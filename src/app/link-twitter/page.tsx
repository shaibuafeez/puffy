"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { ConnectModal } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { enclaveAction, getEnclaveUrl } from "@/lib/enclave";


export default function LinkTwitterPage() {
  const account = useCurrentAccount();
  const [linkedHandle, setLinkedHandle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if already linked
  useEffect(() => {
    if (!account) return;
    enclaveAction<Record<string, unknown>>("get_account", { wallet: account.address })
      .then((data) => {
        if (data?.x_handle) setLinkedHandle(data.x_handle as string);
      })
      .catch(() => {});
  }, [account]);

  // Check URL params for OAuth callback result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("linked");
    const handle = params.get("handle");
    if (success === "true" && handle) {
      setLinkedHandle(handle);
      // Clean URL
      window.history.replaceState({}, "", "/link-twitter");
    }
  }, []);

  const handleLinkTwitter = () => {
    if (!account) return;
    setLoading(true);
    // Redirect to enclave OAuth route with wallet address
    window.location.href = `${getEnclaveUrl()}/twitter/auth?wallet=${account.address}`;
  };

  const handleUnlink = async () => {
    if (!account || !linkedHandle) return;
    setLoading(true);
    try {
      await enclaveAction("unlink", { handle: linkedHandle, walletAddress: account.address });
      setLinkedHandle(null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center text-center px-6 max-w-sm">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Wallet className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Connect Wallet First</h1>
          <p className="text-[13px] text-muted-foreground mb-6">
            Connect your Sui wallet to link your X account.
          </p>
          <ConnectModal
            trigger={
              <button className="flex items-center gap-2 h-10 rounded-lg bg-foreground text-background px-6 text-[13px] font-medium transition-all duration-200 hover:opacity-90 cursor-pointer">
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </button>
            }
          />
        </div>
      </div>
    );
  }

  if (linkedHandle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center text-center px-6 max-w-sm">
          <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Account Linked</h1>
          <p className="text-[13px] text-muted-foreground mb-2">
            Your X account is linked to your wallet.
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2.5 mb-6">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="text-[13px] font-medium">@{linkedHandle}</span>
          </div>
          <p className="text-[12px] text-muted-foreground mb-6">
            You can now tweet <span className="font-mono">@walform</span> to create forms directly from X.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="rounded-lg" render={<Link href="/dashboard" />}>
              Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-destructive hover:text-destructive"
              onClick={handleUnlink}
              disabled={loading}
            >
              Unlink
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center text-center px-6 max-w-sm">
        <div className="h-14 w-14 rounded-2xl bg-foreground/10 flex items-center justify-center mb-5">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold mb-2">Link X Account</h1>
        <p className="text-[13px] text-muted-foreground mb-6">
          Link your X (Twitter) account to create forms by mentioning{" "}
          <span className="font-mono">@walform</span> in tweets.
        </p>
        <Button
          onClick={handleLinkTwitter}
          disabled={loading}
          className="rounded-lg"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4 mr-2" />
          )}
          Connect X Account
        </Button>
        <p className="text-[11px] text-muted-foreground mt-4">
          You&apos;ll be redirected to X to authorize Walform.
        </p>
      </div>
    </div>
  );
}
