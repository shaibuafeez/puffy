"use client";

import { useState, useEffect, useCallback } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import type { UserFormEntry } from "@/lib/types";
import { getUserIndex, saveUserIndex, addFormToIndex as addToStorage } from "@/lib/storage";
import { enclaveAction } from "@/lib/enclave";
import { useXAuth } from "./use-x-auth";

type BotForm = { form_id: string; form_blob_id: string; title: string; created_at: string; seal_allowlist_id?: string };

export function useUserForms() {
  const account = useCurrentAccount();
  const { xHandle, isAuthenticated: xAuthed } = useXAuth();
  const [forms, setForms] = useState<UserFormEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const address = account?.address;

  useEffect(() => {
    if (!address && !xAuthed) {
      setForms([]);
      setIsLoading(false);
      return;
    }

    // 1. Read localStorage cache for fast paint
    let localForms: UserFormEntry[] = [];
    if (address) {
      const index = getUserIndex(address);
      localForms = index?.forms || [];
      if (localForms.length > 0) {
        setForms(localForms);
      }
    }
    setIsLoading(false);

    // 2. Fetch from enclave (primary source)
    const fetchPromises: Promise<BotForm[]>[] = [];

    if (address) {
      fetchPromises.push(
        enclaveAction<BotForm[]>("get_forms", { wallet: address }).catch(() => [])
      );
    }

    if (xAuthed && xHandle) {
      fetchPromises.push(
        enclaveAction<BotForm[]>("get_forms_by_handle", { xHandle }).catch(() => [])
      );
    }

    if (fetchPromises.length === 0) return;

    Promise.all(fetchPromises).then((results) => {
      const allBotForms = results.flat();

      // Deduplicate by form_id
      const seen = new Set<string>();
      const uniqueBotForms = allBotForms.filter((bf) => {
        if (seen.has(bf.form_id)) return false;
        seen.add(bf.form_id);
        return true;
      });

      // Convert to UserFormEntry
      const enclaveForms: UserFormEntry[] = uniqueBotForms.map((bf) => ({
        formId: bf.form_id,
        formBlobId: bf.form_blob_id,
        title: bf.title,
        createdAt: bf.created_at,
        submissionCount: 0,
        sealAllowlistId: bf.seal_allowlist_id,
      }));

      if (enclaveForms.length > 0) {
        // Enclave response replaces state
        setForms(enclaveForms);

        // Write back to localStorage as cache
        if (address) {
          saveUserIndex({ owner: address, forms: enclaveForms });
        }
      } else if (localForms.length > 0) {
        // Enclave is empty but localStorage has entries — rehydrate enclave
        rehydrateEnclave(localForms);
      }
    });
  }, [address, xAuthed, xHandle]);

  const addForm = useCallback(
    (entry: UserFormEntry) => {
      if (address) {
        addToStorage(address, entry);
      }
      setForms((prev) => {
        if (prev.some((f) => f.formId === entry.formId)) return prev;
        return [entry, ...prev];
      });
    },
    [address]
  );

  const updateForm = useCallback(
    (formId: string, updates: Partial<UserFormEntry>) => {
      setForms((prev) => {
        const next = prev.map((f) =>
          f.formId === formId ? { ...f, ...updates } : f
        );
        if (address) {
          saveUserIndex({ owner: address, forms: next });
        }
        return next;
      });
    },
    [address]
  );

  const removeForm = useCallback(
    (formId: string) => {
      setForms((prev) => {
        const next = prev.filter((f) => f.formId !== formId);
        if (address) {
          saveUserIndex({ owner: address, forms: next });
        }
        return next;
      });
    },
    [address]
  );

  return { forms, isLoading, addForm, updateForm, removeForm, address };
}

async function rehydrateEnclave(localForms: UserFormEntry[]) {
  for (const f of localForms) {
    try {
      await enclaveAction("register_form", {
        formId: f.formId,
        formBlobId: f.formBlobId,
        ownerWallet: "",
        title: f.title,
        sealAllowlistId: f.sealAllowlistId,
        createdAt: f.createdAt,
      });
    } catch {
      // Best-effort rehydration
    }
  }
}
