import { Transaction } from "@mysten/sui/transactions";

const MIST_PER_SUI = BigInt(1_000_000_000);

export function suiToMist(sui: number): bigint {
  return BigInt(Math.round(sui * Number(MIST_PER_SUI)));
}

export function buildRewardTransferTx(
  recipient: string,
  amountSui: number
): Transaction {
  const tx = new Transaction();
  const amountMist = suiToMist(amountSui);
  const [coin] = tx.splitCoins(tx.gas, [amountMist]);
  tx.transferObjects([coin], recipient);
  return tx;
}

export function buildBulkRewardTx(
  recipients: { address: string; amountSui: number }[]
): Transaction {
  const tx = new Transaction();
  for (const { address, amountSui } of recipients) {
    const amountMist = suiToMist(amountSui);
    const [coin] = tx.splitCoins(tx.gas, [amountMist]);
    tx.transferObjects([coin], address);
  }
  return tx;
}
