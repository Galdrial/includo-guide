/**
 * PRODUCTION SEEDING SCRIPT
 * Run this script to ingest course data into the LIVE production server.
 * Usage: node scripts/seed_production.js
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

/** 
 * Administrative token for production authentication.
 * Must match the ADMIN_INGEST_TOKEN configured on the production backend.
 */
const ADMIN_INGEST_TOKEN = process.env.ADMIN_INGEST_TOKEN || process.env.INGEST_TOKEN;

/** 
 * TARGET PRODUCTION URL.
 * Replace this with your actual production backend ingest URL before running.
 */
const PRODUCTION_INGEST_URL =
  process.env.PRODUCTION_INGEST_URL ||
  process.env.RENDER_URL ||
  'https://api.your-domain.example/api/admin/ingest';

// Load source catalog from local database
const COURSES_PATH = path.join( __dirname, '../data/courses.json' );
const COURSES_DATA = JSON.parse( fs.readFileSync( COURSES_PATH, 'utf8' ) );

/**
 * Executes a remote POST request to the production server to sync courses and vectors.
 */
const seedProduction = async () => {
  try {
    console.log( "🌍 Connecting to Production Server..." );
    console.log( `🚀 Starting remote ingestion of ${COURSES_DATA.length} courses...` );

    if ( !ADMIN_INGEST_TOKEN ) {
      console.warn( "⚠️ ADMIN_INGEST_TOKEN not set: Request may fail due to authentication requirements." );
    }

    // Remote POST request using the x-admin-token header for security
    const response = await axios.post(
      PRODUCTION_INGEST_URL,
      COURSES_DATA,
      {
        headers: ADMIN_INGEST_TOKEN ? { 'x-admin-token': ADMIN_INGEST_TOKEN } : {}
      }
    );

    console.log( "✅ SUCCESS! Production database is now synchronized." );
    console.log( `📊 Courses synced: ${response.data.count}` );
  } catch ( error ) {
    console.error( "❌ PRODUCTION INGESTION FAILED." );
    if ( error.response ) {
      console.error( `Status: ${error.response.status}` );
      console.error( "Server Message:", error.response.data.error );
    } else {
      console.error( "Error:", error.message );
    }
    console.log( "\nTIP: Verify your PRODUCTION_INGEST_URL and ensure the production server is reachable from your machine." );
  }
};

// Start the production seeding process
seedProduction();
