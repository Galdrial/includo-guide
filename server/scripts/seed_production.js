/**
 * PRODUCTION SEEDING SCRIPT
 * Run this to ingest course data into your LIVE Render server.
 * Usage: node scripts/seed_production.js
 */
const fs = require('fs');
const axios = require('axios');
const path = require('path');

// 1. REPLACE THIS URL with your actual Render backend URL
const RENDER_URL = 'https://includo-guide.onrender.com/api/admin/ingest';

// Load source catalog
const COURSES_DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/courses.json'), 'utf8'));

const seedProduction = async () => {
  try {
    console.log("🌍 Connecting to Production Server...");
    console.log("🚀 Starting remote ingestion of 25 courses...");
    
    const response = await axios.post(RENDER_URL, COURSES_DATA);
    
    console.log("✅ SUCCESS! Production database is now synchronized.");
    console.log("Server message:", response.data.message);
  } catch (error) {
    console.error("❌ PRODUCTION INGESTION FAILED.");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
    console.log("\nTIP: Make sure your Render URL is correct and the server is 'Live' (not sleeping).");
  }
};

seedProduction();
