"use client";

import { useState, useEffect, useCallback } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import type { UserFormEntry } from "@/lib/types";
import { getUserIndex, saveUserIndex, addFormToIndex as addToStorage } from "@/lib/storage";
import { enclaveAction } from "@/lib/enclave";

export function useUserForms() {
  const account = useCurrentAccount();
  const [forms, setForms] = useState<UserFormEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const address = account?.address;

  useEffect(() => {
    if (!address) {
      setForms([]);
      setIsLoading(false);
      return;
    }
    const index = getUserIndex(address);
    const localForms = index?.forms || [];
    setForms(localForms);
    setIsLoading(false);

    // Also fetch bot-created forms from Nautilus enclave and merge
    enclaveAction<{ form_id: string; form_blob_id: string; title: string; created_at: string }[]>("get_forms", { wallet: address })
        .catch(() => [] as { form_id: string; form_blob_id: string; title: string; created_at: string }[])
        .then((botForms) => {
          if (!botForms.length) return;
          setForms((prev) => {
            const existingIds = new Set(prev.map((f) => f.formId));
            const newEntries: UserFormEntry[] = botForms
              .filter((bf) => !existingIds.has(bf.form_id))
              .map((bf) => ({
                formId: bf.form_id,
                formBlobId: bf.form_blob_id,
                title: bf.title,
                createdAt: bf.created_at,
                submissionCount: 0,
              }));
            if (newEntries.length === 0) return prev;
            return [...newEntries, ...prev];
          });
        });
  }, [address]);

  const addForm = useCallback(
    (entry: UserFormEntry) => {
      if (!address) return;
      addToStorage(address, entry);
      setForms((prev) => [entry, ...prev]);
    },
    [address]
  );

  const updateForm = useCallback(
    (formId: string, updates: Partial<UserFormEntry>) => {
      if (!address) return;
      setForms((prev) => {
        const next = prev.map((f) =>
          f.formId === formId ? { ...f, ...updates } : f
        );
        saveUserIndex({ owner: address, forms: next });
        return next;
      });
    },
    [address]
  );

  const removeForm = useCallback(
    (formId: string) => {
      if (!address) return;
      setForms((prev) => {
        const next = prev.filter((f) => f.formId !== formId);
        saveUserIndex({ owner: address, forms: next });
        return next;
      });
    },
    [address]
  );

  return { forms, isLoading, addForm, updateForm, removeForm, address };
}
