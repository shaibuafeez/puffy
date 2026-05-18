use serde::{Deserialize, Serialize};

// === Nautilus process_data action routing ===

#[derive(Debug, Serialize, Deserialize)]
pub struct WalformRequest {
    pub action: String,
    #[serde(default)]
    pub payload: serde_json::Value,
}

// === Twitter types ===

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mention {
    pub id: String,
    pub text: String,
    pub author_id: String,
    pub author_username: String,
    pub conversation_id: String,
}

// === Form definition types (mirrors frontend types.ts) ===

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormField {
    pub id: String,
    #[serde(rename = "type")]
    pub field_type: String,
    pub label: String,
    pub required: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub placeholder: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormSettings {
    #[serde(rename = "encryptSubmissions")]
    pub encrypt_submissions: bool,
    #[serde(rename = "allowAnonymous")]
    pub allow_anonymous: bool,
    #[serde(rename = "submitMessage")]
    pub submit_message: String,
    #[serde(rename = "rewardEnabled", skip_serializing_if = "Option::is_none")]
    pub reward_enabled: Option<bool>,
    #[serde(rename = "rewardAmountSui", skip_serializing_if = "Option::is_none")]
    pub reward_amount_sui: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedForm {
    pub title: String,
    pub description: String,
    pub fields: Vec<FormField>,
    pub settings: FormSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormDefinition {
    pub id: String,
    pub title: String,
    pub description: String,
    pub owner: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    pub fields: Vec<FormField>,
    pub settings: FormSettings,
    #[serde(rename = "tweetUrl", skip_serializing_if = "Option::is_none")]
    pub tweet_url: Option<String>,
    #[serde(rename = "tweetAuthor", skip_serializing_if = "Option::is_none")]
    pub tweet_author: Option<String>,
}

// === Walrus response types ===

#[derive(Debug, Deserialize)]
pub struct WalrusResponse {
    #[serde(rename = "newlyCreated")]
    pub newly_created: Option<WalrusNewlyCreated>,
    #[serde(rename = "alreadyCertified")]
    pub already_certified: Option<WalrusAlreadyCertified>,
}

#[derive(Debug, Deserialize)]
pub struct WalrusNewlyCreated {
    #[serde(rename = "blobObject")]
    pub blob_object: WalrusBlobObject,
}

#[derive(Debug, Deserialize)]
pub struct WalrusBlobObject {
    #[serde(rename = "blobId")]
    pub blob_id: String,
}

#[derive(Debug, Deserialize)]
pub struct WalrusAlreadyCertified {
    #[serde(rename = "blobId")]
    pub blob_id: String,
}

// === Database record types ===

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountRecord {
    pub x_handle: String,
    pub x_id: String,
    pub wallet_address: String,
    pub linked_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BotFormRecord {
    pub form_id: String,
    pub form_blob_id: String,
    pub owner_wallet: String,
    pub tweet_id: String,
    pub tweet_url: String,
    pub title: String,
    pub created_at: String,
}

// === Submission & Note record types ===

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubmissionRecord {
    pub form_id: String,
    pub submission_blob_id: String,
    pub submitted_at: String,
    pub encrypted: bool,
    pub submitter_address: Option<String>,
    pub reward_status: Option<String>,
    pub reward_tx_digest: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteRecord {
    pub note: String,
    pub priority: String,
    pub created_at: String,
    pub updated_at: String,
}

// === BCS-serializable struct for on-chain verification ===

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FormCreatedData {
    pub form_blob_id: Vec<u8>,
    pub owner_address: Vec<u8>,
    pub tweet_id: Vec<u8>,
}
