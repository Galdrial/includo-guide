const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/vector_db.json');

/**
 * LOAD VECTOR DATABASE
 * Retrieves the stored course embeddings from the local JSON file.
 */
const loadDB = () => {
  if (!fs.existsSync(DB_PATH)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
};

/**
 * SAVE VECTOR DATABASE
 * Persists the course embeddings to the local JSON file.
 */
const saveDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

/**
 * SEARCH VECTORS (RAG CORE)
 * Finds the top matching courses using Cosine Similarity.
 * For normalized vectors from OpenAI, dot product is an efficient substitute for similarity.
 */
const searchVectors = (queryVector, topK = 2) => {
  const db = loadDB();
  const scored = db.map(item => {
    // Dot product calculation for semantic score
    const score = dotProduct(queryVector, item.vector);
    return { ...item, score };
  });
  
  // Sort by highest score first and limit results per requirements
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
};

/**
 * DOT PRODUCT CALCULATOR
 * Mathematical foundation for vector similarity search.
 */
const dotProduct = (v1, v2) => {
  return v1.reduce((acc, current, i) => acc + current * v2[i], 0);
};

module.exports = { loadDB, saveDB, searchVectors };
