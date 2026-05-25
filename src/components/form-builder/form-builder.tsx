"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { toast } from "sonner";
import { SlashCommandMenu } from "./field-type-picker";
import { FieldEditor } from "./field-editor";
import { FormSettingsEditor } from "./form-settings";
import type { useFormBuilder } from "@/hooks/use-form-builder";
import { useUserForms } from "@/hooks/use-user-forms";
import { storeJSON } from "@/lib/walrus";
import { enclaveAction } from "@/lib/enclave";
import { buildCreateAllowlistTx } from "@/lib/seal";
import type { FormDefinition } from "@/lib/types";
import type { FieldType } from "@/lib/types";

interface FormBuilderProps {
  formState: ReturnType<typeof useFormBuilder>;
}

export function FormBuilder({ formState }: FormBuilderProps) {
  const router = useRouter();
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { addForm } = useUserForms();
  const {
    title,
    setTitle,
    description,
    setDescription,
    fields,
    settings,
    addField,
    updateField,
    removeField,
    moveField,
    updateSettings,
    isValid,
  } = formState;

  const [publishing, setPublishing] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Slash command menu state
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSlash, setShowSlash] = useState(false);

  const openMenuAt = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      if (!containerRef.current) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom - containerRect.top + 4,
        left: rect.left - containerRect.left,
      });
      setInsertIndex(index);
    },
    []
  );

  const handleMenuSelect = useCallback(
    (type: FieldType) => {
      addField(type);
      setMenuPosition(null);
      setInsertIndex(null);
      setShowSlash(false);
    },
    [addField]
  );

  const handlePublish = async () => {
    if (!account) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!isValid) {
      toast.error("Add a title and at least one field");
      return;
    }

    setPublishing(true);
    try {
      let sealAllowlistId: string | undefined;

      if (settings.encryptSubmissions) {
        toast.info("Creating Seal allowlist on Sui...");
        const tx = buildCreateAllowlistTx();
        const result = await signAndExecute({
          transaction: tx,
        });

        const txResponse = await suiClient.waitForTransaction({
          digest: result.digest,
          options: { showObjectChanges: true },
        });

        const created = txResponse.objectChanges?.find(
          (c) =>
            c.type === "created" &&
            c.objectType.includes("::access::Allowlist")
        );
        if (!created || created.type !== "created") {
          throw new Error("Failed to create Seal allowlist");
        }
        sealAllowlistId = created.objectId;
        toast.success("Seal allowlist created!");
      }

      const formId = crypto.randomUUID();
      const formDef: FormDefinition = {
        id: formId,
        title,
        description,
        owner: account.address,
        createdAt: new Date().toISOString(),
        fields,
        settings: {
          ...settings,
          sealAllowlistId,
        },
      };

      toast.info("Publishing form to Walrus...");
      const formBlobId = await storeJSON(formDef);

      // Register with enclave so dashboard works from any device
      try {
        await enclaveAction("register_form", {
          formId,
          formBlobId,
          ownerWallet: account.address,
          title,
          sealAllowlistId,
          createdAt: formDef.createdAt,
        });
      } catch {
        // Retry once
        await enclaveAction("register_form", {
          formId,
          formBlobId,
          ownerWallet: account.address,
          title,
          sealAllowlistId,
          createdAt: formDef.createdAt,
        }).catch(() => toast.warning("Form saved but enclave registration failed. It may not appear in your dashboard on other devices."));
      }

      addForm({
        formId,
        formBlobId,
        title,
        createdAt: formDef.createdAt,
        submissionCount: 0,
        sealAllowlistId,
      });

      toast.success("Form published to Walrus!");
      router.push(`/dashboard`);
    } catch (error) {
      toast.error(
        `Failed to publish: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setPublishing(false);
    }
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="heading-display text-[clamp(28px,4vw,48px)]">
          Connect your <em className="serif-italic font-normal">wallet</em>
        </div>
        <p className="serif-italic text-[17px] mt-4" style={{ color: "color-mix(in oklab, var(--ink) 60%, transparent)" }}>
          Connect a Sui wallet to start creating forms on Walrus.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Title + description */}
      <div className="pt-7 border-t mt-2" style={{ borderColor: "color-mix(in oklab, var(--ink) 14%, transparent)" }}>
        <div className="mono-label text-[11px] mb-4">&mdash; The composition</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled form"
          className="w-full bg-transparent outline-none p-0"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(36px, 5vw, 72px)",
            lineHeight: 1,
            letterSpacing: "-0.035em",
            color: "var(--ink)",
            border: "none",
          }}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a deck -- italic by default."
          rows={1}
          className="w-full bg-transparent outline-none p-0 mt-4 resize-none"
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(18px, 2vw, 26px)",
            lineHeight: 1.35,
            color: "color-mix(in oklab, var(--ink) 65%, transparent)",
            border: "none",
          }}
        />
      </div>

      {/* Field list */}
      <div className="mt-9">
        <div className="flex justify-between items-baseline pb-3 mb-2 border-b"
             style={{ borderColor: "color-mix(in oklab, var(--ink) 14%, transparent)" }}>
          <span className="mono-label text-[11px]">The questions</span>
          <span className="mono-label text-[11px]">{String(fields.length).padStart(2, "0")} total &middot; drag to reorder</span>
        </div>

        {fields.length === 0 && (
          <div className="py-12 text-center">
            <p className="serif-italic text-[17px]" style={{ color: "color-mix(in oklab, var(--ink) 50%, transparent)" }}>
              No fields yet
            </p>
          </div>
        )}

        {fields.map((field, index) => (
          <div key={field.id}>
            <FieldEditor
              field={field}
              index={index}
              total={fields.length}
              onUpdate={(updates) => updateField(field.id, updates)}
              onRemove={() => removeField(field.id)}
              onMove={(dir) => moveField(field.id, dir)}
              selected={selectedField === field.id}
              onSelect={() =>
                setSelectedField(
                  selectedField === field.id ? null : field.id
                )
              }
            />
          </div>
        ))}

        {/* Add field button */}
        <div className="relative mt-4">
          <button onClick={() => setShowSlash((s) => !s)}
            className="w-full py-5 px-6 rounded-[14px] flex items-center justify-center gap-4 transition-colors"
            style={{
              background: "transparent",
              border: "1.5px dashed color-mix(in oklab, var(--ink) 30%, transparent)",
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "20px",
              color: "color-mix(in oklab, var(--ink) 65%, transparent)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--coral)";
              e.currentTarget.style.color = "var(--coral)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "color-mix(in oklab, var(--ink) 30%, transparent)";
              e.currentTarget.style.color = "color-mix(in oklab, var(--ink) 65%, transparent)";
            }}>
            <span className="mono-label text-[12px]" style={{ color: "inherit" }}>
              {String(fields.length + 1).padStart(2, "0")}
            </span>
            <span>add another question</span>
            <span className="mono-label text-[11px] opacity-50">/</span>
          </button>
          {showSlash && (
            <SlashCommandMenu
              position={{ top: 0, left: 0 }}
              onSelect={handleMenuSelect}
              onClose={() => setShowSlash(false)}
            />
          )}
        </div>
      </div>

      {/* Slash command menu (positioned) */}
      {menuPosition && (
        <SlashCommandMenu
          position={menuPosition}
          onSelect={handleMenuSelect}
          onClose={() => {
            setMenuPosition(null);
            setInsertIndex(null);
          }}
        />
      )}

      {/* Publish strip */}
      <div className="mt-16 p-6 md:p-8 rounded-[18px] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 flex-wrap"
           style={{ background: "var(--ink)", color: "var(--cream)" }}>
        <div>
          <div className="mono-label text-[11px]" style={{ color: "color-mix(in oklab, var(--cream) 55%, transparent)" }}>
            &mdash; Step iv
          </div>
          <div className="mt-1" style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "clamp(22px, 2.5vw, 28px)",
            letterSpacing: "-0.025em",
          }}>
            Ready to <em className="serif-italic font-normal" style={{ color: "var(--coral)" }}>pin it</em> to Walrus?
          </div>
          <div className="text-[13px] mt-1.5" style={{ color: "color-mix(in oklab, var(--cream) 60%, transparent)" }}>
            {settings.encryptSubmissions ? "Seal encryption ON" : "Public"} &middot; {fields.length} fields
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSettingsOpen((s) => !s)}
            className="px-5 py-3 rounded-full text-[14px] font-semibold transition-colors"
            style={{
              background: "transparent",
              color: "var(--cream)",
              border: "1px solid color-mix(in oklab, var(--cream) 30%, transparent)",
              fontFamily: "var(--font-body)",
            }}>
            Settings
          </button>
          <button onClick={handlePublish}
            disabled={!isValid || publishing}
            className="px-5 py-3 rounded-full text-[14px] font-semibold inline-flex items-center gap-2 transition-all disabled:opacity-50"
            style={{
              background: "var(--coral)",
              color: "var(--ink)",
              border: "none",
              fontFamily: "var(--font-body)",
            }}>
            {publishing ? "Publishing..." : "Publish to Walrus"}
            <span>&#8599;</span>
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {settingsOpen && (
        <div className="mt-6 p-7 rounded-[18px]"
             style={{
               background: "var(--cream-deep)",
               border: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)",
             }}>
          <div className="flex justify-between items-baseline mb-5">
            <span className="mono-label text-[11px]">&mdash;&mdash; form settings</span>
            <button onClick={() => setSettingsOpen(false)} className="mono-label text-[11px]">close</button>
          </div>
          <FormSettingsEditor settings={settings} onUpdate={updateSettings} />
        </div>
      )}
    </div>
  );
}
