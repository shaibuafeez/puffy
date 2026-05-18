use reqwest::Client;
use serde_json::json;
use tracing::info;

use super::types::ParsedForm;

const TWEET_SYSTEM_PROMPT: &str = r#"You are a form generator for Walform, a decentralized form builder on Sui blockchain.

Given a tweet, output a JSON object representing a form definition. The form will be used to collect wallet-connected submissions (like giveaways, hackathon entries, whitelists, etc).

Rules:
- Extract the form purpose from the tweet text
- Set rewardEnabled: true and rewardAmountSui if a SUI amount is mentioned
- Always set allowAnonymous: false (wallet connection is required)
- Always set encryptSubmissions: false
- Include 0-3 relevant form fields based on context (do NOT include a "wallet address" field — that's captured automatically)
- Field types available: text, textarea, email, url, number, dropdown, checkbox, radio, star-rating
- Each field needs: id (short lowercase), type, label, required (boolean)
- Keep the title short and clear (under 60 chars)
- Put the full tweet context in the description
- submitMessage should be encouraging and relevant

Respond ONLY with valid JSON matching this structure:
{
  "title": "string",
  "description": "string",
  "fields": [...],
  "settings": {
    "encryptSubmissions": false,
    "allowAnonymous": false,
    "submitMessage": "string",
    "rewardEnabled": boolean,
    "rewardAmountSui": number or null
  }
}"#;

const GENERATE_SYSTEM_PROMPT: &str = r#"You are a form generator for Walform, a decentralized form builder on Sui blockchain.

Given a user's description, output a JSON object representing a complete form definition. Be creative and thorough — generate a well-structured form that matches exactly what the user described.

Rules:
- Create a clear, concise title (under 60 chars)
- Write a helpful description explaining the form's purpose
- Generate 2-8 relevant fields based on the description
- Choose the best field type for each question
- Field types available: text, textarea, email, url, number, dropdown, checkbox, radio, star-rating
- Each field needs: id (short lowercase slug), type, label, required (boolean)
- For dropdown/checkbox/radio fields, include an "options" array with 2-5 relevant options
- Mark critical fields as required: true
- Do NOT include a "wallet address" field — that's captured automatically
- Set encryptSubmissions: false and allowAnonymous: true by default
- Set rewardEnabled: true and rewardAmountSui if the user mentions rewards/payments
- submitMessage should be encouraging and relevant to the form topic

Respond ONLY with valid JSON matching this structure:
{
  "title": "string",
  "description": "string",
  "fields": [
    { "id": "string", "type": "string", "label": "string", "required": boolean, "options": ["..."] }
  ],
  "settings": {
    "encryptSubmissions": false,
    "allowAnonymous": true,
    "submitMessage": "string",
    "rewardEnabled": boolean,
    "rewardAmountSui": number or null
  }
}"#;

pub async fn parse_tweet_to_form(api_key: &str, tweet_text: &str) -> Result<ParsedForm, String> {
    call_huru(api_key, TWEET_SYSTEM_PROMPT, &format!("Tweet: \"{}\"", tweet_text)).await
        .map(|mut parsed| {
            parsed.settings.allow_anonymous = false;
            parsed.settings.encrypt_submissions = false;
            parsed
        })
}

pub async fn generate_form_from_prompt(api_key: &str, prompt: &str) -> Result<ParsedForm, String> {
    call_huru(api_key, GENERATE_SYSTEM_PROMPT, prompt).await
}

async fn call_huru(api_key: &str, system_prompt: &str, user_message: &str) -> Result<ParsedForm, String> {
    let client = Client::new();

    let body = json!({
        "model": "huru/chat-1",
        "messages": [
            { "role": "system", "content": system_prompt },
            { "role": "user", "content": user_message }
        ],
        "response_format": { "type": "json_object" },
        "temperature": 0.3,
        "max_tokens": 2000
    });

    info!("Calling Huru AI...");

    let resp = client
        .post("https://huruai.xyz/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .header("X-Consumer-Email", "shaibuafeez@gmail.com")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Huru API request failed: {e}"))?;

    let status = resp.status();
    let resp_body: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse Huru response: {e}"))?;

    if !status.is_success() {
        return Err(format!("Huru API error {}: {}", status, resp_body));
    }

    info!("Huru response: {}", resp_body);

    let raw_content = resp_body["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| format!("No content in Huru response. Full response: {}", resp_body))?;

    // Strip markdown code fences if present (```json ... ```)
    let content = raw_content.trim();
    let content = if content.starts_with("```") {
        let start = content.find('\n').map(|i| i + 1).unwrap_or(0);
        let end = content.rfind("```").unwrap_or(content.len());
        &content[start..end]
    } else {
        content
    };
    let content = content.trim();

    let parsed: ParsedForm =
        serde_json::from_str(content).map_err(|e| format!("Failed to parse form JSON: {e}"))?;

    info!("Generated form: {}", parsed.title);
    Ok(parsed)
}
