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
=======
# DeFi Intelligence Platform (JavaScript Stack Edition)

This document is the updated version of the original platform overview, with the requested stack migration:

- **Python backend → Express.js (Node.js) backend**
- **Blockchain tooling → Hardhat + Ethers.js**
- **OpenAI LLM → `llama-3.1-8b-instant` via Groq Cloud**

---

## 1) What This Application Is

The **DeFi Intelligence Platform** is a web app for real-time Ethereum intelligence.
It combines:

- Blockchain data access (wallets, transactions, contracts, gas)
- AI-assisted natural-language analysis with tool usage
- A protocol intelligence knowledge base
- Real-time streaming block monitor + alerting

Think: **Bloomberg-style DeFi intelligence**, with an AI analyst built in.

---

## 2) Updated Technology Stack

### Frontend
- React 19
- Tailwind CSS
- shadcn/ui
- Recharts
- Framer Motion

### Backend (Updated)
- **Express.js** (Node.js) API server
- REST + SSE endpoints
- MCP-style tool registry for wallet/contract/gas/protocol intelligence
- MongoDB (wallet cache, chat history, alerts)

### Blockchain / Web3 (Updated)
- **Ethers.js** for on-chain reads, RPC interactions, event/log queries
- **Hardhat** for smart contract development/testing scripts, ABI workflows, and local chain simulation where needed
- Alchemy JSON-RPC provider for Ethereum mainnet data

### AI (Updated)
- **Groq Cloud** as inference provider
- **Model: `llama-3.1-8b-instant`** (open-source LLM)
- RAG + tool-augmented generation pattern retained

---

## 3) AI Provider Migration (OpenAI → Groq + Llama 3.1)

### Install

```bash
npm install groq-sdk
```

### Environment Variables

```bash
export GROQ_API_KEY="<your_groq_api_key>"
```

> For security, store the API key in environment variables or a secrets manager instead of hardcoding it.

### Example Usage (Node.js / Express context)

```js
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function streamLlamaResponse(userPrompt) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: userPrompt }],
    model: 'llama-3.1-8b-instant',
    temperature: 1,
    max_completion_tokens: 1024,
    top_p: 1,
    stream: true,
    stop: null,
  });

  for await (const chunk of chatCompletion) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}
```

---

## 4) Express.js + Ethers.js Example (Wallet Endpoint)

```js
import express from 'express';
import { ethers } from 'ethers';

const app = express();
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_RPC_URL);

app.get('/api/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const [balanceWei, txCount, code] = await Promise.all([
      provider.getBalance(address),
      provider.getTransactionCount(address),
      provider.getCode(address),
    ]);

    return res.json({
      address,
      balance_eth: ethers.formatEther(balanceWei),
      transaction_count: txCount,
      is_contract: code !== '0x',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

---

## 5) Hardhat Integration Points

Use Hardhat for:
- Contract compilation and ABI generation
- Local/mainnet-fork testing of protocol interactions
- Scripted event decoding and simulation workflows

Typical commands:

```bash
npx hardhat compile
npx hardhat test
npx hardhat node
```

---

## 6) Architecture (Updated)

```text
Browser (React/Tailwind/shadcn)
  -> Express.js API (REST + SSE)
     -> MCP-style tool layer
        -> Ethers.js + Alchemy RPC
        -> Protocol Vector Search (TF-IDF + cosine similarity)
        -> MongoDB (cache/history/alerts)
     -> Groq Cloud (llama-3.1-8b-instant)
```

---

## 7) Core Functional Pages (Unchanged Functionality, Updated Backend Stack)

1. Dashboard (`/`) – live network metrics + charts
2. Wallet Explorer (`/wallet`) – ETH balance, tx count, token holdings, wallet/contract classification
3. Contract Monitor (`/contracts`) – code size, recent logs/events
4. AI Query (`/ai`) – natural-language analysis with tool transparency
5. Protocol Intelligence (`/protocols`) – semantic protocol search and risk metadata
6. Live Feed (`/live`) – SSE block stream + configurable gas/txn alerts

---

## 8) Security Notes

- This platform is **read-only** and should never require private keys.
- Do not hardcode credentials in source code.
- Keep `GROQ_API_KEY`, Mongo URI, and Alchemy keys in environment configuration.

---

## 9) Summary of Requested Replacements Completed

- ✅ Replaced Python backend references with **Express.js**
- ✅ Added **Hardhat** and **Ethers.js** as core blockchain tooling
- ✅ Replaced OpenAI references with **Groq + `llama-3.1-8b-instant`**
- ✅ Included JavaScript integration snippets for both blockchain access and LLM streaming
