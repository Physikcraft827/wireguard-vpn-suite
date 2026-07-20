# WireGuard VPN Suite: Server Management Studio & Cross-Platform Client

A full-stack, enterprise-grade WireGuard VPN application suite featuring a **Server Management Studio** (VPN Server & Config Creator) and a **Cross-Platform Client VPN App** (Windows `.exe`, macOS, Linux).

---

## 🌟 Architecture & Features

### 1. Server Management App (`/server-app`)
* **Interface Configuration:** Port selection (default 51820), Subnet range (`10.8.0.0/24`), DNS server, MTU sizing, and PostUp/PostDown firewall rules.
* **Curve25519 Key Generator:** Automatic base64 Private/Public key generation for server & client peers.
* **Peer Management Studio:** Add, edit, search, and delete client peers with automatic IP assignment within the subnet.
* **QR Code & Config Export:** Dynamic real-time QR code generation in UI for scanning with WireGuard mobile apps (iOS / Android) and downloadable `.conf` profile files.
* **Live Dashboard & Metrics:** Real-time upload (Tx) and download (Rx) speed monitoring, active peer counter, and peer handshake timestamps.
* **Tunnel Control Daemon:** Direct interface start/stop execution.

### 2. Client VPN App (`/client-app`)
* **One-Click Tunnel Connector:** Animated glowing connect/disconnect toggle with state indicators.
* **Profile Importer:** Import `.conf` files directly via file picker or paste raw configuration strings.
* **Status Dashboard:** Real-time connection duration timer, virtual WireGuard IP, remote endpoint, ping latency (ms), and download/upload volume counters.
* **System Tray Minimization:** Minimizes to system tray near clock with quick connect/disconnect context menu.
* **Autostart & Kill Switch:** Windows startup registry integration and internet kill switch options.

---

## 💻 Tech Stack & System Requirements

* **Frontend:** React 18, TypeScript, Vite, Modern CSS (Glassmorphism Dark Theme, Outfit / JetBrains Mono fonts)
* **Backend Runtime:** Node.js / Electron Native Process (or Rust / Tauri v2 & Go / Wails wrappers)
* **Virtual Adapter:** Wintun (`wintun.dll`) on Windows / `wg-quick` on Linux/macOS
* **Privileges:** Administrator / Root required for virtual network adapter creation and routing tables.

---

## 🚀 Step-by-Step Compilation & Build Instructions

### Prerequisites
Ensure Node.js (v18+) and npm are installed.

```bash
# Verify installation
node -v
npm -v
```

---

### Step 1: Install Dependencies

```bash
# 1. Install root workspace dependencies
cd c:\Users\Administrator\Desktop\vpn
npm install

# 2. Install Server Studio dependencies
cd c:\Users\Administrator\Desktop\vpn\server-app
npm install

# 3. Install Client VPN App dependencies
cd c:\Users\Administrator\Desktop\vpn\client-app
npm install
```

---

### Step 2: Run in Development Mode

#### Server Management App:
```bash
cd c:\Users\Administrator\Desktop\vpn\server-app
npm run dev
# Or with Electron window:
npx electron .
```

#### Client VPN App:
```bash
cd c:\Users\Administrator\Desktop\vpn\client-app
npm run dev
# Or with Electron window:
npx electron .
```

---

### Step 3: Compile & Build Executables (`.exe`)

To build standalone Windows `.exe` installers or portable binaries:

```bash
# Build Server Management Studio frontend
cd c:\Users\Administrator\Desktop\vpn\server-app
npm run build

# Package into Windows .exe executable with Electron Builder
npx electron-builder --win nsis

# Build Client VPN App frontend
cd c:\Users\Administrator\Desktop\vpn\client-app
npm run build

# Package Client VPN into standalone Windows .exe
npx electron-builder --win nsis
```

The compiled binaries will be output in:
- `server-app/dist/` and `server-app/dist-electron/`
- `client-app/dist/` and `client-app/dist-electron/`

---

## 🛡️ Windows Wintun & Admin Elevation Setup

Under Windows, WireGuard creates network interfaces using `wintun.dll`.
1. Place `wintun.dll` (from [wintun.net](https://www.wintun.net/)) in `C:\Windows\System32\` or next to your compiled `.exe`.
2. Right-click the compiled `.exe` and select **Run as Administrator** to allow interface creation and `iptables`/netsh routing configuration.

---

## 📜 License
MIT License - Created for High Performance & Enterprise Security.
