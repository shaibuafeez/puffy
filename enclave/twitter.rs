use reqwest::Client;
use serde_json::json;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::info;

use super::types::Mention;

pub struct TwitterTokens {
    pub access_token: String,
    pub refresh_token: String,
}

pub struct TwitterClient {
    client: Client,
    pub client_id: String,
    pub client_secret: String,
    pub bearer_token: String,
    pub tokens: Arc<RwLock<TwitterTokens>>,
    bot_user_id: RwLock<Option<String>>,
}

impl TwitterClient {
    pub fn new(
        client_id: String,
        client_secret: String,
        access_token: String,
        refresh_token: String,
        bearer_token: String,
    ) -> Self {
        Self {
            client: Client::new(),
            client_id,
            client_secret,
            bearer_token,
            tokens: Arc::new(RwLock::new(TwitterTokens {
                access_token,
                refresh_token,
            })),
            bot_user_id: RwLock::new(None),
        }
    }

    async fn get_bot_user_id(&self) -> Result<String, String> {
        // Check cache
        {
            let cached = self.bot_user_id.read().await;
            if let Some(ref id) = *cached {
                return Ok(id.clone());
            }
        }

        // /2/users/me requires user context, not app-only bearer
        match self.try_get_bot_user_id().await {
            Ok(id) => Ok(id),
            Err(e) => {
                if e.contains("401") || e.contains("Unauthorized") {
                    info!("Access token expired during user lookup, refreshing...");
                    self.refresh_access_token().await?;
                    self.try_get_bot_user_id().await
                } else {
                    Err(e)
                }
            }
        }
    }

    async fn try_get_bot_user_id(&self) -> Result<String, String> {
        let tokens = self.tokens.read().await;
        let resp = self
            .client
            .get("https://api.twitter.com/2/users/me")
            .header("Authorization", format!("Bearer {}", tokens.access_token))
            .send()
            .await
            .map_err(|e| format!("Failed to fetch bot user: {e}"))?;

        let status = resp.status();
        let body: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse user response: {e}"))?;

        if !status.is_success() {
            return Err(format!("{} - {}", status.as_u16(), body));
        }

        let user_id = body["data"]["id"]
            .as_str()
            .ok_or("Missing user id in response")?
            .to_string();

        // Cache it
        let mut cached = self.bot_user_id.write().await;
        *cached = Some(user_id.clone());

        Ok(user_id)
    }

    pub async fn fetch_mentions(&self, since_id: Option<&str>) -> Result<Vec<Mention>, String> {
        match self.try_fetch_mentions(since_id).await {
            Ok(mentions) => Ok(mentions),
            Err(e) => {
                if e.contains("401") || e.contains("Unauthorized") {
                    info!("Access token expired during fetch_mentions, refreshing...");
                    self.refresh_access_token().await?;
                    self.try_fetch_mentions(since_id).await
                } else {
                    Err(e)
                }
            }
        }
    }

    async fn try_fetch_mentions(&self, since_id: Option<&str>) -> Result<Vec<Mention>, String> {
        let bot_id = self.get_bot_user_id().await?;

        let mut url = format!(
            "https://api.twitter.com/2/users/{}/mentions?tweet.fields=conversation_id,author_id&expansions=author_id&max_results=10",
            bot_id
        );
        if let Some(sid) = since_id {
            url.push_str(&format!("&since_id={}", sid));
        }

        let tokens = self.tokens.read().await;
        let resp = self
            .client
            .get(&url)
            .header("Authorization", format!("Bearer {}", tokens.access_token))
            .send()
            .await
            .map_err(|e| format!("Failed to fetch mentions: {e}"))?;

        let status = resp.status();
        let body: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse mentions: {e}"))?;

        if !status.is_success() {
            return Err(format!("{} - {}", status.as_u16(), body));
        }

        let tweets = match body["data"].as_array() {
            Some(arr) => arr.clone(),
            None => return Ok(vec![]),
        };

        let users = body["includes"]["users"]
            .as_array()
            .cloned()
            .unwrap_or_default();

        let mut mentions = Vec::new();
        for tweet in &tweets {
            let id = tweet["id"].as_str().unwrap_or("").to_string();
            let text = tweet["text"].as_str().unwrap_or("").to_string();
            let author_id = tweet["author_id"].as_str().unwrap_or("").to_string();
            let conversation_id = tweet["conversation_id"]
                .as_str()
                .unwrap_or(&id)
                .to_string();

            let author_username = users
                .iter()
                .find(|u| u["id"].as_str() == Some(&author_id))
                .and_then(|u| u["username"].as_str())
                .unwrap_or("")
                .to_string();

            mentions.push(Mention {
                id,
                text,
                author_id,
                author_username,
                conversation_id,
            });
        }

        Ok(mentions)
    }

    pub async fn reply_to_tweet(&self, tweet_id: &str, text: &str) -> Result<String, String> {
        match self.try_reply(tweet_id, text).await {
            Ok(id) => Ok(id),
            Err(e) => {
                if e.contains("401") || e.contains("403") {
                    info!("Access token expired, refreshing...");
                    self.refresh_access_token().await?;
                    self.try_reply(tweet_id, text).await
                } else {
                    Err(e)
                }
            }
        }
    }

    async fn try_reply(&self, tweet_id: &str, text: &str) -> Result<String, String> {
        let tokens = self.tokens.read().await;
        let resp = self
            .client
            .post("https://api.twitter.com/2/tweets")
            .header(
                "Authorization",
                format!("Bearer {}", tokens.access_token),
            )
            .json(&json!({
                "text": text,
                "reply": {
                    "in_reply_to_tweet_id": tweet_id
                }
            }))
            .send()
            .await
            .map_err(|e| format!("Failed to post reply: {e}"))?;

        let status = resp.status();
        let body: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse reply response: {e}"))?;

        if !status.is_success() {
            return Err(format!("{} - {}", status.as_u16(), body));
        }

        let reply_id = body["data"]["id"]
            .as_str()
            .ok_or("Missing reply id")?
            .to_string();

        Ok(reply_id)
    }

    pub async fn refresh_access_token(&self) -> Result<(), String> {
        let refresh_token = {
            let tokens = self.tokens.read().await;
            tokens.refresh_token.clone()
        };

        let resp = self
            .client
            .post("https://api.twitter.com/2/oauth2/token")
            .form(&[
                ("grant_type", "refresh_token"),
                ("refresh_token", &refresh_token),
                ("client_id", &self.client_id),
            ])
            .basic_auth(&self.client_id, Some(&self.client_secret))
            .send()
            .await
            .map_err(|e| format!("Failed to refresh token: {e}"))?;

        let body: serde_json::Value = resp
            .json()
            .await
            .map_err(|e| format!("Failed to parse refresh response: {e}"))?;

        let new_access = body["access_token"]
            .as_str()
            .ok_or("Missing access_token in refresh response")?;

        let mut tokens = self.tokens.write().await;
        tokens.access_token = new_access.to_string();
        if let Some(new_refresh) = body["refresh_token"].as_str() {
            tokens.refresh_token = new_refresh.to_string();
        }

        info!("Access token refreshed successfully");
        Ok(())
    }

    pub fn get_tweet_url(username: &str, tweet_id: &str) -> String {
        format!("https://x.com/{}/status/{}", username, tweet_id)
    }
}
