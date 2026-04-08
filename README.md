# IncluDO Guide - Intelligent Artisan Orientation

IncluDO Guide is an agentic RAG-powered chatbot designed to connect individuals with traditional craftsmanship opportunities. Built with a focus on empathy and technical precision, the platform guides users through a discovery journey to find their ideal vocational path in Woodworking, Textiles, Ceramics, Leather, or Nature studies.

## 🚀 Features

- **Live Demo**: [https://includo-guide.vercel.app/](https://includo-guide.vercel.app/)
- **Agentic RAG Engine**: Semantic search integrated with a strict 5-point orientation checklist.
- **Data Fidelity**: Guaranteed zero-hallucination course matching based on a real 25-course catalog.
- **Glassmorphism UI**: High-end, modern design with smooth animations and responsive layouts.
- **Session Persistence**: Persistent chat history across browser reloads using local storage and server-side tracking.
- **Custom Brand Identity**: Fully original visual assets and branding.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Framer Motion, Lucide Icons, Vanilla CSS (Glassmorphism).
- **Backend**: Node.js, Express.
- **AI Engine**: OpenAI GPT-4o-mini (Reasoning) & text-embedding-3-small (Semantic Vectors).
- **Database**: Custom JSON-based Vector DB with Cosine Similarity math.

## 📦 Setup & Installation

### 1. Prerequisites
- Node.js (v18 or higher)
- OpenAI API Key

### 2. Configuration
Create a `.env` file in the `server/` directory:
```env
OPENAI_API_KEY=your_api_key_here
PORT=3001
```

### 3. Installation
Install dependencies for both client and server:
```bash
# Install Server dependencies
cd server && npm install

# Install Client dependencies
cd ../client && npm install
```

### 4. Database Seeding
Initialize the vector database with the course catalog:
```bash
# From the server directory (ensure server is running)
npm start
# In another terminal
node scripts/seed.js
```

### 5. Running the App
```bash
# Start Backend (Port 3001)
cd server && npm start

# Start Frontend (Port 5173)
cd client && npm run dev
```

## 📜 License
&copy; 2026 IncluDO Project - Preserving the future through the past.
