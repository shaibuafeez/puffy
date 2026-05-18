pub mod db;
pub mod llm;
pub mod twitter;
pub mod types;
pub mod walrus;

use crate::common::ProcessDataRequest;
use crate::AppState;
use crate::EnclaveError;
use axum::extract::State;
use axum::Json;
use rusqlite::Connection;
use serde_repr::{Deserialize_repr, Serialize_repr};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tracing::{error, info};
use uuid::Uuid;

use self::twitter::TwitterClient;
use self::types::*;

// === Intent scope for signed enclave responses ===

#[derive(Serialize_repr, Deserialize_repr, Debug)]
#[repr(u8)]
pub enum IntentScope {
    FormCreated = 0,
}

// === Walform-specific state ===

pub struct WalformConfig {
    pub huru_api_key: String,
    pub walrus_publisher_url: String,
    pub walrus_aggregator_url: String,
    pub walform_base_url: String,
    pub enclave_base_url: String,
    pub poll_interval_ms: u64,
}

pub struct WalformState {
    pub db: Mutex<Connection>,
    pub twitter: TwitterClient,
    pub config: WalformConfig,
}

// === Action-routed process_data handler ===

pub async fn process_data(
    State(state): State<Arc<AppState>>,
    Json(request): Json<ProcessDataRequest<WalformRequest>>,
) -> Result<Json<serde_json::Value>, EnclaveError> {
    let walform = state
        .walform
        .as_ref()
        .ok_or_else(|| EnclaveError::GenericError("Walform state not initialized".into()))?;

    match request.payload.action.as_str() {
        "link" => handle_link(walform, request.payload.payload).await,
        "get_link" => handle_get_link(walform, request.payload.payload).await,
        "get_forms" => handle_get_forms(walform, request.payload.payload).await,
        "unlink" => handle_unlink(walform, request.payload.payload).await,
        "get_account" => handle_get_account(walform, request.payload.payload).await,
        "poll_status" => handle_poll_status(walform).await,
        "register_submission" => handle_register_submission(walform, request.payload.payload).await,
        "get_submissions" => handle_get_submissions(walform, request.payload.payload).await,
        "update_reward" => handle_update_reward(walform, request.payload.payload).await,
        "save_note" => handle_save_note(walform, request.payload.payload).await,
        "get_notes" => handle_get_notes(walform, request.payload.payload).await,
        "generate_form" => handle_generate_form(walform, request.payload.payload).await,
        _ => Err(EnclaveError::GenericError(format!(
            "Unknown action: {}",
            request.payload.action
        ))),
    }
}

// === Action handlers ===

async fn handle_link(
    state: &WalformState,
    payload: serde_json::Value,
) -> Result<Json<serde_json::Value>, EnclaveError> {
    let x_handle = payload["xHandle"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing xHandle".into()))?;
    let x_id = payload["xId"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing xId".into()))?;
    let wallet = payload["walletAddress"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing walletAddress".into()))?;

    let conn = state.db.lock().unwrap();
    db::link_account(&conn, x_handle, x_id, wallet);

    Ok(Json(serde_json::json!({
        "success": true,
        "linked": { "xHandle": x_handle, "walletAddress": wallet }
    })))
}

async fn handle_get_link(
    state: &WalformState,
    payload: serde_json::Value,
) -> Result<Json<serde_json::Value>, EnclaveError> {
    let handle = payload["handle"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing handle".into()))?;

    let conn = state.db.lock().unwrap();
    match db::get_account_by_handle(&conn, handle) {
        Some(acc) => Ok(Json(serde_json::to_value(acc).unwrap())),
        None => Err(EnclaveError::GenericError("Not linked".into())),
    }
}

async fn handle_get_forms(
    state: &WalformState,
    payload: serde_json::Value,
) -> Result<Json<serde_json::Value>, EnclaveError> {
    let wallet = payload["wallet"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing wallet".into()))?;

    let conn = state.db.lock().unwrap();
    let forms = db::get_forms_by_wallet(&conn, wallet);
    Ok(Json(serde_json::to_value(forms).unwrap()))
}

async fn handle_unlink(
    state: &WalformState,
    payload: serde_json::Value,
) -> Result<Json<serde_json::Value>, EnclaveError> {
    let handle = payload["handle"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing handle".into()))?;
    let wallet = payload["walletAddress"].as_str();

    let conn = state.db.lock().unwrap();

    // Verify wallet matches if provided
    if let Some(w) = wallet {
        if let Some(acc) = db::get_account_by_handle(&conn, handle) {
            if acc.wallet_address != w {
                return Err(EnclaveError::GenericError(
                    "Wallet address does not match".into(),
                ));
            }
        }
    }

    db::unlink_account(&conn, handle);
    Ok(Json(serde_json::json!({ "success": true })))
}

async fn handle_get_account(
    state: &WalformState,
    payload: serde_json::Value,
) -> Result<Json<serde_json::Value>, EnclaveError> {
    let wallet = payload["wallet"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing wallet".into()))?;

    let conn = state.db.lock().unwrap();
    match db::get_account_by_wallet(&conn, wallet) {
        Some(acc) => Ok(Json(serde_json::to_value(acc).unwrap())),
        None => Err(EnclaveError::GenericError("No linked account".into())),
    }
}

async fn handle_poll_status(
    state: &WalformState,
) -> Result<Json<serde_json::Value>, EnclaveError> {
    let conn = state.db.lock().unwrap();
    let last_tweet = db::get_state(&conn, "last_mention_id");
    Ok(Json(serde_json::json!({
        "status": "ok",
        "last_mention_id": last_tweet,
        "timestamp": chrono::Utc::now().to_rfc3339(),
    })))
}

// === Submission & Notes handlers ===

async fn handle_register_submission(
    state: &WalformState,
    payload: serde_json::Value,
) -> Result<Json<serde_json::Value>, EnclaveError> {
    let form_id = payload["formId"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing formId".into()))?;
    let submission_blob_id = payload["submissionBlobId"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing submissionBlobId".into()))?;
    let submitted_at = payload["submittedAt"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing submittedAt".into()))?;
    let encrypted = payload["encrypted"].as_bool().unwrap_or(false);
    let submitter_address = payload["submitterAddress"].as_str();

    let conn = state.db.lock().unwrap();
    db::register_submission(&conn, form_id, submission_blob_id, submitted_at, encrypted, submitter_address);

    Ok(Json(serde_json::json!({ "success": true })))
}

async fn handle_get_submissions(
    state: &WalformState,
    payload: serde_json::Value,
) -> Result<Json<serde_json::Value>, EnclaveError> {
    let form_id = payload["formId"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing formId".into()))?;

    let conn = state.db.lock().unwrap();
    let submissions = db::get_submissions_by_form(&conn, form_id);
    Ok(Json(serde_json::to_value(submissions).unwrap()))
}

async fn handle_update_reward(
    state: &WalformState,
    payload: serde_json::Value,
) -> Result<Json<serde_json::Value>, EnclaveError> {
    let form_id = payload["formId"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing formId".into()))?;
    let submission_blob_id = payload["submissionBlobId"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing submissionBlobId".into()))?;
    let reward_tx_digest = payload["rewardTxDigest"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing rewardTxDigest".into()))?;

    let conn = state.db.lock().unwrap();
    db::update_submission_reward(&conn, form_id, submission_blob_id, reward_tx_digest);

    Ok(Json(serde_json::json!({ "success": true })))
}

async fn handle_save_note(
    state: &WalformState,
    payload: serde_json::Value,
) -> Result<Json<serde_json::Value>, EnclaveError> {
    let form_id = payload["formId"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing formId".into()))?;
    let submission_blob_id = payload["submissionBlobId"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing submissionBlobId".into()))?;
    let note = payload["note"].as_str().unwrap_or("");
    let priority = payload["priority"].as_str().unwrap_or("medium");

    let conn = state.db.lock().unwrap();
    db::upsert_note(&conn, form_id, submission_blob_id, note, priority);

    Ok(Json(serde_json::json!({ "success": true })))
}

async fn handle_get_notes(
    state: &WalformState,
    payload: serde_json::Value,
) -> Result<Json<serde_json::Value>, EnclaveError> {
    let form_id = payload["formId"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing formId".into()))?;

    let conn = state.db.lock().unwrap();
    let notes = db::get_notes_by_form(&conn, form_id);
    Ok(Json(serde_json::to_value(notes).unwrap()))
}

// === AI form generation handler ===

async fn handle_generate_form(
    state: &WalformState,
    payload: serde_json::Value,
) -> Result<Json<serde_json::Value>, EnclaveError> {
    let prompt = payload["prompt"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing prompt".into()))?;

    let parsed = llm::generate_form_from_prompt(&state.config.huru_api_key, prompt)
        .await
        .map_err(|e| EnclaveError::GenericError(format!("AI generation failed: {}", e)))?;

    Ok(Json(serde_json::to_value(parsed).unwrap()))
}

// === Background polling loop ===

pub async fn spawn_polling_loop(state: Arc<WalformState>) {
    let interval = Duration::from_millis(state.config.poll_interval_ms);
    info!(
        "Starting polling loop (interval: {}ms)",
        state.config.poll_interval_ms
    );

    loop {
        if let Err(e) = poll_once(&state).await {
            error!("Polling error: {}", e);
        }
        tokio::time::sleep(interval).await;
    }
}

async fn poll_once(state: &WalformState) -> Result<(), String> {
    let since_id = {
        let conn = state.db.lock().unwrap();
        db::get_state(&conn, "last_mention_id")
    };

    let mentions = state
        .twitter
        .fetch_mentions(since_id.as_deref())
        .await?;

    if mentions.is_empty() {
        return Ok(());
    }

    info!("Found {} new mention(s)", mentions.len());

    // Process oldest first
    let mut sorted = mentions;
    sorted.reverse();

    for mention in &sorted {
        let is_processed = {
            let conn = state.db.lock().unwrap();
            db::is_processed(&conn, &mention.id)
        };
        if is_processed {
            continue;
        }

        if let Err(e) = process_mention(state, mention).await {
            error!("Error processing tweet {}: {}", mention.id, e);
        }

        let conn = state.db.lock().unwrap();
        db::mark_processed(&conn, &mention.id);
        db::set_state(&conn, "last_mention_id", &mention.id);
    }

    Ok(())
}

async fn process_mention(state: &WalformState, mention: &Mention) -> Result<(), String> {
    info!(
        "Processing mention {} from @{}",
        mention.id, mention.author_username
    );

    // 1. Check if user has a linked account
    let account = {
        let conn = state.db.lock().unwrap();
        db::get_account_by_handle(&conn, &mention.author_username)
    };

    let account = match account {
        Some(acc) => acc,
        None => {
            let reply_text = format!(
                "Hey @{}! Link your Sui wallet first at {}/link-twitter to create forms via tweets.",
                mention.author_username, state.config.walform_base_url
            );
            state
                .twitter
                .reply_to_tweet(&mention.id, &reply_text)
                .await?;
            return Ok(());
        }
    };

    // 2. Parse tweet with Huru AI
    let parsed = llm::parse_tweet_to_form(&state.config.huru_api_key, &mention.text).await?;

    // 3. Build full form definition
    let form_id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let tweet_url = TwitterClient::get_tweet_url(&mention.author_username, &mention.id);

    let form = FormDefinition {
        id: form_id.clone(),
        title: parsed.title.clone(),
        description: parsed.description,
        owner: account.wallet_address.clone(),
        created_at: now.clone(),
        fields: parsed.fields,
        settings: parsed.settings,
        tweet_url: Some(tweet_url.clone()),
        tweet_author: Some(mention.author_username.clone()),
    };

    // 4. Upload to Walrus
    let blob_id =
        walrus::store_form_on_walrus(&state.config.walrus_publisher_url, &form).await?;

    // 5. Save to database
    {
        let conn = state.db.lock().unwrap();
        db::save_bot_form(
            &conn,
            &BotFormRecord {
                form_id: form_id.clone(),
                form_blob_id: blob_id.clone(),
                owner_wallet: account.wallet_address,
                tweet_id: mention.id.clone(),
                tweet_url: tweet_url.clone(),
                title: parsed.title.clone(),
                created_at: now,
            },
        );
    }

    // 6. Reply with form link
    let reply_text = format!(
        "Form created!\n\n{}\n{}/form/{}\n\nRespondents connect their Sui wallet to enter.",
        parsed.title, state.config.walform_base_url, blob_id
    );
    state
        .twitter
        .reply_to_tweet(&mention.id, &reply_text)
        .await?;

    info!("Form {} created and reply posted for tweet {}", form_id, mention.id);
    Ok(())
}

// === Twitter OAuth GET route handlers ===

use axum::extract::Query;
use axum::response::Redirect;
use sha2::{Sha256, Digest};
use base64::engine::general_purpose::{URL_SAFE_NO_PAD, STANDARD};
use base64::Engine;

#[derive(Debug, serde::Deserialize)]
pub struct TwitterAuthParams {
    pub wallet: String,
}

pub async fn walform_twitter_auth(
    State(state): State<Arc<AppState>>,
    Query(params): Query<TwitterAuthParams>,
) -> Result<Redirect, EnclaveError> {
    let walform = state
        .walform
        .as_ref()
        .ok_or_else(|| EnclaveError::GenericError("Walform state not initialized".into()))?;

    // Generate PKCE code verifier (43-128 chars, base64url)
    let verifier_bytes: [u8; 32] = rand::random();
    let code_verifier = URL_SAFE_NO_PAD.encode(verifier_bytes);

    // Compute code challenge (S256)
    let mut hasher = Sha256::new();
    hasher.update(code_verifier.as_bytes());
    let challenge_hash = hasher.finalize();
    let code_challenge = URL_SAFE_NO_PAD.encode(challenge_hash);

    // Encode state = base64url({ wallet, codeVerifier })
    let state_json = serde_json::json!({
        "wallet": params.wallet,
        "codeVerifier": code_verifier,
    });
    let state_param = URL_SAFE_NO_PAD.encode(state_json.to_string().as_bytes());

    let client_id = &walform.twitter.client_id;
    let redirect_uri = format!("{}/twitter/callback", walform.config.enclave_base_url);
    let redirect_uri_encoded = urlencoding::encode(&redirect_uri);

    let url = format!(
        "https://twitter.com/i/oauth2/authorize?response_type=code&client_id={}&redirect_uri={}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state={}&code_challenge={}&code_challenge_method=S256",
        client_id, redirect_uri_encoded, state_param, code_challenge
    );

    Ok(Redirect::temporary(&url))
}

#[derive(Debug, serde::Deserialize)]
pub struct TwitterCallbackParams {
    pub code: String,
    pub state: String,
}

pub async fn walform_twitter_callback(
    State(state): State<Arc<AppState>>,
    Query(params): Query<TwitterCallbackParams>,
) -> Result<Redirect, EnclaveError> {
    let walform = state
        .walform
        .as_ref()
        .ok_or_else(|| EnclaveError::GenericError("Walform state not initialized".into()))?;

    let base_url = &walform.config.walform_base_url;

    // Decode state
    let state_bytes = URL_SAFE_NO_PAD
        .decode(&params.state)
        .map_err(|_| EnclaveError::GenericError("Invalid state".into()))?;
    let state_json: serde_json::Value = serde_json::from_slice(&state_bytes)
        .map_err(|_| EnclaveError::GenericError("Invalid state JSON".into()))?;
    let wallet = state_json["wallet"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing wallet in state".into()))?;
    let code_verifier = state_json["codeVerifier"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("Missing codeVerifier in state".into()))?;

    let client_id = &walform.twitter.client_id;
    let client_secret = &walform.twitter.client_secret;
    let redirect_uri = format!("{}/twitter/callback", walform.config.enclave_base_url);

    // Exchange code for token
    let client = reqwest::Client::new();
    let token_res = client
        .post("https://api.twitter.com/2/oauth2/token")
        .header(
            "Authorization",
            format!(
                "Basic {}",
                STANDARD.encode(format!("{}:{}", client_id, client_secret))
            ),
        )
        .header("Content-Type", "application/x-www-form-urlencoded")
        .body(format!(
            "code={}&grant_type=authorization_code&redirect_uri={}&code_verifier={}",
            urlencoding::encode(&params.code),
            urlencoding::encode(&redirect_uri),
            urlencoding::encode(code_verifier),
        ))
        .send()
        .await
        .map_err(|e| EnclaveError::GenericError(format!("Token request failed: {}", e)))?;

    if !token_res.status().is_success() {
        error!("Token exchange failed: {}", token_res.status());
        return Ok(Redirect::temporary(&format!(
            "{}/link-twitter?error=token_failed",
            base_url
        )));
    }

    let token_data: serde_json::Value = token_res
        .json()
        .await
        .map_err(|e| EnclaveError::GenericError(format!("Token parse failed: {}", e)))?;
    let access_token = token_data["access_token"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("No access_token in response".into()))?;

    // Fetch user profile
    let user_res = client
        .get("https://api.twitter.com/2/users/me")
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await
        .map_err(|e| EnclaveError::GenericError(format!("User profile request failed: {}", e)))?;

    if !user_res.status().is_success() {
        return Ok(Redirect::temporary(&format!(
            "{}/link-twitter?error=profile_failed",
            base_url
        )));
    }

    let user_data: serde_json::Value = user_res
        .json()
        .await
        .map_err(|e| EnclaveError::GenericError(format!("User profile parse failed: {}", e)))?;
    let x_handle = user_data["data"]["username"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("No username in profile".into()))?;
    let x_id = user_data["data"]["id"]
        .as_str()
        .ok_or_else(|| EnclaveError::GenericError("No id in profile".into()))?;

    // Store the link
    {
        let conn = walform.db.lock().unwrap();
        db::link_account(&conn, x_handle, x_id, wallet);
    }

    info!("Linked @{} to wallet {}", x_handle, wallet);

    Ok(Redirect::temporary(&format!(
        "{}/link-twitter?linked=true&handle={}",
        base_url, x_handle
    )))
}
