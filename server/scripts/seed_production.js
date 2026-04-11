/**
 * PRODUCTION SEEDING SCRIPT (ESM version)
 * Run this to ingest course data into your LIVE Render server.
 * Usage: node scripts/seed_production.js
 */
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const ADMIN_INGEST_TOKEN = process.env.ADMIN_INGEST_TOKEN || process.env.INGEST_TOKEN;

// 1. REPLACE THIS URL with your actual Render backend URL
const RENDER_URL = 'https://includo-guide.onrender.com/api/admin/ingest';

// Load source catalog
const COURSES_PATH = path.join( __dirname, '../data/courses.json' );
const COURSES_DATA = JSON.parse( fs.readFileSync( COURSES_PATH, 'utf8' ) );

const seedProduction = async () => {
  try {
    console.log( "🌍 Connecting to Production Server..." );
    console.log( `🚀 Starting remote ingestion of ${COURSES_DATA.length} courses...` );
    if ( !ADMIN_INGEST_TOKEN ) {
      console.warn( "⚠️ ADMIN_INGEST_TOKEN non impostato: la chiamata può fallire se il server richiede autenticazione admin." );
    }

    const response = await axios.post(
      RENDER_URL,
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
    console.log( "\nTIP: Make sure your Render URL is correct and the server is 'Live' (not sleeping)." );
  }
};

seedProduction();
