require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { getChatResponse, generateEmbedding } = require('./utils/ai');
const { searchVectors } = require('./utils/db');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory session storage
const sessions = {};

const getSession = (id) => sessions[id] || [
    { 
        role: "system", 
        content: `Sei l'esperto orientatore di 'IncluDO', un progetto no-profit che preserva i mestieri artigianali.
        Il tuo obiettivo è consigliare i 2 corsi migliori dal catalogo ufficiale.
        
        REGOLE DI CONVERSAZIONE:
        1. Fai UNA domanda alla volta. Non sommergere l'utente.
        2. Raccogli questi 5 punti: Area d'interesse, Livello (Principiante/Intermedio/Avanzato), Obiettivo (Lavoro/Hobby), Modalità (Presenza/Remoto), Tempo disponibile (ore/settimana).
        3. Non dare raccomandazioni finché non hai tutti i pezzi del profilo.
        4. Usa un tono accogliente, professionale e umano.
        5. Una volta completato il profilo, usa il tool 'cerca_corsi' per ottenere i dati reali.
        
        RISPONDI SEMPRE IN ITALIANO.` 
    }
];

// TOOL DEFINITION: Following the project mandate for Function Calling
const tools = [
    {
        type: "function",
        function: {
            name: "cerca_corsi",
            description: "Cerca i corsi nel catalogo IncluDO in base al profilo utente completo.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Stringa di ricerca che riassume Area, Livello, Obiettivo, Modalità e Ore." }
                },
                required: ["query"]
            }
        }
    }
];

app.post('/api/chat', async (req, res) => {
    const { message, sessionId } = req.body;
    let history = getSession(sessionId);
    
    // Add user message
    history.push({ role: "user", content: message });

    try {
        // Step 1: Call AI with tools
        const response = await getChatResponse(history, "gpt-4o", tools);
        let aiMessage = response.choices[0].message;

        // Step 2: Check if AI wants to call a tool (The "RAG Moment")
        if (aiMessage.tool_calls) {
            const toolCall = aiMessage.tool_calls[0];
            const args = JSON.parse(toolCall.function.arguments);
            
            // Execute RAG
            const vector = await generateEmbedding(args.query);
            const matches = searchVectors(vector, 10);
            
            // Add tool response to history
            history.push(aiMessage);
            history.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(matches.map(m => m.metadata))
            });

            // Step 3: Final response with RAG data
            const finalResponse = await getChatResponse(history, "gpt-4o");
            aiMessage = finalResponse.choices[0].message;
        }

        // Final cleanup and save
        const reply = aiMessage.content;
        history.push({ role: "assistant", content: reply });
        
        // Keep history manageable (last 15 messages)
        if (history.length > 15) history = [history[0], ...history.slice(-14)];
        sessions[sessionId] = history;

        res.json({ reply, history });

    } catch (error) {
        console.error("Server Reset Error:", error);
        res.status(500).json({ error: "Errore nel processamento della richiesta." });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`IncluDO Server Spec-Compliant running on port ${PORT}`));
