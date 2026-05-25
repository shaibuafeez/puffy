"use client";

import { useState, useEffect } from "react";
import { Star, CheckCircle2 } from "lucide-react";

const STEPS = [
  { type: "text" as const, label: "What's your name?", step: "1 of 3" },
  { type: "stars" as const, label: "Rate your experience", step: "2 of 3" },
  { type: "success" as const, label: "Thank you!", step: "" },
];

const CYCLE_MS = 3200;

export function FormDemoMockup() {
  const [active, setActive] = useState(0);
  const [fade, setFade] = useState<"in" | "out">("in");

  useEffect(() => {
    const interval = setInterval(() => {
      setFade("out");
      setTimeout(() => {
        setActive((prev) => (prev + 1) % STEPS.length);
        setFade("in");
      }, 300);
    }, CYCLE_MS);
    return () => clearInterval(interval);
  }, []);

  const step = STEPS[active];

  return (
    <div className="relative">
      {/* Glow behind mockup */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-primary/5 to-transparent blur-2xl" />

      {/* Browser mockup */}
      <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl shadow-primary/5 overflow-hidden gradient-border">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/30">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-border/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-border/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-border/80" />
          </div>
          <div className="flex-1 mx-8">
            <div className="h-5 rounded-md bg-muted/60 max-w-xs mx-auto flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground/50 font-mono">
                puffy.wal.app/form/demo
              </span>
            </div>
          </div>
        </div>

        {/* Demo content area */}
        <div className="relative h-[260px] sm:h-[300px] flex flex-col">
          {/* Progress bar */}
          <div className="h-1 bg-muted/50">
            <div
              className="h-full bg-foreground transition-all duration-500 ease-out"
              style={{
                width:
                  step.type === "success"
                    ? "100%"
                    : step.type === "stars"
                      ? "66%"
                      : "33%",
              }}
            />
          </div>

          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border/20">
            <span className="text-[11px] font-medium text-muted-foreground/70">
              Customer Feedback
            </span>
            {step.step && (
              <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                {step.step}
              </span>
            )}
          </div>

          {/* Center content */}
          <div className="flex-1 flex items-center justify-center px-8">
            <div
              className={`w-full max-w-sm transition-all duration-300 ${
                fade === "in"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2"
              }`}
            >
              {step.type === "text" && <DemoTextStep />}
              {step.type === "stars" && <DemoStarsStep />}
              {step.type === "success" && <DemoSuccessStep />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoTextStep() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <span className="text-[10px] text-muted-foreground/50">1 &rarr;</span>
        <h3 className="text-lg font-semibold">What&apos;s your name?</h3>
      </div>
      <div className="relative">
        <div className="text-[15px] text-foreground/80 border-b-2 border-foreground/20 pb-2 overflow-hidden whitespace-nowrap">
          <span className="demo-typing inline-block">Sarah Chen</span>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <div className="h-7 px-3 rounded-md bg-foreground text-background text-[11px] font-medium flex items-center">
          OK
        </div>
        <span className="text-[10px] text-muted-foreground/40">
          press Enter
        </span>
      </div>
    </div>
  );
}

function DemoStarsStep() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <span className="text-[10px] text-muted-foreground/50">2 &rarr;</span>
        <h3 className="text-lg font-semibold">Rate your experience</h3>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`h-7 w-7 demo-star-${n} fill-current text-foreground`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 pt-1">
        <div className="h-7 px-3 rounded-md bg-foreground text-background text-[11px] font-medium flex items-center">
          OK
        </div>
        <span className="text-[10px] text-muted-foreground/40">
          press Enter
        </span>
      </div>
    </div>
  );
}

function DemoSuccessStep() {
  return (
    <div className="flex flex-col items-center text-center space-y-3">
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center" style={{ animation: "check-pop 0.5s ease-out forwards" }}>
        <CheckCircle2 className="h-6 w-6 text-foreground" />
      </div>
      <h3 className="text-lg font-semibold">Thank you!</h3>
      <p className="text-[12px] text-muted-foreground/60">
        Stored securely on Walrus
      </p>
    </div>
  );
}
