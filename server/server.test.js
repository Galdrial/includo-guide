/**
 * BACKEND INTEGRATION TESTS
 * This suite verifies the core API endpoints of the IncluDO server.
 * It uses supertest for HTTP requests and Vitest for assertions.
 */

import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { app } from './server.js';

/**
 * MOCK OPENAI: Prevents real API calls during testing.
 * This ensures tests are deterministic, fast, and cost-free.
 */
vi.mock( 'openai', () => {
  return {
    default: vi.fn().mockImplementation( () => ( {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue( {
            choices: [{ message: { content: "Mocked AI Response" } }]
          } )
        }
      },
      embeddings: {
        create: vi.fn().mockResolvedValue( {
          data: [{ embedding: Array( 1536 ).fill( 0.1 ) }]
        } )
      }
    } ) )
  };
} );

describe( 'Backend API Lifecycle & Security', () => {

  // Configuration for test isolation
  process.env.ADMIN_INGEST_TOKEN = 'test-admin-token';
  process.env.SKIP_COURSES_WRITE = '1';

  /** 
   * Session History Persistence
   * Verifies that the server correctly manages and filters session history.
   */
  it( 'GET /api/history/:sessionId should return status 200 and history array', async () => {
    const res = await request( app ).get( '/api/history/test_session_123' );
    expect( res.status ).toBe( 200 );
    expect( res.body ).toHaveProperty( 'history' );
    expect( Array.isArray( res.body.history ) ).toBe( true );
  } );

  /** 
   * Session Lifecycle (Reset)
   * Ensures sessions can be wiped both from memory and persistent store.
   */
  it( 'POST /api/reset should return status 200 and success: true', async () => {
    const res = await request( app )
      .post( '/api/reset' )
      .send( { sessionId: 'test_session_123' } );
    expect( res.status ).toBe( 200 );
    expect( res.body.success ).toBe( true );
  } );

  /**
   * AI Chat Core Logic
   * Verifies that the chat pipeline correctly interacts with the AI bridge.
   */
  it( 'POST /api/chat should handle requests with a valid AI response', async () => {
    const res = await request( app )
      .post( '/api/chat' )
      .send( { message: 'vorrei imparare il legno', sessionId: 'test_session_123' } );

    expect( res.status ).toBe( 200 );
    expect( res.body ).toHaveProperty( 'reply' );
    expect( typeof res.body.reply ).toBe( 'string' );
  } );

  /**
   * Administrative Security (Auth)
   * Tests the timing-safe token authentication logic for ingestion.
   */
  describe( 'Administrative Security (Ingestion Auth)', () => {
      
    it( 'should reject requests with missing token (401)', async () => {
      const res = await request( app )
        .post( '/api/admin/ingest' )
        .send( [] );
      expect( res.status ).toBe( 401 );
    } );

    it( 'should reject requests with invalid token (403)', async () => {
      const res = await request( app )
        .post( '/api/admin/ingest' )
        .set( 'x-admin-token', 'wrong-token' )
        .send( [] );
      expect( res.status ).toBe( 403 );
    } );

    it( 'should accept valid token and payload (200)', async () => {
        const payload = [{
          id: 'test-course',
          title: 'Corso Test',
          area: 'Legno',
          duration: '4 settimane',
          weekly_hours: 6,
          skills: ['Assemblaggio'],
          remote: true,
          level: 'Principiante',
          objective: 'Hobby',
          description: 'Corso di prova'
        }];
    
        const res = await request( app )
          .post( '/api/admin/ingest' )
          .set( 'x-admin-token', 'test-admin-token' )
          .send( payload );
    
        expect( res.status ).toBe( 200 );
        expect( res.body.success ).toBe( true );
    } );
  });

  /**
   * Input Validation & Edge Cases
   */
  describe( 'Input Sanitization & Edge Cases', () => {

    it( 'POST /api/chat should still respond when sessionId is missing (generate new)', async () => {
        const res = await request( app )
          .post( '/api/chat' )
          .send( { message: 'ciao' } );
    
        expect( res.status ).toBe( 200 );
        expect( res.body ).toHaveProperty( 'sessionId' );
    } );

    it( 'POST /api/chat should return 400 for empty or whitespace-only messages', async () => {
        const res = await request( app )
          .post( '/api/chat' )
          .send( { message: '   ', sessionId: 'test_session_123' } );
    
        expect( res.status ).toBe( 400 );
    } );

  });

} );
