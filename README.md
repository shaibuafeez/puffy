<div align="center">

# Puffy

**forms worth keeping.**

[![Sui](https://img.shields.io/badge/Sui-Mainnet-4DA2FF?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEwIiBmaWxsPSIjNERBMkZGIi8+PC9zdmc+)](https://sui.io)
[![Walrus](https://img.shields.io/badge/Walrus-Storage-F15B3B?style=flat-square)](https://walrus.xyz)
[![Seal](https://img.shields.io/badge/Seal-Encrypted-0A3A3A?style=flat-square)](https://docs.seal.mystenlabs.com)
[![Nautilus](https://img.shields.io/badge/Nautilus-TEE-0B0F17?style=flat-square)](https://docs.nautilus.sh)
[![License](https://img.shields.io/badge/License-MIT-f3ecdc?style=flat-square)](#license)

[Live App](https://puffyforms.wal.app) &middot; [Demo Video](https://puffyforms.wal.app) &middot; [Tweet @puffy](https://x.com/puffy)

---

*Tweet us a form idea. We'll build it, encrypt it, and send it back — in seconds.*

*No server ever sees your data in plaintext.*

</div>

---

## The Problem

Every form you've ever filled out — job applications, medical intake, feedback surveys — lives on someone else's server. Google's, Typeform's, a startup you've never heard of. You hand over personal data and *hope* they handle it well.

Form builders have a trust problem. Puffy eliminates it.

---

## What Puffy Does

Puffy is a decentralized form builder where **submissions are encrypted end-to-end**, **stored on Walrus**, and **only readable by the form owner**. No intermediaries. No plaintext at rest. Just cryptography.

**Three ways to create a form:**

| Method | How it works |
|--------|-------------|
| **Tweet it** | Mention `@puffy` on X — *"bug report with severity levels"* — and we reply with a live, encrypted form |
| **Say it** | Type one sentence in the builder — *"hackathon registration with team size"* — and AI generates it |
| **Build it** | Use the slash-command editor with 11 field types, theming, and live preview |

Every form is stored on Walrus. Every submission is encrypted with Seal. Every secret stays inside a Nautilus TEE.

---

## How It Works

```
You                          Puffy                         Walrus / Sui
 │                             │                              │
 ├── tweet @puffy ────────────▶│                              │
 │   "NPS survey for            │── AI parses tweet ──────────│
 │    SDK users"                │   (inside Nautilus TEE)      │
 │                              │                              │
 │                              │── store form blob ─────────▶│ Walrus
 │                              │                              │
 │◀── reply with form link ────│                              │
 │                              │                              │
 │                              │                              │
 │  respondent fills form       │                              │
 ├─────────────────────────────▶│                              │
 │                              │── Seal encrypt ────────────▶│ Sui + Walrus
 │                              │   (2-of-2 threshold)         │
 │                              │                              │
 │  form owner decrypts         │                              │
 ├── wallet signature ────────▶│                              │
 │                              │── Seal decrypt ◀────────────│ key servers
 │◀── plaintext response ─────│                              │
 │   (client-side only)         │                              │
```

**0% of submissions pass through us.** Encryption and decryption happen client-side. The Nautilus TEE handles AI generation and X bot logic — but never touches response data.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        WALRUS SITES                             │
│              Static Next.js app — no backend                    │
│         Form builder · Form renderer · Dashboard                │
└──────────────┬──────────────────────────┬───────────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────┐    ┌──────────────────────────────┐
│    NAUTILUS TEE       │    │         WALRUS STORAGE        │
│                       │    │                               │
│  AI form generation   │───▶│  Form definitions (JSON)     │
│  X bot polling        │    │  Submissions (Seal-encrypted) │
│  OAuth flows          │    │  File uploads                 │
│  Submission tracking  │    │  Site hosting                 │
│                       │    │                               │
│  No plaintext at rest │    │  Decentralized blobs          │
└───────────────────────┘    └──────────────────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────┐    ┌──────────────────────────────┐
│    SEAL (SUI)         │    │       SUI BLOCKCHAIN          │
│                       │    │                               │
│  2-of-2 threshold     │    │  Allowlist smart contracts    │
│  encryption           │    │  SUI token rewards            │
│  Key server verify    │    │  Wallet-gated access          │
└───────────────────────┘    └──────────────────────────────┘
```

---

## Features

### Tweet-to-Form
Mention `@puffy` on X with what you need. Our Nautilus enclave polls for mentions, parses your tweet with AI, generates a structured form, stores it on Walrus, and replies with a shareable link. Link your X account to your Sui wallet via OAuth 2.0 PKCE to manage forms from the dashboard.

### AI Generation
Describe any form in one sentence. The AI (Huru LLM, running inside the TEE) generates the complete structure — fields, types, validation, labels. Works from both the web UI and X mentions.

### Seal Encryption
Every submission is encrypted client-side using Seal's threshold encryption (2-of-2 key servers on Sui). The form owner creates an on-chain allowlist via a Move smart contract. Only wallets on the allowlist can decrypt. No one else — not Puffy, not Walrus, not anyone — can read responses.

### Walrus Storage
Forms, submissions, file uploads, and the entire frontend are stored on Walrus. No central database. No S3 buckets. Form definitions are immutable blobs — the blob ID *is* the URL.

### Nautilus TEE
The backend runs inside a Nautilus Trusted Execution Environment. AI inference, X bot logic, OAuth tokens, and submission tracking all happen in an enclave where secrets are hardware-isolated. Nothing leaks.

### SUI Rewards
Incentivize respondents with per-submission SUI payments. Direct wallet-to-wallet transfers. Track reward status from the dashboard.

### Form Builder
11 field types (text, email, URL, number, dropdown, checkbox, radio, star rating, file upload, rich text, textarea). Slash-command menu. Live Typeform-style preview. Custom theming. Webhook integrations.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui |
| Wallet | @mysten/dapp-kit · Sui wallet adapters |
| Storage | Walrus (forms, submissions, files, site hosting) |
| Encryption | Seal on Sui · @mysten/seal · 2-of-2 threshold |
| Smart Contract | Move on Sui — `walform_seal::access` |
| TEE | Nautilus (Rust / Axum) |
| AI | Huru LLM (OpenAI-compatible, runs inside TEE) |
| Hosting | Walrus Sites (mainnet) |
| Bot | X API v2 · OAuth 2.0 PKCE · mentions polling |

---

## Walrus Integration

Puffy is built *on* Walrus, not just *with* it. Four integration points:

| Purpose | How |
|---------|-----|
| **Form storage** | Form definitions → JSON blob → blob ID becomes the URL |
| **Submission storage** | Responses (Seal-encrypted) → stored as blobs |
| **File uploads** | User-uploaded images/documents → stored directly on Walrus |
| **Site hosting** | The entire frontend is a Walrus Site — no Vercel, no AWS |

All reads use public aggregator endpoints. No authentication required.

---

## Seal Encryption Flow

```
CREATE FORM (encryption enabled)
  └─▶ Create Allowlist on Sui (walform_seal::access::new_allowlist)
  └─▶ Form owner's address added to allowlist
  └─▶ allowlistObjectId saved in form settings

SUBMIT RESPONSE
  └─▶ Serialize submission to bytes
  └─▶ sealEncrypt(data, allowlistObjectId) → encrypted blob
  └─▶ Store encrypted blob on Walrus

DECRYPT (dashboard, form owner only)
  └─▶ Fetch encrypted blob from Walrus
  └─▶ sealDecrypt(data, allowlistObjectId, wallet signature)
  └─▶ Seal key servers verify sender is on allowlist (seal_approve)
  └─▶ Plaintext returned client-side — never touches a server
```

---

## Project Structure

```
puffy/
├── src/
│   ├── app/                       # Next.js pages
│   │   ├── page.tsx               # Landing page
│   │   ├── create/                # Form builder
│   │   ├── form/[formBlobId]/     # Public form submission
│   │   ├── dashboard/             # Form management + decryption
│   │   └── link-twitter/          # X account ↔ wallet linking
│   ├── components/
│   │   ├── form-builder/          # Editor, picker, preview, settings, AI
│   │   ├── form-renderer/         # Field renderer, file upload, ratings
│   │   ├── dashboard/             # Form cards, submission table
│   │   └── wallet/                # Sui wallet provider + connect button
│   ├── hooks/                     # useFormBuilder, useUserForms
│   └── lib/
│       ├── walrus.ts              # Walrus blob read/write
│       ├── seal.ts                # Seal encrypt/decrypt + allowlist
│       ├── enclave.ts             # TEE API client
│       └── types.ts               # Type definitions
├── enclave/                       # Nautilus TEE (Rust)
│   ├── main.rs                    # Axum server
│   ├── mod.rs                     # Action router (12 endpoints)
│   ├── llm.rs                     # Huru AI integration
│   ├── twitter.rs                 # X API client
│   ├── db.rs                      # SQLite persistence
│   └── Containerfile              # TEE container build
├── move/
│   └── walform_seal/
│       └── sources/access.move    # Seal allowlist smart contract
└── next.config.ts                 # Static export config
```

---

## Run Locally

```bash
npm install
npm run dev
```

---

## Deploy

```bash
# Build and deploy to Walrus Sites
npm run build
echo '{"routes":{"/*":"/index.html"}}' > out/ws-resources.json
site-builder --context mainnet publish ./out --epochs 5
```

---

## Smart Contract

```move
module walform_seal::access {
    entry fun new_allowlist(ctx: &mut TxContext)
    entry fun add_address(list: &mut Allowlist, addr: address)
    entry fun seal_approve(id: vector<u8>, list: &Allowlist, ctx: &TxContext)
}
```

---

## Enclave API

All actions via `POST /process_data`:

| Action | Description |
|--------|------------|
| `generate_form` | AI form generation from natural language |
| `register_submission` | Track new submission |
| `get_submissions` | List submissions for a form |
| `update_reward` | Mark reward sent with tx digest |
| `save_note` / `get_notes` | Admin notes on submissions |
| `get_forms` | List bot-created forms by wallet |
| `link` / `unlink` | X account ↔ wallet linking |

---

<div align="center">

**Built with Walrus · Sealed by Seal · Secured in Nautilus · Powered by Sui**

[puffyforms.wal.app](https://puffyforms.wal.app)

</div>

---

## License

MIT
