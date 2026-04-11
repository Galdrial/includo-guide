# Deployment Guide - IncluDO Guide

## Backend (Node.js + Express) → Render

### 1. Preparazione repository

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Creare servizio su Render

- Vai su [render.com](https://render.com) e crea un nuovo **Web Service**.
- Connetti il repo GitHub.
- Scegli branch `main`.

### 3. Configurare Environment Variables su Render

Nella dashboard Render, sezione **Environment**, aggiungi:

```
OPENAI_API_KEY=sk-...
ADMIN_INGEST_TOKEN=your-secret-token-here
SESSIONS_DIR=/var/data
SESSION_TTL_MS=2592000000
SESSION_PRUNE_INTERVAL_MS=600000
MAX_SESSION_MESSAGES=20
INGEST_RATE_LIMIT_WINDOW_MS=900000
INGEST_RATE_LIMIT_MAX=10
```

### 4. Build & Start command

- Build: `npm install`
- Start: `npm start`

### 5. Seedare il catalogo (una volta)

Una volta deployato, dalla tua macchina locale:

```bash
ADMIN_INGEST_TOKEN=your-secret-token-here \
  RENDER_URL=https://includo-guide.onrender.com/api/admin/ingest \
  node server/scripts/seed_production.js
```

---

## Frontend (React + Vite) → Vercel

### 1. Configurare Vercel

- Vai su [vercel.com](https://vercel.com) e importa il repo.
- Scegli folder: `./client`.

### 2. Build & Output settings (auto-rilevati)

- Framework: **Create React App** (o Vite, Vercel lo rileva).
- Build: `npm run build`
- Output directory: `dist`

### 3. Environment Variables (opzionale)

Se vuoi API custom:

```
VITE_API_BASE=https://includo-guide.onrender.com/api
```

Di default usa `http://localhost:3001/api`, ma Vercel aggiornerà dinamicamente al dominio Render.

### 4. Deploy

Vercel auto-deploya ogni push a main.

---

## Verificare il Deploy

### Backend health check

```bash
curl https://includo-guide.onrender.com/api/health
```

Dovrebbe rispondere: `{"status":"ok","uptime":...}`

### Frontend

Apri `https://includo-guide.vercel.app` e testa la chat.

---

## ⚠️ Limitazioni Importanti

### Single Instance Only

- **Sessioni non sincronizzate**: se deployate 2+ instance backend, ogni istanza ha una copia locale di `sessions.json`.
- **Soluzione**: Render offre replica DB; per produzione usare PostgreSQL o Redis per sessions.

### Render Free Tier

- Spins down dopo 15 min di inattività.
- Cold start ~30 sec al primo request.
- Per produzione: upgrade a Paid tier.

### Omissioni intenzionali per MVP

- Nessun rate limiting globale su `/api/chat`.
- Nessun circuit breaker su OpenAI API.
- Sessioni cancellate al restart server (se `SESSIONS_DIR` non è persistent disk).

---

## Troubleshooting Rapido

| Sintomo                        | Causa                      | Soluzione                                   |
| ------------------------------ | -------------------------- | ------------------------------------------- |
| 401/403 su `/api/admin/ingest` | Token errato o mancante    | Verifica `ADMIN_INGEST_TOKEN` in Render env |
| 503 al seed                    | Token non configurato      | Setta `ADMIN_INGEST_TOKEN` in env Render    |
| Chat risponde lentamente       | Cold start o OpenAI lento  | Attendi 30+ sec, controlla quota OpenAI     |
| Sessione si perde dopo restart | `/var/data` non persistent | Upgrade a persistent disk su Render         |
| CORS error dal client          | API_BASE sbagliato         | Verifica `VITE_API_BASE` su Vercel          |

---

## Architettura di Deployment

```
[Client, Vercel]
         ↓ HTTPS
    [API Gateway]
         ↓
[Server, Render]
    ├─ OpenAI API
    ├─ /data/vector_db.json (courses)
    └─ /var/data/sessions.json (sessions, non persistent)
```

---

_Per produzione robusta: migrare sessions a Postgres/Redis e aggiungere load balancer._
