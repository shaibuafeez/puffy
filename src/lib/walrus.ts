import { WALRUS_AGGREGATOR } from "./constants";
import { enclaveAction } from "./enclave";

const CACHE_PREFIX = "walrus_cache_";

function cacheGet(blobId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(`${CACHE_PREFIX}${blobId}`);
  } catch {
    return null;
  }
}

function cacheSet(blobId: string, data: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`${CACHE_PREFIX}${blobId}`, data);
  } catch {
    // sessionStorage full — evict oldest entries and retry
    try {
      const keys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(CACHE_PREFIX)) keys.push(key);
      }
      // Remove first half of cached entries
      keys.slice(0, Math.max(1, Math.floor(keys.length / 2))).forEach((k) => sessionStorage.removeItem(k));
      sessionStorage.setItem(`${CACHE_PREFIX}${blobId}`, data);
    } catch {
      // Give up silently — caching is best-effort
    }
  }
}

export async function storeBlob(data: Uint8Array | string, filename = "blob.bin"): Promise<string> {
  const raw = typeof data === "string" ? new TextEncoder().encode(data) : data;

  // Convert to base64 for JSON transport to enclave
  let binary = "";
  for (let i = 0; i < raw.length; i++) {
    binary += String.fromCharCode(raw[i]);
  }
  const b64 = btoa(binary);

  const result = await enclaveAction<{ blobId: string }>("store_blob", {
    data: b64,
    filename,
  });

  return result.blobId;
}

export async function readBlob(blobId: string): Promise<Uint8Array> {
  // Check cache for base64-encoded blob
  const cached = cacheGet(blobId);
  if (cached) {
    const binary = atob(cached);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  const response = await fetch(`${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`);
  if (!response.ok) {
    throw new Error(`Walrus read failed (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Cache as base64 (only cache blobs under 512KB to avoid filling sessionStorage)
  if (bytes.length < 512 * 1024) {
    let b64 = "";
    for (let i = 0; i < bytes.length; i++) b64 += String.fromCharCode(bytes[i]);
    cacheSet(blobId, btoa(b64));
  }

  return bytes;
}

export async function storeJSON<T>(data: T): Promise<string> {
  const json = JSON.stringify(data);
  return storeBlob(json, "data.json");
}

export async function readJSON<T>(blobId: string): Promise<T> {
  // Fast path: check JSON text cache directly
  const cached = cacheGet(blobId);
  if (cached) {
    // Could be base64 blob or JSON text — try JSON parse first
    try {
      return JSON.parse(cached) as T;
    } catch {
      // It's a base64 blob cache entry, decode it
      const binary = atob(cached);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const text = new TextDecoder().decode(bytes);
      return JSON.parse(text) as T;
    }
  }

  const response = await fetch(`${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`);
  if (!response.ok) {
    throw new Error(`Walrus read failed (${response.status})`);
  }
  const text = await response.text();
  const parsed = JSON.parse(text) as T;

  // Cache the raw JSON text (much more compact than base64 of bytes)
  cacheSet(blobId, text);

  return parsed;
}

export async function storeFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return storeBlob(new Uint8Array(buffer), file.name);
}

export function getBlobUrl(blobId: string): string {
  return `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`;
}
