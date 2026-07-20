import React, { useState } from 'react';
import { ServerConfigState } from '../types';
import { generateKeyPair, generateServerConfigText } from '../utils/wireguard';
import { Key, RefreshCw, Shield, Download, FileCode, CheckCircle2 } from 'lucide-react';

interface ServerConfigProps {
  config: ServerConfigState;
  onChange: (updated: ServerConfigState) => void;
  peersCount: number;
}

export const ServerConfig: React.FC<ServerConfigProps> = ({ config, onChange, peersCount }) => {
  const [copied, setCopied] = useState(false);

  const handleKeyRegen = () => {
    if (confirm('Regenerating server keys will invalidate all existing client connections. Proceed?')) {
      const newKeys = generateKeyPair();
      onChange({
        ...config,
        privateKey: newKeys.privateKey,
        publicKey: newKeys.publicKey,
      });
    }
  };

  const handleCopyConfig = () => {
    const text = generateServerConfigText(config, []);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card glass-panel fade-in">
      <div className="card-header">
        <div className="card-title">
          <Shield className="icon-emerald" size={22} />
          <h3>WireGuard Tunnel & Interface Settings</h3>
        </div>
        <span className="badge badge-neutral">Peers: {peersCount}</span>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Interface Name</label>
          <input
            type="text"
            className="input-field"
            value={config.interfaceName}
            onChange={(e) => onChange({ ...config, interfaceName: e.target.value })}
            placeholder="wg0"
          />
        </div>

        <div className="form-group">
          <label>Listen Port (UDP)</label>
          <input
            type="number"
            className="input-field"
            value={config.listenPort}
            onChange={(e) => onChange({ ...config, listenPort: parseInt(e.target.value) || 51820 })}
          />
        </div>

        <div className="form-group">
          <label>VPN Subnet Range</label>
          <input
            type="text"
            className="input-field"
            value={config.subnet}
            onChange={(e) => onChange({ ...config, subnet: e.target.value })}
            placeholder="10.8.0.0/24"
          />
        </div>

        <div className="form-group">
          <label>Server Tunnel IP</label>
          <input
            type="text"
            className="input-field"
            value={config.serverIP}
            onChange={(e) => onChange({ ...config, serverIP: e.target.value })}
            placeholder="10.8.0.1/24"
          />
        </div>

        <div className="form-group">
          <label>Server Public IP / Hostname (Endpoint)</label>
          <input
            type="text"
            className="input-field"
            value={config.endpointHost || ''}
            onChange={(e) => onChange({ ...config, endpointHost: e.target.value })}
            placeholder="e.g. 185.220.101.5 or vpn.yourdomain.com"
          />
        </div>

        <div className="form-group">
          <label>DNS Resolver</label>
          <input
            type="text"
            className="input-field"
            value={config.dns}
            onChange={(e) => onChange({ ...config, dns: e.target.value })}
            placeholder="1.1.1.1, 8.8.8.8"
          />
        </div>

        <div className="form-group">
          <label>MTU Size</label>
          <input
            type="number"
            className="input-field"
            value={config.mtu}
            onChange={(e) => onChange({ ...config, mtu: parseInt(e.target.value) || 1420 })}
          />
        </div>
      </div>

      <div className="keys-section margin-top-lg">
        <div className="section-label">
          <Key size={16} /> Server Key Pair (Curve25519)
        </div>
        <div className="key-box-container">
          <div className="key-row">
            <span className="key-title">Public Key:</span>
            <code className="key-code">{config.publicKey}</code>
          </div>
          <div className="key-row">
            <span className="key-title">Private Key:</span>
            <code className="key-code blur-sensitive">{config.privateKey}</code>
          </div>
        </div>
        <div className="button-row margin-top-md">
          <button className="btn btn-secondary" onClick={handleKeyRegen}>
            <RefreshCw size={15} /> Regenerate Server Keys
          </button>
          <button className="btn btn-outline" onClick={handleCopyConfig}>
            {copied ? <CheckCircle2 size={15} color="#10b981" /> : <FileCode size={15} />}
            {copied ? 'Copied to Clipboard!' : 'Copy wg0.conf'}
          </button>
        </div>
      </div>

      <div className="advanced-section margin-top-lg">
        <h4 className="sub-heading">Firewall & Routing Scripts (PostUp / PostDown)</h4>
        <div className="form-group margin-top-sm">
          <label>PostUp Rule</label>
          <input
            type="text"
            className="input-field code-font"
            value={config.postUp}
            onChange={(e) => onChange({ ...config, postUp: e.target.value })}
            placeholder="iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE"
          />
        </div>
        <div className="form-group margin-top-sm">
          <label>PostDown Rule</label>
          <input
            type="text"
            className="input-field code-font"
            value={config.postDown}
            onChange={(e) => onChange({ ...config, postDown: e.target.value })}
            placeholder="iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE"
          />
        </div>
      </div>
    </div>
  );
};
