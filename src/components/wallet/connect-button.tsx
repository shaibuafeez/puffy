"use client";

import { useState } from "react";
import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { truncateAddress } from "@/lib/utils";

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
          className="flex items-center gap-2 h-9 rounded-full px-4 text-[12.5px] font-semibold transition-all duration-200 cursor-pointer"
          style={{
            background: "var(--ink)",
            color: "var(--cream)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--coral)", boxShadow: "0 0 8px var(--coral)" }} />
          {truncateAddress(account.address)}
          <span
            className="transition-transform duration-200"
            style={{ fontSize: 10, transform: dropdownOpen ? "rotate(180deg)" : "none" }}
          >
            ▾
          </span>
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />
            <div
              className="absolute right-0 top-full mt-2 z-50 w-60 rounded-[14px] p-2 shadow-[0_20px_40px_-16px_rgba(11,15,23,0.25)]"
              style={{
                background: "var(--cream)",
                border: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)",
              }}
            >
              <div className="px-3 py-2.5 mb-1">
                <div className="mono-label text-[10px]">Connected wallet</div>
                <div
                  className="mt-1.5 text-[11.5px] truncate"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}
                >
                  {account.address}
                </div>
              </div>

              <div className="h-px mx-1 mb-1" style={{ background: "color-mix(in oklab, var(--ink) 12%, transparent)" }} />

              <button
                onClick={copyAddress}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] transition-colors cursor-pointer"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "color-mix(in oklab, var(--ink) 70%, transparent)",
                }}
              >
                {copied ? "✓ Copied" : "Copy address"}
              </button>

              <button
                onClick={() => {
                  disconnect();
                  setDropdownOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] transition-colors cursor-pointer"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--coral)",
                }}
              >
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
        <button
          className="flex items-center gap-2 h-9 rounded-full px-5 text-[13px] font-semibold transition-all duration-200 hover:opacity-90 cursor-pointer"
          style={{
            background: "var(--ink)",
            color: "var(--cream)",
            fontFamily: "var(--font-body)",
          }}
        >
          Connect wallet
          <span className="text-[11px]" style={{ color: "var(--coral)" }}>→</span>
        </button>
      }
    />
  );
}
