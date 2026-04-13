/**
 * VECTOR DATABASE UTILITIES
 * This module provides a simple file-based vector store implementation.
 * It handles loading, saving, and searching for vector embeddings using
 * cosine similarity for RAG (Retrieval-Augmented Generation) flows.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

/** Path to the JSON file acting as our local vector database storage. */
const DB_PATH = path.join( __dirname, '../data/vector_db.json' );

// --- DATABASE OPERATIONS ---

/**
 * Loads the vector database from local JSON storage.
 * @returns {Array<Object>} An array of vector entries {id, vector, metadata}.
 */
export const loadDB = () => {
  if ( !fs.existsSync( DB_PATH ) ) {
    return [];
  }
  return JSON.parse( fs.readFileSync( DB_PATH, 'utf8' ) );
};

/**
 * Persists the provided data array to the local vector database file.
 * @param {Array<Object>} data - The data array to save.
 */
export const saveDB = ( data ) => {
  fs.writeFileSync( DB_PATH, JSON.stringify( data, null, 2 ) );
};

// --- RAG SEARCH LOGIC ---

/**
 * Performs a vector search and returns the top K most similar items.
 * Uses Cosine Similarity to compare the query vector against the database.
 * @param {Array<number>} queryVector - The embedding vector of the search query.
 * @param {number} [topK=2] - The number of top results to return.
 * @returns {Array<Object>} The top matching items with an added 'score' field.
 */
export const searchVectors = ( queryVector, topK = 2 ) => {
  if ( !Array.isArray( queryVector ) || queryVector.length === 0 || topK <= 0 ) {
    return [];
  }

  const db = loadDB();
  const scored = db.map( item => {
    // Generate a similarity score between 0 and 1
    const score = cosineSimilarity( queryVector, item.vector );
    return { ...item, score };
  } );

  // Sort by score descending and return the requested number of results
  return scored.sort( ( a, b ) => b.score - a.score ).slice( 0, topK );
};

// --- VECTOR MATHEMATICS (Cosine Similarity) ---

/**
 * Calculates the Dot Product of two vectors.
 * @param {Array<number>} v1 - First vector.
 * @param {Array<number>} v2 - Second vector.
 * @returns {number} The dot product value.
 */
export const dotProduct = ( v1, v2 ) => {
  if ( !Array.isArray( v1 ) || !Array.isArray( v2 ) ) return 0;
  return v1.reduce( ( acc, current, i ) => acc + current * ( v2[i] || 0 ), 0 );
};

/**
 * Calculates the Euclidean Norm (magnitude) of a vector.
 * @param {Array<number>} vector - The vector to normalize.
 * @returns {number} The norm value.
 */
export const vectorNorm = ( vector ) => {
  if ( !Array.isArray( vector ) || vector.length === 0 ) return 0;
  return Math.sqrt( dotProduct( vector, vector ) );
};

/**
 * Calculates the Cosine Similarity between two vectors.
 * Formula: (A · B) / (||A|| * ||B||)
 * @param {Array<number>} v1 - First vector.
 * @param {Array<number>} v2 - Second vector.
 * @returns {number} A score between 0 (completely different) and 1 (identical).
 */
export const cosineSimilarity = ( v1, v2 ) => {
  const norm1 = vectorNorm( v1 );
  const norm2 = vectorNorm( v2 );
  if ( norm1 === 0 || norm2 === 0 ) return 0;
  return dotProduct( v1, v2 ) / ( norm1 * norm2 );
};
