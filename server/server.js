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
    const courses = loadDB().map(entry => entry.metadata);

    // NEW DYNAMIC FUNNEL LOGIC
    // We provide a compressed map of ALL 50 courses so the AI can "screen" in real-time
    const catalogMap = courses.map(c => `- ${c.title} (${c.area}, ${c.level}, ${c.objective}, ${c.remote ? 'Remoto' : 'Presenza'}, ${c.weekly_hours}h/sett)`).join('\n');

    const systemPrompt = `
# RUOLO
Sei l'esperto "IncluDO Guide". Il tuo compito è aiutare l'utente a trovare il corso ideale nel nostro catalogo di 50 corsi.

# CATALOGO COMPLETO (La tua mappa mentale)
${catalogMap}

# LOGICA DI SCREENING (L'Imbuto Rigoroso)
1. **Filtra ma non svelare**: Ad ogni messaggio, scarta i corsi che non corrispondono. Non elencare i nomi o le descrizioni dei corsi finché non attivi "RICERCA_CORSI".
2. **Usa i Numeri**: Informa l'utente solo del *numero* di corsi superstiti. (Esempio: "Ottimo, per questa scelta ho 6 corsi disponibili. Preferisci l'obiettivo Lavoro o Hobby?").
3. **Approfondisci sempre**: Non fermarti finché non hai tutti i 5 parametri (Area, Livello, Obiettivo, Modalità, Ore) O finché non restano solo 1 o 2 corsi che corrispondono perfettamente.
4. **Trasparenza**: Se una scelta porta a 0 risultati, avvisa subito l'utente e proponi di cambiare l'ultimo parametro.
5. **Chiusura**: Triggere "RICERCA_CORSI" SOLO quando hai ristretto il campo al massimo (1-3 corsi ideali).

# STILE
Sii un mastro artigiano accogliente, autorevole e molto onesto. Parla SEMPRE in italiano.
    `;

    try {
        const chatContext = [{ role: "system", content: systemPrompt }, ...history, { role: "user", content: message }];
        const aiResponse = await getChatResponse(chatContext); 
        let reply = aiResponse.text();

        if (reply.includes("RICERCA_CORSI")) {
            // Final RAG to get descriptions and full skills
            const queryVector = await generateEmbedding(message + " " + history.map(h => h.content).join(" ")); 
            const searchResults = searchVectors(queryVector, 10);
            
            const resultsPrompt = `
In base alla nostra conversazione, ecco i corsi dal catalogo:
${JSON.stringify(searchResults.map(r => r.metadata), null, 2)}

1. Mostra i CORSI IDEALI (match 100%) e i CONSIGLI ALTERNATIVI.
2. Usa TITOLI ORIGINALI e dati esatti. Sii onesto se qualcosa non coincide.
            `;
            const finalResult = await getChatResponse([...chatContext, { role: "assistant", content: reply }, { role: "user", content: resultsPrompt }]);
            reply = finalResult.text().replace("RICERCA_CORSI", "");
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
