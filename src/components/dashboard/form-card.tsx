"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate, generateFormLink } from "@/lib/utils";
import type { UserFormEntry } from "@/lib/types";
import { Copy, ArrowUpRight, Shield, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface FormCardProps {
  form: UserFormEntry;
}

export function FormCard({ form }: FormCardProps) {
  const link = generateFormLink(form.formBlobId);

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    toast.success("Form link copied!");
  };

  return (
    <div className="group relative rounded-2xl border border-border/50 bg-card p-5 transition-all duration-300 hover:border-border hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-[15px] line-clamp-1 pr-2">
          {form.title || "Untitled Form"}
        </h3>
        {form.sealAllowlistId && (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
            <Shield className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <MessageSquare className="h-3 w-3" />
          {form.submissionCount} response{form.submissionCount !== 1 ? "s" : ""}
        </div>
        <div className="h-3 w-px bg-border" />
        <p className="text-[12px] text-muted-foreground">
          {formatDate(form.createdAt)}
        </p>
      </div>

      {/* Blob ID */}
      <div className="mb-4 rounded-lg bg-muted/50 px-3 py-2">
        <p className="font-mono text-[11px] text-muted-foreground truncate">
          {form.formBlobId}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-lg"
          onClick={copyLink}
        >
          <Copy className="h-3 w-3 mr-1.5" />
          Copy Link
        </Button>
        <Button size="sm" className="flex-1 rounded-lg" render={<Link href={`/dashboard/${form.formId}`} />}>
          View
          <ArrowUpRight className="h-3 w-3 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
