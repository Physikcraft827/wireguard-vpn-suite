#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use std::process::Command;
use x25519_dalek::{PublicKey, StaticSecret};

#[derive(Serialize, Deserialize)]
struct KeyPair {
    private_key: String,
    public_key: String,
}

#[tauri::command]
fn generate_wireguard_keys() -> KeyPair {
    let secret = StaticSecret::random_from_rng(OsRng);
    let public = PublicKey::from(&secret);

    KeyPair {
        private_key: BASE64.encode(secret.to_bytes()),
        public_key: BASE64.encode(public.to_bytes()),
    }
}

#[tauri::command]
fn start_wireguard_tunnel(config_path: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("wireguard.exe")
            .args(["/installtunnelservice", &config_path])
            .output()
            .map_err(|e| e.to_string())?;
        
        if output.status.success() {
            Ok("WireGuard Wintun Tunnel Service Started Successfully".to_string())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let output = Command::new("wg-quick")
            .args(["up", &config_path])
            .output()
            .map_err(|e| e.to_string())?;

        if output.status.success() {
            Ok("WireGuard Tunnel Started".to_string())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }
}

#[tauri::command]
fn stop_wireguard_tunnel(interface_name: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("wireguard.exe")
            .args(["/uninstalltunnelservice", &interface_name])
            .output()
            .map_err(|e| e.to_string())?;
        
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }

    #[cfg(not(target_os = "windows"))]
    {
        let output = Command::new("wg-quick")
            .args(["down", &interface_name])
            .output()
            .map_err(|e| e.to_string())?;

        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            generate_wireguard_keys,
            start_wireguard_tunnel,
            stop_wireguard_tunnel
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
