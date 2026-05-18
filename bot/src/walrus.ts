import { CONFIG } from "./config.js";

interface FormDefinition {
  id: string;
  title: string;
  description: string;
  owner: string;
  createdAt: string;
  fields: unknown[];
  settings: unknown;
  tweetUrl?: string;
  tweetAuthor?: string;
}

interface WalrusResponse {
  newlyCreated?: {
    blobObject: {
      blobId: string;
    };
  };
  alreadyCertified?: {
    blobId: string;
  };
}

/**
 * Store a form definition on Walrus and return the blob ID.
 */
export async function storeFormOnWalrus(
  form: FormDefinition
): Promise<string> {
  const body = JSON.stringify(form);

  const response = await fetch(
    `${CONFIG.walrus.publisherUrl}/v1/blobs?epochs=5`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Walrus upload failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as WalrusResponse;

  const blobId =
    data.newlyCreated?.blobObject.blobId || data.alreadyCertified?.blobId;

  if (!blobId) {
    throw new Error("No blobId in Walrus response");
  }

  return blobId;
}

/**
 * Get the public URL for a Walrus blob.
 */
export function getBlobUrl(blobId: string): string {
  return `${CONFIG.walrus.aggregatorUrl}/v1/blobs/${blobId}`;
}
