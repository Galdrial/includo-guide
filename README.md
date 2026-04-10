# IncluDO Guide - Intelligent Artisan Orientation

### Full-Stack RAG-Powered Vocational Platform

IncluDO Guide is a production-ready orientation system designed to connect individuals with traditional artisan training. Using a **Modular Prompt Factory** and **Vector RAG**, the platform provides guided discovery across Woodworking, Textiles, Ceramics, Leather, and Nature disciplines.

---

## 🏛️ Technical Reality & Features

- **Agentic RAG Infrastructure**: Local JSON-based vector database (Cosine Similarity) synchronized with the course catalog.
- **Persistent Memory**: Session-based history stored in `sessions.json` for server-side persistence across restarts.
- **Pedagogical Constraints**: Guaranteed "Max 2" course recommendations enforced by dual-layer prompt synthesize.
- **Inclusive UI**: High-fidelity Glassmorphism interface with full ARIA accessibility and WCAG-friendly contrast.
- **Security Hardened**:
  - ESM (ES Modules) throughout the stack.
  - SSRF protection (Axios v1.15.0+).
  - Dedicated administrative ingestion API.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Framer Motion, Vanilla CSS.
- **Backend**: Node.js v22 (ESM), Express 5.
- **AI Engine**: OpenAI GPT-4o-mini & Text-Embedding-3-Small.
- **Database**: Custom Vector Store & Persistent Session Storage.

---

## 📦 Maintenance & Operations

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
cd server && node scripts/seed.js
```

### 🌐 Deployment

- **Frontend**: Designed for Vercel.
- **Backend**: Designed for Render (Persistent Disk required for `sessions.json` stability).

---

&copy; 2026 IncluDO Project - _Engineering inclusive futures._
