import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Peer, ServerConfigState } from '../types';
import { generateClientConfigText } from '../utils/wireguard';
import { X, Download, Copy, Check, QrCode as QrIcon } from 'lucide-react';

interface PeerQRCodeModalProps {
  peer: Peer | null;
  serverConfig: ServerConfigState;
  onClose: () => void;
}

export const PeerQRCodeModal: React.FC<PeerQRCodeModalProps> = ({ peer, serverConfig, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [endpointHost, setEndpointHost] = useState(serverConfig.endpointHost || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (peer && canvasRef.current) {
      const configText = generateClientConfigText(peer, serverConfig, endpointHost);
      QRCode.toCanvas(canvasRef.current, configText, {
        width: 260,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#0f172a',
        },
      }, (error) => {
        if (error) console.error('QR Code render error:', error);
      });
    }
  }, [peer, serverConfig, endpointHost]);

  if (!peer) return null;

  const clientConfigStr = generateClientConfigText(peer, serverConfig, endpointHost);

  const handleCopy = () => {
    navigator.clipboard.writeText(clientConfigStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${peer.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.conf`;
    if ((window as any).electronAPI) {
      (window as any).electronAPI.saveFile({ filename, content: clientConfigStr });
    } else {
      const blob = new Blob([clientConfigStr], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-panel fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <QrIcon size={22} className="icon-cyan" />
            <h3>Client QR Code & Configuration Export</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group margin-bottom-md">
            <label>Server Endpoint IP / Domain:</label>
            <input
              type="text"
              className="input-field"
              value={endpointHost}
              onChange={(e) => setEndpointHost(e.target.value)}
              placeholder="e.g. 203.0.113.10 or vpn.yourdomain.com"
            />
          </div>

          <div className="qr-preview-container">
            <div className="canvas-wrapper">
              <canvas ref={canvasRef} />
              <p className="qr-hint">Scan with WireGuard Mobile App (iOS / Android)</p>
            </div>

            <div className="config-preview-box">
              <div className="config-header">
                <span>{peer.name}.conf</span>
                <div className="modal-actions">
                  <button className="btn btn-outline sm" onClick={handleCopy}>
                    {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button className="btn btn-primary sm" onClick={handleDownload}>
                    <Download size={14} /> Download .conf
                  </button>
                </div>
              </div>
              <pre className="config-code-preview">{clientConfigStr}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
