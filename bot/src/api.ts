import express from "express";
import cors from "cors";
import { CONFIG } from "./config.js";
import {
  linkAccount,
  getAccountByHandle,
  getAccountByWallet,
  unlinkAccount,
  getFormsByWallet,
} from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Link X account to wallet
app.post("/api/link", (req, res) => {
  const { xHandle, xId, walletAddress } = req.body;

  if (!xHandle || !xId || !walletAddress) {
    res.status(400).json({ error: "Missing xHandle, xId, or walletAddress" });
    return;
  }

  linkAccount(xHandle, xId, walletAddress);
  res.json({ success: true, linked: { xHandle, walletAddress } });
});

// Check if handle is linked
app.get("/api/link/:handle", (req, res) => {
  const account = getAccountByHandle(req.params.handle);
  if (!account) {
    res.status(404).json({ error: "Not linked" });
    return;
  }
  res.json(account);
});

// Get forms created by bot for a wallet
app.get("/api/forms/:wallet", (req, res) => {
  const forms = getFormsByWallet(req.params.wallet);
  res.json(forms);
});

// Unlink account
app.delete("/api/link/:handle", (req, res) => {
  const { walletAddress } = req.body || {};
  const account = getAccountByHandle(req.params.handle);

  if (!account) {
    res.status(404).json({ error: "Not linked" });
    return;
  }

  // Verify the request comes from the wallet owner
  if (walletAddress && account.wallet_address !== walletAddress) {
    res.status(403).json({ error: "Wallet mismatch" });
    return;
  }

  unlinkAccount(req.params.handle);
  res.json({ success: true });
});

// Check link status by wallet
app.get("/api/account/:wallet", (req, res) => {
  const account = getAccountByWallet(req.params.wallet);
  if (!account) {
    res.status(404).json({ error: "No linked account" });
    return;
  }
  res.json(account);
});

export function startApi(): void {
  app.listen(CONFIG.app.botApiPort, () => {
    console.log(`[API] Listening on port ${CONFIG.app.botApiPort}`);
  });
}
