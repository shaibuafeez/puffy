# Walform

**Decentralized forms powered by Walrus, Seal, and Sui.**

> Live: [https://tictac.wal.app](https://tictac.wal.app)

Walform is a fully decentralized form builder and data collection platform. Forms and submissions are stored on **Walrus**, responses are end-to-end encrypted with **Seal**, and the entire frontend is hosted as a **Walrus Site** — no centralized servers involved.

---

## Architecture

```
+------------------+     +-------------------+     +------------------+
|   Walrus Sites   |     |  Nautilus Enclave  |     |   Walrus Storage |
|  (Static React)  |---->|  (AWS Nitro TEE)   |---->|  (Forms & Data)  |
+------------------+     +-------------------+     +------------------+
        |                        |                         |
        v                        v                         v
  Users interact           AI generation            Decentralized blobs
  via browser              Twitter bot              for forms, submissions,
                           Submission tracking      and file uploads
                           OAuth flows

+------------------+     +-------------------+
|    Seal (Sui)    |     |   Sui Blockchain   |
|   Encryption     |     |   Allowlist Mgmt   |
+------------------+     +-------------------+
```

**Frontend** — Next.js static export deployed on Walrus Sites. Zero backend dependencies.

**Enclave** — Rust server running inside an AWS Nitro Enclave (TEE). Handles AI form generation, Twitter bot polling, OAuth, and submission tracking. Secrets never leave the enclave.

**Storage** — All form definitions and submissions are stored as Walrus blobs. Encrypted submissions use Seal so only the form owner can decrypt.

**Smart Contract** — Move module on Sui manages Seal encryption allowlists for access control.

---

## Features

### Form Builder
- **11 field types** — text, textarea, rich text, email, URL, number, dropdown, checkbox, radio, star rating, file upload
- **AI generation** — Describe a form in natural language, AI generates the full structure via Huru LLM
- **Slash command menu** — Keyboard-first field picker inspired by Notion
- **Live preview** — Real-time Typeform-style preview as you build
- **Brand theming** — Custom colors, fonts, and logo upload
- **Webhooks** — POST submissions to external URLs on submit

### Encryption & Privacy
- **Seal encryption** — End-to-end encrypted submissions using Seal on Sui
- **On-chain allowlists** — Move smart contract controls decryption access
- **Wallet-gated decryption** — Only the form owner's wallet can decrypt responses
- **Optional anonymous mode** — Allow submissions without wallet connection

### Data Storage
- **Walrus blob storage** — Forms and submissions stored on decentralized Walrus network
- **No central database** — Form definitions are immutable Walrus blobs
- **Client-side index** — User's form list stored in localStorage + enclave sync

### Rewards
- **SUI token rewards** — Incentivize respondents with per-submission SUI payments
- **On-chain transfers** — Direct wallet-to-wallet reward distribution
- **Dashboard tracking** — Track reward status (pending/sent) per submission

### Twitter/X Bot
- **Tweet-to-form** — Mention the bot on X with a form description, get a form link reply
- **AI parsing** — Tweets are parsed by Huru AI into structured form definitions
- **OAuth linking** — Link X account to Sui wallet via OAuth 2.0 PKCE flow
- **Auto-polling** — Bot checks for new mentions every 30 seconds

### Deployment
- **Walrus Sites hosting** — Entire frontend deployed as a Walrus Site (no Vercel/AWS)
- **SPA routing** — `ws-resources.json` routes all paths to `index.html`
- **Static export** — `next build` produces pure static files, no server required

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React, TypeScript, Tailwind CSS, shadcn/ui |
| Wallet | @mysten/dapp-kit, Sui wallet adapters |
| Storage | Walrus (blobs for forms, submissions, file uploads) |
| Encryption | Seal on Sui (allowlist-based access control) |
| Smart Contract | Move (Sui) — `walform_seal::access` |
| Backend | Rust (axum) inside AWS Nitro Enclave |
| AI | Huru AI (OpenAI-compatible API) |
| Hosting | Walrus Sites (mainnet) |
| Bot | Twitter API v2 (OAuth 2.0 PKCE, mentions polling) |

---

## Project Structure

```
walform/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── page.tsx            # Landing page
│   │   ├── create/             # Form builder
│   │   ├── form/[formBlobId]/  # Form submission (public)
│   │   ├── dashboard/          # Form management
│   │   │   └── [formId]/       # Submission viewer + decryption
│   │   └── link-twitter/       # X account linking
│   ├── components/
│   │   ├── form-builder/       # Builder UI (editor, picker, preview, settings, AI)
│   │   ├── form-renderer/      # Submission UI (field renderer, file upload, ratings)
│   │   ├── dashboard/          # Dashboard UI (form cards, submission table)
│   │   ├── wallet/             # Sui wallet provider + connect button
│   │   └── ui/                 # shadcn/ui components
│   ├── hooks/                  # useFormBuilder, useUserForms
│   └── lib/                    # Core utilities
│       ├── walrus.ts           # Walrus blob read/write
│       ├── seal.ts             # Seal encrypt/decrypt + allowlist
│       ├── enclave.ts          # Enclave API client
│       ├── types.ts            # TypeScript type definitions
│       └── ...
├── enclave/                    # Nautilus enclave (Rust)
│   ├── main.rs                 # Axum server setup + config
│   ├── mod.rs                  # Action router (12 endpoints)
│   ├── llm.rs                  # Huru AI integration (tweet + prompt parsing)
│   ├── twitter.rs              # Twitter API client (OAuth, mentions, replies)
│   ├── db.rs                   # SQLite (accounts, forms, submissions, notes)
│   ├── types.rs                # Rust type definitions (mirrors frontend)
│   ├── walrus.rs               # Walrus blob storage from Rust
│   ├── Containerfile           # Enclave build (Docker → EIF)
│   └── Makefile                # Build + run commands
├── move/
│   └── walform_seal/
│       └── sources/access.move # Seal allowlist smart contract
└── next.config.ts              # Static export configuration
```

---

## How It Works

### 1. Create a Form
Connect your Sui wallet, then either:
- **Manual** — Use the slash-command block editor to add fields
- **AI** — Describe what you need in natural language, AI generates the form

### 2. Publish
The form definition is serialized to JSON and stored as a Walrus blob. If encryption is enabled, a Seal allowlist is created on Sui first. The form gets a unique blob ID that becomes its URL.

### 3. Share
Share the link (`https://tictac.wal.app/form/{blobId}`). Respondents fill out the form in a step-by-step Typeform-style flow. Submissions are stored on Walrus (encrypted if enabled) and registered with the enclave.

### 4. Analyze
The form owner views submissions in the dashboard. Encrypted submissions are decrypted client-side using the Seal protocol (requires wallet signature). Owners can add notes, send SUI rewards, and export data.

### Tweet Flow
```
User tweets @bot "create a hackathon signup form"
  → Enclave polls Twitter mentions
  → Huru AI parses tweet into form definition
  → Form stored on Walrus
  → Bot replies with form link
```

---

## Walrus Integration

Walform uses Walrus for **three distinct purposes**:

1. **Form storage** — `storeJSON(formDefinition)` → returns `blobId` used as the form URL
2. **Submission storage** — Responses (optionally Seal-encrypted) stored as blobs
3. **File uploads** — User-uploaded files (images, documents) stored directly on Walrus
4. **Site hosting** — The entire frontend is a Walrus Site (object `0x994b...f4d`)

All Walrus operations use the public publisher/aggregator endpoints — no authentication needed for reads.

---

## Seal Encryption Flow

```
Publish (encryption enabled):
  1. Create Allowlist on Sui (walform_seal::access::new_allowlist)
  2. Form owner's address added to allowlist automatically
  3. allowlistObjectId saved in FormDefinition.settings

Submit (encrypted form):
  1. Serialize submission to bytes
  2. sealEncrypt(data, allowlistObjectId) → encrypted blob
  3. Store encrypted blob on Walrus

Decrypt (dashboard):
  1. Fetch encrypted blob from Walrus
  2. sealDecrypt(data, allowlistObjectId, wallet signature)
  3. Seal key servers verify sender is in allowlist (seal_approve)
  4. Decrypted data displayed in dashboard
```

---

## Environment Variables

```bash
NEXT_PUBLIC_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
NEXT_PUBLIC_WALRUS_EPOCHS=5
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_BOT_API_URL=http://<enclave-ip>:3000
NEXT_PUBLIC_APP_URL=https://tictac.wal.app
```

---

## Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build static export
npm run build

# Serve static build locally
npx serve out
```

---

## Deployment

### Frontend (Walrus Sites)

```bash
# Build static site
npm run build

# Add SPA routing config
echo '{"routes":{"/*":"/index.html"}}' > out/ws-resources.json

# Deploy to Walrus Sites
site-builder --context mainnet publish ./out --epochs 5
```

### Enclave (AWS Nitro)

```bash
# Build enclave image
make ENCLAVE_APP=walform

# Start enclave
sudo make run

# Expose ports + inject secrets
bash expose_enclave.sh
```

---

## Smart Contract

The `walform_seal::access` Move module manages encryption access control:

```move
// Create an allowlist (form owner)
entry fun new_allowlist(ctx: &mut TxContext)

// Grant decryption access
entry fun add_address(list: &mut Allowlist, addr: address)

// Seal key server verification
entry fun seal_approve(id: vector<u8>, list: &Allowlist, ctx: &TxContext)
```

Published on Sui testnet: `0x52a93a59870a877eda57ad623f9d56c3e10cc36017e73bc0da8564a1dbe31106`

---

## Enclave API

All enclave actions go through `POST /process_data`:

| Action | Description |
|--------|------------|
| `generate_form` | AI form generation from natural language prompt |
| `register_submission` | Track new form submission |
| `get_submissions` | List submissions for a form |
| `update_reward` | Mark reward as sent with tx digest |
| `save_note` | Admin notes on submissions |
| `get_notes` | Retrieve notes for a form |
| `get_forms` | List bot-created forms by wallet |
| `get_account` | Get linked X account for wallet |
| `link` / `unlink` | X account ↔ wallet linking |
| `poll_status` | Bot health check |

Twitter OAuth routes: `GET /twitter/auth`, `GET /twitter/callback`

---

## License

MIT
