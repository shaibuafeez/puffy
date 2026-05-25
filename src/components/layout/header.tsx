"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/wallet/connect-button";
import { Menu, X } from "lucide-react";

const navItems = [
  { href: "/create", label: "Create" },
  { href: "/dashboard", label: "My Forms" },
  { href: "/link-twitter", label: "Connect X" },
];

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1400px] px-5 md:px-8">
        <div className="flex h-14 md:h-16 items-center justify-between relative">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <svg viewBox="0 0 320 320" width={28} height={28} className="block">
              <path d="M 160 60 C 222 60 270 108 270 165 C 270 215 230 240 198 252 Q 192 268 178 274 Q 170 270 168 256 L 152 256 Q 150 270 142 274 Q 128 268 122 252 C 90 240 50 215 50 165 C 50 108 98 60 160 60 Z" fill="#f15b3b"/>
              <ellipse cx="160" cy="220" rx="60" ry="22" fill="rgba(255,255,255,0.18)"/>
              <path d="M 145 235 q -2 18 -4 30 q 4 4 8 0 q 0 -16 -1 -30 z" fill="#f3ecdc" stroke="#0b0f17" strokeWidth="1"/>
              <path d="M 175 235 q 2 18 4 30 q -4 4 -8 0 q 0 -16 1 -30 z" fill="#f3ecdc" stroke="#0b0f17" strokeWidth="1"/>
              <ellipse cx="135" cy="135" rx="12" ry="14" fill="white"/>
              <ellipse cx="185" cy="135" rx="12" ry="14" fill="white"/>
              <circle cx="135" cy="138" r="5" fill="#0b0f17"/>
              <circle cx="185" cy="138" r="5" fill="#0b0f17"/>
              <circle cx="137" cy="134" r="1.5" fill="white"/>
              <circle cx="187" cy="134" r="1.5" fill="white"/>
              <path d="M 154 170 Q 160 178 166 170 Q 160 184 154 170 Z" fill="#0b0f17"/>
              <path d="M 90 170 q -28 22 -54 18" stroke="#0b0f17" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5"/>
              <path d="M 230 170 q 28 22 54 18" stroke="#0b0f17" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5"/>
            </svg>
            <span
              className="text-[20px] md:text-[22px] tracking-[-0.04em]"
              style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
            >
              Puffy
            </span>
            <span
              className="hidden sm:inline-flex text-[10.5px] px-2 py-0.5 rounded"
              style={{
                fontFamily: "var(--font-mono)",
                background: "var(--ink)",
                color: "var(--cream)",
              }}
            >
              v0.4
            </span>
          </Link>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-6 text-[13.5px] font-medium absolute left-1/2 -translate-x-1/2">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition-opacity duration-200 ${
                    isActive ? "opacity-100" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/create"
                className="btn-editorial-outline"
                style={{ padding: "9px 16px", fontSize: 13 }}
              >
                New Form
              </Link>
              <ConnectButton />
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-border"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-5 mb-4 rounded-2xl p-3 space-y-1 card-editorial">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-xl text-[14px] font-medium ${
                  isActive ? "text-[var(--coral)]" : "opacity-70"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 px-2 border-t border-border mt-1">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
