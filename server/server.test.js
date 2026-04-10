import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from './server.js';

// Mock OpenAI to prevent credential errors during testing
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: { 
        completions: { 
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: "Mocked AI Response" } }]
          }) 
        } 
      },
      embeddings: { 
        create: vi.fn().mockResolvedValue({
          data: [{ embedding: Array(1536).fill(0.1) }]
        }) 
      }
    }))
  };
});

describe('API Endpoints (Integration)', () => {

  it('GET /api/history/:sessionId should return status 200 and history array', async () => {
    const res = await request(app).get('/api/history/test_session_123');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('history');
    expect(Array.isArray(res.body.history)).toBe(true);
  });

  it('POST /api/reset should return status 200 and success: true', async () => {
    const res = await request(app)
      .post('/api/reset')
      .send({ sessionId: 'test_session_123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/chat should handle requests with a valid AI response', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'vorrei imparare il legno', sessionId: 'test_session_123' });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(typeof res.body.reply).toBe('string');
  });

});
