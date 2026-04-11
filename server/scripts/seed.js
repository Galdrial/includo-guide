/**
 * ADMIN SEEDING SCRIPT (ESM version)
 * This script automates the process of ingesting course data into the vector database.
 * Requirement: The backend server must be running on port 3001.
 */
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const ADMIN_INGEST_TOKEN = process.env.ADMIN_INGEST_TOKEN || process.env.INGEST_TOKEN;

// Load the source catalog from the JSON file
const COURSES_PATH = path.join( __dirname, '../data/courses.json' );
const COURSES_DATA = JSON.parse( fs.readFileSync( COURSES_PATH, 'utf8' ) );

const seed = async () => {
  try {
    console.log( "🚀 Starting course ingestion & vectorization process..." );
    console.log( `📦 Sending ${COURSES_DATA.length} courses to the server...` );
    if ( !ADMIN_INGEST_TOKEN ) {
      console.warn( "⚠️ ADMIN_INGEST_TOKEN non impostato: la chiamata può fallire se il server richiede autenticazione admin." );
    }

    // Send the catalog to the ingestion endpoint to generate vectors
    const response = await axios.post(
      'http://localhost:3001/api/admin/ingest',
      COURSES_DATA,
      {
        headers: ADMIN_INGEST_TOKEN ? { 'x-admin-token': ADMIN_INGEST_TOKEN } : {}
      }
    );

    console.log( "✅ Success! Database and Vectors are now synchronized." );
    console.log( `📊 Total courses processed: ${response.data.count}` );
  } catch ( error ) {
    console.error( "❌ Ingestion failed." );
    if ( error.response ) {
      console.error( "Server error:", error.response.data.error );
    } else {
      console.error( "Technical error:", error.message );
    }
    console.log( "💡 Tip: Ensure the server is active on port 3001." );
  }
};

seed();
