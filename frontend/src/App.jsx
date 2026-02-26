import { NavLink, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Layout({ children }) {
  return (
    <div className="app">
      <aside>
        <h2>DeFi Intel</h2>
        <nav>
          {[
            ['/', 'Dashboard'],
            ['/wallet', 'Wallet Explorer'],
            ['/contracts', 'Contract Monitor'],
            ['/ai', 'AI Query'],
            ['/protocols', 'Protocol Intel'],
            ['/live', 'Live Feed']
          ].map(([path, label]) => (
            <NavLink key={path} to={path} className={({ isActive }) => (isActive ? 'active' : '')} end={path === '/'}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main>{children}</main>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    fetch(`${API}/api/network/stats`).then((r) => r.json()).then(setStats);
  }, []);
  return <div><h1>Dashboard</h1><pre>{JSON.stringify(stats, null, 2)}</pre></div>;
}

function Wallet() {
  const [address, setAddress] = useState('');
  const [data, setData] = useState(null);
  const analyze = async () => {
    const res = await fetch(`${API}/api/wallet/${address}`);
    setData(await res.json());
  };
  return <div><h1>Wallet Explorer</h1><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x..." /><button onClick={analyze}>Analyze</button><pre>{JSON.stringify(data, null, 2)}</pre></div>;
}

function Contracts() {
  const [address, setAddress] = useState('');
  const [data, setData] = useState(null);
  const monitor = async () => {
    const res = await fetch(`${API}/api/contracts/${address}`);
    setData(await res.json());
  };
  return <div><h1>Contract Monitor</h1><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x..." /><button onClick={monitor}>Monitor</button><pre>{JSON.stringify(data, null, 2)}</pre></div>;
}

function AI() {
  const [query, setQuery] = useState('');
  const [resp, setResp] = useState(null);
  const ask = async () => {
    const res = await fetch(`${API}/api/ai/query`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
    setResp(await res.json());
  };
  return <div><h1>AI Query</h1><textarea rows="4" value={query} onChange={(e) => setQuery(e.target.value)} /><button onClick={ask}>Ask</button><pre>{JSON.stringify(resp, null, 2)}</pre></div>;
}

function Protocols() {
  const [q, setQ] = useState('');
  const [data, setData] = useState([]);
  const search = async () => {
    const res = await fetch(`${API}/api/protocols?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    setData(json.results || []);
  };
  useEffect(() => { search(); }, []);
  return <div><h1>Protocol Intelligence</h1><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="lending low risk" /><button onClick={search}>Search</button><pre>{JSON.stringify(data, null, 2)}</pre></div>;
}

function Live() {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    const es = new EventSource(`${API}/api/stream/blocks`);
    es.addEventListener('block', (e) => {
      const data = JSON.parse(e.data);
      setEvents((prev) => [data, ...prev].slice(0, 20));
    });
    return () => es.close();
  }, []);
  return <div><h1>Live Feed</h1><pre>{JSON.stringify(events, null, 2)}</pre></div>;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/ai" element={<AI />} />
        <Route path="/protocols" element={<Protocols />} />
        <Route path="/live" element={<Live />} />
      </Routes>
    </Layout>
  );
}
