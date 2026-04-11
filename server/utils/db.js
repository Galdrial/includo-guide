import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

const DB_PATH = path.join( __dirname, '../data/vector_db.json' );

/**
 * LOAD VECTOR DATABASE
 */
export const loadDB = () => {
  if ( !fs.existsSync( DB_PATH ) ) {
    return [];
  }
  return JSON.parse( fs.readFileSync( DB_PATH, 'utf8' ) );
};

/**
 * SAVE VECTOR DATABASE
 */
export const saveDB = ( data ) => {
  fs.writeFileSync( DB_PATH, JSON.stringify( data, null, 2 ) );
};

/**
 * SEARCH VECTORS (RAG CORE)
 */
export const searchVectors = ( queryVector, topK = 2 ) => {
  if ( !Array.isArray( queryVector ) || queryVector.length === 0 || topK <= 0 ) {
    return [];
  }

  const db = loadDB();
  const scored = db.map( item => {
    const score = cosineSimilarity( queryVector, item.vector );
    return { ...item, score };
  } );

  return scored.sort( ( a, b ) => b.score - a.score ).slice( 0, topK );
};

/**
 * DOT PRODUCT CALCULATOR
 */
export const dotProduct = ( v1, v2 ) => {
  if ( !Array.isArray( v1 ) || !Array.isArray( v2 ) ) return 0;
  return v1.reduce( ( acc, current, i ) => acc + current * ( v2[i] || 0 ), 0 );
};

export const vectorNorm = ( vector ) => {
  if ( !Array.isArray( vector ) || vector.length === 0 ) return 0;
  return Math.sqrt( dotProduct( vector, vector ) );
};

export const cosineSimilarity = ( v1, v2 ) => {
  const norm1 = vectorNorm( v1 );
  const norm2 = vectorNorm( v2 );
  if ( norm1 === 0 || norm2 === 0 ) return 0;
  return dotProduct( v1, v2 ) / ( norm1 * norm2 );
};
