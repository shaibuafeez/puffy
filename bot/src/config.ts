import { config } from "dotenv";

config();

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const CONFIG = {
  twitter: {
    clientId: requireEnv("TWITTER_CLIENT_ID"),
    clientSecret: requireEnv("TWITTER_CLIENT_SECRET"),
    accessToken: requireEnv("TWITTER_ACCESS_TOKEN"),
    refreshToken: requireEnv("TWITTER_REFRESH_TOKEN"),
    bearerToken: requireEnv("TWITTER_BEARER_TOKEN"),
  },
  openai: {
    apiKey: requireEnv("OPENAI_API_KEY"),
  },
  walrus: {
    publisherUrl:
      process.env.WALRUS_PUBLISHER_URL ||
      "https://publisher.walrus-testnet.walrus.space",
    aggregatorUrl:
      process.env.WALRUS_AGGREGATOR_URL ||
      "https://aggregator.walrus-testnet.walrus.space",
  },
  app: {
    botApiPort: parseInt(process.env.BOT_API_PORT || "3001", 10),
    walformBaseUrl: process.env.WALFORM_BASE_URL || "http://localhost:3000",
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || "30000", 10),
  },
};
