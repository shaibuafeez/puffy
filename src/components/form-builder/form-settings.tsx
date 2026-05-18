"use client";

import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { storeFile, getBlobUrl } from "@/lib/walrus";
import type { FormSettings, FormTheme, FontFamily } from "@/lib/types";
import {
  Shield,
  Users,
  MessageSquare,
  Palette,
  Webhook,
  Upload,
  X,
  Loader2,
  Image,
  Coins,
} from "lucide-react";
import { toast } from "sonner";

const FONT_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: "inter", label: "Inter" },
  { value: "roboto", label: "Roboto" },
  { value: "space-grotesk", label: "Space Grotesk" },
  { value: "dm-sans", label: "DM Sans" },
  { value: "plus-jakarta", label: "Plus Jakarta Sans" },
];

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

  return (
    <div className="space-y-3 py-2">
      {/* Encryption toggle */}
      <div className="flex items-center justify-between py-1.5">
        <div className="flex items-center gap-2.5">
          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <Label htmlFor="encrypt" className="text-[13px] font-medium">
              Seal Encryption
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Encrypt submissions on-chain
            </p>
          </div>
        </div>
        <Switch
          id="encrypt"
          checked={settings.encryptSubmissions}
          onCheckedChange={(checked) =>
            onUpdate({ encryptSubmissions: checked })
          }
        />
      </div>

      {settings.encryptSubmissions && (
        <div className="ml-6 rounded-lg bg-muted/50 p-3">
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            A Seal allowlist will be created on Sui when you publish. Only your
            wallet can decrypt submissions.
          </p>
        </div>
      )}

      {/* Anonymous toggle */}
      <div className="flex items-center justify-between py-1.5">
        <div className="flex items-center gap-2.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <Label htmlFor="anonymous" className="text-[13px] font-medium">
              Allow Anonymous
            </Label>
            <p className="text-[11px] text-muted-foreground">
              No wallet required to submit
            </p>
          </div>
        </div>
        <Switch
          id="anonymous"
          checked={settings.allowAnonymous}
          onCheckedChange={(checked) =>
            onUpdate({ allowAnonymous: checked })
          }
        />
      </div>

      {/* Submit message */}
      <div className="space-y-2 py-1.5">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <Label className="text-[13px] font-medium">Submit Message</Label>
            <p className="text-[11px] text-muted-foreground">
              Shown after form submission
            </p>
          </div>
        </div>
        <input
          type="text"
          value={settings.submitMessage}
          onChange={(e) => onUpdate({ submitMessage: e.target.value })}
          placeholder="Thank you for your submission!"
          className="w-full ml-6 bg-transparent text-[13px] outline-none border-b border-border/30 pb-1.5 placeholder:text-muted-foreground/40 focus:border-border transition-colors"
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-border/30 !my-4" />

      {/* Brand Theming */}
      <div className="space-y-3 py-1.5">
        <div className="flex items-center gap-2.5">
          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <Label className="text-[13px] font-medium">Brand Theming</Label>
            <p className="text-[11px] text-muted-foreground">
              Customize the look of your public form
            </p>
          </div>
        </div>

        <div className="ml-6 space-y-3">
          {/* Colors row */}
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">
                Accent
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={theme.primaryColor || "#ffffff"}
                  onChange={(e) =>
                    updateTheme({ primaryColor: e.target.value })
                  }
                  className="h-7 w-7 rounded-md border border-border/50 cursor-pointer bg-transparent p-0.5"
                />
                {theme.primaryColor && (
                  <button
                    onClick={() => updateTheme({ primaryColor: undefined })}
                    className="text-muted-foreground/50 hover:text-muted-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">
                Background
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={theme.backgroundColor || "#0a0a0a"}
                  onChange={(e) =>
                    updateTheme({ backgroundColor: e.target.value })
                  }
                  className="h-7 w-7 rounded-md border border-border/50 cursor-pointer bg-transparent p-0.5"
                />
                {theme.backgroundColor && (
                  <button
                    onClick={() =>
                      updateTheme({ backgroundColor: undefined })
                    }
                    className="text-muted-foreground/50 hover:text-muted-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground">Text</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={theme.textColor || "#f2f2f2"}
                  onChange={(e) =>
                    updateTheme({ textColor: e.target.value })
                  }
                  className="h-7 w-7 rounded-md border border-border/50 cursor-pointer bg-transparent p-0.5"
                />
                {theme.textColor && (
                  <button
                    onClick={() => updateTheme({ textColor: undefined })}
                    className="text-muted-foreground/50 hover:text-muted-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Font selector */}
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Font</label>
            <select
              value={theme.fontFamily || ""}
              onChange={(e) =>
                updateTheme({
                  fontFamily: (e.target.value || undefined) as
                    | FontFamily
                    | undefined,
                })
              }
              className="w-full h-8 rounded-md border border-border/50 bg-transparent text-[12px] px-2 outline-none focus:border-border transition-colors"
            >
              <option value="">Default (Inter)</option>
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Logo upload */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted-foreground">Logo</label>
            {theme.logoBlobId ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg border border-border/50 overflow-hidden bg-muted flex items-center justify-center">
                  <img
                    src={getBlobUrl(theme.logoBlobId)}
                    alt="Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <button
                  onClick={() => updateTheme({ logoBlobId: undefined })}
                  className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {uploadingLogo ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Image className="h-3 w-3" />
                )}
                {uploadingLogo ? "Uploading..." : "Upload logo"}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border/30 !my-4" />

      {/* Webhook */}
      <div className="space-y-2 py-1.5">
        <div className="flex items-center gap-2.5">
          <Webhook className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <Label className="text-[13px] font-medium">Webhook</Label>
            <p className="text-[11px] text-muted-foreground">
              POST submission data to an external URL
            </p>
          </div>
        </div>
        <input
          type="url"
          value={settings.webhookUrl || ""}
          onChange={(e) => onUpdate({ webhookUrl: e.target.value || undefined })}
          placeholder="https://example.com/webhook"
          className="w-full ml-6 bg-transparent text-[13px] font-mono outline-none border-b border-border/30 pb-1.5 placeholder:text-muted-foreground/40 focus:border-border transition-colors"
        />
        {settings.webhookUrl && (
          <p className="ml-6 text-[11px] text-muted-foreground">
            Each submission will be POSTed as JSON to this URL
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-border/30 !my-4" />

      {/* Reward Respondents */}
      <div className="space-y-2 py-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Coins className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <Label htmlFor="reward" className="text-[13px] font-medium">
                Reward Respondents
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Send SUI tokens to respondents
              </p>
            </div>
          </div>
          <Switch
            id="reward"
            checked={settings.rewardEnabled || false}
            onCheckedChange={(checked) => {
              const updates: Partial<FormSettings> = { rewardEnabled: checked };
              if (checked) {
                if (!settings.rewardAmountSui) updates.rewardAmountSui = 0.1;
                updates.allowAnonymous = false;
              }
              onUpdate(updates);
            }}
          />
        </div>
        {settings.rewardEnabled && (
          <div className="ml-6 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={settings.rewardAmountSui ?? 0.1}
                onChange={(e) =>
                  onUpdate({
                    rewardAmountSui: parseFloat(e.target.value) || 0.1,
                  })
                }
                className="w-24 bg-transparent text-[13px] outline-none border-b border-border/30 pb-1.5 focus:border-border transition-colors tabular-nums"
              />
              <span className="text-[12px] text-muted-foreground">
                SUI per response
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              You will send rewards from the dashboard after reviewing each
              submission.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
