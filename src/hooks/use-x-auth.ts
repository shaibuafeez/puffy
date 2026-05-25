"use client";

import { useState, useEffect, useCallback } from "react";
import { enclaveAction, getEnclaveUrl } from "@/lib/enclave";

const STORAGE_KEY = "walform_x_session";

interface XSession {
  xHandle: string;
  token: string;
}

export function useXAuth() {
  const [session, setSession] = useState<XSession | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  // On mount: check URL params first, then sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const xAuth = params.get("x_auth");
    const handle = params.get("handle");
    const token = params.get("token");

    if (xAuth === "true" && handle && token) {
      // Came back from X OAuth — store and clean URL
      const newSession: XSession = { xHandle: handle, token };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      setSession(newSession);
      // Clean URL params
      const url = new URL(window.location.href);
      url.searchParams.delete("x_auth");
      url.searchParams.delete("handle");
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.pathname);
      setIsVerifying(false);
      return;
    }

    // Check sessionStorage for existing session
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as XSession;
        // Verify token with enclave
        enclaveAction<{ valid: boolean; xHandle?: string }>("verify_x_session", {
          token: parsed.token,
        })
          .then((res) => {
            if (res.valid) {
              setSession(parsed);
            } else {
              sessionStorage.removeItem(STORAGE_KEY);
            }
          })
          .catch(() => {
            sessionStorage.removeItem(STORAGE_KEY);
          })
          .finally(() => setIsVerifying(false));
        return;
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }

    setIsVerifying(false);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const redirectToXAuth = useCallback(() => {
    window.location.href = `${getEnclaveUrl()}/x/auth`;
  }, []);

  return {
    xHandle: session?.xHandle ?? null,
    xToken: session?.token ?? null,
    isAuthenticated: !!session,
    isVerifying,
    logout,
    redirectToXAuth,
  };
}
