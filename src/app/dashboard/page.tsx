"use client";

import Link from "next/link";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/dashboard/form-card";
import { useUserForms } from "@/hooks/use-user-forms";
import { Plus, Inbox, Wallet, LayoutGrid, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const account = useCurrentAccount();
  const { forms, isLoading } = useUserForms();

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <Wallet className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-[13px] text-muted-foreground max-w-sm">
          Connect a Sui wallet to view and manage your forms
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mb-3" />
        <p className="text-[13px]">Loading forms...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[12px] font-medium text-primary mb-4">
            <LayoutGrid className="h-3 w-3" />
            Dashboard
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Your Forms</h1>
          <p className="text-muted-foreground text-[15px] mt-2">
            Manage forms, view submissions, and export data.
          </p>
        </div>
        <Button className="h-10 px-5 glow-hover" render={<Link href="/create" />}>
          <Plus className="h-4 w-4 mr-2" />
          New Form
        </Button>
      </div>

      {forms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-border/50">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No Forms Yet</h3>
          <p className="text-[13px] text-muted-foreground mb-6 max-w-xs">
            Create your first decentralized form to get started
          </p>
          <Button className="glow-hover" render={<Link href="/create" />}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Form
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <FormCard key={form.formId} form={form} />
          ))}
        </div>
      )}
    </div>
  );
}
