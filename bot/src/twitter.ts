import { TwitterApi } from "twitter-api-v2";
import { CONFIG } from "./config.js";

// OAuth 2.0 user client for posting replies
let userClient = new TwitterApi(CONFIG.twitter.accessToken);

// Bearer token client for reading mentions
const readClient = new TwitterApi(CONFIG.twitter.bearerToken);

/**
 * Refresh the OAuth 2.0 access token if expired.
 */
async function refreshAccessToken(): Promise<void> {
  const client = new TwitterApi({
    clientId: CONFIG.twitter.clientId,
    clientSecret: CONFIG.twitter.clientSecret,
  });

  const { accessToken, refreshToken } = await client.refreshOAuth2Token(
    CONFIG.twitter.refreshToken
  );

  // Update in-memory tokens
  CONFIG.twitter.accessToken = accessToken;
  if (refreshToken) {
    CONFIG.twitter.refreshToken = refreshToken;
  }

  userClient = new TwitterApi(accessToken);
}

export interface Mention {
  id: string;
  text: string;
  authorId: string;
  authorUsername: string;
  conversationId: string;
}

/**
 * Fetch recent mentions of the bot since a given tweet ID.
 */
export async function fetchMentions(sinceId?: string): Promise<Mention[]> {
  const botUser = await readClient.v2.me();
  const botId = botUser.data.id;

  const params: Record<string, unknown> = {
    "tweet.fields": "conversation_id,author_id",
    expansions: "author_id",
    max_results: 10,
  };
  if (sinceId) {
    params.since_id = sinceId;
  }

  const response = await readClient.v2.userMentionTimeline(botId, params);

  const mentions: Mention[] = [];
  const users = response.includes?.users || [];

  for (const tweet of response.data?.data || []) {
    const author = users.find((u: { id: string }) => u.id === tweet.author_id);
    mentions.push({
      id: tweet.id,
      text: tweet.text,
      authorId: tweet.author_id || "",
      authorUsername: author?.username || "",
      conversationId: tweet.conversation_id || tweet.id,
    });
  }

  return mentions;
}

/**
 * Reply to a tweet. Retries once with token refresh on auth failure.
 */
export async function replyToTweet(
  tweetId: string,
  text: string
): Promise<string> {
  try {
    const result = await userClient.v2.reply(text, tweetId);
    return result.data.id;
  } catch (err: unknown) {
    const statusCode = (err as { code?: number }).code;
    if (statusCode === 401 || statusCode === 403) {
      console.log("Access token expired, refreshing...");
      await refreshAccessToken();
      const result = await userClient.v2.reply(text, tweetId);
      return result.data.id;
    }
    throw err;
  }
}

/**
 * Get the URL of a tweet.
 */
export function getTweetUrl(username: string, tweetId: string): string {
  return `https://x.com/${username}/status/${tweetId}`;
}
