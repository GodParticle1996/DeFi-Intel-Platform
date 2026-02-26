# DeFi Intelligence Platform

A full-stack JavaScript DeFi intelligence app with:

- **Frontend:** React + Vite
- **Backend:** Express.js + Ethers.js
- **Smart-contract tooling:** Hardhat
- **LLM:** Groq Cloud using **`llama-3.1-8b-instant`**
- **Database:** MongoDB
- **Orchestration:** Docker Compose

## Architecture

- `frontend/` renders the 6 dashboard pages:
  - `/` Dashboard
  - `/wallet` Wallet Explorer
  - `/contracts` Contract Monitor
  - `/ai` AI Query
  - `/protocols` Protocol Intel
  - `/live` Live Feed
- `backend/` provides REST + SSE APIs.
- `contracts/` contains Hardhat config + sample contract tests.

## Run with Docker Compose

1. Copy env:

```bash
cp .env.example .env
```

2. Set your keys in `.env`:

```bash
ALCHEMY_RPC_URL=...
GROQ_API_KEY=...
```

3. Start stack:

```bash
docker compose up --build
```

4. Open:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000/api/health`

## API Highlights

- `GET /api/network/stats`
- `GET /api/wallet/:address`
- `GET /api/contracts/:address`
- `GET /api/protocols?q=lending low risk`
- `POST /api/ai/query`
- `GET /api/stream/blocks` (SSE)
- `GET/POST/DELETE /api/alerts`

## Groq Integration

The backend uses `groq-sdk` with model `llama-3.1-8b-instant`.
If `GROQ_API_KEY` is missing, AI endpoint returns a fallback message.

## Hardhat

Run tests inside the optional devtools profile:

```bash
docker compose --profile devtools up --build hardhat
```

## Security

- Never commit secrets.
- Keep API keys only in environment variables.
