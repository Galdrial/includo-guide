import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { app } from './server.js';

// Mock OpenAI to prevent credential errors during testing
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

describe( 'API Endpoints (Integration)', () => {

  process.env.ADMIN_INGEST_TOKEN = 'test-admin-token';
  process.env.SKIP_COURSES_WRITE = '1';

  it( 'GET /api/history/:sessionId should return status 200 and history array', async () => {
    const res = await request( app ).get( '/api/history/test_session_123' );
    expect( res.status ).toBe( 200 );
    expect( res.body ).toHaveProperty( 'history' );
    expect( Array.isArray( res.body.history ) ).toBe( true );
  } );

  it( 'POST /api/reset should return status 200 and success: true', async () => {
    const res = await request( app )
      .post( '/api/reset' )
      .send( { sessionId: 'test_session_123' } );
    expect( res.status ).toBe( 200 );
    expect( res.body.success ).toBe( true );
  } );

  it( 'POST /api/chat should handle requests with a valid AI response', async () => {
    const res = await request( app )
      .post( '/api/chat' )
      .send( { message: 'vorrei imparare il legno', sessionId: 'test_session_123' } );

    expect( res.status ).toBe( 200 );
    expect( res.body ).toHaveProperty( 'reply' );
    expect( typeof res.body.reply ).toBe( 'string' );
  } );

  it( 'POST /api/admin/ingest should reject missing token', async () => {
    const res = await request( app )
      .post( '/api/admin/ingest' )
      .send( [] );

    expect( res.status ).toBe( 401 );
    expect( res.body ).toHaveProperty( 'error' );
  } );

  it( 'POST /api/admin/ingest should reject invalid payload', async () => {
    const res = await request( app )
      .post( '/api/admin/ingest' )
      .set( 'x-admin-token', 'test-admin-token' )
      .send( [{ id: 'missing-fields' }] );

    expect( res.status ).toBe( 400 );
    expect( res.body ).toHaveProperty( 'error' );
  } );

  it( 'POST /api/admin/ingest should reject invalid token', async () => {
    const res = await request( app )
      .post( '/api/admin/ingest' )
      .set( 'x-admin-token', 'wrong-token' )
      .send( [] );

    expect( res.status ).toBe( 403 );
    expect( res.body ).toHaveProperty( 'error' );
  } );

  it( 'POST /api/admin/ingest should fail when admin token is not configured', async () => {
    const previousToken = process.env.ADMIN_INGEST_TOKEN;
    delete process.env.ADMIN_INGEST_TOKEN;

    const res = await request( app )
      .post( '/api/admin/ingest' )
      .set( 'x-admin-token', 'test-admin-token' )
      .send( [] );

    expect( res.status ).toBe( 503 );
    expect( res.body ).toHaveProperty( 'error' );

    process.env.ADMIN_INGEST_TOKEN = previousToken;
  } );

  it( 'POST /api/chat should still respond when sessionId is missing', async () => {
    const res = await request( app )
      .post( '/api/chat' )
      .send( { message: 'ciao' } );

    expect( res.status ).toBe( 200 );
    expect( res.body ).toHaveProperty( 'reply' );
    expect( res.body ).toHaveProperty( 'sessionId' );
    expect( typeof res.body.sessionId ).toBe( 'string' );
  } );

  it( 'POST /api/chat should return 400 for invalid message payload', async () => {
    const res = await request( app )
      .post( '/api/chat' )
      .send( { message: '   ', sessionId: 'test_session_123' } );

    expect( res.status ).toBe( 400 );
    expect( res.body ).toHaveProperty( 'error' );
  } );

  it( 'POST /api/admin/ingest should accept valid token and payload', async () => {
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
    expect( res.body.count ).toBe( 1 );
  } );

} );
