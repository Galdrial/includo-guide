const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { generateEmbedding, getChatResponse } = require('./utils/ai');
const { loadDB, saveDB, searchVectors } = require('./utils/db');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

/**
 * 1. ADMIN INGESTION ENDPOINT
 * Used to populate the vector database with course data.
 * It converts text descriptions into vector embeddings for semantic search.
 */
app.post('/api/admin/ingest', async (req, res) => {
  try {
    const courses = req.body; 
    const vectorDB = loadDB();
    
    for (const course of (Array.isArray(courses) ? courses : [courses])) {
      // Create a rich string for embedding to ensure high semantic accuracy
      const embedString = `Title: ${course.title}. Area: ${course.area}. Level: ${course.level}. Objective: ${course.objective}. Remote: ${course.remote ? 'yes' : 'no'}. Skills: ${course.skills.join(', ')}. Description: ${course.description}.`;
      
      const vector = await generateEmbedding(embedString);
      
      const entry = {
        id: course.id,
        vector,
        metadata: {
          title: course.title,
          duration: course.duration,
          remote: course.remote,
          skills: course.skills,
          description: course.description,
          level: course.level,
          objective: course.objective
        }
      };
      
      // Update existing entry or push new one (Upsert logic)
      const index = vectorDB.findIndex(v => v.id === course.id);
      if (index !== -1) vectorDB[index] = entry; else vectorDB.push(entry);
    }
    
    saveDB(vectorDB);
    res.json({ success: true, message: "Ingestion completed successfully." });
  } catch (error) {
    res.status(500).json({ error: "Error during ingestion process." });
  }
});

/**
 * 2. SESSION PERSISTENCE LOGIC
 * Simple file-based session storage to keep track of user conversations.
 */
const SESSION_DB_PATH = path.join(__dirname, 'data/sessions.json');

const getSession = (id) => {
    if (!fs.existsSync(SESSION_DB_PATH)) fs.writeFileSync(SESSION_DB_PATH, '{}');
    const db = JSON.parse(fs.readFileSync(SESSION_DB_PATH));
    return db[id] || [];
};

const saveSession = (id, history) => {
    const db = JSON.parse(fs.readFileSync(SESSION_DB_PATH));
    db[id] = history;
    fs.writeFileSync(SESSION_DB_PATH, JSON.stringify(db, null, 2));
};

/**
 * 3. HISTORY RETRIEVAL ENDPOINT
 * Allows the frontend to restore chat history based on the current sessionId.
 */
app.get('/api/history/:sessionId', (req, res) => {
    const history = getSession(req.params.sessionId);
    res.json({ history });
});

/**
 * 4. CORE CHAT & ORIENTATION ENDPOINT
 * Orchestrates the conversation flow, data extraction, and RAG search.
 */
app.post('/api/chat', async (req, res) => {
    let { message, sessionId } = req.body;
    
    // SECURITY: Input Sanitization and validation
    if (!message || typeof message !== 'string') return res.status(400).json({ error: "Invalid message format." });
    message = message.trim().substring(0, 500); // Prevent token overflow/attacks
    message = message.replace(/<[^>]*>?/gm, ''); // Strip HTML tags
    
    const history = getSession(sessionId);

    // SYSTEM PROMPT: Defines the AI behavior with Catalog Awareness
    const systemPrompt = `
# ROLE
You are the "IncluDO Guide" expert. You must guide users using the INTERNAL CATALOG MAP.

# INTERNAL CATALOG MAP (What exists)
- LEGNO: [Beg, Int, Adv] x [Work, Hobby] x [Presenza]. Remote: only [Int+Work] and [Beg+Hobby].
- TESSUTI: [Beg, Adv] x [Work] x [Presenza]. [Beg, Int] x [Work, Hobby] x [Remote].
- CERAMICA: ALL levels x [Work, Hobby] x [Presenza] ONLY. NO Remote.
- PELLE: [Beg, Int] x [Work, Hobby] x [Presenza] ONLY. NO Remote.
- NATURA: ALL levels x [Work] x [Remote] ONLY. NO Presenza.

# ORIENTATION RULES
1. **Catalog Awareness**: If a user's choice leads to an empty set (e.g., Remote Ceramics), STOP them immediately and propose existing alternatives.
2. **Dynamic Questions**: Skip a question if only one option exists for the chosen category (e.g., for Nature, don't ask Modality, it's always Remote).
3. **Empathy**: Help choose between Wood/Textiles if undecided by explaining the different technical approaches.
4. **Trigger**: Output 'RICERCA_CORSI' only when you have a matchable 5/5 checklist.
    `;

    try {
        const chatContext = [
            { role: "system", content: systemPrompt },
            ...history,
            { role: "user", content: message } 
        ];

        const aiResponse = await getChatResponse(chatContext); 
        let reply = aiResponse.text();

        // RAG TRIGGER: Executes vector search only when all parameters are gathered
        if (reply.includes("RICERCA_CORSI")) {
            // STEP A: Summarize user profile for accurate vector search
            const summaryContext = [
                { role: "system", content: "Create a technical search query including: Category, Level, Objective, Modality, and Time." },
                ...history,
                { role: "user", content: message }
            ];
            const summaryResult = await getChatResponse(summaryContext);
            const searchQuery = summaryResult.text();

            // STEP B: Perform Semantic Search
            const queryVector = await generateEmbedding(searchQuery); 
            const courses = searchVectors(queryVector, 6); // Broader coverage to ensure matches are found among top results
            
            // STEP C: Generate final recommendation based on retrieved data
            const resultsPrompt = `
OFFICIAL IncluDO Catalog (Use ONLY these!):
${JSON.stringify(courses.map(c => c.metadata), null, 2)}

Based on these courses:
1. CATEGORIZE the results: 
   - Group under "PERFECT MATCHES" ONLY if Category, Level, Objective AND Modality match the user's request 100%. 
   - Group everything else under "ALTERNATIVE SUGGESTIONS". If NO perfect match exists, explicitly state "No exact match found in our catalog, but here are the best alternatives:".
2. ABSOLUTE DATA FIDELITY: Use EXACT ORIGINAL TITLES and DURATIONS.
3. BE HONEST: For every alternative, clearly state which parameter doesn't match (e.g., "This is for Work, while you asked for Hobby").
4. Explain WHY an alternative might still be valuable.
            `;
            
            const finalContext = [...chatContext, { role: "assistant", content: reply }, { role: "user", content: resultsPrompt }];
            const finalResult = await getChatResponse(finalContext);
            reply = finalResult.text().replace("RICERCA_CORSI", "");
        }

        // Save conversation to session history
        history.push({ role: "user", content: message });
        history.push({ role: "assistant", content: reply });
        saveSession(sessionId, history);

        res.json({ reply, history });
    } catch (error) {
        console.error("Chat terminal error:", error);
        res.status(500).json({ error: "Siamo spiacenti, c'è stato un problema tecnico. Riprova più tardi." });
    }
});

app.listen(PORT, () => {
    console.log(`IncluDO Server live on port ${PORT}`);
});
