import { type FieldType } from "./types";

export const WALRUS_PUBLISHER =
  process.env.NEXT_PUBLIC_WALRUS_PUBLISHER ||
  "https://publisher.walrus-testnet.walrus.space";
export const WALRUS_AGGREGATOR =
  process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR ||
  "https://aggregator.walrus-testnet.walrus.space";
export const WALRUS_EPOCHS = Number(
  process.env.NEXT_PUBLIC_WALRUS_EPOCHS || 5
);
export const SUI_NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK ||
  "testnet") as "testnet" | "mainnet";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const FIELD_TYPE_CONFIG: Record<
  FieldType,
  { label: string; icon: string; description: string }
> = {
  text: {
    label: "Short Text",
    icon: "Type",
    description: "Single line text input",
  },
  textarea: {
    label: "Long Text",
    icon: "AlignLeft",
    description: "Multi-line text area",
  },
  richtext: {
    label: "Rich Text",
    icon: "FileText",
    description: "Formatted text with markdown",
  },
  email: { label: "Email", icon: "Mail", description: "Email address input" },
  url: { label: "URL", icon: "Link", description: "Website URL input" },
  number: { label: "Number", icon: "Hash", description: "Numeric input" },
  dropdown: {
    label: "Dropdown",
    icon: "ChevronDown",
    description: "Select from a list",
  },
  checkbox: {
    label: "Checkboxes",
    icon: "CheckSquare",
    description: "Multiple choice selection",
  },
  radio: {
    label: "Radio Buttons",
    icon: "Circle",
    description: "Single choice selection",
  },
  "star-rating": {
    label: "Star Rating",
    icon: "Star",
    description: "Rate with stars",
  },
  "file-upload": {
    label: "File Upload",
    icon: "Upload",
    description: "Upload images or videos",
  },
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
