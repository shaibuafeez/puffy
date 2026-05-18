import { WALRUS_PUBLISHER, WALRUS_AGGREGATOR, WALRUS_EPOCHS } from "./constants";
import type { WalrusStoreResponse } from "./types";

function extractBlobId(response: WalrusStoreResponse): string {
  if (response.newlyCreated) {
    return response.newlyCreated.blobObject.blobId;
  }
  if (response.alreadyCertified) {
    return response.alreadyCertified.blobId;
  }
  throw new Error("Unexpected Walrus response format");
}

export async function storeBlob(data: Uint8Array | string): Promise<string> {
  const raw = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const body = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer;

  const response = await fetch(
    `${WALRUS_PUBLISHER}/v1/blobs?epochs=${WALRUS_EPOCHS}`,
    { method: "PUT", body }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Walrus upload failed (${response.status}): ${text}`);
  }

  const result: WalrusStoreResponse = await response.json();
  return extractBlobId(result);
}

export async function readBlob(blobId: string): Promise<Uint8Array> {
  const response = await fetch(`${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`);
  if (!response.ok) {
    throw new Error(`Walrus read failed (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function storeJSON<T>(data: T): Promise<string> {
  const json = JSON.stringify(data);
  return storeBlob(json);
}

export async function readJSON<T>(blobId: string): Promise<T> {
  const bytes = await readBlob(blobId);
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text) as T;
}

export async function storeFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return storeBlob(new Uint8Array(buffer));
}

export function getBlobUrl(blobId: string): string {
  return `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`;
}
