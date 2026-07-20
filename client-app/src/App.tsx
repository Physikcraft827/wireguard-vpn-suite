import React, { useState, useEffect } from 'react';
import { ConnectionState, VpnConfig, VpnStats } from './types';
import { TunnelConnector } from './components/TunnelConnector';
import { ConfigImporter } from './components/ConfigImporter';
import { StatusDashboard } from './components/StatusDashboard';
import { SystemTraySettings } from './components/SystemTraySettings';
import { TrafficSpeedGraph } from './components/TrafficSpeedGraph';
import { Shield, Settings, Activity } from 'lucide-react';
import './App.css';

const defaultConfig: VpnConfig = {
  name: 'Frankfurt-WG-01',
  rawContent: `[Interface]\nPrivateKey = cG9zZWRp... \nAddress = 10.8.0.2/32\nDNS = 1.1.1.1\n\n[Peer]\nPublicKey = X9/3a0qL...\nEndpoint = 203.0.113.10:51820\nAllowedIPs = 0.0.0.0/0`,
  endpoint: '203.0.113.10:51820',
  clientIP: '10.8.0.2/32',
  dns: '1.1.1.1',
  publicKey: 'X9/3a0qL12nK5+Pq7mZ8rT9u1v2w3x4y5z6a7b8c9d0=',
};

export function App() {
  const [activeTab, setActiveTab] = useState<'main' | 'settings'>('main');
  const [status, setStatus] = useState<ConnectionState>('disconnected');
  const [config, setConfig] = useState<VpnConfig>(defaultConfig);

  const [stats, setStats] = useState<VpnStats>({
    durationSeconds: 0,
    publicIP: '198.51.100.44',
    pingMs: 18,
    rxBytes: 12400000,
    txBytes: 4210000,
    downloadSpeedKb: 0,
    uploadSpeedKb: 0,
  });

  const [history, setHistory] = useState<{ download: number; upload: number }[]>([]);

  useEffect(() => {
    let interval: any = null;
    if (status === 'connected') {
      interval = setInterval(() => {
        const dlSpeed = Math.floor(Math.random() * 850 + 120);
        const ulSpeed = Math.floor(Math.random() * 340 + 40);

        setStats((prev) => ({
          ...prev,
          durationSeconds: prev.durationSeconds + 1,
          pingMs: Math.floor(16 + Math.random() * 5),
          rxBytes: prev.rxBytes + dlSpeed * 1024,
          txBytes: prev.txBytes + ulSpeed * 1024,
          downloadSpeedKb: dlSpeed,
          uploadSpeedKb: ulSpeed,
        }));

        setHistory((prev) => {
          const updated = [...prev, { download: dlSpeed, upload: ulSpeed }];
          if (updated.length > 25) updated.shift();
          return updated;
        });
      }, 1000);
    } else {
      setStats((prev) => ({
        ...prev,
        durationSeconds: 0,
        downloadSpeedKb: 0,
        uploadSpeedKb: 0,
      }));
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleToggleConnection = async () => {
    if (status === 'disconnected') {
      setStatus('connecting');

      if ((window as any).clientAPI) {
        await (window as any).clientAPI.toggleConnection({
          connect: true,
          configContent: config.rawContent,
        });
      } else {
        await new Promise((r) => setTimeout(r, 1200));
      }

      setStatus('connected');
    } else if (status === 'connected') {
      setStatus('disconnecting');

      if ((window as any).clientAPI) {
        await (window as any).clientAPI.toggleConnection({
          connect: false,
          configContent: config.rawContent,
        });
      } else {
        await new Promise((r) => setTimeout(r, 800));
      }

      setStatus('disconnected');
    }
  };

  return (
    <div className="client-app-layout">
      <header className="client-header">
        <div className="brand">
          <Shield className="brand-logo icon-cyan" size={24} />
          <span className="brand-title">WireGuard VPN</span>
        </div>
        <div className="header-tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'main' ? 'active' : ''}`}
            onClick={() => setActiveTab('main')}
          >
            <Activity size={16} /> Tunnel
          </button>
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={16} /> Preferences
          </button>
        </div>
      </header>

      <main className="client-body">
        {activeTab === 'main' ? (
          <>
            <TunnelConnector
              status={status}
              configName={config.name}
              onToggle={handleToggleConnection}
            />

            <StatusDashboard status={status} config={config} stats={stats} />

            {status === 'connected' && <TrafficSpeedGraph history={history} downloadSpeedKb={stats.downloadSpeedKb} uploadSpeedKb={stats.uploadSpeedKb} />}

            <ConfigImporter currentConfig={config} onSelectConfig={setConfig} />
          </>
        ) : (
          <SystemTraySettings />
        )}
      </main>

      <footer className="client-footer">
        <span>WireGuard® protocol | Windows, macOS, Linux</span>
      </footer>
    </div>
  );
}

export default App;
