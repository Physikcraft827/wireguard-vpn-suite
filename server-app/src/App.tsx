import React, { useState, useEffect } from 'react';
import { ServerConfigState, Peer } from './types';
import { generateKeyPair, getPublicKey, generateServerConfigText } from './utils/wireguard';
import { ServerConfig } from './components/ServerConfig';
import { PeerManager } from './components/PeerManager';
import { PeerQRCodeModal } from './components/PeerQRCodeModal';
import { LiveDashboard } from './components/LiveDashboard';
import { ServerControl } from './components/ServerControl';
import { Shield, LayoutDashboard, Settings, Users, Power, Github } from 'lucide-react';
import './App.css';

// Load or initialize Server Config from LocalStorage
const getInitialConfig = (): ServerConfigState => {
  const saved = localStorage.getItem('wg_server_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.endpointHost) {
        parsed.endpointHost = 'vpn.physikcraft.de';
      }
      if (parsed.privateKey) {
        parsed.publicKey = getPublicKey(parsed.privateKey);
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse saved server config:', e);
    }
  }

  const keys = generateKeyPair();
  return {
    interfaceName: 'wg0',
    listenPort: 51820,
    subnet: '10.8.0.0/24',
    serverIP: '10.8.0.1/24',
    endpointHost: 'vpn.physikcraft.de',
    privateKey: keys.privateKey,
    publicKey: keys.publicKey,
    dns: '1.1.1.1, 8.8.8.8',
    mtu: 1360,
    persistentKeepalive: 25,
    postUp: '',
    postDown: '',
    isRunning: false,
  };
};

// Load or initialize Peers from LocalStorage
const getInitialPeers = (): Peer[] => {
  const saved = localStorage.getItem('wg_server_peers');
  if (saved) {
    try {
      const parsed: Peer[] = JSON.parse(saved);
      return parsed.map((peer) => {
        if (peer.privateKey) {
          peer.publicKey = getPublicKey(peer.privateKey);
        }
        return peer;
      });
    } catch (e) {
      console.error('Failed to parse saved peers:', e);
    }
  }
  return [];
};

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'config' | 'peers' | 'control'>('dashboard');
  const [config, setConfig] = useState<ServerConfigState>(getInitialConfig);
  const [peers, setPeers] = useState<Peer[]>(getInitialPeers);
  const [selectedQRPeer, setSelectedQRPeer] = useState<Peer | null>(null);

  // Auto-save Config to LocalStorage & Sync wg0.conf with running WireGuard service
  useEffect(() => {
    localStorage.setItem('wg_server_config', JSON.stringify(config));
    if ((window as any).electronAPI?.startTunnel && config.isRunning) {
      const fullConf = generateServerConfigText(config, peers);
      (window as any).electronAPI.startTunnel({
        interfaceName: config.interfaceName,
        configContent: fullConf,
      });
    }
  }, [config, peers]);

  // Auto-save Peers to LocalStorage
  useEffect(() => {
    localStorage.setItem('wg_server_peers', JSON.stringify(peers));
  }, [peers]);

  // Live Query WireGuard kernel interface stats if Electron API is present
  useEffect(() => {
    if (!config.isRunning || !(window as any).electronAPI) return;

    const interval = setInterval(async () => {
      try {
        const cmd = process.platform === 'win32'
          ? 'wireguard.exe /dump'
          : `wg show ${config.interfaceName} dump`;
        
        const res = await (window as any).electronAPI.executeCommand(cmd);
        if (res.success && res.output) {
          const lines = res.output.trim().split('\n');
          if (lines.length > 1) {
            // Parse peer stats from dump
            const peerMap = new Map<string, { rx: number; tx: number; handshake: number }>();
            for (let i = 1; i < lines.length; i++) {
              const parts = lines[i].split('\t');
              if (parts.length >= 7) {
                const pubKey = parts[0];
                const handshake = parseInt(parts[4] || '0', 10);
                const rx = parseInt(parts[5] || '0', 10);
                const tx = parseInt(parts[6] || '0', 10);
                peerMap.set(pubKey, { rx, tx, handshake });
              }
            }

            setPeers((prevPeers) =>
              prevPeers.map((p) => {
                const live = peerMap.get(p.publicKey);
                if (live) {
                  const isActive = live.handshake > 0 && Date.now() / 1000 - live.handshake < 180;
                  return {
                    ...p,
                    rxBytes: live.rx,
                    txBytes: live.tx,
                    active: isActive,
                    lastHandshake: live.handshake > 0 ? new Date(live.handshake * 1000).toLocaleTimeString() : undefined,
                  };
                }
                return p;
              })
            );
          }
        }
      } catch (err) {
        console.error('Error fetching live WireGuard stats:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [config.isRunning, config.interfaceName]);

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
      {/* Sidebar Navigation */}
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

        <div className="sidebar-footer">
          <div className="server-status-pill">
            <span className={`status-dot ${config.isRunning ? 'running' : 'stopped'}`}></span>
            <span>{config.isRunning ? 'wg0 Online' : 'wg0 Stopped'}</span>
          </div>
          <span className="version-tag">Developed for High Performance</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-title">
            <h1>WireGuard VPN Server Management Studio</h1>
            <p>Configure tunnels, generate peer keys, export configs & monitor real-time traffic</p>
          </div>
          <div className="header-actions">
            <span className="badge badge-emerald">Port: {config.listenPort}</span>
            <span className="badge badge-cyan">Subnet: {config.subnet}</span>
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

      {/* QR Code Export Modal */}
      <PeerQRCodeModal
        peer={selectedQRPeer}
        serverConfig={config}
        onClose={() => setSelectedQRPeer(null)}
      />
    </div>
  );
}

export default App;
