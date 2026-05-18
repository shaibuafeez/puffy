import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "walform-bot.db");

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent access
db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    x_handle TEXT PRIMARY KEY,
    x_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    linked_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bot_forms (
    form_id TEXT PRIMARY KEY,
    form_blob_id TEXT NOT NULL,
    owner_wallet TEXT NOT NULL,
    tweet_id TEXT NOT NULL,
    tweet_url TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS processed_tweets (
    tweet_id TEXT PRIMARY KEY,
    processed_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bot_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// --- Accounts ---

export interface AccountRecord {
  x_handle: string;
  x_id: string;
  wallet_address: string;
  linked_at: string;
}

export function linkAccount(
  xHandle: string,
  xId: string,
  walletAddress: string
): void {
  db.prepare(
    `INSERT OR REPLACE INTO accounts (x_handle, x_id, wallet_address, linked_at)
     VALUES (?, ?, ?, ?)`
  ).run(xHandle.toLowerCase(), xId, walletAddress, new Date().toISOString());
}

export function getAccountByHandle(
  xHandle: string
): AccountRecord | undefined {
  return db
    .prepare("SELECT * FROM accounts WHERE x_handle = ?")
    .get(xHandle.toLowerCase()) as AccountRecord | undefined;
}

export function getAccountByWallet(
  walletAddress: string
): AccountRecord | undefined {
  return db
    .prepare("SELECT * FROM accounts WHERE wallet_address = ?")
    .get(walletAddress) as AccountRecord | undefined;
}

export function unlinkAccount(xHandle: string): void {
  db.prepare("DELETE FROM accounts WHERE x_handle = ?").run(
    xHandle.toLowerCase()
  );
}

// --- Bot Forms ---

export interface BotFormRecord {
  form_id: string;
  form_blob_id: string;
  owner_wallet: string;
  tweet_id: string;
  tweet_url: string;
  title: string;
  created_at: string;
}

export function saveBotForm(form: BotFormRecord): void {
  db.prepare(
    `INSERT OR REPLACE INTO bot_forms (form_id, form_blob_id, owner_wallet, tweet_id, tweet_url, title, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    form.form_id,
    form.form_blob_id,
    form.owner_wallet,
    form.tweet_id,
    form.tweet_url,
    form.title,
    form.created_at
  );
}

export function getFormsByWallet(walletAddress: string): BotFormRecord[] {
  return db
    .prepare("SELECT * FROM bot_forms WHERE owner_wallet = ? ORDER BY created_at DESC")
    .all(walletAddress) as BotFormRecord[];
}

// --- Processed Tweets ---

export function isProcessed(tweetId: string): boolean {
  const row = db
    .prepare("SELECT 1 FROM processed_tweets WHERE tweet_id = ?")
    .get(tweetId);
  return !!row;
}

export function markProcessed(tweetId: string): void {
  db.prepare(
    "INSERT OR IGNORE INTO processed_tweets (tweet_id, processed_at) VALUES (?, ?)"
  ).run(tweetId, new Date().toISOString());
}

// --- Bot State (for tracking last seen tweet ID) ---

export function getState(key: string): string | undefined {
  const row = db.prepare("SELECT value FROM bot_state WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value;
}

export function setState(key: string, value: string): void {
  db.prepare(
    "INSERT OR REPLACE INTO bot_state (key, value) VALUES (?, ?)"
  ).run(key, value);
}
