const OpenAI = require('openai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * GENERATE EMBEDDING
 * Converts a string into a 1536-dimensional vector for semantic search.
 * Uses OpenAI's text-embedding-3-small model.
 */
const generateEmbedding = async (text) => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('...')) {
      console.warn("⚠️  OPENAI_API_KEY missing, using deterministic mock vector for simulation.");
      const sum = text.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      return Array(1536).fill(0).map((_, i) => Math.sin(sum + i) / 2 + 0.5);
  }
  
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
};

/**
 * GET CHAT RESPONSE
 * Interacts with OpenAI's Chat Completion API (GPT-4o-mini).
 * Supports conversational history and custom instructions.
 */
const getChatResponse = async (messages) => {
    try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('...')) {
            return { text: () => "OpenAI Simulation: Please configure a valid OPENAI_API_KEY in server/.env." };
        }
        
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages.map(m => ({
                role: m.role,
                content: m.content
            })),
            temperature: 0.7,
        });

        // Abstraction layer for consistent .text() usage
        return { 
            text: () => response.choices[0].message.content 
        };
    } catch (error) {
        console.error("OpenAI Bridge Error:", error.message);
        throw error;
    }
};

module.exports = { generateEmbedding, getChatResponse };
