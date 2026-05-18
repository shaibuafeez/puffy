import { v4 as uuidv4 } from "uuid";
import { CONFIG } from "./config.js";
import { fetchMentions, replyToTweet, getTweetUrl } from "./twitter.js";
import { parseTweetToForm } from "./llm.js";
import { storeFormOnWalrus } from "./walrus.js";
import {
  getAccountByHandle,
  saveBotForm,
  isProcessed,
  markProcessed,
  getState,
  setState,
} from "./db.js";
import { startApi } from "./api.js";

const LAST_TWEET_KEY = "last_mention_id";

async function processMention(mention: {
  id: string;
  text: string;
  authorId: string;
  authorUsername: string;
}) {
  console.log(
    `[Bot] Processing mention from @${mention.authorUsername}: "${mention.text}"`
  );

  // Check if user has linked their account
  const account = getAccountByHandle(mention.authorUsername);
  if (!account) {
    console.log(`[Bot] @${mention.authorUsername} not linked — replying with instructions`);
    await replyToTweet(
      mention.id,
      `@${mention.authorUsername} Link your wallet first at ${CONFIG.app.walformBaseUrl}/link-twitter to create forms via mentions.`
    );
    return;
  }

  // Parse tweet with GPT
  console.log("[Bot] Parsing tweet with GPT...");
  const parsed = await parseTweetToForm(mention.text);

  // Build full FormDefinition
  const formId = uuidv4();
  const tweetUrl = getTweetUrl(mention.authorUsername, mention.id);
  const formDef = {
    id: formId,
    title: parsed.title,
    description: parsed.description,
    owner: account.wallet_address,
    createdAt: new Date().toISOString(),
    fields: parsed.fields,
    settings: parsed.settings,
    tweetUrl,
    tweetAuthor: `@${mention.authorUsername}`,
  };

  // Upload to Walrus
  console.log("[Bot] Uploading form to Walrus...");
  const formBlobId = await storeFormOnWalrus(formDef);

  // Save to bot DB
  saveBotForm({
    form_id: formId,
    form_blob_id: formBlobId,
    owner_wallet: account.wallet_address,
    tweet_id: mention.id,
    tweet_url: tweetUrl,
    title: parsed.title,
    created_at: formDef.createdAt,
  });

  // Reply with form link
  const formLink = `${CONFIG.app.walformBaseUrl}/form/${formBlobId}`;
  const replyText = [
    `@${mention.authorUsername} Form created!`,
    ``,
    `${parsed.title}`,
    `${formLink}`,
    ``,
    `Respondents connect their Sui wallet to enter.`,
  ].join("\n");

  await replyToTweet(mention.id, replyText);
  console.log(`[Bot] Replied with form link: ${formLink}`);
}

async function poll() {
  try {
    const sinceId = getState(LAST_TWEET_KEY);
    const mentions = await fetchMentions(sinceId);

    if (mentions.length === 0) return;

    // Process oldest first
    const sorted = [...mentions].reverse();

    for (const mention of sorted) {
      if (isProcessed(mention.id)) continue;

      try {
        await processMention(mention);
      } catch (err) {
        console.error(`[Bot] Error processing tweet ${mention.id}:`, err);
      }

      markProcessed(mention.id);
      setState(LAST_TWEET_KEY, mention.id);
    }
  } catch (err) {
    console.error("[Bot] Polling error:", err);
  }
}

// Main
console.log("[Bot] Starting Walform Twitter Bot...");
console.log(`[Bot] Poll interval: ${CONFIG.app.pollIntervalMs}ms`);
console.log(`[Bot] Walform URL: ${CONFIG.app.walformBaseUrl}`);

// Start the REST API
startApi();

// Start polling
poll();
setInterval(poll, CONFIG.app.pollIntervalMs);

console.log("[Bot] Bot is running. Waiting for mentions...");
