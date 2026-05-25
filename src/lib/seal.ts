"use client";

import { SealClient, SessionKey } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex, toHex } from "@mysten/bcs";
import type { SealCompatibleClient } from "@mysten/seal";

// Our deployed Move package on mainnet
export const SEAL_PACKAGE_ID =
  "0xe3df21fc35fd8146a7b84b24e256d2c60bc72c81389d02e7272706a2284921ad";

// Seal key server configs for mainnet (Overclock + Studio Mirai, open mode)
const SEAL_KEY_SERVERS = [
  {
    objectId:
      "0x145540d931f182fef76467dd8074c9839aea126852d90d18e1556fcbbd1208b6",
    weight: 1,
  },
  {
    objectId:
      "0xe0eb52eba9261b96e895bbb4deca10dcd64fbc626a1133017adcd5131353fd10",
    weight: 1,
  },
];

let sealClientInstance: SealClient | null = null;

export function getSealClient(suiClient: SealCompatibleClient): SealClient {
  if (!sealClientInstance) {
    sealClientInstance = new SealClient({
      suiClient,
      serverConfigs: SEAL_KEY_SERVERS,
      verifyKeyServers: false,
    });
  }
  return sealClientInstance;
}

/**
 * Build the identity bytes for Seal encryption.
 * Format: allowlistObjectId bytes (to match our Move contract's starts_with check)
 */
export function buildIdentity(allowlistObjectId: string): string {
  // The identity is the hex of the allowlist object ID
  return allowlistObjectId;
}

/**
 * Encrypt data using Seal.
 * This does NOT require a wallet - anyone can encrypt.
 */
export async function sealEncrypt(
  suiClient: SealCompatibleClient,
  data: Uint8Array,
  allowlistObjectId: string
): Promise<Uint8Array> {
  const client = getSealClient(suiClient);
  const id = buildIdentity(allowlistObjectId);

  const { encryptedObject } = await client.encrypt({
    threshold: 2,
    packageId: SEAL_PACKAGE_ID,
    id,
    data,
  });

  return encryptedObject;
}

/**
 * Decrypt data using Seal.
 * Requires a wallet signature for the session key.
 */
export async function sealDecrypt(
  suiClient: SealCompatibleClient,
  encryptedData: Uint8Array,
  allowlistObjectId: string,
  userAddress: string,
  signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>
): Promise<Uint8Array> {
  const client = getSealClient(suiClient);

  // Create a session key
  const sessionKey = await SessionKey.create({
    address: userAddress,
    packageId: SEAL_PACKAGE_ID,
    ttlMin: 30,
    suiClient,
  });

  // Sign the personal message with the wallet
  const personalMessage = sessionKey.getPersonalMessage();
  const { signature } = await signPersonalMessage(personalMessage);
  await sessionKey.setPersonalMessageSignature(signature);

  // Build the transaction that calls seal_approve
  const id = buildIdentity(allowlistObjectId);
  const tx = new Transaction();
  tx.moveCall({
    target: `${SEAL_PACKAGE_ID}::access::seal_approve`,
    arguments: [
      tx.pure.vector("u8", fromHex(id.startsWith("0x") ? id.slice(2) : id)),
      tx.object(allowlistObjectId),
    ],
  });

  const txBytes = await tx.build({
    client: suiClient,
    onlyTransactionKind: true,
  });

  return client.decrypt({
    data: encryptedData,
    sessionKey,
    txBytes,
  });
}

/**
 * Create a new Seal allowlist on-chain.
 * Returns the transaction to be signed and executed.
 */
export function buildCreateAllowlistTx(): Transaction {
  const tx = new Transaction();
  tx.moveCall({
    target: `${SEAL_PACKAGE_ID}::access::new_allowlist`,
  });
  return tx;
}
