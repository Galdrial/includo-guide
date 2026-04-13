# IncluDO Guide - Deployment & Operations Manual
### Enterprise-Grade Vocational Orientation Platform

This guide provides comprehensive instructions for deploying and maintaining the IncluDO project in a production environment. The architecture is designed for a **distributed cloud setup** (Frontend on Vercel, Backend on Render) with a persistent RAG (Retrieval-Augmented Generation) infrastructure.

---

## 🏗️ Cloud Infrastructure Overview

- **Frontend**: React (Vite) deployed on **Vercel**.
- **Backend**: Node.js v22 (ESM) deployed on **Render**.
- **AI Engine**: OpenAI GPT-4o-mini & Text-Embedding-3-Small.
- **Monitoring**: Uptime Robot (via `/api/health` endpoint).

---

## 🟢 Backend Deployment (Render)

### 1. Preparation
Connect your GitHub repository to [Render.com](https://render.com) and create a new **Web Service**.

- **Environment**: Node.js
- **Branch**: `main`
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 2. Required Environment Variables
Configure these in the Render Dashboard (Environment section):

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | Your OpenAI API key (required for RAG and Chat). |
| `ADMIN_INGEST_TOKEN` | A secret string used to authorize data synchronization. |
| `PORT` | Set to `3001` (default). |
| `NODE_ENV` | Set to `production`. |

### 3. Persistent Disk (Recommended)
By default, the `sessions.json` file is ephemeral and will be reset on every server restart. For true production persistence, mount a **Persistent Disk** to `/var/data` and configure the path in your environment.

---

## 🔵 Frontend Deployment (Vercel)

### 1. Project Setup
Import your repository into [Vercel](https://vercel.com).

- **Framework Preset**: Vite
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 2. Environment Variables
- **VITE_API_BASE**: The URL of your Render backend (e.g., `https://includo-guide.onrender.com/api`).

---

## 🔄 Data Synchronization (RAG Ingestion)

Once the backend is live, you must synchronize the local course catalog with the production vector database.

1. Ensure the `ADMIN_INGEST_TOKEN` is set on your Render server.
2. From your local development machine, run:

```bash
# Set the token and production URL
EXPORT ADMIN_INGEST_TOKEN=your_secret_token
EXPORT RENDER_URL=https://your-app.onrender.com/api/admin/ingest

# Run the ingestion script
node server/scripts/seed_production.js
```

---

## 🛡️ Uptime & Monitoring Strategy (Zero Cold Start)

Since Render's free tier puts the server to sleep after 15 minutes of inactivity, we use a proactive ping strategy.

1. **Health Endpoint**: The server exposes a lightweight `GET /api/health` endpoint.
2. **Automated Ping**: Use a service like **Uptime Robot** or **Cron-job.org**.
   - **Type**: HTTP(s) Monitor.
   - **URL**: `https://your-app.onrender.com/api/health`
   - **Interval**: 5 minutes.
3. **Benefit**: This keeps the server "alive" 24/7, eliminating "cold start" delays and ensuring the first user of the day receives an instant response.

---

## 🧪 Quality Assurance & Troubleshooting

### Running Tests
Before every deployment, ensure the full test suite passes locally:
```bash
cd server && npm test
cd ../client && npm test
```

### Common Issues
- **CORS Errors**: Ensure `VITE_API_BASE` in Vercel matches your Render URL exactly.
- **401 Unauthorized during Seed**: Check that the `x-admin-token` header sent by `seed_production.js` matches the `ADMIN_INGEST_TOKEN` on the server.
- **Missing Embeddings**: If courses are visible but recommendations fail, re-run the Data Synchronization step.

---

&copy; 2026 IncluDO Project - *Engineering inclusive futures.*
