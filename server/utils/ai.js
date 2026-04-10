import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * GENERATE EMBEDDING
 */
export const generateEmbedding = async (text) => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('...')) {
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
 */
export const getChatResponse = async (messages, model = "gpt-4o", tools = null) => {
    try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('...')) {
            throw new Error("OPENAI_API_KEY non configurata.");
        }
        
        const options = {
            model: model,
            messages: messages.map(m => {
                const msg = { role: m.role, content: m.content || "" };
                if (m.tool_calls) msg.tool_calls = m.tool_calls;
                if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
                return msg;
            }),
            temperature: 0.7,
        };

        if (tools) options.tools = tools;

        return await openai.chat.completions.create(options);
    } catch (error) {
        console.error("OpenAI Bridge Error:", error.message);
        throw error;
    }
};
