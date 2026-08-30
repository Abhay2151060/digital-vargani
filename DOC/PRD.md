# Product Requirement Document
## Digital Vargani / Mandal Fund & Receipt Management Platform

---

## 1. WHAT TO BUILD

A responsive, mobile-first web platform (PWA-compatible) for festival trusts and youth mandals — Ganeshotsav, Navratri, Shiv Jayanti, Dahi Handi — that replaces physical paper bill books with:

- Digital donation collection
- Automated multi-lingual receipts (Marathi, Hindi, Gujarati, English)
- Cash reconciliation between volunteers and treasurers
- Public transparency reporting on collections and spend

**Core goals:**
- Let a volunteer log a donation in under 10 seconds, from any mobile browser, with no app install.
- Give donors an instant digital receipt via WhatsApp/SMS in their preferred language.
- Give treasurers real-time visibility into cash-in-hand per volunteer and automated reconciliation.
- Give the public/devotees a transparent, auditable record of where funds came from and how they were spent.
- Work reliably at festival scale, including offline in weak-connectivity zones (basements, crowded pandals).

**What this is not:** a full accounting/ERP system, a payment gateway, or a tool for non-festival fundraising. Scope is collection, receipting, reconciliation, and transparency for time-boxed festival drives.

---

## 2. TARGETED USER

| Persona | Who they are | What they need |
|---|---|---|
| **Mandal Admin / President** | Runs the mandal, owns the festival budget and public reputation | Full control over mandal setup, volunteer access, and expense approval; confidence that the transparency report reflects reality |
| **Treasurer (खजिनदार)** | Manages the money day-to-day, often the most tech-comfortable member | Real-time cash-in-hand visibility per volunteer, fast donation collection, reconciliation workflow, exportable reports for audit |
| **Volunteer (कार्यकर्ता)** | Field team member / representative | Access to personal collection history (`/history`); collection creation (`/collect`) and totals management (`/totals`) are handled by Treasurer & Admin roles |
| **Donor / Public** | Gives cash or UPI on the spot, wants proof and, increasingly, transparency | A receipt they can trust and verify, in their own language, and — if they choose — visibility into how the mandal spent the money |

**Shared context across personas:** low tolerance for friction (festival collection happens in short, high-volume bursts), variable smartphone/network conditions, and a strong cultural expectation of trust and accountability around community funds.

---

## 3. FEATURES

### Mandal setup & access
- Mandal profile: name, registration number, city/area, festival type, custom receipt prefix, logo
- **Admin Uploads**:
  - **UPI Payment QR Code (QR कोड)**: Admin uploads official UPI QR code image used on collection forms and public donation views.
  - **Mandal Ahwal (अहवाल)**: Admin uploads official Annual Report & Audit statement (PDF/Image) with custom title for public view.
- One phone number can belong to multiple mandals and switch between them
- Passwordless OTP login (mobile number + 6-digit code)
- Admin-generated invite links to add volunteers/treasurers by phone number
- Active/inactive toggle per volunteer

### Fast donation collection (Treasurer & Admin flow)
- Minimal form: donor name, phone, amount (quick-select chips + custom), payment mode (cash/UPI/pending), optional flat/wing for society drives, receipt language
- Offline-first entry with local caching, syncing automatically when connectivity returns
- Under-10-second entry target on any mobile browser

### Pending Collection & Settlement (येणे वर्गणी)
- Ability to record promised or pending donations (`payment_mode = PENDING`) with full donor details.
- Dedicated "वर्गणी जमा करा (Add Collection)" action on pending records with one-tap settlement:
  - **Collect via UPI (यूपीआय द्वारे)**: Converts pending donation to UPI with optional UTR / payment reference.
  - **Collect via Cash (रोख द्वारे)**: Converts pending donation to Cash for cash reconciliation.
- Instant receipt update and WhatsApp share upon settlement.

### Digital receipts
- Branded receipt with mandal logo, deity/slogan line, unique receipt ID, timestamp, donor details, amount in words and numbers, and a verification QR code
- One-tap WhatsApp share (click-to-chat, pre-filled multi-lingual message) — no paid WhatsApp Business API required
- Downloadable PDF/image receipt as a fallback for donors without WhatsApp

### Treasurer dashboard & reconciliation
- Live totals: collected today vs. total festival collection, split by payment mode (Cash, UPI, Pending)
- Real-time breakdown card for **येणे वर्गणी (Pending Collection)**
- Live cash-in-hand per volunteer
- Handover workflow: volunteer submits cash, treasurer confirms received amount, system flags and tracks any discrepancy through to resolution

### Expense tracking
- Categorized expense logging (mandap, sound/lighting, prasad, idol, security, permissions, other)
- Photo attachment of vendor bills
- Admin approval step before an expense counts toward the public balance sheet
- Real-time net balance = approved collections − approved expenses

### Public transparency portal
- Shareable public page per mandal (`/mandal/{slug}/transparency`)
- **Official Ahwal (अहवाल)**: Publicly viewable and downloadable official Mandal Annual Report & Audit statement.
- **Online Donation UPI QR Code**: Publicly displayed Mandal QR code and UPI ID for direct devotee contributions.
- Donation and expense breakdown charts
- Donor roll with an option to hide phone numbers
- Audited status badge signed by president/treasurer

### Data & exports
- One-click CSV/Excel export
- Downloadable festival audit PDF report for trustees

---

*For technical architecture, database schema, and a detailed risk/gap review, see the accompanying schema and critique documents.*
