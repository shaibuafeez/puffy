"use client";

import { useState } from "react";
import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { truncateAddress } from "@/lib/utils";
import { LogOut, ChevronDown, Wallet, Copy, Check } from "lucide-react";

export function ConnectButton() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!account) return;
    navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (account) {
    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 h-9 rounded-full border border-border/60 bg-card px-3.5 text-[13px] font-medium transition-all duration-200 hover:bg-accent hover:border-border shadow-sm hover:shadow-md cursor-pointer"
        >
          <span className="font-mono tracking-tight">
            {truncateAddress(account.address)}
          </span>
          <ChevronDown
            className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${
              dropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-border/50 bg-card p-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2.5 mb-1">
                <p className="text-[11px] text-muted-foreground mb-1">
                  Connected Wallet
                </p>
                <p className="text-[12px] font-mono truncate">
                  {account.address}
                </p>
              </div>

              <div className="h-px bg-border/40 mx-1 mb-1" />

              <button
                onClick={() => {
                  copyAddress();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy Address"}
              </button>

              <button
                onClick={() => {
                  disconnect();
                  setDropdownOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-red-400 transition-colors hover:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <ConnectModal
      trigger={
        <button className="flex items-center gap-2 h-9 rounded-full bg-foreground text-background px-5 text-[13px] font-medium transition-all duration-200 hover:opacity-90 shadow-sm hover:shadow-md cursor-pointer">
          <Wallet className="h-3.5 w-3.5" />
          Connect
        </button>
      }
    />
  );
}
