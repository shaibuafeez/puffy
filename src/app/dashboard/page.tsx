"use client";

import Link from "next/link";
import { useCurrentAccount, ConnectModal } from "@mysten/dapp-kit";
import { FormCard } from "@/components/dashboard/form-card";
import { useUserForms } from "@/hooks/use-user-forms";
import { useXAuth } from "@/hooks/use-x-auth";
import { useState } from "react";

export default function DashboardPage() {
  const account = useCurrentAccount();
  const { isAuthenticated: xAuthed, xHandle, redirectToXAuth, logout: xLogout, isVerifying } = useXAuth();
  const { forms, isLoading } = useUserForms();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const filtered = forms.filter((f) => {
    if (filter === "encrypted" && !f.sealAllowlistId) return false;
    if (q && !f.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const totalSubmissions = forms.reduce((s, f) => s + (f.submissionCount || 0), 0);
  const encryptedCount = forms.filter((f) => f.sealAllowlistId).length;

  if (!account && !xAuthed) {
    if (isVerifying) {
      return (
        <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center"
             style={{ background: "var(--cream)", color: "var(--ink)" }}>
          <div className="w-8 h-8 rounded-full border-2 border-[var(--coral)] border-t-transparent animate-spin" />
        </div>
      );
    }
    return (
      <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center text-center px-6"
           style={{ background: "var(--cream)", color: "var(--ink)" }}>
        <div className="heading-display text-[clamp(32px,5vw,48px)]">
          View your <em className="serif-italic">forms</em>
        </div>
        <p className="serif-italic text-[18px] mt-4 mb-8" style={{ color: "color-mix(in oklab, var(--ink) 60%, transparent)" }}>
          Connect a Sui wallet or sign in with X to manage your forms.
        </p>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <ConnectModal
            trigger={
              <button className="px-6 py-3 rounded-full text-[14px] font-bold"
                      style={{ background: "var(--ink)", color: "var(--cream)", fontFamily: "var(--font-body)" }}>
                Connect Wallet
              </button>
            }
          />
          <span className="mono-label text-[11px]" style={{ color: "color-mix(in oklab, var(--ink) 45%, transparent)" }}>or</span>
          <button onClick={redirectToXAuth}
                  className="px-6 py-3 rounded-full text-[14px] font-bold inline-flex items-center gap-2"
                  style={{ background: "var(--coral)", color: "var(--ink)", fontFamily: "var(--font-body)" }}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Sign in with X
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-70px)] flex flex-col items-center justify-center"
           style={{ background: "var(--cream)", color: "var(--ink)" }}>
        <div className="mono-label mb-3">Loading forms...</div>
        <div className="w-8 h-8 rounded-full border-2 border-[var(--coral)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ background: "var(--cream)", color: "var(--ink)", minHeight: "calc(100vh - 70px)" }}>
      {/* Masthead */}
      <div className="border-b" style={{ borderColor: "color-mix(in oklab, var(--ink) 14%, transparent)" }}>
        <div className="max-w-[1500px] mx-auto px-4 md:px-8 flex items-center justify-between h-8 overflow-hidden">
          <span className="mono-label text-[10px]">Vol. I &middot; Issue 04 &middot; Workshop</span>
          <span className="mono-label text-[10px]"><em className="serif-italic normal-case tracking-normal">your forms</em> &mdash; {forms.length} in flight</span>
          <span className="mono-label text-[10px] hidden md:block">
            {xAuthed && !account && (
              <span className="inline-flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="h-3 w-3 inline" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                @{xHandle}
                <button onClick={xLogout} className="underline ml-1" style={{ color: "color-mix(in oklab, var(--ink) 50%, transparent)" }}>logout</button>
              </span>
            )}
            {!xAuthed && <>Walrus aggregator &middot; ag-prime-01</>}
          </span>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-4 md:px-8 pb-20">
        {/* Title row */}
        <div className="pt-8 border-t flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-7"
             style={{ borderColor: "color-mix(in oklab, var(--ink) 14%, transparent)" }}>
          <div>
            <div className="mono-label text-[11px] mb-4">&mdash; The workshop</div>
            <h1 className="heading-display text-[clamp(40px,7vw,96px)] leading-[0.95]">
              Your <em className="serif-italic font-normal">forms,</em><br className="hidden md:inline" />
              currently in flight.
            </h1>
          </div>
          <Link href="/create"
            className="btn-editorial whitespace-nowrap self-start md:self-auto">
            Compose a new form
            <span className="text-[13px]">&#8599;</span>
          </Link>
        </div>

        {/* Stat tape */}
        <div className="mt-10 md:mt-12 border-t border-b py-6 md:py-7 grid grid-cols-2 md:grid-cols-4 gap-y-6"
             style={{ borderColor: "color-mix(in oklab, var(--ink) 14%, transparent)" }}>
          {[
            { k: "Total forms", v: String(forms.length), s: "active" },
            { k: "Submissions", v: String(totalSubmissions), s: "across all forms", big: true },
            { k: "Encrypted", v: String(encryptedCount), s: "Seal protocol" },
            { k: "Forms this month", v: String(forms.length), s: "and counting" },
          ].map((s, i) => (
            <div key={i} className="px-3 md:px-7"
                 style={{ borderLeft: i > 0 ? "1px solid color-mix(in oklab, var(--ink) 14%, transparent)" : undefined }}>
              <div className="mono-label text-[10.5px]">{s.k}</div>
              <div className="mt-2 heading-display leading-none"
                   style={{ fontSize: "clamp(36px, 4vw, 60px)", color: s.big ? "var(--coral)" : "var(--ink)" }}>
                {s.v}
              </div>
              <div className="mt-1.5 serif-italic text-[13px]" style={{ color: "color-mix(in oklab, var(--ink) 60%, transparent)" }}>
                {s.s}
              </div>
            </div>
          ))}
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-3 md:gap-4 mt-8 md:mt-9 mb-5 md:mb-6 flex-wrap">
          <span className="mono-label text-[11px]">&mdash;&mdash; filter</span>
          <div className="flex rounded-full p-1"
               style={{ background: "var(--cream-deep)", border: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)" }}>
            {[
              { id: "all", label: "All" },
              { id: "encrypted", label: "Encrypted" },
            ].map((o) => (
              <button key={o.id} onClick={() => setFilter(o.id)}
                className="px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-colors"
                style={{
                  color: filter === o.id ? "var(--cream)" : "color-mix(in oklab, var(--ink) 70%, transparent)",
                  background: filter === o.id ? "var(--ink)" : "transparent",
                }}>
                {o.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-[300px] ml-2">
            <span className="mono-label text-[11px]">&mdash;&mdash; search</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="title..."
              className="flex-1 bg-transparent outline-none pb-0.5 text-[12.5px]"
              style={{
                borderBottom: "1px solid color-mix(in oklab, var(--ink) 24%, transparent)",
                fontFamily: "var(--font-mono)",
                color: "var(--ink)",
              }} />
          </div>

          <div className="flex-1" />
          <span className="mono-label text-[11px]">{String(filtered.length).padStart(2, "0")} of {String(forms.length).padStart(2, "0")}</span>
        </div>

        {/* Form grid */}
        {filtered.length === 0 ? (
          <div className="mt-3 py-20 px-6 text-center rounded-[18px]"
               style={{ border: "1.5px dashed color-mix(in oklab, var(--ink) 25%, transparent)" }}>
            <span className="mono-label text-[11px]">&mdash;&mdash; inbox</span>
            <h3 className="heading-display text-[clamp(28px,4vw,48px)] mt-4 leading-none">
              Nothing here yet, only <em className="serif-italic font-normal">possibility.</em>
            </h3>
            <p className="serif-italic text-[17px] mt-3 max-w-[440px] mx-auto"
               style={{ color: "color-mix(in oklab, var(--ink) 60%, transparent)" }}>
              Spin up your first form in under a minute. Drag fields, publish to Walrus, share the link.
            </p>
            <div className="mt-6">
              <Link href="/create" className="btn-editorial">
                Start your first form
                <span className="text-[13px]">&rarr;</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
            {filtered.map((f, i) => (
              <FormCard key={f.formId} form={f} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
