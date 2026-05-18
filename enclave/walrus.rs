use reqwest::Client;
use tracing::info;

use super::types::{FormDefinition, WalrusResponse};

pub async fn store_form_on_walrus(
    publisher_url: &str,
    form: &FormDefinition,
) -> Result<String, String> {
    let client = Client::new();
    let url = format!("{}/v1/blobs?epochs=5", publisher_url);

    let json_body =
        serde_json::to_string(form).map_err(|e| format!("Failed to serialize form: {e}"))?;

    info!("Uploading form '{}' to Walrus...", form.title);

    let resp = client
        .put(&url)
        .header("Content-Type", "application/json")
        .body(json_body)
        .send()
        .await
        .map_err(|e| format!("Walrus upload failed: {e}"))?;

    let status = resp.status();
    let body = resp
        .text()
        .await
        .map_err(|e| format!("Failed to read Walrus response: {e}"))?;

    if !status.is_success() {
        return Err(format!("Walrus upload error {}: {}", status, body));
    }

    let walrus_resp: WalrusResponse =
        serde_json::from_str(&body).map_err(|e| format!("Failed to parse Walrus response: {e}"))?;

    let blob_id = if let Some(newly_created) = walrus_resp.newly_created {
        newly_created.blob_object.blob_id
    } else if let Some(already_certified) = walrus_resp.already_certified {
        already_certified.blob_id
    } else {
        return Err("No blob ID in Walrus response".to_string());
    };

    info!("Form uploaded to Walrus: {}", blob_id);
    Ok(blob_id)
}
