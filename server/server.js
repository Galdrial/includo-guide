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
      const embedString = `Title: ${course.title}. Area: ${course.area}. Level: ${course.level}. Objective: ${course.objective}. Time: ${course.weekly_hours}h/week. Remote: ${course.remote ? 'yes' : 'no'}. Skills: ${course.skills.join(', ')}. Description: ${course.description}.`;
      
      const vector = await generateEmbedding(embedString);
      
      const entry = {
        id: course.id,
        vector,
        metadata: {
          title: course.title,
          duration: course.duration,
          weekly_hours: course.weekly_hours,
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

    // 1. GENERARE LA RISPOSTA CONVERSAZIONALE
    const systemPrompt = `Sii l'esperto "IncluDO Guide". Chiedi con calore: Area, Livello, Obiettivo, Modalità e Ore/settimana. Non elencare i corsi finché non hai tutti i dati.`;
    
    try {
        const chatContext = [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: message }];
        const aiResponse = await getChatResponse(chatContext); 
        let reply = aiResponse.text();

        // 2. SHADOW PROFILER: Check if the profile is complete (Independent from the reply)
        const profilerPrompt = `
        Analizza la chat e estrai i parametri in questo JSON:
        {"area": "...", "level": "...", "objective": "...", "modality": "...", "hours": 0}
        Se un parametro manca, scrivi "null".
        Chat: ${JSON.stringify([...history, { role: "user", content: message }])}
        `;
        const profileResult = await getChatResponse([{ role: "system", content: "Output ONLY JSON or 'null'" }, { role: "user", content: profilerPrompt }], "gpt-4o-mini");
        
        try {
            const profile = JSON.parse(profileResult.text());
            const isComplete = profile.area && profile.level && profile.objective && profile.modality && profile.hours;

            if (isComplete && !history.some(h => h.content.includes("###"))) {
                // AUTO-TRIGGER SEARCH
                const queryVector = await generateEmbedding(`${profile.area} ${profile.level} ${profile.objective} ${profile.modality} ${profile.hours} hours`); 
                const searchResults = searchVectors(queryVector, 10);
                
                const resultsPrompt = `
                Dati utente: ${JSON.stringify(profile)}
                Corsi: ${JSON.stringify(searchResults.map(r => r.metadata))}
                Genera la risposta finale con "CORSI IDEALI" e "CONSIGLI ALTERNATIVI". 
                Sii onesto se il match non è 100% (esempio: se l'utente vuole Remoto ma il corso è in Presenza, mettilo in Alternativi).
                `;
                const finalResult = await getChatResponse([{ role: "system", content: "Sii un consulente onesto e accogliente" }, { role: "user", content: resultsPrompt }]);
                reply = finalResult.text();
            }
        } catch (e) {
            // Profiler failed or returned null, continue normally
        }

        history.push({ role: "user", content: message }, { role: "assistant", content: reply });
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
