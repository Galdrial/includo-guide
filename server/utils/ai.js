/**
 * AI UTILITIES - OpenAI Bridge
 * This module handles the integration with OpenAI APIs for generating
 * vector embeddings and handling chat completions.
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the server root .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Global OpenAI client instance.
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * GENERATE EMBEDDING
 * Converts a string into a 1536-dimensional vector using OpenAI's embedding model.
 * If no API key is present, it returns a deterministic mock vector for testing.
 * @param {string} text - The input text to vectorize.
 * @returns {Promise<Array<number>>} The resulting vector embedding.
 */
export const generateEmbedding = async (text) => {
  // Fallback for environments without an active OpenAI API key
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
 * Sends a sequence of messages to the OpenAI Chat Completion API.
 * Supports tool calling and structured outputs.
 * @param {Array<Object>} messages - The conversation history.
 * @param {string} [model="gpt-4o"] - The model to use.
 * @param {Array<Object>|null} [tools=null] - Optional tool definitions.
 * @returns {Promise<Object>} The full API response from OpenAI.
 */
export const getChatResponse = async (messages, model = "gpt-4o", tools = null) => {
    try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('...')) {
            throw new Error("OPENAI_API_KEY not configured.");
        }
        
        const options = {
            model: model,
            messages: messages.map(m => {
                const msg = { role: m.role, content: m.content || "" };
                // Ensure tool calls and IDs are passed back to the model if present
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
