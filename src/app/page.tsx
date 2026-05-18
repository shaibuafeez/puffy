import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Layers,
  Database,
  Shield,
  Share2,
  BarChart3,
  Fingerprint,
  ArrowRight,
  Sparkles,
  Lock,
  Globe,
  Star,
  CheckCircle2,
  Webhook,
  Palette,
} from "lucide-react";
import { FormDemoMockup } from "@/components/landing/form-demo";

const features = [
  {
    icon: Layers,
    title: "Visual Form Builder",
    description:
      "Notion-style block editor with rich text, dropdowns, star ratings, file uploads, and 11 field types.",
    hero: true,
  },
  {
    icon: Database,
    title: "Walrus Storage",
    description:
      "Every form and submission is stored on Walrus decentralized storage. No servers, no single point of failure.",
  },
  {
    icon: Shield,
    title: "Seal Encryption",
    description:
      "End-to-end encryption powered by Seal on Sui. Only the form owner's wallet can decrypt responses.",
  },
  {
    icon: Share2,
    title: "One-Click Sharing",
    description:
      "Each form gets a unique Walrus-powered link. Share it anywhere — no wallet needed for respondents.",
  },
  {
    icon: Palette,
    title: "Brand Theming",
    description:
      "Custom colors, fonts, and logo upload. Forms look native to your brand with full visual control.",
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description:
      "Real-time POST to any external URL on submission. Integrate with Slack, Discord, or your own backend.",
  },
];

const steps = [
  {
    num: "01",
    title: "Design",
    description:
      "Build your form with our visual editor. Choose from 11 field types, enable Seal encryption, and customize settings.",
    icon: Sparkles,
  },
  {
    num: "02",
    title: "Share",
    description:
      "Publish to Walrus and get a unique link. Respondents can fill it out without a wallet.",
    icon: Globe,
  },
  {
    num: "03",
    title: "Analyze",
    description:
      "View encrypted submissions in your dashboard. Decrypt with your wallet, add notes, and export data.",
    icon: Lock,
  },
];

const stats = [
  { icon: Layers, label: "11 Field Types" },
  { icon: Shield, label: "Seal Encrypted" },
  { icon: Database, label: "Walrus Stored" },
  { icon: Star, label: "Brand Theming" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 grid-pattern" />
        <div className="absolute inset-0 hero-glow" />

        <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-16 md:pt-32 md:pb-20">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="animate-fade-up opacity-0 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[13px] text-primary mb-8">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary/60 animate-pulse-dot" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Built for Walrus Sessions Hackathon
            </div>

            {/* Heading */}
            <h1 className="animate-fade-up opacity-0 animation-delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Decentralized Forms
              <br />
              <span className="text-muted-foreground">
                Powered by Walrus
              </span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-up opacity-0 animation-delay-200 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed mb-10">
              Create feedback forms, surveys, and bug reports with Seal-encrypted
              submissions stored on Walrus. No central server. No data silos.
              Your data, your keys.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-up opacity-0 animation-delay-300 flex flex-col sm:flex-row items-center gap-3">
              <Button size="lg" className="h-12 px-6 text-[15px] glow-hover" render={<Link href="/create" />}>
                Start Building
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-6 text-[15px]" render={<Link href="/dashboard" />}>
                View Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Animated Form Demo Mockup */}
        <div className="relative mx-auto max-w-3xl px-6 pb-20 md:pb-28 animate-fade-up opacity-0 animation-delay-400">
          <FormDemoMockup />
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-t border-border/50 bg-muted/20">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {stats.map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-[13px] font-medium">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                  {stat.label}
                </div>
                {i < stats.length - 1 && (
                  <div className="h-4 w-px bg-border/60 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="text-center mb-16">
            <p className="text-[13px] font-medium text-primary uppercase tracking-widest mb-3">
              Features
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Everything you need for
              <br />
              decentralized feedback
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`group relative rounded-2xl border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 ${
                  feature.hero
                    ? "gradient-border"
                    : "border-border/50 hover:border-border"
                }`}
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted mb-4">
                  <feature.icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="font-semibold text-[15px] mb-2">{feature.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative border-t border-border/50 bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
          <div className="text-center mb-16">
            <p className="text-[13px] font-medium text-primary uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Three steps to decentralized forms
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px border-t border-dashed border-border" />
                )}
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border/50 shadow-sm">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to build?
          </h2>
          <p className="text-muted-foreground text-base mb-8 max-w-lg mx-auto">
            Create your first decentralized form in under a minute.
            No setup required — just connect your wallet and go.
          </p>
          <Button size="lg" className="h-12 px-8 text-[15px] glow-hover" render={<Link href="/create" />}>
            Create Your First Form
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50">
        <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M12 3L2 9l10 6 10-6-10-6z" />
                <path d="M2 17l10 6 10-6" />
                <path d="M2 13l10 6 10-6" />
              </svg>
            </div>
            <span className="font-medium text-foreground">Walform</span>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Stored on Walrus. Encrypted with Seal. Secured by Sui.
          </p>
        </div>
      </footer>
    </div>
  );
}
