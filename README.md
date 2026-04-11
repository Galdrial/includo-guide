# IncluDO Guide - Intelligent Artisan Orientation

[Live](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=vercel)

### Full-Stack RAG-Powered Vocational Platform

IncluDO Guide is a production-ready orientation system designed to connect individuals with traditional artisan training. Using a **Modular Prompt Factory** and **Vector RAG**, the platform provides guided discovery across Woodworking, Textiles, Ceramics, Leather, and Nature disciplines.

---

## 🏛️ Technical Reality & Features

- **Agentic RAG Infrastructure**: Local JSON-based vector database (Cosine Similarity) synchronized with the course catalog.
- **Persistent Memory**: Session-based history stored in `sessions.json` for server-side persistence across restarts.
- **Pedagogical Constraints**: Guaranteed "Max 2" course recommendations enforced by dual-layer prompt synthesize.
- **Inclusive UI**: High-fidelity Glassmorphism interface with full ARIA accessibility and WCAG-friendly contrast.
- **Deployment Optimized**: Configurato per Vercel + Render con supporto nativo a **Uptime Robot** (endpoint `/api/health`) per eliminare i tempi di cold-start. ✅
- **Security Hardened**:
  - ESM (ES Modules) throughout the stack.
  - SSRF protection (Axios v1.15.0+).
  - Dedicated administrative ingestion API.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Framer Motion, Vanilla CSS.
- **Backend**: Node.js 20+ (ESM), Express 5.
- **AI Engine**: OpenAI GPT-4o-mini & Text-Embedding-3-Small.
- **Database**: Custom Vector Store & Persistent Session Storage.

---

## 📦 Maintenance & Operations

### 🚀 Quick Bootstrap

```bash
# 1) Install dependencies
cd server && npm install
cd ../client && npm install

# 2) Configure server environment
cp ../server/.env.example ../server/.env

# 3) Start backend (terminal A)
cd ../server && npm start

# 4) Start frontend (terminal B)
cd ../client && npm run dev
```

### ⚙️ Environment Configuration (Server)

Configure `server/.env` from `server/.env.example`.

- `OPENAI_API_KEY`: OpenAI API key for chat + embeddings.
- `ADMIN_INGEST_TOKEN`: shared secret required by `/api/admin/ingest` via header `x-admin-token`.
- `SESSIONS_DIR`: filesystem directory used for anonymous session persistence.
- `SESSION_TTL_MS`: max inactivity time before a session expires.
- `SESSION_PRUNE_INTERVAL_MS`: background prune interval.
- `MAX_SESSION_MESSAGES`: max messages retained per session window.
- `INGEST_RATE_LIMIT_WINDOW_MS`: admin ingest rate-limit window.
- `INGEST_RATE_LIMIT_MAX`: max ingest requests per window.

### 🔌 API Contract (Essenziale)

#### `POST /api/chat`

- Body richiesto: `{ "message": "stringa non vuota", "sessionId"?: "string" }`
- Se `message` è vuota o assente: risposta `400`.
- Se `sessionId` manca, il server ne genera una anonima e la restituisce in risposta.
- Risposta `200`:

```json
{
  "reply": "...",
  "history": [ ... ],
  "sessionId": "sid_..."
}
```

#### `POST /api/admin/ingest`

- Richiede header: `x-admin-token: <ADMIN_INGEST_TOKEN>`
- Protezioni attive: autenticazione token, validazione payload corsi, rate limiting.

### 🧪 Quality Assurance (QA)

The project includes a comprehensive test suite using **Vitest**:

- **Backend**: Integration tests verifying API status codes (200 OK) and AI response logic.
- **Frontend**: UI tests verifying rendering, session initialization, and accessibility roles.

```bash
# Run tests
cd server && npm test
cd ../client && npm test
```

### 🔄 Data Synchronization

To synchronize the catalog (`courses.json`) with the vector store (`vector_db.json`), ensure the server is running and execute:

```bash
cd server && ADMIN_INGEST_TOKEN=your_secret node scripts/seed.js
```

### 🌐 Deployment

- **Frontend**: Designed for Vercel.
- **Backend**: Designed for Render (Persistent Disk required for `sessions.json` stability).

---

&copy; 2026 IncluDO Project - _Engineering inclusive futures._
