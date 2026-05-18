"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/wallet/connect-button";
import { Menu, X } from "lucide-react";

const navItems = [
  { href: "/create", label: "Create" },
  { href: "/dashboard", label: "Dashboard" },
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
        scrolled
          ? "glass shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-[72px] items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#4A90E2] to-[#357ABD] shadow-sm transition-all duration-200 group-hover:shadow-md">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="transition-transform duration-200 group-hover:scale-110"
              >
                <path
                  d="M12 2L3 7v10l9 5 9-5V7l-9-5z"
                  fill="white"
                  opacity="0.9"
                />
                <path
                  d="M12 2L3 7l9 5 9-5-9-5z"
                  fill="white"
                  opacity="0.3"
                />
              </svg>
            </div>
            <span className="text-[15px] font-semibold tracking-[-0.01em]">
              Walform
            </span>
          </Link>

          {/* Center nav — floating pill */}
          <nav className="hidden md:flex items-center">
            <div className="flex items-center gap-0.5 rounded-full border border-border/60 bg-muted/60 p-1 shadow-sm">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-5 py-1.5 text-[13px] font-medium rounded-full transition-all duration-200 ${
                      isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:block">
              <ConnectButton />
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card transition-colors hover:bg-accent"
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
        <div className="mx-6 mb-4 rounded-2xl border border-border/50 bg-card p-3 shadow-lg space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-xl text-[14px] font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 px-2 border-t border-border/30 mt-1">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}
