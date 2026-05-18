import OpenAI from "openai";
import { CONFIG } from "./config.js";

const openai = new OpenAI({ apiKey: CONFIG.openai.apiKey });

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[];
}

interface FormSettings {
  encryptSubmissions: boolean;
  allowAnonymous: boolean;
  submitMessage: string;
  rewardEnabled?: boolean;
  rewardAmountSui?: number;
}

export interface ParsedForm {
  title: string;
  description: string;
  fields: FormField[];
  settings: FormSettings;
}

const SYSTEM_PROMPT = `You are a form generator for Walform, a decentralized form builder on Sui blockchain.

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
    "rewardAmountSui": number or undefined
  }
}`;

export async function parseTweetToForm(tweetText: string): Promise<ParsedForm> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Tweet: "${tweetText}"` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from GPT");
  }

  const parsed = JSON.parse(content) as ParsedForm;

  // Ensure required defaults
  parsed.settings.allowAnonymous = false;
  parsed.settings.encryptSubmissions = false;

  return parsed;
}
