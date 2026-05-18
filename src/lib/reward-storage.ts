const REWARD_PREFIX = "walform_rewards_";

export interface RewardRecord {
  rewardStatus: "pending" | "sent";
  rewardTxDigest?: string;
  sentAt?: string;
}

export function getRewardRecords(
  formId: string
): Record<string, RewardRecord> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(`${REWARD_PREFIX}${formId}`);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, RewardRecord>;
  } catch {
    return {};
  }
}

export function saveRewardRecord(
  formId: string,
  submissionBlobId: string,
  record: RewardRecord
): void {
  if (typeof window === "undefined") return;
  const records = getRewardRecords(formId);
  records[submissionBlobId] = record;
  localStorage.setItem(`${REWARD_PREFIX}${formId}`, JSON.stringify(records));
}
