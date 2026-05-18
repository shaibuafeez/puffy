"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDate, downloadAsCSV, downloadAsJSON } from "@/lib/utils";
import { getBlobUrl } from "@/lib/walrus";
import type { FormDefinition, FormSubmission, AdminNote } from "@/lib/types";
import {
  Search,
  Download,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Star,
  FileImage,
  Lock,
  Inbox,
  Coins,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const PRIORITY_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  low: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  medium: { bg: "bg-foreground/10", text: "text-foreground/70", dot: "bg-foreground/50" },
  high: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400" },
  critical: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
};

interface SubmissionTableProps {
  form: FormDefinition;
  submissions: { blobId: string; data: FormSubmission | null; encrypted?: boolean; submitterAddress?: string; rewardStatus?: "pending" | "sent"; rewardTxDigest?: string }[];
  notes: Record<string, AdminNote>;
  onSaveNote: (submissionBlobId: string, note: string, priority: string) => void;
  onSendReward?: (submissionBlobId: string, recipientAddress: string) => Promise<void>;
  rewardAmountSui?: number;
}

export function SubmissionTable({
  form,
  submissions,
  notes,
  onSaveNote,
  onSendReward,
  rewardAmountSui,
}: SubmissionTableProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [noteSheet, setNoteSheet] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [notePriority, setNotePriority] = useState("medium");
  const [sendingReward, setSendingReward] = useState<string | null>(null);

  const showRewardColumn = !!onSendReward;
  const columnCount = showRewardColumn ? 7 : 6;

  const filtered = submissions.filter((sub) => {
    if (!search) return true;
    if (!sub.data) return false;
    const text = JSON.stringify(sub.data.responses).toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const openNoteSheet = (blobId: string) => {
    const existing = notes[blobId];
    setNoteText(existing?.note || "");
    setNotePriority(existing?.priority || "medium");
    setNoteSheet(blobId);
  };

  const saveNote = () => {
    if (noteSheet) {
      onSaveNote(noteSheet, noteText, notePriority);
      setNoteSheet(null);
      toast.success("Note saved");
    }
  };

  const handleExportCSV = () => {
    const rows = filtered
      .filter((s) => s.data)
      .map((s) => {
        const row: Record<string, unknown> = {
          submittedAt: s.data!.submittedAt,
          submitter: s.data!.submitter,
          blobId: s.blobId,
        };
        form.fields.forEach((field) => {
          const val = s.data!.responses[field.id];
          row[field.label || field.id] = Array.isArray(val)
            ? val.join("; ")
            : String(val ?? "");
        });
        return row;
      });
    downloadAsCSV(rows, `${form.title}-submissions`);
  };

  const handleExportJSON = () => {
    const data = filtered.filter((s) => s.data).map((s) => s.data);
    downloadAsJSON(data, `${form.title}-submissions`);
  };

  const renderValue = (fieldId: string, value: unknown) => {
    const field = form.fields.find((f) => f.id === fieldId);
    if (!field) return String(value ?? "");

    if (field.type === "star-rating") {
      return (
        <span className="flex items-center gap-0.5">
          {Array.from({ length: value as number }, (_, i) => (
            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
          ))}
          <span className="ml-1.5 text-[11px] text-muted-foreground">
            {String(value)}/{field.maxRating || 5}
          </span>
        </span>
      );
    }

    if (field.type === "file-upload" && value) {
      return (
        <a
          href={getBlobUrl(value as string)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-primary hover:underline text-[12px]"
        >
          <FileImage className="h-3 w-3" />
          View file
        </a>
      );
    }

    if (Array.isArray(value)) return value.join(", ");
    return String(value ?? "");
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search submissions..."
            className="pl-9 h-10 rounded-lg"
          />
        </div>
        <Button variant="outline" size="sm" className="rounded-lg" onClick={handleExportCSV}>
          <Download className="h-3 w-3 mr-1.5" />
          CSV
        </Button>
        <Button variant="outline" size="sm" className="rounded-lg" onClick={handleExportJSON}>
          <Download className="h-3 w-3 mr-1.5" />
          JSON
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-12 text-[12px] font-medium">#</TableHead>
              <TableHead className="text-[12px] font-medium">Date</TableHead>
              <TableHead className="text-[12px] font-medium">Submitter</TableHead>
              <TableHead className="text-[12px] font-medium">Preview</TableHead>
              <TableHead className="w-24 text-[12px] font-medium">Priority</TableHead>
              {showRewardColumn && (
                <TableHead className="w-32 text-[12px] font-medium">Reward</TableHead>
              )}
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-40">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                      <Inbox className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-[13px] text-muted-foreground">No submissions yet</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {filtered.map((sub, i) => {
              const isExpanded = expanded === sub.blobId;
              const note = notes[sub.blobId];
              const firstTextFieldId = form.fields.find(
                (f) => f.type === "text" || f.type === "textarea" || f.type === "richtext"
              )?.id;
              const preview = sub.data && firstTextFieldId
                ? String(sub.data.responses[firstTextFieldId] || "")
                : sub.encrypted
                  ? null
                  : "-";

              return (
                <TableRow key={sub.blobId} className="group">
                  <TableCell className="font-mono text-[12px] text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="text-[12px]">
                    {sub.data ? formatDate(sub.data.submittedAt) : "-"}
                  </TableCell>
                  <TableCell className="text-[12px]">
                    {sub.data
                      ? sub.data.submitter === "anonymous"
                        ? <span className="text-muted-foreground">Anonymous</span>
                        : <span className="font-mono">{sub.data.submitter.slice(0, 6)}...{sub.data.submitter.slice(-4)}</span>
                      : "-"}
                  </TableCell>
                  <TableCell className="text-[12px] max-w-[220px]">
                    {preview === null ? (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Encrypted
                      </span>
                    ) : (
                      <span className="truncate block">{preview}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {note && (
                      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ${PRIORITY_CONFIG[note.priority]?.bg} ${PRIORITY_CONFIG[note.priority]?.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_CONFIG[note.priority]?.dot}`} />
                        {note.priority}
                      </span>
                    )}
                  </TableCell>
                  {showRewardColumn && (
                    <TableCell>
                      {sub.rewardStatus === "sent" ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Sent
                        </span>
                      ) : !sub.submitterAddress ? (
                        <span className="text-[11px] text-muted-foreground">No wallet</span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] rounded-md"
                          disabled={sendingReward === sub.blobId}
                          onClick={async () => {
                            setSendingReward(sub.blobId);
                            try {
                              await onSendReward!(sub.blobId, sub.submitterAddress!);
                            } finally {
                              setSendingReward(null);
                            }
                          }}
                        >
                          {sendingReward === sub.blobId ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <Coins className="h-3 w-3 mr-1" />
                          )}
                          Send {rewardAmountSui} SUI
                        </Button>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => openNoteSheet(sub.blobId)}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() =>
                          setExpanded(isExpanded ? null : sub.blobId)
                        }
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Expanded detail */}
      {expanded && (() => {
        const sub = submissions.find((s) => s.blobId === expanded);
        if (!sub?.data) return null;
        return (
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border/30 bg-muted/30">
              <h4 className="font-medium text-[13px]">Response Details</h4>
            </div>
            <div className="p-5 space-y-4">
              {form.fields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
                    {field.label || field.id}
                  </p>
                  <div className="text-[13px]">
                    {renderValue(field.id, sub.data!.responses[field.id])}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border/30 bg-muted/20">
              <p className="font-mono text-[11px] text-muted-foreground truncate">
                Blob: {sub.blobId}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Notes sheet */}
      <Sheet open={!!noteSheet} onOpenChange={() => setNoteSheet(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Admin Notes</SheetTitle>
          </SheetHeader>
          <div className="space-y-5 mt-6">
            <div className="space-y-2">
              <label className="text-[13px] font-medium">Priority</label>
              <Select value={notePriority} onValueChange={(v) => v && setNotePriority(v)}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                      Low
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-foreground/50" />
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-400" />
                      High
                    </span>
                  </SelectItem>
                  <SelectItem value="critical">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-400" />
                      Critical
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium">Note</label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add notes about this submission..."
                rows={6}
                className="rounded-lg"
              />
            </div>
            <Button onClick={saveNote} className="w-full rounded-lg">
              Save Note
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
