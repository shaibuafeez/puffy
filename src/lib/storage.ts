import type { UserIndex, UserFormEntry } from "./types";

const INDEX_PREFIX = "walform_index_";

export function getUserIndex(address: string): UserIndex | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`${INDEX_PREFIX}${address}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserIndex;
  } catch {
    return null;
  }
}

export function saveUserIndex(index: UserIndex): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${INDEX_PREFIX}${index.owner}`,
    JSON.stringify(index)
  );
}

export function addFormToIndex(
  address: string,
  entry: UserFormEntry
): void {
  const index = getUserIndex(address) || { owner: address, forms: [] };
  index.forms.unshift(entry);
  saveUserIndex(index);
}

export function updateFormInIndex(
  address: string,
  formId: string,
  updates: Partial<UserFormEntry>
): void {
  const index = getUserIndex(address);
  if (!index) return;
  const form = index.forms.find((f) => f.formId === formId);
  if (form) {
    Object.assign(form, updates);
    saveUserIndex(index);
  }
}

export function removeFormFromIndex(address: string, formId: string): void {
  const index = getUserIndex(address);
  if (!index) return;
  index.forms = index.forms.filter((f) => f.formId !== formId);
  saveUserIndex(index);
}
