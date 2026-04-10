import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '../data/vector_db.json');

/**
 * LOAD VECTOR DATABASE
 */
export const loadDB = () => {
  if (!fs.existsSync(DB_PATH)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
};

/**
 * SAVE VECTOR DATABASE
 */
export const saveDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

/**
 * SEARCH VECTORS (RAG CORE)
 */
export const searchVectors = (queryVector, topK = 2) => {
  const db = loadDB();
  const scored = db.map(item => {
    const score = dotProduct(queryVector, item.vector);
    return { ...item, score };
  });
  
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
};

/**
 * DOT PRODUCT CALCULATOR
 */
export const dotProduct = (v1, v2) => {
  if (!v1 || !v2) return 0;
  return v1.reduce((acc, current, i) => acc + current * (v2[i] || 0), 0);
};
