# Phases
Breakdown of the project into manageable phases — Digital Vargani / Mandal Fund & Receipt Management Platform.

---

## PHASE 1: LOGIN & AUTHENTICATION

- **User registration:** No separate signup form — a user record is created implicitly on first OTP login (phone number as identity).
- **Login/Logout:** Passwordless OTP login (mobile number + 6-digit code via SMS/WhatsApp); logout clears session/JWT client-side.
- **Password reset:** Not applicable — OTP-only auth has no password to reset. (If email/password is ever added for admin-web access, this section applies then.)
- **Authentication & authorization setup:**
  - JWT (or session) issued after OTP verification.
  - Role-based access per mandal (`ADMIN`, `TREASURER`, `VOLUNTEER`) via `mandal_members`.
  - RLS session context set on every authenticated request (`app.current_mandal_ids`), so tenant isolation is enforced at the DB layer from day one.
  - Invite-link flow: admin generates a link/adds a phone number → invited user's first OTP login activates their `mandal_members` row (`PENDING` → `ACTIVE`).
  - DLT template registration for OTP SMS completed before this phase is considered done (see `rules.md` compliance note).

**Exit criteria:** A user can log in via OTP, land on the correct role-scoped view, and cannot see another mandal's data even by guessing IDs.

---

## PHASE 2: DASHBOARD

- **Dashboard layout:** Persona-specific layouts — Volunteer (history view), Treasurer (stats, collection + reconciliation access), Admin (mandal settings + member management).
- **Overview cards/stats:**
  - Volunteer: personal collection history (`/history`). Access to `/collect` and `/totals` is restricted to Treasurer and Admin.
  - Treasurer: total collected today vs. festival total, cash vs. UPI/bank split, live cash-in-hand per volunteer.
  - Admin: active volunteer count, pending expense approvals, pending member invites.
- **Navigation setup:** Route groups by role (`(volunteer)`, `(treasurer)`, `(admin)`) as defined in `architecture.md`; bottom-tab nav on mobile for volunteer flow (fastest thumb-reach for the 10-second entry target).
- **Basic data visualization:** Simple bar/line chart for collections-over-time (treasurer view) and a payment-mode split chart — lightweight charting only; the fuller pie-chart breakdown belongs to the public transparency portal (Phase 4).

**Exit criteria:** Each role sees a live, correctly-scoped dashboard on login, backed by Redis-cached aggregates rather than live Postgres queries.

---

## PHASE 3: CRUD OPERATIONS

Main entities: **Donations**, **Expenses**, **Mandal Members**, **Mandal Profile**.

- **Create:**
  - Donation entry form (the core <10-second flow) — works online and offline.
  - Expense logging with category + bill photo upload.
  - Mandal profile setup (name, logo, UPI ID, receipt prefix, etc.).
  - Member invite (create `mandal_members` row).
- **Read:**
  - Donation list/detail (receipt view with QR).
  - Expense list/detail.
  - Mandal profile view.
- **Update:**
  - Pending donation collection & settlement: convert `PENDING` donations into `CASH` or `UPI` via `POST /donations/collect-pending`.
  - Donation corrections go through the `donation_corrections` append-only pattern — never a direct field edit (see `rules.md`, Section 2).
  - Expense edits allowed only while `status = PENDING`; once `APPROVED`/`REJECTED`, further changes require a new entry + admin note.
  - Mandal profile and member role/status updates (admin only).
- **Delete:**
  - No hard deletes on donations/expenses — `is_voided` soft-delete with `voided_by`/`voided_reason` instead, preserving the audit trail.
  - Member removal sets `status = REVOKED`, not a row delete.
- **Form validation:** Zod (frontend) + class-validator DTOs (backend), shared shape — required donor name, valid amount (`> 0`), valid payment mode (`CASH`, `UPI`, `PENDING`), phone format check when WhatsApp receipt is requested.
- **List & detail views:** Paginated donation/expense lists per mandal, receipt detail view with QR + WhatsApp share action, and "वर्गणी जमा करा" action on pending donations.
- **Search, filter & sort:** Filter donations by date range, payment mode (Cash/UPI/Pending), volunteer, reconciliation status; filter expenses by category/status; sort by date or amount.

**Exit criteria:** A volunteer can create a donation offline or online, view full donor details, and settle pending collections; a treasurer/admin can view, filter, correct (via the append-only pattern), and void records without ever losing the audit trail.

---

## PHASE 4: ADDITIONAL FEATURES

- **Business logic & rules:**
  - Pending collection (येणे वर्गणी) settlement workflow: `PENDING → CASH` (ready for cash reconciliation) or `PENDING → UPI` (with payment reference).
  - Cash reconciliation workflow (expected vs. received, discrepancy flagging + resolution).
  - Expense approval workflow (`PENDING → APPROVED/REJECTED`, only approved expenses count toward the public balance sheet).
  - Server-allocated receipt number ranges to prevent offline collisions.
  - Payment verification states for UPI/bank transfer donations.
- **File upload/download:**
  - Mandal logo upload, expense bill photo upload (to object storage, not the DB).
  - Downloadable PDF/image receipts; CSV/Excel export; festival audit PDF report.
- **Notifications/Alerts:**
  - In-app banner for pending offline-sync items ("3 donations waiting to sync").
  - Alert to treasurer when a reconciliation discrepancy is opened.
  - Alert to admin when an expense is submitted for approval.
- **Settings/Preferences:**
  - Donor/volunteer preferred language.
  - Public transparency toggle + "hide donor phone numbers" setting.
  - Receipt prefix and branding settings.
  - Public transparency portal itself (charts, donor roll, audited badge) is built in this phase, reading only from approved/non-voided records.

**Exit criteria:** Reconciliation and expense-approval workflows are fully wired end-to-end; the public transparency page is live and reflects only settled, approved data.

---

## PHASE 5: TESTING & QUALITY ASSURANCE

- **Unit testing:** Reconciliation/discrepancy calculations, receipt-number allocation logic, amount-in-words conversion (all 4 languages), RLS policy behavior.
- **Integration testing:** Offline sync flow — duplicate submission on retry, conflict scenarios, idempotency via `client_id`; end-to-end donation → receipt → WhatsApp share; expense approval → balance sheet update.
- **Bug fixing:** Triaged by severity, with anything touching a financial table (per `rules.md`) requiring a second reviewer before merge.
- **Performance testing:**
  - Load test for festival-peak burst writes (visarjan-day-scale concurrent donation submissions).
  - Confirm <1.5s mobile page load on 3G/4G and <500ms donation submission targets from the PRD.
  - Redis cache hit-rate check on dashboard endpoints under load.

**Exit criteria:** Core financial flows have test coverage, the app holds up under simulated peak load, and no known high-severity bugs remain open on financial modules.

---

## PHASE 6: DEPLOYMENT & MAINTENANCE

- **Deployment to staging & production:**
  - Staging environment mirrors production RLS/auth config for realistic testing.
  - Production deploy: frontend to Vercel (or equivalent edge host), API containerized (Fly.io/Railway/ECS), Postgres + Redis provisioned with backups enabled.
  - Pre-festival deployment freeze window (per `rules.md`) — no non-critical changes shipped right before a major collection day.
- **User feedback & monitoring:**
  - Structured logging/alerting on financial-integrity events (failed reconciliations, sync conflicts, voided donations) distinct from generic app errors.
  - Lightweight in-app feedback channel for volunteers/treasurers during first live festival use.
- **Bug fixes & improvements:** Rapid-response process during the first live festival deployment, since that's the real stress test the platform hasn't had before.
- **Future enhancements (post-MVP, not in initial scope):**
  - 80G/FCRA compliance handling (flagged in the PRD critique as a legal gap to resolve before broader rollout).
  - Payment gateway integration for verified UPI (vs. click-to-chat + manual verification).
  - Multi-mandal aggregated reporting for federations/umbrella trusts.

**Exit criteria:** Platform is live for at least one real festival collection cycle, monitored, with a clear backlog for the flagged post-MVP items.

---

*Companion documents: `PRD.md` (scope), `architecture.md` (system design), `rules.md` (standards), `schema_v2.sql` (database schema).*
