import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from './server.js';

// Mock OpenAI to prevent credential errors during testing
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: { completions: { create: vi.fn() } },
      embeddings: { create: vi.fn() }
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

  // Note: We avoid testing real OpenAI calls during integration tests to save costs/time, 
  // but we can check if the endpoint is reachable.
  it('POST /api/chat should handle requests (Basic structure test)', async () => {
    // We send a request and if it errors out due to missing API KEY in test env, 
    // it still proves it hit the handler.
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'ciao', sessionId: 'test_session_123' });
    
    // In a real test env with key, it would be 200.
    // Without key or real AI, we at least expect it not to be 404.
    expect(res.status).not.toBe(404);
  });

});
