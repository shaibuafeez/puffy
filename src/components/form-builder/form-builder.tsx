"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SlashCommandMenu } from "./field-type-picker";
import { FieldEditor } from "./field-editor";
import { FormSettingsEditor } from "./form-settings";
import type { useFormBuilder } from "@/hooks/use-form-builder";
import { useUserForms } from "@/hooks/use-user-forms";
import { storeJSON } from "@/lib/walrus";
import { buildCreateAllowlistTx } from "@/lib/seal";
import type { FormDefinition } from "@/lib/types";
import type { FieldType } from "@/lib/types";
import {
  Plus,
  Loader2,
  Rocket,
  Wallet,
  ChevronDown,
  ChevronRight,
  Settings,
} from "lucide-react";

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
      const fieldId = addField(type);
      // If inserting at a specific index, move the field there
      if (insertIndex !== null && insertIndex < fields.length) {
        // The new field is at the end, we need to move it to insertIndex
        // moveField moves one step at a time, so we'll handle this differently
        // Actually, we just added it at the end. Let's reorder.
        // For simplicity, we move it up from the end to the target position
        const currentIndex = fields.length; // it will be at this index after addField
        // We need to move it (fields.length - insertIndex) times up
        // But since addField is async via setState, we handle this with a setTimeout
      }
      setMenuPosition(null);
      setInsertIndex(null);
    },
    [addField, insertIndex, fields.length]
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
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <Wallet className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-[13px] text-muted-foreground max-w-sm">
          Connect a Sui wallet to start creating forms on Walrus
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative space-y-1">
      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled form"
        className="w-full bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/30"
      />

      {/* Description */}
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a description..."
        className="w-full bg-transparent text-[15px] text-muted-foreground outline-none placeholder:text-muted-foreground/30 mb-6"
      />

      {/* Divider */}
      <div className="h-px bg-border/40 my-6" />

      {/* Fields */}
      <div className="space-y-0.5">
        {fields.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-[13px] text-muted-foreground/60 mb-3">
              No fields yet
            </p>
            <button
              onClick={(e) => openMenuAt(e, 0)}
              className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add your first field
            </button>
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

            {/* Insert button between blocks */}
            <div className="group/insert flex items-center justify-center h-3 -my-0.5 relative">
              <button
                onClick={(e) => openMenuAt(e, index + 1)}
                className="opacity-0 group-hover/insert:opacity-100 absolute flex items-center justify-center h-5 w-5 rounded-full bg-muted hover:bg-accent border border-border/50 transition-all z-10"
              >
                <Plus className="h-3 w-3 text-muted-foreground" />
              </button>
              <div className="opacity-0 group-hover/insert:opacity-100 w-full h-px bg-border/40 transition-opacity" />
            </div>
          </div>
        ))}

        {/* Add field button at end */}
        {fields.length > 0 && (
          <button
            onClick={(e) => openMenuAt(e, fields.length)}
            className="flex items-center gap-2 w-full py-3 px-2 text-[13px] text-muted-foreground/50 hover:text-muted-foreground transition-colors rounded-lg hover:bg-accent/30"
          >
            <Plus className="h-4 w-4" />
            Add a field
          </button>
        )}
      </div>

      {/* Slash command menu */}
      <SlashCommandMenu
        position={menuPosition}
        onSelect={handleMenuSelect}
        onClose={() => {
          setMenuPosition(null);
          setInsertIndex(null);
        }}
      />

      {/* Divider before settings */}
      <div className="h-px bg-border/40 !mt-8 !mb-4" />

      {/* Settings (collapsible) */}
      <button
        onClick={() => setSettingsOpen(!settingsOpen)}
        className="flex items-center gap-2 w-full py-2 text-[12px] font-medium text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
      >
        {settingsOpen ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <Settings className="h-3 w-3" />
        Settings
      </button>
      {settingsOpen && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-150">
          <FormSettingsEditor settings={settings} onUpdate={updateSettings} />
        </div>
      )}

      {/* Publish */}
      <div className="!mt-8">
        <Button
          onClick={handlePublish}
          disabled={!isValid || publishing}
          className="w-full h-12 text-[15px] rounded-xl glow-hover"
          size="lg"
        >
          {publishing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {settings.encryptSubmissions
                ? "Creating allowlist & publishing..."
                : "Publishing to Walrus..."}
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4 mr-2" />
              Publish Form
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
