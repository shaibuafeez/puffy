const ENCLAVE_URL =
  process.env.NEXT_PUBLIC_BOT_API_URL || "http://localhost:3001";

export async function enclaveAction<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(`${ENCLAVE_URL}/process_data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload: { action, payload } }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Enclave request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getEnclaveUrl(): string {
  return ENCLAVE_URL;
}
