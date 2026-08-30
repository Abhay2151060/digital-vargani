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
| Admin Ahwal (अहवाल) & UPI QR Code Upload | Admin uploads official Ahwal (Report) and UPI payment QR code; rendered on collection screens and public transparency portal | `PRD.md`, `packages/db`, `apps/web/settings` |
| Pending Collection (येणे वर्गणी) Settlement (`Collect via UPI` / `Collect via Cash`) | Enables recording promised donations and settling them via transactional API `POST /donations/collect-pending` with full verification updates | `PRD.md`, `architecture.md`, `packages/types` |
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

- **[Admin UPI QR Code Upload & Display on `/collect`]** Mandal Admins can upload their official payment QR code (PhonePe, Google Pay, Paytm, BHIM) via `/settings`. The uploaded QR code is saved to the database and displayed prominently on `/collect` whenever UPI payment mode is selected, with automatic fallback to a dynamic amount-encoded QR code if no image has been uploaded yet.
- **[Purge Dummy / Demo / Test Data & Production Deployment]** Removed all sample/mock expenses and test transactions from `seed.ts` and system baseline. Database and seed scripts are cleanly configured with the primary Admin user (`Omkar Bhagat`, `8574968596`) and Mandal setup. All changes staged, committed, and deployed to production.
- **[Sole Admin & Removal of 1-Click Demo Login]** Configured Omkar Bhagat (`8574968596`, Role: `ADMIN`) as the single initial Admin user. Removed the 1-Click Demo Login functionality from the login page and homepage. All additional roles (Volunteers, Treasurers) are managed and created directly by the Admin via the Member Management portal (`/members`).

---

## 3. CURRENTLY WORKING

**Status:** Production release deployed with clean baseline data.

**Working on:** Production monitoring and runtime verification.

**Current file/module:** Complete codebase deployed.

**What's next:**
1. Monitor live transactions and user onboarding.
2. Provide support for volunteer/treasurer team management by Admin.

---

*Companion documents: `PRD.md`, `architecture.md`, `rules.md`, `phases.doc.md`, `design.md`, `schema_v2.sql`.*

