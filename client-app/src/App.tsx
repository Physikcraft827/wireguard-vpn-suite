import React, { useState, useEffect } from 'react';
import { ConnectionState, VpnConfig, VpnStats } from './types';
import { TunnelConnector } from './components/TunnelConnector';
import { ConfigImporter } from './components/ConfigImporter';
import { StatusDashboard } from './components/StatusDashboard';
import { SystemTraySettings } from './components/SystemTraySettings';
import { TrafficSpeedGraph } from './components/TrafficSpeedGraph';
import { Shield, Settings, Activity, FileText } from 'lucide-react';
import './App.css';

const getInitialClientConfig = (): VpnConfig => {
  const saved = localStorage.getItem('wg_client_active_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse client config:', e);
    }
  }
  return {
    name: 'No Profile Loaded',
    rawContent: '',
    endpoint: 'Not Configured',
    clientIP: '10.8.0.x',
    dns: '1.1.1.1',
    publicKey: 'Import a .conf profile below',
  };
};

export function App() {
  const [activeTab, setActiveTab] = useState<'main' | 'settings'>('main');
  const [status, setStatus] = useState<ConnectionState>('disconnected');
  const [config, setConfig] = useState<VpnConfig>(getInitialClientConfig);

  // Auto-save active config to LocalStorage
  useEffect(() => {
    if (config.rawContent) {
      localStorage.setItem('wg_client_active_config', JSON.stringify(config));
    }
  }, [config]);

  const [stats, setStats] = useState<VpnStats>({
    durationSeconds: 0,
    publicIP: 'Disconnected',
    pingMs: 0,
    rxBytes: 0,
    txBytes: 0,
    downloadSpeedKb: 0,
    uploadSpeedKb: 0,
  });

  const [history, setHistory] = useState<{ download: number; upload: number }[]>([]);

  // Connection timer & traffic simulator
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

  // Listen to system tray quick actions if available
  useEffect(() => {
    if ((window as any).clientAPI) {
      (window as any).clientAPI.onTrayToggle(() => {
        handleToggleConnection();
      });
    }
  }, [status, config]);

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
      {/* Top Navigation */}
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

      {/* App Body */}
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
