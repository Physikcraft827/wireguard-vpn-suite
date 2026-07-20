package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"os/exec"
	"runtime"

	"golang.org/x/crypto/curve25519"
)

type WireGuardApp struct {
	ctx context.Context
}

type KeyPair struct {
	PrivateKey string `json:"private_key"`
	PublicKey  string `json:"public_key"`
}

func NewWireGuardApp() *WireGuardApp {
	return &WireGuardApp{}
}

func (a *WireGuardApp) GenerateKeys() (*KeyPair, error) {
	var priv [32]byte
	var pub [32]byte

	_, err := rand.Read(priv[:])
	if err != nil {
		return nil, err
	}

	priv[0] &= 248
	priv[31] &= 127
	priv[31] |= 64

	curve25519.ScalarBaseMult(&pub, &priv)

	return &KeyPair{
		PrivateKey: base64.StdEncoding.EncodeToString(priv[:]),
		PublicKey:  base64.StdEncoding.EncodeToString(pub[:]),
	}, nil
}

func (a *WireGuardApp) ToggleTunnel(configPath string, enable bool) (string, error) {
	if runtime.GOOS == "windows" {
		var cmd *exec.Cmd
		if enable {
			cmd = exec.Command("wireguard.exe", "/installtunnelservice", configPath)
		} else {
			cmd = exec.Command("wireguard.exe", "/uninstalltunnelservice", "wg0")
		}
		out, err := cmd.CombinedOutput()
		return string(out), err
	}

	action := "up"
	if !enable {
		action = "down"
	}
	cmd := exec.Command("wg-quick", action, configPath)
	out, err := cmd.CombinedOutput()
	return string(out), err
}

func main() {
	app := NewWireGuardApp()
	keys, _ := app.GenerateKeys()
	fmt.Printf("WireGuard Go Backend initialized. Generated Key: %s\n", keys.PublicKey)
}
