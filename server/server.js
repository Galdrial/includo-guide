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

    const systemPrompt = `Sei l'esperto "IncluDO Guide". 
    REGOLE: 
    1. Chiedi con calore: Area, Livello, Obiettivo, Modalità e Ore/settimana. 
    2. NON citare mai corsi esterni (Udemy, Skillshare, etc.). 
    3. Parla solo della scuola IncluDO.
    4. Non inventare corsi prima che appaiano i risultati ufficiali.`;
    
    try {
        const chatContext = [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: message }];
        const aiResponse = await getChatResponse(chatContext); 
        let reply = aiResponse.text();

        // 2. SHADOW PROFILER: Stronger JSON Extraction
        const profilerPrompt = `
        Estrai i dati dalla chat in questo formato JSON (usa "null" se mancano):
        {"area": "Pelle|Legno|Ceramica|Tessuti|Natura", "level": "Principiante|Intermedio|Avanzato", "objective": "Lavoro|Hobby", "modality": "Presenza|Remoto", "hours": numero}
        
        Conversazione: ${JSON.stringify([...history.slice(-6), { role: "user", content: message }])}
        `;
        const profileResult = await getChatResponse([{ role: "system", content: "Output ONLY valid JSON" }, { role: "user", content: profilerPrompt }], "gpt-4o-mini");
        
        try {
            const cleanText = profileResult.text().replace(/```json|```/g, "").trim();
            const profile = JSON.parse(cleanText);
            const isComplete = profile.area !== "null" && profile.level !== "null" && profile.objective !== "null" && profile.modality !== "null" && (profile.hours !== "null" && profile.hours > 0);

            if (isComplete && !history.some(h => h.content.includes("###"))) {
                // AUTO-TRIGGER SEARCH
                const queryVector = await generateEmbedding(`${profile.area} ${profile.level} ${profile.objective} ${profile.modality} ${profile.hours} ore`); 
                const searchResults = searchVectors(queryVector, 10);
                
                const resultsPrompt = `
                Dati Utente: ${JSON.stringify(profile)}
                Catalogo: ${JSON.stringify(searchResults.map(r => r.metadata))}
                
                COMPITO: Genera la risposta dell'orientatoreIncluDO mostrando i "CORSI IDEALI" (match 100%) e "CONSIGLI ALTERNATIVI". 
                Sii onesto se il match non è 100% (es. ore diverse o modalità diversa). Sostituisci completamente la risposta precedente.
                `;
                const finalResult = await getChatResponse([{ role: "system", content: "Sei un orientatore professionale. Mostra i risultati del database ufficiale." }, { role: "user", content: resultsPrompt }]);
                reply = finalResult.text();
            }
        } catch (e) {
            console.error("Profiler failed:", e);
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
