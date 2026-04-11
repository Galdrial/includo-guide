# IncluDO Guide Client

Frontend React/Vite per la chat di orientamento artigiano di IncluDO.

## Requisiti

- Node.js 20+
- Backend avviato (default API: `http://localhost:3001/api`)

## Avvio rapido

```bash
npm install
npm run dev
```

L'app sarà disponibile su `http://localhost:5173` (porta Vite standard).

## Configurazione API

Il client usa questa base URL:

- `VITE_API_BASE` (opzionale)

Esempio file `.env` nel client:

```bash
VITE_API_BASE=http://localhost:3001/api
```

Se non impostata, viene usato il fallback `http://localhost:3001/api`.

## Script disponibili

- `npm run dev`: avvio sviluppo
- `npm run build`: build produzione
- `npm run preview`: preview build
- `npm run lint`: lint ESLint
- `npm test`: test Vitest

## Test

```bash
npm test
```

Copre rendering principale, messaggio iniziale e ruoli ARIA base.
