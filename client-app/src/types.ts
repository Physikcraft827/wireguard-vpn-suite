export interface VpnConfig {
  name: string;
  rawContent: string;
  endpoint: string;
  clientIP: string;
  dns: string;
  publicKey: string;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'disconnecting';

export interface VpnStats {
  durationSeconds: number;
  publicIP: string;
  pingMs: number;
  rxBytes: number;
  txBytes: number;
  downloadSpeedKb: number;
  uploadSpeedKb: number;
}
