# Architecture

High-level design and structure of the application.

---

## 1. ARCHITECTURE

### System overview

The platform is a three-tier, multi-tenant web application: a mobile-first PWA frontend, a stateless API backend, and a PostgreSQL-centered data layer. Each mandal is a tenant, isolated at the database row level.

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (PWA / Mobile Web)               │
│   Next.js 14 · React · TailwindCSS · Service Worker (PWA)    │
│   IndexedDB — offline queue for donation entries              │
└──────────────────────────────┬────────────────────────────────┘
                                │ HTTPS / REST (JSON)
┌──────────────────────────────▼────────────────────────────────┐
│                     Backend API Layer                          │
│         Node.js (NestJS) — modular, role-guarded routes        │
│   Auth Module · Donations Module · Expenses Module ·           │
│   Reconciliation Module · Receipts Module · Reports Module     │
└───────┬───────────────────────┬───────────────────┬───────────┘
        │                       │                    │
┌───────▼────────┐   ┌──────────▼─────────┐  ┌───────▼──────────┐
│  PostgreSQL      │  │  Redis              │  │  Object Storage   │
│  Primary DB       │  │  Cache + live tally │  │  Cloudflare R2 /  │
│  (multi-tenant,   │  │  aggregation        │  │  S3 — logos,      │
│  RLS enforced)    │  │                     │  │  bills, receipts  │
└────────────────────┘  └─────────────────────┘  └───────────────────┘
        │
┌───────▼────────────────────────────────────────────────────────┐
│              External Services (via API Layer)                  │
│   SMS/OTP: Fast2SMS or Firebase Phone Auth                       │
│   Receipt delivery: WhatsApp click-to-chat (no paid API)         │
└────────────────────────────────────────────────────────────────┘
```

### Components & responsibilities

- **Frontend (PWA):** Renders the volunteer collection flow, treasurer dashboard, and public transparency pages. Owns the offline queue — donation entries are written to IndexedDB first, then synced to the API once connectivity returns, using a client-generated `client_id` as an idempotency key.
- **Backend API:** Stateless NestJS service. Each module maps to a PRD feature area (donations, expenses, reconciliation, receipts, reports). All financial writes are append-only at the service layer — corrections are new rows, never destructive updates.
- **PostgreSQL:** System of record. Row-Level Security policies enforce mandal isolation at the database level, not just in application code, so a bug in one module can't leak another mandal's data.
- **Redis:** Not a source of truth — caches live dashboard aggregates (today's total, per-volunteer cash-in-hand) so the treasurer dashboard doesn't hit Postgres on every poll. Invalidated/recomputed on each new donation/reconciliation write.
- **Object storage:** Mandal logos, expense bill photos, and generated receipt PDFs/images. Referenced from Postgres by URL, never stored as blobs in the DB.
- **SMS/OTP provider:** Handles passwordless login. Abstracted behind an auth-provider interface so the vendor can be swapped without touching the rest of the backend.
- **Receipt delivery:** WhatsApp click-to-chat is a frontend-generated deep link (`api.whatsapp.com/send?...`), not a backend integration — no message content passes through the server beyond generating the pre-filled text.

### Key interaction flows

**Donation entry (online):**
Volunteer submits form → API validates + allocates receipt number from the volunteer's pre-fetched range → writes to `donations` → updates Redis tally → returns receipt payload → frontend renders receipt + WhatsApp deep link.

**Donation entry (offline):**
Volunteer submits form → written to IndexedDB with `sync_status = PENDING_SYNC` and a locally-generated `client_id` → on reconnect, frontend replays queued entries → API dedupes on `(mandal_id, client_id)` → confirmed entries marked `SYNCED` client-side.

**Cash reconciliation:**
Treasurer opens reconciliation tab → API sums unreconciled `CASH` donations for a volunteer (`expected_amount`) → treasurer enters `received_amount` → API computes discrepancy, creates a `cash_reconciliations` row, links covered donations, marks them reconciled.

**Public transparency page:**
Public request hits a cached, read-only endpoint scoped to one mandal's `APPROVED` expenses and non-voided donations only — never queries live/unreconciled data.

---

## 2. FOLDER & FILE STRUCTURE

```
vargani-platform/
├── apps/
│   ├── web/                        # Next.js frontend (PWA)
│   │   ├── public/
│   │   │   ├── manifest.json       # PWA manifest
│   │   │   └── icons/
│   │   ├── src/
│   │   │   ├── app/                # Next.js app router
│   │   │   │   ├── (volunteer)/    # Donation entry flow
│   │   │   │   ├── (treasurer)/    # Dashboard, reconciliation
│   │   │   │   ├── (admin)/        # Mandal setup, member management
│   │   │   │   ├── mandal/[slug]/transparency/  # Public page
│   │   │   │   └── r/[receiptId]/  # Receipt verification page
│   │   │   ├── components/
│   │   │   │   ├── donation-form/
│   │   │   │   ├── receipt/
│   │   │   │   └── dashboard/
│   │   │   ├── lib/
│   │   │   │   ├── offline-queue.ts    # IndexedDB read/write helpers
│   │   │   │   ├── sync.ts             # Sync-on-reconnect logic
│   │   │   │   └── api-client.ts
│   │   │   ├── hooks/
│   │   │   └── service-worker.ts
│   │   └── next.config.js
│   │
│   └── api/                        # NestJS backend
│       ├── src/
│       │   ├── auth/                    # OTP login, session/JWT
│       │   ├── mandals/                 # Mandal profile, settings
│       │   ├── members/                 # Invites, roles, RLS session context
│       │   ├── donations/               # Collection, receipt numbering
│       │   ├── receipts/                # Receipt generation (PDF/QR)
│       │   ├── expenses/                # Logging + approval workflow
│       │   ├── reconciliation/          # Cash handover, discrepancies
│       │   ├── reports/                 # CSV/PDF exports
│       │   ├── transparency/            # Public read-only endpoints
│       │   ├── common/
│       │   │   ├── guards/              # Role guards, RLS context middleware
│       │   │   ├── interceptors/
│       │   │   └── decorators/
│       │   └── main.ts
│       └── nest-cli.json
│
├── packages/
│   ├── db/                         # Shared Postgres layer
│   │   ├── migrations/
│   │   ├── schema.sql              # Source-of-truth schema (see schema_v2.sql)
│   │   └── seed/
│   ├── types/                      # Shared TS types between web + api
│   └── ui/                         # Shared design tokens/components
│
├── docs/
│   ├── PRD.md
│   ├── architecture.md             # This file
│   └── schema_v2.sql
│
├── docker-compose.yml              # Local Postgres + Redis
├── turbo.json                      # Monorepo task runner (or nx.json)
└── package.json
```

**Notes on structure:**
- Monorepo (Turborepo/Nx-style) keeps frontend, backend, and shared types in one place, since the receipt/donation schema is shared between both.
- Route grouping in `apps/web/src/app/` mirrors the persona-based access scopes from the PRD — volunteer, treasurer, admin, and public are physically separated, making it easy to apply different auth guards per group.
- `offline-queue.ts` and `sync.ts` are isolated in `lib/` because they carry the most product-critical, easy-to-get-wrong logic (idempotency, conflict handling) — keeping them out of components makes them independently testable.
- `packages/db/schema.sql` is the single source of truth for the database; migrations are generated from it rather than hand-written ad hoc.

---

## 3. TECH STACK

| Layer | Technology | Why |
|---|---|---|
| **Frontend framework** | Next.js 14 (React) | Server-side rendering for fast first load on 3G/4G; App Router supports the route-grouping by persona |
| **Styling** | TailwindCSS | Fast to build a consistent, mobile-first UI without a heavy design system |
| **Icons** | Lucide Icons | Lightweight, tree-shakeable |
| **PWA / offline** | Service Worker + IndexedDB | Installable "Add to Home Screen" with no app store; IndexedDB backs the offline donation queue |
| **Client-side PDF/receipt rendering** | HTML Canvas / jsPDF | Instant, client-side receipt generation without a server round-trip |
| **Backend framework** | Node.js — NestJS | Modular, opinionated structure maps cleanly to feature modules; built-in guards suit role-based access (Admin/Treasurer/Volunteer) |
| **API style** | REST (tRPC optional if frontend/backend stay same-language) | Simple, well-understood, easy to version |
| **Primary database** | PostgreSQL | Relational integrity for financial data; native Row-Level Security for multi-tenant isolation |
| **Cache / live aggregation** | Redis | Fast reads for live dashboard tallies without hammering Postgres during collection bursts |
| **Object storage** | Cloudflare R2 (or AWS S3) | Logos, expense bill photos, generated receipts |
| **Auth / OTP** | Firebase Phone Auth or Fast2SMS/Twilio (DLT-registered) | Passwordless mobile login; provider abstracted behind an interface for swappability |
| **Receipt delivery** | WhatsApp click-to-chat (`api.whatsapp.com/send`) | No WhatsApp Business API cost; works from any volunteer phone |
| **Hosting** | Vercel (frontend) + containerized API (Fly.io/Railway/AWS ECS) | Edge-served frontend for latency; containerized backend for Postgres/Redis proximity |
| **Monorepo tooling** | Turborepo or Nx | Shared types and DB schema between `web` and `api` without duplication |

---

*Companion documents: `PRD.md` (product scope), `schema_v2.sql` (full database schema with audit, verification, and offline-sync fixes applied).*
