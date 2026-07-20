import React from 'react';
import { ConnectionState } from '../types';
import { Power, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

interface TunnelConnectorProps {
  status: ConnectionState;
  configName: string;
  onToggle: () => void;
}

export const TunnelConnector: React.FC<TunnelConnectorProps> = ({ status, configName, onToggle }) => {
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting' || status === 'disconnecting';

  return (
    <div className="connector-container">
      <div className="tunnel-status-header">
        <span className={`status-badge-glow ${status}`}>
          {isConnected && <ShieldCheck size={16} />}
          {status === 'disconnected' && <ShieldAlert size={16} />}
          {isConnecting && <Loader2 size={16} className="spin" />}
          <span>{status.toUpperCase()}</span>
        </span>
        <span className="current-config-title">{configName}</span>
      </div>

      <div className="power-btn-wrapper margin-top-lg">
        <div className={`power-ring ${status}`} />
        <button
          className={`power-button ${status}`}
          onClick={onToggle}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <Loader2 size={42} className="spin icon-light" />
          ) : (
            <Power size={44} className={isConnected ? 'icon-emerald-bright' : 'icon-muted-bright'} />
          )}
        </button>
      </div>

      <div className="connector-hint margin-top-md">
        {isConnected && <p className="text-emerald">Protected & Encrypted with WireGuard</p>}
        {status === 'disconnected' && <p className="text-muted">Click the button to establish VPN connection</p>}
        {isConnecting && <p className="text-cyan">Handshaking with Remote WireGuard Peer...</p>}
      </div>
    </div>
  );
};
