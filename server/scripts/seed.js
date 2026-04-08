/**
 * ADMIN SEEDING SCRIPT
 * This script automates the process of ingesting course data into the vector database.
 * Requirement: The backend server must be running on port 3001.
 */
require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

// Load the source catalog from the JSON file
const COURSES_DATA = JSON.parse(fs.readFileSync(__dirname + '/../data/courses.json', 'utf8'));

const seed = async () => {
  try {
    console.log("🚀 Starting course ingestion process...");
    
    // Send the catalog to the ingestion endpoint to generate vectors
    const response = await axios.post('http://localhost:3001/api/admin/ingest', COURSES_DATA);
    
    console.log("✅ Success:", response.data.message);
  } catch (error) {
    console.error("❌ Ingestion failed. Ensure the server is active on port 3001.");
    console.error("Technical error:", error.message);
  }
};

seed();
