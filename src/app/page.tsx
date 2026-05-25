"use client";

import { useState, useEffect, useId } from "react";
import Link from "next/link";

/* ─── Animated Walrus Mark ─── */
function WalrusMark({ size = 280 }: { size?: number }) {
  const uid = useId().replace(/:/g, "");
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (n: number) => {
      setT((n - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const bob = Math.sin(t * 1.2) * 4;
  const tusk = Math.sin(t * 0.8) * 2;
  const wake = (t * 30) % 200;

  return (
    <svg viewBox="0 0 320 320" width={size} height={size} className="block">
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f15b3b" />
          <stop offset="1" stopColor="#c8421f" />
        </linearGradient>
        <radialGradient id={`${uid}-shine`} cx="0.3" cy="0.3" r="0.6">
          <stop offset="0" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="1" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <g opacity="0.5" stroke="var(--ink)" strokeWidth="1.4" fill="none" strokeLinecap="round">
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M ${20 + wake / 3 + i * 8},${230 + i * 12} q 40,${-8 + Math.sin(t * 1.5 + i) * 3} 80,0 t 80,0 t 80,0`}
            opacity={0.18 + i * 0.08}
          />
        ))}
      </g>
      <g transform={`translate(0 ${bob})`}>
        <path d={`M 90,170 q -28,${20 + tusk * 2} -54,18`} stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d={`M 230,170 q 28,${20 - tusk * 2} 54,18`} stroke="var(--ink)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
        <path
          d={`M 160 60 C 222 60 270 108 270 165 C 270 215 230 240 198 252 Q 192 268 178 274 Q 170 270 168 256 L 152 256 Q 150 270 142 274 Q 128 268 122 252 C 90 240 50 215 50 165 C 50 108 98 60 160 60 Z`}
          fill={`url(#${uid}-body)`}
        />
        <ellipse cx="160" cy="220" rx="60" ry="22" fill="rgba(255,255,255,0.18)" />
        <g transform={`rotate(${tusk * 0.5} 160 220)`}>
          <path d="M 145 235 q -2 18 -4 30 q 4 4 8 0 q 0 -16 -1 -30 z" fill="var(--cream)" stroke="var(--ink)" strokeWidth="1" />
          <path d="M 175 235 q 2 18 4 30 q -4 4 -8 0 q 0 -16 1 -30 z" fill="var(--cream)" stroke="var(--ink)" strokeWidth="1" />
        </g>
        <g>
          <ellipse cx="135" cy="135" rx="12" ry="14" fill="white" />
          <ellipse cx="185" cy="135" rx="12" ry="14" fill="white" />
          <circle cx={135 + Math.sin(t) * 1.5} cy={138 + Math.cos(t * 0.7)} r="5" fill="var(--ink)" />
          <circle cx={185 + Math.sin(t) * 1.5} cy={138 + Math.cos(t * 0.7)} r="5" fill="var(--ink)" />
          <circle cx={137} cy={134} r="1.5" fill="white" />
          <circle cx={187} cy={134} r="1.5" fill="white" />
        </g>
        <path d="M 154 170 Q 160 178 166 170 Q 160 184 154 170 Z" fill="var(--ink)" />
        <g fill="var(--ink)" opacity="0.6">
          <circle cx="135" cy="188" r="1.4" />
          <circle cx="145" cy="192" r="1.4" />
          <circle cx="175" cy="192" r="1.4" />
          <circle cx="185" cy="188" r="1.4" />
        </g>
        <ellipse cx="120" cy="105" rx="40" ry="22" fill={`url(#${uid}-shine)`} opacity="0.5" />
      </g>
    </svg>
  );
}

/* ─── Floating Chip ─── */
function FloatChip({
  top, left, right, bottom, rotate = 0, accent, children,
}: {
  top?: string; left?: string; right?: string; bottom?: string;
  rotate?: number; accent?: boolean; children: React.ReactNode;
}) {
  const dir = rotate >= 0 ? "A" : "B";
  const id = `floaty${dir}${Math.abs(rotate)}`;
  const dur = 5 + Math.abs(rotate) / 3;
  return (
    <div
      className="absolute max-w-[240px] rounded-[14px] p-3 shadow-[0_20px_40px_-16px_rgba(11,15,23,0.25),0_4px_12px_-2px_rgba(11,15,23,0.08)]"
      style={{
        top, left, right, bottom,
        background: accent ? "var(--ink)" : "white",
        color: accent ? "var(--cream)" : "var(--ink)",
        border: accent ? "none" : "1px solid rgba(11,15,23,0.06)",
        animation: `${id} ${dur}s ease-in-out infinite`,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {children}
      <style>{`@keyframes ${id} { 0%,100% { transform: rotate(${rotate}deg) translateY(0); } 50% { transform: rotate(${rotate}deg) translateY(${dir === "A" ? -8 : 8}px); } }`}</style>
    </div>
  );
}

/* ─── Marquee ─── */
function Marquee({ items }: { items: string[] }) {
  return (
    <div
      className="overflow-hidden whitespace-nowrap py-[18px]"
      style={{ background: "var(--ink)", color: "var(--cream)" }}
    >
      <div className="inline-flex" style={{ animation: "marquee 38s linear infinite" }}>
        {Array.from({ length: 3 }).flatMap((_, r) =>
          items.map((it, i) => (
            <span key={`${r}-${i}`} className="inline-flex items-center gap-[22px] pr-9">
              <span className="serif-italic text-[clamp(28px,3.4vw,56px)] tracking-[-0.01em]">
                {it}
              </span>
              <span className="text-[clamp(20px,2vw,28px)]" style={{ color: "var(--coral)" }}>
                ✦
              </span>
            </span>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Tickertape ─── */
function Tickertape() {
  const items = [
    { t: "create", who: "design", what: "→", form: "build your form in the editor" },
    { t: "publish", who: "pin", what: "→", form: "store the definition on Walrus" },
    { t: "collect", who: "seal", what: "→", form: "submissions encrypted client-side" },
    { t: "read", who: "decrypt", what: "→", form: "sign with your wallet to view" },
    { t: "reward", who: "SUI", what: "→", form: "send tokens to respondents" },
    { t: "own", who: "walrus", what: "→", form: "your data, your blobs, your keys" },
  ];
  return (
    <div
      className="overflow-hidden py-3"
      style={{
        background: "var(--ink)",
        color: "var(--cream)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="inline-flex whitespace-nowrap" style={{ animation: "tick 38s linear infinite" }}>
        {Array.from({ length: 3 }).flatMap((_, r) =>
          items.map((it, i) => (
            <span key={`${r}-${i}`} className="inline-flex items-center gap-3 pr-7 text-[12.5px]" style={{ fontFamily: "var(--font-mono)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--coral)", boxShadow: "0 0 12px var(--coral)" }} />
              <span style={{ color: "rgba(255,255,255,0.5)" }}>{it.t}</span>
              <span style={{ color: "var(--coral)" }}>{it.who}</span>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>{it.what}</span>
              <span className="serif-italic text-[16px] text-white">{it.form}</span>
              <span style={{ color: "rgba(255,255,255,0.25)", marginLeft: 12 }}>──</span>
            </span>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Manifesto Panel ─── */
function Panel({
  bg, ink, label, lead, body, side,
}: {
  bg: string; ink: string; label: string;
  lead: React.ReactNode; body: string; side: React.ReactNode;
}) {
  return (
    <div style={{ background: bg, color: ink, borderTop: `1px solid color-mix(in oklab, ${ink} 8%, transparent)` }} className="py-14 md:py-[120px] px-5 md:px-8">
      <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-8 md:gap-20 items-center">
        <div>
          <div className="mono-label mb-4 md:mb-7">{label}</div>
          <h2 className="heading-display text-[clamp(36px,7vw,104px)]">{lead}</h2>
          <p className="mt-5 md:mt-8 max-w-[520px] text-[15px] md:text-[17px] leading-relaxed" style={{ color: `color-mix(in oklab, ${ink} 80%, transparent)` }}>
            {body}
          </p>
        </div>
        <div className="relative min-h-[200px] md:min-h-[360px]">{side}</div>
      </div>
    </div>
  );
}

/* ─── Side Art: Blob ─── */
function BlobArt() {
  return (
    <div
      className="relative p-7 rounded-[18px] shadow-[0_30px_60px_-20px_rgba(11,15,23,0.2)]"
      style={{
        background: "var(--cream)",
        border: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)",
        transform: "rotate(-1.5deg)",
      }}
    >
      <div className="mono-label mb-3">walrus://blob</div>
      <div className="text-[16px] md:text-[clamp(20px,1.9vw,26px)] leading-[1.35] break-all" style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}>
        0x<span style={{ color: "var(--coral)" }}>8a4b</span>2f1c9e7d
        <br />3b5a6c8e<span style={{ color: "var(--coral)" }}>0f9d</span>1a2b
        <br />3c4d5e6f<span style={{ color: "var(--coral)" }}>02e</span>
      </div>
      <div
        className="mt-4 pt-4 flex justify-between text-[11px]"
        style={{
          fontFamily: "var(--font-mono)",
          borderTop: "1px dashed color-mix(in oklab, var(--ink) 20%, transparent)",
          color: "rgba(0,0,0,0.55)",
        }}
      >
        <span>3.2 KB</span>
        <span>5 epochs</span>
        <span style={{ color: "var(--ocean-2)" }}>● PINNED</span>
      </div>
    </div>
  );
}

/* ─── Side Art: Seal ─── */
function SealArt() {
  return (
    <div className="relative grid grid-cols-4 gap-2">
      {Array.from({ length: 24 }, (_, i) => (
        <div
          key={i}
          className="aspect-square rounded-lg flex items-center justify-center font-semibold text-xs"
          style={{
            fontFamily: "var(--font-mono)",
            background: i === 11 ? "var(--coral)" : "rgba(255,255,255,0.06)",
            color: i === 11 ? "var(--ink)" : "rgba(255,255,255,0.4)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {i === 11 ? "✦" : String.fromCharCode(65 + ((i * 7) % 26))}
        </div>
      ))}
      <div className="absolute -bottom-12 left-0 right-0 text-center text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.4)" }}>
        ↑ what we see · ↓ what you see
      </div>
    </div>
  );
}

/* ─── Side Art: Webhook ─── */
function WebhookArt() {
  const nodes = [
    { label: "submit()", sub: "on form → submission" },
    { label: "webhook", sub: "POST /discord/feedback" },
    { label: "reward()", sub: "send 0.05 SUI" },
  ];
  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
      {/* Desktop: absolute positioned with SVG lines */}
      <div className="relative h-[360px] hidden md:block">
        <svg viewBox="0 0 400 360" width="100%" height="100%" className="absolute inset-0">
          <defs>
            <marker id="ah" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 z" fill="var(--cream)" />
            </marker>
          </defs>
          <path d="M 70 60 C 180 60 220 180 330 180" stroke="var(--sand)" strokeWidth="1.5" fill="none" markerEnd="url(#ah)" strokeDasharray="4 4" />
          <path d="M 70 180 C 180 180 220 180 330 180" stroke="var(--cream)" strokeWidth="1.5" fill="none" markerEnd="url(#ah)" />
          <path d="M 70 300 C 180 300 220 180 330 180" stroke="var(--sand)" strokeWidth="1.5" fill="none" markerEnd="url(#ah)" strokeDasharray="4 4" />
        </svg>
        {[38, 158, 278].map((y, i) => (
          <div
            key={i}
            className="absolute left-2 rounded-lg p-2 px-3 min-w-[140px]"
            style={{ top: y, background: "rgba(255,255,255,0.06)", color: "var(--cream)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="font-semibold" style={{ color: "var(--coral)" }}>{nodes[i].label}</div>
            <div style={{ opacity: 0.55, marginTop: 2 }}>{nodes[i].sub}</div>
          </div>
        ))}
        <div
          className="absolute rounded-lg p-2 px-3 min-w-[140px]"
          style={{ top: 158, right: 8, background: "var(--coral)", color: "var(--ink)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="font-semibold" style={{ color: "var(--ink)" }}>submission</div>
          <div style={{ opacity: 0.7, marginTop: 2 }}>pinned + sealed</div>
        </div>
      </div>

      {/* Mobile: simple stacked list */}
      <div className="md:hidden flex flex-col gap-2">
        {nodes.map((c, i) => (
          <div
            key={i}
            className="rounded-lg p-3"
            style={{ background: "rgba(255,255,255,0.06)", color: "var(--cream)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="font-semibold" style={{ color: "var(--coral)" }}>{c.label}</div>
            <div style={{ opacity: 0.55, marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
        <div className="rounded-lg p-3 flex items-center justify-between" style={{ background: "var(--coral)", color: "var(--ink)" }}>
          <div>
            <div className="font-semibold">submission</div>
            <div style={{ opacity: 0.7, marginTop: 2 }}>pinned + sealed</div>
          </div>
          <span className="text-[10px] opacity-60">→ WALRUS</span>
        </div>
      </div>
    </div>
  );
}

/* ─── How It Works Art ─── */
function DesignArt() {
  const questions = [
    { type: "RATING", q: "How likely are you to recommend Puffy?", active: true },
    { type: "CHOICE", q: "Which feature delights you most?", active: false },
    { type: "LONG", q: "Anything else?", active: false },
  ];
  return (
    <div className="card-editorial !p-5" style={{ transform: "rotate(-1deg)" }}>
      {questions.map((item, i) => (
        <div
          key={i}
          className="rounded-lg p-2.5 mb-1.5"
          style={{
            background: item.active ? "var(--cream-deep)" : "transparent",
            border: item.active ? "1px solid var(--coral)" : "1px solid transparent",
          }}
        >
          <div className="text-[10px] mb-1" style={{ color: "rgba(0,0,0,0.5)", fontFamily: "var(--font-mono)" }}>{item.type}</div>
          <div className="text-[13.5px] font-semibold">{item.q}</div>
        </div>
      ))}
      <div className="mt-2 p-2 rounded-lg text-center text-xs" style={{ border: "1.5px dashed rgba(0,0,0,0.2)", color: "rgba(0,0,0,0.45)" }}>
        + add field
      </div>
    </div>
  );
}

function PublishArt() {
  const lines: [string, string, string][] = [
    ["$", "puffy publish ./form.json", "rgba(0,0,0,0.55)"],
    ["→", "uploading to Walrus aggregator…", "rgba(0,0,0,0.55)"],
    ["✓", "pinned · 3.2 KB · 5 epochs", "var(--ocean)"],
    ["✓", "blob: 0x8a4b2f1c9e7d3b5a6c…", "var(--ocean)"],
    ["→", "puffy.wal.app/f/8a4b…", "var(--coral)"],
  ];
  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink)" }}>
      {lines.map(([p, l, c], i) => (
        <div key={i} className="flex gap-2.5 py-1.5">
          <span style={{ color: c, width: 14 }}>{p}</span>
          <span>{l}</span>
        </div>
      ))}
    </div>
  );
}

function ReceiveArt() {
  const rows = [
    { who: "mira@nodelab", state: "sealing…", color: "var(--sand)" },
    { who: "0xd2f1…99ab", state: "pinned", color: "var(--ocean)" },
    { who: "diego@sui", state: "pinned", color: "var(--ocean)" },
    { who: "0x44ac…123e", state: "sealing…", color: "var(--sand)" },
    { who: "sora@onyx", state: "pinned", color: "var(--ocean)" },
  ];
  return (
    <div className="flex flex-col gap-1">
      {rows.map((r, i) => (
        <div
          key={i}
          className="flex justify-between p-2 px-3 rounded-md text-xs animate-fade-up opacity-0"
          style={{
            fontFamily: "var(--font-mono)",
            background: "white",
            border: "1px solid color-mix(in oklab, var(--ink) 10%, transparent)",
            animationDelay: `${i * 0.2}s`,
          }}
        >
          <span>{r.who}</span>
          <span className="flex items-center gap-1.5" style={{ color: r.color }}>
            <span
              className={`w-1.5 h-1.5 rounded-full ${r.state === "sealing…" ? "animate-pulse-dot" : ""}`}
              style={{ background: r.color }}
            />
            {r.state}
          </span>
        </div>
      ))}
    </div>
  );
}

function ReadArt() {
  return (
    <div className="rounded-[14px] p-5" style={{ background: "var(--ink)", color: "var(--cream)" }}>
      <div className="mono-label !text-[10px] opacity-50">Decrypted</div>
      <div className="mt-2.5 serif-italic text-[22px] leading-[1.35] text-white">
        &ldquo;The mobile field reordering is finicky. Would love haptics.&rdquo;
      </div>
      <div
        className="mt-3.5 pt-3.5 flex justify-between text-[11px]"
        style={{
          fontFamily: "var(--font-mono)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.55)",
        }}
      >
        <span>Mira K. · 0x8a4b…f02e</span>
        <span style={{ color: "var(--coral)" }}>★★★★☆ · HIGH</span>
      </div>
    </div>
  );
}

/* ─── How It Works Art: Tweet ─── */
function TweetArt() {
  return (
    <div className="card-editorial !p-0 overflow-hidden" style={{ transform: "rotate(1deg)" }}>
      {/* Original tweet */}
      <div className="p-4 pb-3" style={{ borderBottom: "1px solid color-mix(in oklab, var(--ink) 10%, transparent)" }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full" style={{ background: "var(--ocean)", opacity: 0.7 }} />
          <div>
            <div className="text-[12.5px] font-semibold">alice.sui</div>
            <div className="text-[10.5px]" style={{ fontFamily: "var(--font-mono)", color: "rgba(0,0,0,0.45)" }}>@alice_builds</div>
          </div>
        </div>
        <p className="text-[13.5px] leading-snug">
          hey <span className="font-semibold" style={{ color: "var(--coral)" }}>@puffywal</span> make me a feedback form for my dApp, ask about UX, performance, and feature requests
        </p>
      </div>
      {/* Reply */}
      <div className="p-4 pt-3" style={{ background: "color-mix(in oklab, var(--ink) 3%, var(--cream))" }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "var(--coral)" }}>
            <svg viewBox="0 0 320 320" width="16" height="16">
              <path
                d="M 160 80 C 210 80 250 120 250 165 C 250 200 225 225 200 233 Q 195 244 185 248 Q 180 245 179 236 L 168 236 Q 167 245 162 248 Q 148 244 143 233 C 118 225 70 200 70 165 C 70 120 110 80 160 80 Z"
                fill="white"
              />
            </svg>
          </div>
          <div>
            <div className="text-[12.5px] font-semibold">Puffy</div>
            <div className="text-[10.5px]" style={{ fontFamily: "var(--font-mono)", color: "rgba(0,0,0,0.45)" }}>@puffywal</div>
          </div>
        </div>
        <p className="text-[13.5px] leading-snug">
          Done! 3 fields, sealed & pinned.
        </p>
        <div
          className="mt-2 rounded-md p-2 px-2.5 text-[11px] flex items-center justify-between"
          style={{
            fontFamily: "var(--font-mono)",
            background: "white",
            border: "1px solid color-mix(in oklab, var(--ink) 12%, transparent)",
          }}
        >
          <span style={{ color: "var(--coral)" }}>puffyforms.wal.app/f/8a4b…</span>
          <span style={{ color: "var(--ocean)" }}>sealed</span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Page
   ========================================================= */
export default function HomePage() {
  const verbs = ["feedback", "surveys", "NPS", "RSVPs", "bug reports", "applications", "pulses"];
  const [vi, setVi] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setVi((v) => (v + 1) % verbs.length), 2200);
    return () => clearInterval(id);
  }, []);

  const marqueeItems = [
    "Forms worth keeping",
    "Encryption is the default",
    "Your data, your blob, your keys",
    "Forms become primitives",
    "No central server",
    "Pinned to Walrus",
    "Sealed by Seal",
    "Secured by Sui",
  ];

  const howRows = [
    { n: "01", tag: "Design", verb: "compose", body: "Open the builder. Type your first question, or describe the form and let the AI draft it. Drag to reorder, slash to insert a new field.", side: <DesignArt /> },
    { n: "02", tag: "Publish", verb: "pin", body: "One click writes the form definition to Walrus as a JSON blob, pinned for the lifetime you choose. You get a permanent link the moment the receipt lands.", side: <PublishArt /> },
    { n: "03", tag: "Receive", verb: "seal", body: "Respondents see your form. They submit. Their answers are wrapped in Seal threshold encryption before they leave the browser and pinned to Walrus.", side: <ReceiveArt /> },
    { n: "04", tag: "Read", verb: "decrypt", body: "Sign once with your wallet. The dashboard decrypts submissions on your device. Review responses, send SUI rewards — or just read.", side: <ReadArt /> },
    { n: "05", tag: "Tweet", verb: "mention", body: "Tweet @puffywal with your form idea. The bot reads your prompt, drafts the fields, publishes to Walrus, and replies with a sealed form link — all from a single mention.", side: <TweetArt /> },
  ];

  const specs = [
    { k: "Field types", v: "11", sub: "text, long, email, url, number, dropdown, checkbox, radio, rating, file upload, rich text" },
    { k: "Storage", v: "Walrus", sub: "pinned blobs, 5-epoch default, censorship-resistant" },
    { k: "Encryption", v: "Seal", sub: "threshold, client-side, opt-out per form" },
    { k: "Rewards", v: "SUI", sub: "per-submission, manual from dashboard" },
    { k: "AI drafting", v: "✓", sub: "describe your form → AI generates it" },
    { k: "Brand theming", v: "✓", sub: "color, font, logo per form" },
    { k: "X integration", v: "✓", sub: "create forms from tweets" },
    { k: "TEE backend", v: "✓", sub: "Nautilus enclave, no plaintext at rest" },
  ];

  return (
    <div style={{ background: "var(--cream)", color: "var(--ink)" }}>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-5 md:px-8 pt-6 md:pt-[40px] pb-8">
        {/* Meta strip — desktop */}
        <div className="max-w-[1400px] mx-auto hidden md:flex justify-between items-center mono-label mb-[32px]">
          <span>Vol. I · Issue 04 · Walrus Sessions</span>
          <span>Sui · Walrus · Open beta</span>
          <span>† est. 2026</span>
        </div>

        {/* ── Mobile hero ── */}
        <div className="md:hidden min-h-[calc(100svh-56px)] flex flex-col">
          {/* Walrus — big, proud, top of screen */}
          <div className="flex justify-center pt-4 pb-2 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[300px] h-[300px] rounded-full" style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--coral) 18%, transparent) 0%, transparent 70%)", filter: "blur(30px)" }} />
            </div>
            <WalrusMark size={260} />
          </div>

          {/* Headline */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-px" style={{ background: "var(--ink)" }} />
              <span className="mono-label !text-[9.5px]">
                Decentralized forms on Walrus
              </span>
            </div>

            <h1 className="heading-display text-[13vw] leading-[0.9]">
              Forms
              <span className="serif-italic font-light text-[11vw] tracking-[-0.02em] ml-1.5" style={{ color: "var(--coral)" }}>
                worth
              </span>
              <br />
              keeping,
              <br />
              <span key={vi} style={{ display: "inline-block", whiteSpace: "nowrap", animation: "flipIn .45s ease both", color: "var(--ocean)" }}>{verbs[vi]}<span style={{ color: "var(--ink)" }}>.</span></span>
            </h1>

            <p className="mt-5 text-[15px] leading-relaxed" style={{ color: "color-mix(in oklab, var(--ink) 70%, transparent)" }}>
              Your respondents&apos; answers never touch a server.
              Drafts in Walrus. Sealed by Seal. Secured by Sui.
            </p>
          </div>

          {/* CTA — pinned to bottom area */}
          <div className="pt-6 pb-4 flex flex-col gap-3">
            <Link href="/create" className="btn-editorial w-full justify-center text-[15px]">
              Start a form
              <span className="pill-coral">→</span>
            </Link>
            <Link href="/dashboard" className="btn-editorial-outline w-full text-center text-[15px]">
              See it on Walrus
            </Link>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="text-[11px]" style={{ color: "color-mix(in oklab, var(--ink) 55%, transparent)" }}>
                Open beta · built on Sui + Walrus
              </span>
            </div>
          </div>
        </div>

        {/* ── Desktop hero ── */}
        <div className="max-w-[1400px] mx-auto hidden md:grid md:grid-cols-[1.4fr_1fr] gap-10 items-center">
          {/* Headline */}
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <span className="w-7 h-px" style={{ background: "var(--ink)" }} />
              <span className="mono-label !text-[11px]">
                A form builder for the decentralized decade
              </span>
            </div>

            <h1 className="heading-display text-[clamp(64px,9vw,144px)]">
              Forms
              <span className="serif-italic font-light text-[clamp(56px,7.5vw,120px)] tracking-[-0.02em] ml-3" style={{ color: "var(--coral)" }}>
                worth
              </span>
              <br />
              keeping,
              <br />
              <span key={vi} style={{ display: "inline-block", whiteSpace: "nowrap", animation: "flipIn .45s ease both", color: "var(--ocean)" }}>{verbs[vi]}<span style={{ color: "var(--ink)" }}>.</span></span>
            </h1>

            <p className="mt-8 max-w-[540px] text-[17px] leading-relaxed" style={{ color: "color-mix(in oklab, var(--ink) 75%, transparent)" }}>
              A form builder for people who would rather not hand their respondents&apos;
              answers to a third party. Drafts in Walrus blobs. Submissions wrapped in Seal.
              Bound by Sui.{" "}
              <em className="serif-italic font-medium">The walrus eats the form.</em>
            </p>

            <div className="mt-9 flex flex-wrap gap-3 items-center">
              <Link href="/create" className="btn-editorial">
                Start a form
                <span className="pill-coral">→</span>
              </Link>
              <Link href="/dashboard" className="btn-editorial-outline">
                See it on Walrus
              </Link>
              <div className="flex items-center gap-2 ml-1.5">
                <span className="text-xs" style={{ color: "color-mix(in oklab, var(--ink) 60%, transparent)" }}>
                  Open beta · built on Sui + Walrus
                </span>
              </div>
            </div>
          </div>

          {/* Walrus column */}
          <div className="relative min-h-[460px]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="absolute -inset-10 rounded-full" style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--coral) 22%, transparent) 0%, transparent 70%)", filter: "blur(20px)" }} />
              <WalrusMark size={420} />
            </div>

            <FloatChip top="6%" left="2%">
              <div className="text-[11px]" style={{ fontFamily: "var(--font-mono)", color: "var(--ocean)" }}>BLOB 0x4f2a…b91c</div>
              <div className="font-bold text-sm mt-1" style={{ fontFamily: "var(--font-display)" }}>Product feedback</div>
              <div className="text-[11px] mt-1" style={{ color: "rgba(0,0,0,.5)" }}>Seal encrypted · Walrus pinned</div>
            </FloatChip>

            <FloatChip bottom="10%" right="0%" rotate={4}>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className="text-[22px] leading-none" style={{ color: n <= 4 ? "var(--coral)" : "rgba(0,0,0,0.2)" }}>★</span>
                ))}
              </div>
              <div className="text-[11px] mt-1" style={{ fontFamily: "var(--font-mono)", color: "rgba(0,0,0,.55)" }}>+0.05 SUI rewarded</div>
            </FloatChip>

            <FloatChip top="38%" right="-4%" rotate={-3} accent>
              <div className="serif-italic text-lg" style={{ color: "var(--cream)" }}>
                &ldquo;No server. No middleman.&rdquo;
              </div>
              <div className="text-[10px] mt-1.5" style={{ fontFamily: "var(--font-mono)", color: "rgba(255,255,255,0.7)" }}>—— CLIENT-SIDE ENCRYPTION</div>
            </FloatChip>
          </div>
        </div>
      </section>

      {/* ── Tickertape + Marquee ── */}
      <Tickertape />
      <Marquee items={marqueeItems} />

      {/* ── Manifesto ── */}
      <section id="manifesto">
        <Panel
          bg="var(--cream-deep)"
          ink="var(--ink)"
          label="01 — Storage"
          lead={<>Your data.<br /><em className="serif-italic font-normal">Your blob.</em><br />Your keys.</>}
          body="Every form definition is a Walrus blob. Every submission is a Walrus blob. Nothing routes through us — we are a UI, not a custodian. Take your blob ID, plug it into any reader, and the answers are yours forever."
          side={<BlobArt />}
        />
        <Panel
          bg="var(--ink)"
          ink="var(--cream)"
          label="02 — Privacy"
          lead={<>Encryption<br />is the <em className="serif-italic font-normal" style={{ color: "var(--coral)" }}>default</em>,<br />not a setting.</>}
          body="Submissions are wrapped in Seal threshold encryption the moment the respondent hits OK. You decrypt with your wallet — never with our help. We can't read what we never receive."
          side={<SealArt />}
        />
        <Panel
          bg="var(--ocean)"
          ink="var(--cream)"
          label="03 — Composability"
          lead={<>Forms<br />are <em className="serif-italic font-normal" style={{ color: "var(--sand)" }}>primitives</em>,<br />not silos.</>}
          body="Pipe submissions into webhooks. Trigger contracts on Sui. Reward respondents in SUI per answer. Build a leaderboard out of NPS scores. Forms become Lego — bring your stack."
          side={<WebhookArt />}
        />
      </section>

      {/* ── Stat Art ── */}
      <section className="py-14 md:py-[120px] px-5 md:px-8" style={{ background: "var(--cream)" }}>
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-[1fr_1.2fr] gap-8 md:gap-16 items-center">
          <div className="order-2 md:order-1">
            <div className="mono-label">The thing nobody else can say</div>
            <h3 className="heading-display text-[clamp(28px,4.4vw,64px)] leading-[1.05] mt-4 md:mt-5">
              of submissions ever pass through a centralized server.{" "}
              <span className="serif-italic font-normal" style={{ color: "var(--coral)" }}>Not one byte.</span>
            </h3>
            <p className="mt-4 md:mt-5 max-w-[440px] text-[15px] md:text-[16px] leading-relaxed" style={{ color: "rgba(0,0,0,0.65)" }}>
              Puffy never sees your respondents&apos; answers. The client encrypts, signs, and uploads
              to Walrus directly. The dashboard fetches blobs straight from Walrus aggregators.
              We are a UI, not a database.
            </p>
          </div>
          <div className="text-center md:text-right relative order-1 md:order-2">
            <div className="absolute -top-10 -right-5 w-[200px] md:w-[280px] h-[200px] md:h-[280px] rounded-full opacity-[0.18]" style={{ background: "var(--coral)", filter: "blur(40px)" }} />
            <div className="relative heading-display text-[clamp(100px,22vw,360px)] leading-[0.85] tracking-[-0.07em]">
              0<span style={{ color: "var(--coral)" }}>%</span>
            </div>
            <div className="mono-label -mt-2">of submissions touch our servers · by design</div>
          </div>
        </div>
      </section>

      {/* ── Pull Quote ── */}
      <section className="relative overflow-hidden py-14 md:py-[120px] px-5 md:px-8" style={{ background: "var(--coral)", color: "var(--ink)" }}>
        <div className="absolute -top-[120px] -right-[120px] w-[300px] md:w-[400px] h-[300px] md:h-[400px] rounded-full bg-white/[0.16]" />
        <div className="absolute -bottom-[160px] -left-[100px] w-[280px] md:w-[380px] h-[280px] md:h-[380px] rounded-full bg-black/[0.08]" />
        <div className="max-w-[1100px] mx-auto relative">
          <div className="serif-italic text-[clamp(28px,6vw,96px)] leading-[1.1] tracking-[-0.03em]">
            One link. No backend. No database.
            <span className="hidden md:inline"><br /></span>{" "}
            Just a form that{" "}
            <span className="heading-display not-italic" style={{ color: "var(--ink)" }}>lives on Walrus</span>.
          </div>
          <div className="mt-6 md:mt-9 flex items-center gap-3.5 mono-label !tracking-[0.08em]" style={{ color: "rgba(0,0,0,0.7)" }}>
            <span className="w-8 h-px" style={{ background: "var(--ink)" }} />
            The Puffy manifesto
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="py-12 md:py-20 px-5 md:px-8" style={{ background: "var(--cream)" }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="pt-6 md:pt-8 flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 md:gap-4" style={{ borderTop: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)" }}>
            <div className="mono-label">The five motions</div>
            <div className="serif-italic text-[clamp(18px,2vw,28px)]">
              from blank page to encrypted blob
            </div>
          </div>

          <div className="mt-8 md:mt-12">
            {howRows.map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-[80px_1fr_1fr] gap-4 md:gap-10 py-6 md:py-10 items-start md:items-center"
                style={{ borderBottom: "1px solid color-mix(in oklab, var(--ink) 12%, transparent)" }}
              >
                <div className="hidden md:block self-start pt-2 text-[16px]" style={{ fontFamily: "var(--font-mono)", color: "rgba(0,0,0,0.55)" }}>
                  {r.n}
                </div>
                <div>
                  <div className="text-[11px] tracking-[0.18em] uppercase mb-2" style={{ fontFamily: "var(--font-mono)", color: "var(--coral)" }}>
                    <span className="md:hidden">{r.n} · </span>{r.tag}
                  </div>
                  <h3 className="heading-display text-[clamp(32px,4.4vw,64px)] leading-none">
                    <em className="serif-italic font-normal" style={{ color: "var(--ocean)" }}>{r.verb}</em>
                    &nbsp;the form.
                  </h3>
                  <p className="mt-3 md:mt-4 max-w-[460px] text-[14px] md:text-[15.5px] leading-relaxed" style={{ color: "rgba(0,0,0,0.7)" }}>
                    {r.body}
                  </p>
                </div>
                <div className="mt-2 md:mt-0">{r.side}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Specs ── */}
      <section id="specs" className="py-12 md:py-20 px-5 md:px-8" style={{ background: "var(--cream-deep)", borderTop: "1px solid color-mix(in oklab, var(--ink) 10%, transparent)" }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-baseline gap-2 md:gap-4 mb-6 md:mb-9">
            <h2 className="heading-display text-[clamp(24px,3.4vw,42px)]">What&apos;s in the box</h2>
            <span className="mono-label">v0.4 · shipping monthly</span>
          </div>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px"
            style={{ background: "color-mix(in oklab, var(--ink) 12%, transparent)", border: "1px solid color-mix(in oklab, var(--ink) 12%, transparent)" }}
          >
            {specs.map((s, i) => (
              <div key={i} className="p-4 md:p-6" style={{ background: "var(--cream)" }}>
                <div className="mono-label !text-[10.5px]">{s.k}</div>
                <div
                  className="heading-display text-[clamp(24px,2.8vw,40px)] mt-2"
                  style={{ color: s.v === "✓" ? "var(--ocean)" : "var(--ink)" }}
                >
                  {s.v}
                </div>
                <div className="mt-2 text-[12px] md:text-[12.5px] leading-snug" style={{ color: "rgba(0,0,0,0.6)" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closer ── */}
      <section className="pt-14 md:pt-[120px] pb-8 md:pb-10 px-5 md:px-8" style={{ background: "var(--cream)" }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-end">
            <div>
              <div className="mono-label">—— now you</div>
              <h2 className="heading-display text-[clamp(36px,7vw,104px)] mt-4 md:mt-5">
                Make<br />
                <em className="serif-italic font-normal" style={{ color: "var(--coral)" }}>the first form</em><br />
                you can live with.
              </h2>
              <div className="mt-6 md:mt-9 flex flex-col sm:flex-row flex-wrap gap-3">
                <Link href="/create" className="btn-editorial !py-4 !px-[26px] !text-[15px] w-full sm:w-auto justify-center">
                  Start in the builder →
                </Link>
                <Link href="/dashboard" className="btn-editorial-outline !py-4 !px-[26px] !text-[15px] w-full sm:w-auto text-center">
                  Browse forms on Walrus
                </Link>
              </div>
            </div>
            <div>
              <ul className="grid gap-2.5 md:gap-3.5" style={{ fontFamily: "var(--font-body)" }}>
                {[
                  ["Open beta", "free to use"],
                  ["Walrus mainnet", "blobs pinned on-chain"],
                  ["Seal encryption", "on by default · per form"],
                  ["SUI rewards", "send tokens to respondents"],
                  ["Wallet only", "no email, no password"],
                ].map(([k, v], i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center py-2.5 md:py-3.5"
                    style={{ borderBottom: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)" }}
                  >
                    <span className="font-bold text-base md:text-lg tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>{k}</span>
                    <span className="text-[11px] md:text-[12.5px] tracking-[0.02em]" style={{ fontFamily: "var(--font-mono)", color: "rgba(0,0,0,0.55)" }}>{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Giant wordmark */}
        <div className="mt-12 md:mt-20 overflow-hidden">
          <div className="heading-display text-[clamp(72px,26vw,440px)] leading-[0.85] tracking-[-0.07em] text-center whitespace-nowrap">
            Pu<em className="serif-italic font-normal" style={{ color: "var(--coral)" }}>ffy</em>.
          </div>
        </div>

        {/* Footer bar */}
        <div
          className="mt-6 md:mt-8 pt-5 md:pt-6 flex flex-col sm:flex-row justify-between flex-wrap gap-3 md:gap-4 mono-label !text-[11px] md:!text-[12px] !tracking-[0.04em]"
          style={{ borderTop: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)" }}
        >
          <span>© 2026 Puffy Collective</span>
          <span>Stored on Walrus · Encrypted with Seal · Secured by Sui</span>
        </div>
      </section>
    </div>
  );
}
