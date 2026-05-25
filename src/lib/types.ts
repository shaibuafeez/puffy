export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "email"
  | "url"
  | "number"
  | "dropdown"
  | "checkbox"
  | "radio"
  | "star-rating"
  | "file-upload"
  | "confirm";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[];
  maxRating?: number;
  acceptTypes?: string[];
  maxFileSize?: number;
}

export type FontFamily =
  | "inter"
  | "roboto"
  | "space-grotesk"
  | "dm-sans"
  | "plus-jakarta";

export interface FormTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: FontFamily;
  logoBlobId?: string;
}

export interface FormSettings {
  encryptSubmissions: boolean;
  encryptionHint?: string;
  /** Seal allowlist object ID for decryption access control */
  sealAllowlistId?: string;
  allowAnonymous: boolean;
  submitMessage: string;
  theme?: FormTheme;
  webhookUrl?: string;
  rewardEnabled?: boolean;
  rewardAmountSui?: number;
}

export interface FormDefinition {
  id: string;
  title: string;
  description: string;
  owner: string;
  createdAt: string;
  fields: FormField[];
  settings: FormSettings;
  tweetUrl?: string;
  tweetAuthor?: string;
}

export interface FormSubmission {
  formId: string;
  formBlobId: string;
  submittedAt: string;
  submitter: string;
  responses: Record<string, unknown>;
}

export interface AdminNote {
  note: string;
  priority: "low" | "medium" | "high" | "critical";
  createdAt: string;
  updatedAt: string;
}

export interface UserFormEntry {
  formId: string;
  formBlobId: string;
  title: string;
  createdAt: string;
  submissionCount: number;
  sealAllowlistId?: string;
}

export interface UserIndex {
  owner: string;
  forms: UserFormEntry[];
}

export interface WalrusStoreResponse {
  newlyCreated?: {
    blobObject: {
      blobId: string;
      id: string;
      size: number;
    };
  };
  alreadyCertified?: {
    blobId: string;
    endEpoch: number;
    event: { txDigest: string };
  };
}

export interface SubmissionEntry {
  submissionBlobId: string;
  submittedAt: string;
  encrypted?: boolean;
  submitterAddress?: string;
  rewardStatus?: "pending" | "sent";
  rewardTxDigest?: string;
}
