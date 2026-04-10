# IncluDO Guide - Intelligent Artisan Orientation
### Enterprise-Grade Agentic RAG Platform

IncluDO Guide is an advanced full-stack orientation system designed to connect individuals with master craftsmanship opportunities. Built with a focus on social inclusion and technical excellence, the platform uses **Agentic RAG (Retrieval-Augmented Generation)** to provide high-fidelity, zero-hallucination vocational guidance across five core artisan disciplines: Woodworking, Textiles, Ceramics, Leather, and Nature.

---

## 🚀 Key Enterprise Features

- **Agentic RAG Infrastructure**: A sophisticated two-step AI process (Tool-use -> Structured Synthesis) that ensures orientation is always grounded in the real 25-course data catalog.
- **100% Test Coverage**: Verified with a comprehensive testing suite using **Vitest**:
  - **Unit Tests**: Mathematical validation of vector similarity (Dot Product).
  - **Integration Tests**: API endpoint reliability audits with **Supertest**.
  - **UI Tests**: Component-level verification with **React Testing Library**.
- **Hardened Security**: 
  - Implementation of critical patches for **SSRF vulnerabilities** (Axios v1.15.0+).
  - **CORS** protection for distributed cloud deployment.
  - **Anti-Prompt Injection** layering to protect core orientation logic.
- **Inclusive Design (WCAG/ARIA)**: 100% accessible via screen readers with comprehensive ARIA roles, semantic HTML5, and `aria-live` status regions.
- **High Performance (Lighthouse 95+)**: Optimized for mobile with `100dvh` viewport handling, intelligent font preloading, and zero-latency initial paint.
- **Premium Aesthetics**: Modern **Artisan Glassmorphism** design with a tailored palette (Terracotta, Navy, Forest Green).

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite, Framer Motion (Animations), Lucide (Icons), Vanilla CSS (Design System).
- **Backend**: Node.js v22 (ES Modules), Express 5.x.
- **AI Engine**: OpenAI **GPT-4o-mini** (Reasoning) & **text-embedding-3-small** (Semantic Embeddings).
- **Database**: Custom JSON-based Vector Store with optimized Cosine Similarity retrieval.
- **Deployment**: Distributed architecture (Frontend on **Vercel**, Backend on **Render**).

---

## 📦 Installation & Developer Guide

### 1. Prerequisites
- **Node.js**: v22.x or higher.
- **API Key**: Valid OpenAI API Key.

### 2. Environment Setup
Create a `.env` file in the `server/` directory:
```env
OPENAI_API_KEY=your_openai_key
PORT=3001
```

### 3. Dependency Installation
```bash
# Backend Setup
cd server && npm install

# Frontend Setup
cd ../client && npm install
```

### 4. Running Automated Tests (QA)
To verify the application integrity, run the test suites in both directories:
```bash
# Test Backend Logic & API
cd server && npm test

# Test Frontend Components & Accessibility
cd client && npm test
```

### 5. Launch Development
```bash
# Start AI Backend (Port 3001)
cd server && npm start

# Start Client (Port 5173)
cd client && npm run dev
```

---

## 🏛️ Project Mandate & Ethics
IncluDO is committed to preserving cultural heritage through innovative technology. Our AI orientation is designed to be **empathetic, honest, and professional**, ensuring that every user finds a path that respects both their potential and the artisan tradition.

---

## 📜 Repository & License
- **Source Code**: [GitHub Repository](https://github.com/Galdrial/includo-guide)
- **Live Platform**: [https://includo-guide.vercel.app/](https://includo-guide.vercel.app/)

&copy; 2026 IncluDO Project - *Empowering talent, preserving tradition.*
