use rusqlite::{params, Connection};

use std::collections::HashMap;

use super::types::{AccountRecord, BotFormRecord, NoteRecord, SubmissionRecord};

pub fn init_db(path: &str) -> Connection {
    let conn = Connection::open(path).expect("Failed to open database");
    conn.execute_batch("PRAGMA journal_mode=WAL;").ok();
    conn.execute_batch(
        "
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
        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            form_id TEXT NOT NULL,
            submission_blob_id TEXT NOT NULL UNIQUE,
            submitted_at TEXT NOT NULL,
            encrypted INTEGER NOT NULL DEFAULT 0,
            submitter_address TEXT,
            reward_status TEXT DEFAULT 'pending',
            reward_tx_digest TEXT,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON submissions(form_id);
        CREATE TABLE IF NOT EXISTS admin_notes (
            form_id TEXT NOT NULL,
            submission_blob_id TEXT NOT NULL,
            note TEXT NOT NULL DEFAULT '',
            priority TEXT NOT NULL DEFAULT 'medium',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (form_id, submission_blob_id)
        );
        ",
    )
    .expect("Failed to create tables");
    conn
}

pub fn link_account(conn: &Connection, x_handle: &str, x_id: &str, wallet_address: &str) {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT OR REPLACE INTO accounts (x_handle, x_id, wallet_address, linked_at) VALUES (?1, ?2, ?3, ?4)",
        params![x_handle.to_lowercase(), x_id, wallet_address, now],
    )
    .ok();
}

pub fn get_account_by_handle(conn: &Connection, x_handle: &str) -> Option<AccountRecord> {
    conn.query_row(
        "SELECT x_handle, x_id, wallet_address, linked_at FROM accounts WHERE x_handle = ?1",
        params![x_handle.to_lowercase()],
        |row| {
            Ok(AccountRecord {
                x_handle: row.get(0)?,
                x_id: row.get(1)?,
                wallet_address: row.get(2)?,
                linked_at: row.get(3)?,
            })
        },
    )
    .ok()
}

pub fn get_account_by_wallet(conn: &Connection, wallet_address: &str) -> Option<AccountRecord> {
    conn.query_row(
        "SELECT x_handle, x_id, wallet_address, linked_at FROM accounts WHERE wallet_address = ?1",
        params![wallet_address],
        |row| {
            Ok(AccountRecord {
                x_handle: row.get(0)?,
                x_id: row.get(1)?,
                wallet_address: row.get(2)?,
                linked_at: row.get(3)?,
            })
        },
    )
    .ok()
}

pub fn unlink_account(conn: &Connection, x_handle: &str) {
    conn.execute(
        "DELETE FROM accounts WHERE x_handle = ?1",
        params![x_handle.to_lowercase()],
    )
    .ok();
}

pub fn save_bot_form(conn: &Connection, form: &BotFormRecord) {
    conn.execute(
        "INSERT OR REPLACE INTO bot_forms (form_id, form_blob_id, owner_wallet, tweet_id, tweet_url, title, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            form.form_id,
            form.form_blob_id,
            form.owner_wallet,
            form.tweet_id,
            form.tweet_url,
            form.title,
            form.created_at,
        ],
    )
    .ok();
}

pub fn get_forms_by_wallet(conn: &Connection, wallet_address: &str) -> Vec<BotFormRecord> {
    let mut stmt = conn
        .prepare("SELECT form_id, form_blob_id, owner_wallet, tweet_id, tweet_url, title, created_at FROM bot_forms WHERE owner_wallet = ?1 ORDER BY created_at DESC")
        .unwrap();
    stmt.query_map(params![wallet_address], |row| {
        Ok(BotFormRecord {
            form_id: row.get(0)?,
            form_blob_id: row.get(1)?,
            owner_wallet: row.get(2)?,
            tweet_id: row.get(3)?,
            tweet_url: row.get(4)?,
            title: row.get(5)?,
            created_at: row.get(6)?,
        })
    })
    .unwrap()
    .filter_map(|r| r.ok())
    .collect()
}

pub fn is_processed(conn: &Connection, tweet_id: &str) -> bool {
    conn.query_row(
        "SELECT 1 FROM processed_tweets WHERE tweet_id = ?1",
        params![tweet_id],
        |_| Ok(()),
    )
    .is_ok()
}

pub fn mark_processed(conn: &Connection, tweet_id: &str) {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT OR IGNORE INTO processed_tweets (tweet_id, processed_at) VALUES (?1, ?2)",
        params![tweet_id, now],
    )
    .ok();
}

pub fn get_state(conn: &Connection, key: &str) -> Option<String> {
    conn.query_row(
        "SELECT value FROM bot_state WHERE key = ?1",
        params![key],
        |row| row.get(0),
    )
    .ok()
}

pub fn set_state(conn: &Connection, key: &str, value: &str) {
    conn.execute(
        "INSERT OR REPLACE INTO bot_state (key, value) VALUES (?1, ?2)",
        params![key, value],
    )
    .ok();
}

// === Submissions CRUD ===

pub fn register_submission(
    conn: &Connection,
    form_id: &str,
    submission_blob_id: &str,
    submitted_at: &str,
    encrypted: bool,
    submitter_address: Option<&str>,
) {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT OR IGNORE INTO submissions (form_id, submission_blob_id, submitted_at, encrypted, submitter_address, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![form_id, submission_blob_id, submitted_at, encrypted as i32, submitter_address, now],
    )
    .ok();
}

pub fn get_submissions_by_form(conn: &Connection, form_id: &str) -> Vec<SubmissionRecord> {
    let mut stmt = conn
        .prepare("SELECT form_id, submission_blob_id, submitted_at, encrypted, submitter_address, reward_status, reward_tx_digest FROM submissions WHERE form_id = ?1 ORDER BY submitted_at DESC")
        .unwrap();
    stmt.query_map(params![form_id], |row| {
        let encrypted_int: i32 = row.get(3)?;
        Ok(SubmissionRecord {
            form_id: row.get(0)?,
            submission_blob_id: row.get(1)?,
            submitted_at: row.get(2)?,
            encrypted: encrypted_int != 0,
            submitter_address: row.get(4)?,
            reward_status: row.get(5)?,
            reward_tx_digest: row.get(6)?,
        })
    })
    .unwrap()
    .filter_map(|r| r.ok())
    .collect()
}

pub fn update_submission_reward(
    conn: &Connection,
    form_id: &str,
    submission_blob_id: &str,
    reward_tx_digest: &str,
) {
    conn.execute(
        "UPDATE submissions SET reward_status = 'sent', reward_tx_digest = ?1 WHERE form_id = ?2 AND submission_blob_id = ?3",
        params![reward_tx_digest, form_id, submission_blob_id],
    )
    .ok();
}

// === Admin Notes CRUD ===

pub fn upsert_note(
    conn: &Connection,
    form_id: &str,
    submission_blob_id: &str,
    note: &str,
    priority: &str,
) {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO admin_notes (form_id, submission_blob_id, note, priority, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5) ON CONFLICT(form_id, submission_blob_id) DO UPDATE SET note = ?3, priority = ?4, updated_at = ?5",
        params![form_id, submission_blob_id, note, priority, now],
    )
    .ok();
}

pub fn get_notes_by_form(conn: &Connection, form_id: &str) -> HashMap<String, NoteRecord> {
    let mut stmt = conn
        .prepare("SELECT submission_blob_id, note, priority, created_at, updated_at FROM admin_notes WHERE form_id = ?1")
        .unwrap();
    let rows = stmt
        .query_map(params![form_id], |row| {
            let key: String = row.get(0)?;
            let record = NoteRecord {
                note: row.get(1)?,
                priority: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
            };
            Ok((key, record))
        })
        .unwrap();
    rows.filter_map(|r| r.ok()).collect()
}
