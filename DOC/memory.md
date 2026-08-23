# Memory
Project memory to keep track of progress, decisions and current work — Digital Vargani / Mandal Fund & Receipt Management Platform.

> This file is meant to be updated as the project moves forward — treat it as a running log, not a one-time document. Update Section 3 every session; append to Section 2 whenever something ships or a decision is made.

---

## 1. MEMORY

### Key context
- **Product:** Mobile-first PWA replacing paper bill-books for festival trusts/mandals (Ganeshotsav, Navratri, Shiv Jayanti, Dahi Handi) — donation collection, multi-lingual digital receipts, cash reconciliation, expense tracking, public transparency reporting.
- **Core constraint:** volunteer donation entry must work in under 10 seconds, on any mobile browser, with no app install, including offline in weak-connectivity zones.
- **Full docs suite (all in `/mnt/user-data/outputs/`):**
  - `PRD.md` — what to build, target users, features
  - `architecture.md` — system design, folder structure, tech stack
  - `rules.md` — standards, allowed/avoided tech, AI boundaries
  - `schema_v2.sql` — full Postgres schema (with audit/verification/offline-sync fixes)
  - `phases.doc.md` — 6-phase build plan
  - `design.md` — UI/UX system, color, typography, preference storage

### Decisions made so far
| Decision | Rationale | Doc reference |
|---|---|---|
| Immutable ledger pattern for donations/expenses — no destructive UPDATE on financial fields | Preserve audit trail; core to the transparency value prop | `schema_v2.sql`, `rules.md` §2 |
| Server-allocated receipt number ranges (not client-generated sequential numbers) | Prevent collisions when multiple volunteers are offline simultaneously | `schema_v2.sql`, `phases.doc.md` Phase 3 |
| UPI donations get a `payment_verification_status`, not blind trust | UPI was a bigger fraud surface than cash pre-fix | `schema_v2.sql` |
| WhatsApp click-to-chat, not paid Business API | Avoids per-message cost and approval overhead at MVP stage | `rules.md` §2, `architecture.md` |
| Postgres Row-Level Security for tenant isolation, enforced at DB layer | App-layer-only checks were flagged as a gap; RLS is the real boundary | `schema_v2.sql`, `rules.md` §1 |
| Dark theme deferred to Phase 4+, not MVP | Primary usage is outdoors/daylight; low ROI for MVP effort | `design.md` §2 |
| No ORM magic (Prisma) on financial tables — Kysely/raw SQL preferred there | Reconciliation/ledger queries need to stay auditable as plain SQL | `rules.md` §1–2 |
| 80G / FCRA compliance handling pushed to post-MVP "Future enhancements" | Open legal/scope question, not yet resolved — intentionally not assumed either way | `phases.doc.md` Phase 6, PRD critique |
| AI cannot merge/deploy unsupervised changes to donations, expenses, reconciliation, or receipt-numbering tables | Money + audit-trail risk — human sign-off required | `rules.md` §5 |

### Open questions (not yet decided)
- Is 80G tax-receipt support in scope for MVP, or deferred entirely? (Depends on how many target mandals are registered trusts.)
- Will any mandal need FCRA handling (foreign/NRI donors) in the near term, or can that be safely deferred?
- Confirmed OTP/SMS vendor (Fast2SMS vs. Firebase Phone Auth vs. Twilio) — `rules.md` lists both as options behind an abstraction, no final pick yet.
- Hosting provider for the containerized API — Fly.io vs. Railway vs. AWS ECS not yet chosen.

---

## 2. WHAT HAPPENED

*(Newest first. Add an entry whenever something ships, changes, or gets decided.)*

- **[Scaffolding & Core Implementation Complete]** Full Turborepo monorepo implemented:
  - `packages/types`: Shared TypeScript interfaces, Enums, Zod validation schemas for donations, expenses, reconciliations, auth, and mandal profiles.
  - `packages/db`: Full PostgreSQL schema with Row-Level Security (RLS) policies, immutable financial ledger (`donations`, `donation_corrections`), client connection pool with RLS session management, migration and seed scripts.
  - `packages/ui`: Shared mobile-first UI components (Button, Input, Card, StatusBadge, AmountChips, Modal, BottomNav) using festive design tokens.
  - `apps/api`: NestJS modular backend with Auth (OTP + JWT + RLS context), Mandals, Members, Donations (with offline batch sync, corrections, voiding, receipt range allocation), Expenses (approval workflow), Reconciliation (cash handover & discrepancy tracking), Transparency (public read-only), and Reports (CSV export).
  - `apps/web`: Next.js 14 mobile-first PWA with multi-lingual support (Marathi, Hindi, Gujarati, English), IndexedDB offline queue with auto-sync on reconnect, client-side PDF receipt generation + QR codes, WhatsApp click-to-chat deep link sharing, Volunteer collection (<10s flow), Treasurer dashboard & cash reconciliation, Admin settings & team management, and public transparency portal.
- **[Planning phase]** Full documentation suite drafted: PRD, architecture, rules, database schema (v2, with fixes), 6-phase build plan, and design system.
- **[Planning phase]** Original PRD (v1) reviewed and critiqued — gaps identified in legal/compliance, financial integrity, and offline sync.
- **[Planning phase]** Schema redrafted (`schema_v2.sql`) applying fixes from critique.

### Issues faced & solutions
- Node/npm in sandboxed environment lacked local execution permissions for external paths; resolved by running toolchain commands with bypass sandbox approval.

---

## 3. CURRENTLY WORKING

**Status:** Full Monorepo Build Completed (5/5 packages successful). Ready for local runtime launch and live user testing.

**Working on:** Ready to start local dev servers (`npm run dev`) or run migrations/seed against database.

**Current file/module:** Entire workspace verified and clean.

**What's next:**
1. Start PostgreSQL 16 & Redis 7 via `docker compose up -d` (or connect to an active Postgres instance).
2. Run database migration `npm run migrate` and seed `npm run seed` in `packages/db`.
3. Launch development servers with `npm run dev`.
4. Test volunteer login, instant donation entry (<10s), offline sync simulation, cash reconciliation, and public transparency portal.

---

*Companion documents: `PRD.md`, `architecture.md`, `rules.md`, `phases.doc.md`, `design.md`, `schema_v2.sql`.*
