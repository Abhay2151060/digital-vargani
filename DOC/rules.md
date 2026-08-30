# Rules

Project rules, standards and guidelines to build and maintain the application.

---

## 1. WHAT TO USE

**Frontend**
- Next.js 14 (App Router) for the web PWA — server components by default; client components only where interactivity requires it (forms, offline queue, dashboard live updates).
- TailwindCSS for styling — no separate CSS files per component unless a Tailwind utility genuinely can't express it.
- TypeScript everywhere, strict mode on. No `.js` files in `apps/web` or `apps/api`.
- React Hook Form + Zod for the donation/expense forms — schema-validated input, matches the Zod schemas already used for API request validation (single source of truth for shape).

**Backend**
- NestJS (Node.js) — feature-module structure as laid out in `architecture.md`. One module per bounded context (donations, expenses, reconciliation, etc.).
- REST over JSON for all client-facing endpoints. tRPC only if a future internal-only service is added; don't introduce it into the public API surface.
- Class-validator/class-transformer (NestJS default) for DTO validation at the API boundary, mirroring the Zod schemas on the frontend.

**Data**
- PostgreSQL as the single system of record. All schema changes go through migrations — never a manual `ALTER TABLE` against production.
- Row-Level Security for tenant isolation — every new table containing `mandal_id` gets an RLS policy before it ships, not after.
- Redis strictly as a cache/aggregation layer. Nothing is allowed to be *only* in Redis — it must always be reconstructable from Postgres.

**Patterns**
- Append-only ledger pattern for `donations` and any other financial table — corrections are new rows (see `donation_corrections`), never destructive `UPDATE`s on amount/donor fields.
- Idempotency keys (`client_id`) on any write that can originate offline or be retried.
- Server-allocated ID/number ranges for anything that must stay unique across offline clients (e.g. receipt numbers) — never client-generated sequential numbers.

---

## 2. WHAT TO AVOID

- **No client-side sequential receipt numbering.** Guaranteed to collide across offline volunteers. Use the server-allocated range pattern instead (see `schema_v2.sql`).
- **No destructive updates on settled financial records** (`amount`, `donor_name`). For corrections, use `donation_corrections`. For unsettled `PENDING` donations, payment mode transitions (`PENDING → CASH` or `PENDING → UPI`) must occur strictly through transactional endpoint `POST /donations/collect-pending` with full verification tracking.
- **No paid WhatsApp Business API integration** for MVP — click-to-chat deep links only. Business API adds cost and approval overhead the product doesn't need at this stage; revisit only if volume/scale genuinely demands it.
- **No storing files (images, PDFs) as database blobs.** Object storage only (R2/S3), referenced by URL.
- **No trusting client-reported payment status for UPI without a verification path.** Never treat `payment_mode = 'UPI'` as equivalent to confirmed cash-in-hand without verification status.
- **No global/shared state libraries (Redux, MobX, etc.) on the frontend.** The app's state needs (form state, offline queue, server data) are covered by React Hook Form, the offline-queue module, and server components / fetch caching. Avoid the added complexity unless a concrete need arises.
- **No ORMs that hide raw SQL entirely** (e.g. avoid deep Prisma "magic" for the financial tables) — reconciliation and ledger queries need to be auditable as plain SQL. A lightweight query builder (Kysely) or raw parameterized queries are preferred over full ORM abstraction for the financial modules. ORM use is fine for low-risk tables (mandal profile, member metadata).
- **No hardcoded language strings in components.** All donor-facing text goes through the i18n layer — receipts and forms must support Marathi/Hindi/Gujarati/English without code changes per language.
- **No SMS/OTP provider called directly from route handlers.** Always go through the auth-provider abstraction, so the vendor can be swapped without touching business logic.

---

## 3. LIBRARIES & DEPENDENCIES

| Purpose | Library | Version guideline |
|---|---|---|
| Frontend framework | `next` | Latest stable 14.x; hold before major-version bumps until reviewed |
| UI utility styling | `tailwindcss` | ^3.x |
| Icons | `lucide-react` | Latest |
| Form handling | `react-hook-form` | ^7.x |
| Schema validation (shared) | `zod` | Pin minor version across `web` and `api` — mismatches cause silent validation drift |
| Backend framework | `@nestjs/core` and family | Latest stable, kept in lockstep across all `@nestjs/*` packages |
| DB query layer (financial modules) | `kysely` | ^0.27+ |
| DB query layer (low-risk modules) | `prisma` (optional) | If used, restrict to non-financial tables only |
| PDF/receipt generation (client) | `jspdf` | Latest stable |
| QR code generation | `qrcode` | Latest stable |
| Caching | `ioredis` | Latest stable |
| Object storage SDK | `@aws-sdk/client-s3` (R2-compatible) | Latest stable |
| Auth / OTP | `firebase-admin` or Fast2SMS SDK, behind an internal `AuthProvider` interface | — |
| Testing | `vitest` (unit), `playwright` (e2e) | Latest stable |
| Linting/formatting | `eslint`, `prettier` | Shared root config, no per-package overrides |

**Rule of thumb:** before adding any new dependency, check whether an existing library in this table already covers the need. New dependencies for financial-data handling (payments, ledgers, reconciliation) require explicit review before merging — no drive-by `npm install` on those modules.

---

## 4. ERROR HANDLING

**Principles**
- Fail loudly in logs, fail gracefully in the UI. The person on the ground (a volunteer mid-collection) should never see a raw stack trace or a blank screen.
- Every user-facing error message is written in the donor/volunteer's selected language, and never exposes internal details (SQL errors, stack traces, internal IDs).
- Financial writes fail closed: if the backend can't confirm a donation was saved, the frontend must clearly show it as unsynced/pending — never silently drop it or silently mark it as saved.

**Backend**
- All API errors return a consistent shape: `{ code, message, details? }`. `code` is a stable machine-readable string (e.g. `RECEIPT_NUMBER_EXHAUSTED`), `message` is safe to show to the end user.
- Use NestJS exception filters centrally — no scattered `try/catch` with inconsistent response shapes across modules.
- Log full error context (stack trace, request ID, `mandal_id`, `user_id`) server-side only, never in the API response.
- Structured logging (JSON) shipped to a central log store, tagged by module (`donations`, `reconciliation`, etc.) so financial-module errors can be filtered and alerted on separately from UI/cosmetic errors.

**Frontend**
- Offline queue errors (sync failures) surface as a persistent, dismissible banner — "3 donations waiting to sync" — never a silent failure.
- Form validation errors are inline, field-level, and in the user's selected language.
- A global error boundary catches unhandled render errors and shows a friendly fallback ("Something went wrong — your data is safe, please retry") rather than a blank/broken page.
- Network failures during donation submission fall back to the offline queue automatically rather than surfacing as a hard error — the offline path is the fallback, not just for genuinely-offline users.

**Reporting**
- Financial-integrity errors (reconciliation mismatches, failed payment verification, sync conflicts) are logged as distinct event types so they can be monitored/alerted on separately from generic application errors.
- Any error affecting money (failed reconciliation, voided donation, rejected expense) is written to an audit log entry, not just a general error log — these need to be queryable later for trust/dispute resolution.

---

## 5. BOUNDARIES OF AI

Scope of what AI assistance (Claude or otherwise) is and isn't trusted to do unsupervised on this project.

**AI can:**
- Generate boilerplate: component scaffolding, DTOs, migration files, test stubs.
- Draft documentation, PRD sections, and architecture notes (with human review before being treated as final).
- Suggest schema changes, flag gaps, and review code for the patterns listed in this document.
- Write non-financial business logic (mandal profile editing, member invites, UI components) with standard code review.
- Generate translations for UI strings as a first draft — always reviewed by a native speaker before shipping, since donor-facing receipt text has real-world trust implications.

**AI cannot (without explicit human sign-off):**
- Merge or deploy changes to any table or endpoint touching `donations`, `expenses`, `cash_reconciliations`, or `receipt_number_allocations` without a human review specifically checking the ledger/audit-trail rules in Section 2.
- Make final calls on legal/compliance scope (80G eligibility, FCRA applicability, DPDP consent flows) — AI can draft the mechanism, but a human (ideally with legal input) confirms the actual compliance requirement being implemented.
- Change RLS policies or auth/role-guard logic unsupervised — these are the tenant-isolation boundary; a mistake here is a data-leak, not a bug.
- Decide product scope trade-offs (e.g., "do we support FCRA donors in MVP?") — AI can lay out the trade-offs, a human decides.
- Be trusted as the sole reviewer of its own financial-module code. A second pass — human or a separate review pass — is required for anything touching money before merge.
- Fabricate library APIs, external service behavior (e.g. WhatsApp/SMS provider quirks), or regulatory specifics it isn't certain of — when uncertain, it should say so rather than presenting a guess as fact, especially for compliance-adjacent claims.

**General principle:** AI is trusted to move fast on structure, boilerplate, and drafts. It is not trusted as the final word on anything where being wrong costs money, breaks legal compliance, or leaks one mandal's data to another.

---

## 6. GENERAL RULES

### Code style & formatting
- Prettier + ESLint, shared root config — no per-file/per-package style overrides.
- 2-space indentation, single quotes, trailing commas (Prettier defaults).
- No `any` in TypeScript except in clearly-commented, isolated interop shims.
- Prefer named exports over default exports (easier refactors, clearer imports).

### Naming conventions
- Files: `kebab-case.ts` (e.g. `offline-queue.ts`).
- React components: `PascalCase` (e.g. `DonationForm.tsx`).
- Database tables/columns: `snake_case`, matching `schema_v2.sql`.
- API routes: plural nouns, REST-conventional (`/donations`, `/donations/:id`).
- Booleans prefixed `is_`/`has_` (matches existing schema: `is_reconciled`, `is_voided`).

### Commit messages
- Conventional Commits format: `type(scope): summary` — e.g. `fix(reconciliation): correct discrepancy calc for partial handovers`.
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
- Scope matches the module name where possible (`donations`, `expenses`, `auth`, `web`).
- Any commit touching a financial table or RLS policy must reference the related PR/review in the commit body.

### Security & data privacy
- No PII (donor name, phone) in logs — log donation/user IDs, not raw personal data.
- All donor-facing public pages respect the mandal's `hide phone numbers` transparency setting — enforced server-side, not just hidden in the UI.
- Secrets (DB credentials, SMS/OTP API keys, storage keys) only in environment variables / secret manager — never committed, never in client-side bundles.
- RLS is the enforced boundary for tenant isolation; application-layer checks are a second line of defense, not a substitute.

### Performance & scalability
- Dashboard aggregates read from Redis, not computed live from Postgres on every request.
- Public transparency pages are cached/ISR'd — they don't need to be real-time to the second.
- Donation submission must stay under the PRD's <500ms target; any change adding latency to that path needs explicit justification.
- Load-test before each festival season's peak window (visarjan-day-scale burst writes), not just once at launch.

### Documentation & comments
- Every module's `README.md` states its purpose and its RLS/audit-trail obligations if it touches financial data.
- Comments explain *why*, not *what* — code should be self-explanatory for the "what."
- Any deviation from these rules (an exception) must be documented inline with a reason and, ideally, a linked issue.

### Testing
- Unit tests required for all reconciliation/discrepancy calculation logic — this is the highest-consequence math in the app.
- Integration tests for the offline sync flow, specifically duplicate-submission and conflict scenarios.
- E2E test covering the full volunteer donation → receipt → WhatsApp share flow before any release.
- No merging to main with failing tests; no skipping tests on financial modules to "fix later."

### Other project-specific rules
- Any new table containing money or PII gets an RLS policy and an audit-trail review as part of the same PR — not a follow-up.
- Language/i18n coverage is a release gate: a feature touching donor-facing text isn't done until all four languages are present.
- Festival-season code freezes: no non-critical schema changes in the run-up to a major festival window, to avoid destabilizing the app during peak collection.
