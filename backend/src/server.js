import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import Groq from 'groq-sdk';
import { MongoClient, ObjectId } from 'mongodb';
import { PROTOCOLS, searchProtocols } from './protocols.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 3000);
const RPC_URL = process.env.ALCHEMY_RPC_URL || 'https://eth.llamarpc.com';
const provider = new ethers.JsonRpcProvider(RPC_URL);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const mongoUri = process.env.MONGO_URI || 'mongodb://mongo:27017';
const mongoClient = new MongoClient(mongoUri);
let db;

async function connectMongo() {
  await mongoClient.connect();
  db = mongoClient.db(process.env.MONGO_DB_NAME || 'defi_intel');
  await db.collection('alerts').createIndex({ createdAt: -1 });
}

function detectTools(query) {
  const q = query.toLowerCase();
  const tools = [];
  if (/0x[a-f0-9]{40}/i.test(query)) tools.push('get_wallet_balance');
  if (q.includes('gas') || q.includes('gwei') || q.includes('fee')) tools.push('get_gas_price');
  if (q.includes('block')) tools.push('get_block_info');
  if (q.includes('protocol') || q.includes('lending') || q.includes('defi')) tools.push('search_defi_protocols');
  if (q.includes('risk') || q.includes('safe') || q.includes('audit')) tools.push('analyze_risk');
  return [...new Set(tools)];
}

app.get('/api/health', (_, res) => {
  res.json({ ok: true, service: 'defi-intel-backend' });
});

app.get('/api/network/stats', async (_, res) => {
  try {
    const [blockNumber, feeData, block] = await Promise.all([
      provider.getBlockNumber(),
      provider.getFeeData(),
      provider.getBlock('latest')
    ]);

    res.json({
      blockNumber,
      gasPriceGwei: feeData.gasPrice ? Number(ethers.formatUnits(feeData.gasPrice, 'gwei')) : null,
      baseFeeGwei: block?.baseFeePerGas ? Number(ethers.formatUnits(block.baseFeePerGas, 'gwei')) : null,
      transactionCount: block?.transactions?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) return res.status(400).json({ error: 'Invalid Ethereum address' });

    const [balanceWei, txCount, code] = await Promise.all([
      provider.getBalance(address),
      provider.getTransactionCount(address),
      provider.getCode(address)
    ]);

    res.json({
      address,
      balanceEth: ethers.formatEther(balanceWei),
      txCount,
      isContract: code !== '0x'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/contracts/:address', async (req, res) => {
  try {
    const { address } = req.params;
    if (!ethers.isAddress(address)) return res.status(400).json({ error: 'Invalid Ethereum address' });

    const [code, balance, latest] = await Promise.all([
      provider.getCode(address),
      provider.getBalance(address),
      provider.getBlockNumber()
    ]);

    const fromBlock = Math.max(0, latest - 100);
    const logs = await provider.getLogs({
      address,
      fromBlock,
      toBlock: latest
    });

    res.json({
      address,
      codeSizeBytes: (code.length - 2) / 2,
      balanceEth: ethers.formatEther(balance),
      recentEvents: logs.slice(-20).map((l) => ({
        blockNumber: l.blockNumber,
        txHash: l.transactionHash,
        topics: l.topics,
        data: l.data
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/protocols', (req, res) => {
  const q = req.query.q?.toString() || '';
  if (!q) return res.json({ results: PROTOCOLS });
  return res.json({ results: searchProtocols(q) });
});

app.post('/api/alerts', async (req, res) => {
  try {
    const doc = { ...req.body, createdAt: new Date(), active: true };
    const result = await db.collection('alerts').insertOne(doc);
    res.status(201).json({ _id: result.insertedId, ...doc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/alerts', async (_, res) => {
  try {
    const alerts = await db.collection('alerts').find().sort({ createdAt: -1 }).toArray();
    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/alerts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('alerts').deleteOne({ _id: new ObjectId(id) });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });

    const tools = detectTools(query);
    const protocolContext = searchProtocols(query).slice(0, 3);
    const stats = await provider.getBlockNumber();

    const systemPrompt = `You are a DeFi analyst assistant. Use provided context and never fabricate unknown facts.`;
    const userPrompt = `Query: ${query}\nTools: ${tools.join(', ') || 'none'}\nTop protocol context: ${JSON.stringify(protocolContext)}\nLatest block: ${stats}`;

    let response = 'Groq API key missing. Configure GROQ_API_KEY to enable llama-3.1-8b-instant responses.';

    if (process.env.GROQ_API_KEY) {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        temperature: 0.4,
        max_completion_tokens: 800,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });
      response = completion.choices?.[0]?.message?.content || response;
    }

    res.json({ response, toolsUsed: tools, model: 'llama-3.1-8b-instant' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stream/blocks', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let lastSeen = 0;
  const timer = setInterval(async () => {
    try {
      const latest = await provider.getBlock('latest');
      if (latest && latest.number && latest.number !== lastSeen) {
        lastSeen = latest.number;
        const payload = {
          blockNumber: latest.number,
          txCount: latest.transactions.length,
          gasUsed: latest.gasUsed.toString(),
          timestamp: latest.timestamp
        };
        res.write(`event: block\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } else {
        res.write(`event: heartbeat\ndata: {}\n\n`);
      }
    } catch {
      res.write(`event: heartbeat\ndata: {}\n\n`);
    }
  }, 6000);

  req.on('close', () => {
    clearInterval(timer);
    res.end();
  });
});

connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend listening on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start backend:', err.message);
    process.exit(1);
  });
