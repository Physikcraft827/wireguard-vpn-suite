import React, { useState } from 'react';
import { ServerConfigState, Peer } from './types';
import { generateKeyPair } from './utils/wireguard';
import { ServerConfig } from './components/ServerConfig';
import { PeerManager } from './components/PeerManager';
import { PeerQRCodeModal } from './components/PeerQRCodeModal';
import { LiveDashboard } from './components/LiveDashboard';
import { ServerControl } from './components/ServerControl';
import { Shield, LayoutDashboard, Settings, Users, Power } from 'lucide-react';
import './App.css';

const initialKeys = generateKeyPair();

const initialConfig: ServerConfigState = {
  interfaceName: 'wg0',
  listenPort: 51820,
  subnet: '10.8.0.0/24',
  serverIP: '10.8.0.1/24',
  privateKey: initialKeys.privateKey,
  publicKey: initialKeys.publicKey,
  dns: '1.1.1.1, 8.8.8.8',
  mtu: 1420,
  persistentKeepalive: 25,
  postUp: 'iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE',
  postDown: 'iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE',
  isRunning: true,
};

const defaultPeers: Peer[] = [
  {
    id: 'peer_1',
    name: 'MacBook Pro (Mobile)',
    publicKey: 'X9/3a0qL12nK5+Pq7mZ8rT9u1v2w3x4y5z6a7b8c9d0=',
    privateKey: generateKeyPair().privateKey,
    allowedIPs: '10.8.0.2/32',
    allocatedIP: '10.8.0.2',
    createdAt: 'Jul 20, 2026 12:00',
    rxBytes: 15400000,
    txBytes: 84900000,
    active: true,
  },
  {
    id: 'peer_2',
    name: 'iPhone 15 Pro',
    publicKey: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v=',
    privateKey: generateKeyPair().privateKey,
    allowedIPs: '10.8.0.3/32',
    allocatedIP: '10.8.0.3',
    createdAt: 'Jul 20, 2026 12:15',
    rxBytes: 3200000,
    txBytes: 12100000,
    active: true,
  },
];

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'config' | 'peers' | 'control'>('dashboard');
  const [config, setConfig] = useState<ServerConfigState>(initialConfig);
  const [peers, setPeers] = useState<Peer[]>(defaultPeers);
  const [selectedQRPeer, setSelectedQRPeer] = useState<Peer | null>(null);

  const handleAddPeer = (newPeer: Peer) => {
    setPeers((prev) => [...prev, newPeer]);
  };

  const handleDeletePeer = (id: string) => {
    if (confirm('Are you sure you want to remove this client peer?')) {
      setPeers((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleEditPeer = (updatedPeer: Peer) => {
    setPeers((prev) => prev.map((p) => (p.id === updatedPeer.id ? updatedPeer : p)));
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="logo-container">
          <Shield className="logo-icon icon-cyan" size={32} />
          <div>
            <h2>WireGuard</h2>
            <span className="subtitle">Server Studio v1.0</span>
          </div>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Live Dashboard</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'peers' ? 'active' : ''}`}
            onClick={() => setActiveTab('peers')}
          >
            <Users size={18} />
            <span>Peer Management</span>
            <span className="badge-count">{peers.length}</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            <Settings size={18} />
            <span>Interface Config</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'control' ? 'active' : ''}`}
            onClick={() => setActiveTab('control')}
          >
            <Power size={18} />
            <span>Service Control</span>
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-title">
            <h1>WireGuard VPN Server Management Studio</h1>
            <p>Configure tunnels, generate peer keys, export configs & monitor real-time traffic</p>
          </div>
        </header>

        <div className="content-container">
          {activeTab === 'dashboard' && <LiveDashboard peers={peers} isRunning={config.isRunning} />}
          {activeTab === 'peers' && (
            <PeerManager
              peers={peers}
              serverConfig={config}
              onAddPeer={handleAddPeer}
              onDeletePeer={handleDeletePeer}
              onEditPeer={handleEditPeer}
              onShowQR={(peer) => setSelectedQRPeer(peer)}
            />
          )}
          {activeTab === 'config' && (
            <ServerConfig config={config} onChange={setConfig} peersCount={peers.length} />
          )}
          {activeTab === 'control' && (
            <ServerControl
              config={config}
              peers={peers}
              onToggleRun={(isRunning) => setConfig((c) => ({ ...c, isRunning }))}
            />
          )}
        </div>
      </main>

      <PeerQRCodeModal
        peer={selectedQRPeer}
        serverConfig={config}
        onClose={() => setSelectedQRPeer(null)}
      />
    </div>
  );
}

export default App;
