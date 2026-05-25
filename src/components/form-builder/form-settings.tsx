"use client";

import { useState, useRef } from "react";
import { storeFile, getBlobUrl } from "@/lib/walrus";
import type { FormSettings, FormTheme, FontFamily } from "@/lib/types";
import { toast } from "sonner";

const FONT_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: "inter", label: "Inter" },
  { value: "roboto", label: "Roboto" },
  { value: "space-grotesk", label: "Space Grotesk" },
  { value: "dm-sans", label: "DM Sans" },
  { value: "plus-jakarta", label: "Plus Jakarta Sans" },
];

const BRAND_COLORS = ["#f15b3b", "#0a3a3a", "#d6a04b", "#7c5cff", "#0b0f17"];

interface FormSettingsEditorProps {
  settings: FormSettings;
  onUpdate: (updates: Partial<FormSettings>) => void;
}

export function FormSettingsEditor({
  settings,
  onUpdate,
}: FormSettingsEditorProps) {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const theme = settings.theme || {};

  const updateTheme = (updates: Partial<FormTheme>) => {
    onUpdate({ theme: { ...theme, ...updates } });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const blobId = await storeFile(file);
      updateTheme({ logoBlobId: blobId });
      toast.success("Logo uploaded");
    } catch {
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "8px",
    background: "var(--cream)",
    border: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)",
    fontFamily: "var(--font-mono)",
    fontSize: "12.5px",
    color: "var(--ink)",
    outline: "none",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Brand color */}
      <SettingRow label="Brand color" hint="Used in the live form theme">
        <div className="flex gap-2">
          {BRAND_COLORS.map((c) => (
            <button key={c} onClick={() => updateTheme({ primaryColor: c })}
              className="w-[30px] h-[30px] rounded-lg"
              style={{
                background: c,
                border: theme.primaryColor === c ? "2px solid var(--ink)" : "2px solid transparent",
                outline: "1px solid rgba(0,0,0,0.1)",
              }} />
          ))}
        </div>
      </SettingRow>

      {/* Seal encryption */}
      <SettingRow label="Seal encryption" hint="Threshold encryption - default on">
        <ToggleV2
          v={settings.encryptSubmissions}
          on={() => onUpdate({ encryptSubmissions: !settings.encryptSubmissions })}
        />
      </SettingRow>

      {/* Reward per submission */}
      <SettingRow label="Reward per submission" hint="Disbursed to wallet after review">
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={settings.rewardAmountSui ?? 0}
            onChange={(e) =>
              onUpdate({
                rewardEnabled: parseFloat(e.target.value) > 0,
                rewardAmountSui: parseFloat(e.target.value) || 0,
              })
            }
            style={inputStyle}
            className="!w-24"
          />
          <span className="mono-label text-[11px]">SUI</span>
        </div>
      </SettingRow>

      {/* Webhook URL */}
      <SettingRow label="Webhook URL" hint="Submission events POST here">
        <input
          type="url"
          value={settings.webhookUrl || ""}
          onChange={(e) => onUpdate({ webhookUrl: e.target.value || undefined })}
          placeholder="https://hooks...."
          style={inputStyle}
        />
      </SettingRow>

      {/* Anonymous */}
      <SettingRow label="Allow anonymous" hint="No wallet required">
        <ToggleV2
          v={settings.allowAnonymous}
          on={() => onUpdate({ allowAnonymous: !settings.allowAnonymous })}
        />
      </SettingRow>

      {/* Submit message */}
      <SettingRow label="Submit message" hint="Shown after form submission">
        <input
          type="text"
          value={settings.submitMessage}
          onChange={(e) => onUpdate({ submitMessage: e.target.value })}
          placeholder="Thank you for your submission!"
          style={inputStyle}
        />
      </SettingRow>

      {/* Font */}
      <SettingRow label="Font family" hint="For the public form view">
        <select
          value={theme.fontFamily || ""}
          onChange={(e) =>
            updateTheme({
              fontFamily: (e.target.value || undefined) as FontFamily | undefined,
            })
          }
          style={{ ...inputStyle, height: "34px" }}>
          <option value="">Default (Inter)</option>
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </SettingRow>

      {/* Logo */}
      <SettingRow label="Logo" hint="Shown on the public form">
        {theme.logoBlobId ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg overflow-hidden flex items-center justify-center"
                 style={{ border: "1px solid color-mix(in oklab, var(--ink) 14%, transparent)", background: "var(--cream)" }}>
              <img src={getBlobUrl(theme.logoBlobId)} alt="Logo" className="h-full w-full object-contain" />
            </div>
            <button onClick={() => updateTheme({ logoBlobId: undefined })}
              className="mono-label text-[11px]" style={{ color: "var(--coral)" }}>
              remove
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingLogo}
            className="mono-label text-[11px] disabled:opacity-50"
            style={{ color: "var(--coral)" }}>
            {uploadingLogo ? "uploading..." : "+ upload logo"}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
      </SettingRow>
    </div>
  );
}

function SettingRow({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px" }}>{label}</span>
        <span className="mono-label text-[10px] opacity-50">{hint}</span>
      </div>
      {children}
    </div>
  );
}

function ToggleV2({ v, on }: { v: boolean; on: () => void }) {
  return (
    <button onClick={on}
      className="relative w-[44px] h-[26px] rounded-full transition-colors"
      style={{ background: v ? "var(--ink)" : "rgba(0,0,0,0.18)" }}>
      <span className="absolute top-[3px] w-5 h-5 rounded-full transition-[left]"
            style={{
              left: v ? "21px" : "3px",
              background: v ? "var(--coral)" : "var(--cream)",
            }} />
    </button>
  );
}
