# Design
UI/UX guidelines and visual design system — Digital Vargani / Mandal Fund & Receipt Management Platform.

---

## 1. UI/UX

### Clean and intuitive interface
- The donation entry screen is the single most-used screen in the app and should have near-zero visual noise: donor name, phone, amount chips, payment mode, submit. Nothing else competes for attention on that screen.
- Favor recognition over recall — quick-select amount chips (₹101, ₹251, ₹501...) instead of requiring the volunteer to type and remember denominations.
- One primary action per screen. The volunteer flow, treasurer dashboard, and admin settings each have exactly one obvious next step at any given moment.

### Consistent user experience
- The same component (button, card, input, badge) looks and behaves identically whether it appears in the volunteer flow, treasurer dashboard, or public transparency page.
- Status is always communicated the same way across the app: color + icon + label together, never color alone (see Section 2 on accessibility).
- Receipts, dashboards, and the public portal share the same visual language (colors, type, spacing) so a donor recognizes the brand across every touchpoint — the receipt they get on WhatsApp should feel like the same product as the transparency page they might visit later.

### Mobile-first approach
- Every screen is designed at a 360–390px viewport first, then scaled up. Desktop/tablet is a secondary consideration — the vast majority of usage (volunteer collection, donor receipt viewing) happens on a phone, often a budget Android device on a mobile browser.
- Touch targets are a minimum of 44×44px. Amount chips, submit buttons, and nav items are sized for a thumb, not a cursor.
- Critical actions (submit donation, confirm cash received) sit within comfortable thumb-reach — bottom of screen, not top.
- Design and test against real-world constraints: mid-range Android screens, occasionally cracked/degraded displays, direct sunlight (outdoor pandal collection) — favor high contrast over subtlety.

### Easy navigation and accessibility
- Bottom tab navigation for the volunteer flow (max 3–4 tabs: Collect, My Totals, Receipts, Profile) — no hamburger menus burying the core action.
- Treasurer/Admin views can use a simple top nav or side drawer since they're used in shorter, less frequent, more deliberate sessions.
- WCAG AA minimum contrast ratios (4.5:1 for body text, 3:1 for large text/UI components) — non-negotiable given outdoor/bright-light usage.
- All interactive elements have visible focus states and accessible labels (screen-reader support), even though the primary user base is mobile-touch — some admin/treasurer usage may happen on desktop with assistive tech.
- Icons are always paired with text labels in primary flows — icon-only buttons are reserved for very common, well-understood actions (close, back) with an accessible label attached regardless.

### Component reuse and consistency
- A shared component library (`packages/ui`, per `architecture.md`) is the only source of buttons, inputs, cards, badges, and modals — no one-off styled elements built inline in a feature module.
- Components are built with variants (e.g. `Button` has `primary` / `secondary` / `danger` / `ghost`), not copy-pasted near-duplicates.
- Status badges (Pending / Approved / Rejected / Verified / Voided) are a single shared component driven by a status prop — new statuses extend the component, they don't spawn new one-off badge styles.

---

## 2. COLOR & THEME

The palette draws on the festival context (Ganeshotsav/Navratri) without leaning on any single deity or festival's specific iconography, since the platform serves multiple festivals and mandals.

### Primary, Secondary & Accent colors
| Role | Color | Hex | Use |
|---|---|---|---|
| Primary | Saffron | `#F97316` | Primary buttons, active nav items, key CTAs |
| Primary (dark variant) | Deep Saffron | `#C2410C` | Hover/pressed states |
| Secondary | Deep Maroon | `#7C2D12` | Secondary buttons, headers on receipts, accents evoking traditional festival color |
| Accent | Marigold Yellow | `#FACC15` | Highlights, badges, festive touches (e.g. receipt border accents) — used sparingly, not as a base color |

### Background & Surface colors
| Role | Color | Hex |
|---|---|---|
| App background | Off-white | `#FAF9F6` |
| Surface (cards, sheets) | White | `#FFFFFF` |
| Surface (subtle/inset) | Light grey | `#F3F1EC` |
| Border/divider | Warm grey | `#E5E1D8` |

### Text colors
| Role | Color | Hex |
|---|---|---|
| Primary text | Near-black (warm) | `#292118` |
| Secondary text | Warm grey | `#6B6459` |
| Disabled text | Light warm grey | `#A8A297` |
| Text on primary (saffron) background | White | `#FFFFFF` |
| Link/interactive text | Deep saffron | `#C2410C` |

### Success, Warning, Error colors
| Role | Color | Hex | Example use |
|---|---|---|---|
| Success | Green | `#16A34A` | Donation synced, reconciliation matched, expense approved |
| Warning | Amber | `#D97706` | Pending sync, pending approval, pending verification |
| Error | Red | `#DC2626` | Reconciliation discrepancy, sync conflict, failed payment verification |
| Info | Blue | `#2563EB` | Neutral informational states (e.g. "invite sent") |

All status colors are paired with an icon + text label (never color alone) per the accessibility rule in Section 1.

### Light & Dark theme support
- **Light theme is the default and the primary target for MVP** — most usage happens outdoors/in daylight where dark mode has little benefit and can hurt readability.
- **Dark theme is a Phase 4+ enhancement**, not MVP-blocking. When implemented:
  - Backgrounds shift to warm dark greys (`#1C1815` base, `#252019` surface) rather than pure black, keeping the same warm undertone as the light theme.
  - Saffron primary shifts slightly lighter (`#FB923C`) for sufficient contrast against dark surfaces.
  - Status colors (success/warning/error) get lightened variants to maintain AA contrast on dark backgrounds.
- Theme preference is user-controlled, not forced by system/OS setting, though it can default to system preference on first load (see Section 4).

---

## 3. FONTS & TYPOGRAPHY

### Primary font family
- **Latin script:** `Inter` — clean, highly legible at small sizes, wide language support, good for UI density on small screens.
- **Devanagari (Marathi/Hindi):** `Noto Sans Devanagari` — pairs well with Inter at matching weights, designed for screen legibility.
- **Gujarati:** `Noto Sans Gujarati` — same family reasoning, consistent x-height pairing with the above.
- Font stack falls back gracefully: `Inter, 'Noto Sans Devanagari', 'Noto Sans Gujarati', system-ui, sans-serif` — the browser selects the right glyphs per character automatically, so mixed-language receipts (e.g. an English donor name inside a Marathi receipt) render correctly without manual font-switching logic.

### Heading styles
| Level | Size (mobile) | Size (desktop) | Weight | Use |
|---|---|---|---|---|
| H1 | 24px / 1.3 | 32px / 1.25 | SemiBold | Page titles (rare — most screens don't need one) |
| H2 | 20px / 1.35 | 24px / 1.3 | SemiBold | Section headers (dashboard sections, settings groups) |
| H3 | 17px / 1.4 | 18px / 1.4 | Medium | Card titles, list group headers |

### Body text styles
| Style | Size | Line height | Weight | Use |
|---|---|---|---|---|
| Body (default) | 15px | 1.5 | Regular | Standard UI text |
| Body (large) | 16px | 1.5 | Regular | Primary form labels, key dashboard numbers' supporting text |
| Body (small) | 13px | 1.45 | Regular | Timestamps, helper text, metadata |
| Caption | 12px | 1.4 | Regular | Legal/fine print, receipt footer text |

### Font sizes & line heights
- Base unit: 15px body / 1.5 line height, scaled up modestly for desktop (Section 1's mobile-first principle applies to type too — don't just inherit desktop sizes downward).
- Numeric/amount displays (₹ figures on dashboards and receipts) use tabular figures where the font supports it, so columns of numbers align cleanly.
- Minimum readable size anywhere in the app: 12px (captions only) — nothing donor- or volunteer-facing goes smaller, given outdoor/glare usage conditions.

### Font weights
| Weight | Value | Use |
|---|---|---|
| Regular | 400 | Body text, form inputs |
| Medium | 500 | Emphasized body text, H3, nav labels |
| SemiBold | 600 | H1/H2, key stat numbers on dashboards, button labels |
| Bold | 700 | Reserved for rare high-emphasis moments (e.g. large ₹ total on the treasurer dashboard) — not used broadly, to keep Bold meaningful |

---

## 4. MEMORY (UI PREFERENCES)

What the app remembers per user, and how.

### Remember user preferences
- Preferences are tied to the authenticated user (`users` table), not the device — so a volunteer's preferences follow them across phones.
- Stored server-side (not just `localStorage`) for anything that should persist across devices/reinstalls; device-local settings (below) are the exception.

### Theme mode (light/dark)
- Stored per-user, defaulting to system preference on first login if no explicit choice has been made.
- Toggle accessible from account/settings on every persona's view, not buried in admin-only settings.
- Applied immediately on toggle, no reload required.

### Language preference
- `users.preferred_language` (already in the schema) drives:
  - The UI language for that user's own volunteer/treasurer/admin views.
  - The default receipt language when that user is the *donor* — pre-selected on their next receipt without re-asking.
- Donors without an account (most donors) have their language choice remembered only for the current receipt — no persistent profile exists for anonymous donors, so this is a per-transaction setting rather than a stored preference (consistent with not creating shadow donor accounts).

### Sidebar/layout state
- Treasurer/Admin desktop views: collapsed/expanded state of any side navigation is remembered per-device (`localStorage`), since it's a low-stakes cosmetic preference that doesn't need to sync across devices.
- Volunteer mobile flow has no sidebar (bottom-tab nav only), so this applies only to the treasurer/admin desktop experience.

### Any other UI customizations
- Default dashboard date range (e.g. "Today" vs "This Festival") remembered per-user for the treasurer dashboard, so a treasurer who always checks the full-festival view doesn't have to reselect it each session.
- Quick-amount chip set is mandal-configurable (admin sets the preset ₹ values for their mandal) rather than per-user — this is a mandal-level setting stored on the `mandals` table, not a personal UI preference.
- Notification/alert preferences (Section 4 of `phases.doc.md`) — e.g. whether a treasurer wants a push/SMS alert on every reconciliation discrepancy vs. a daily digest — stored per-user once notification infrastructure exists (Phase 4+).

**Implementation note:** device-local preferences use `localStorage` (not the offline-donation-queue's IndexedDB, which is reserved for transactional data per `rules.md`); cross-device preferences are a lightweight `user_preferences` table or a JSON column on `users`, kept separate from financial tables so preference writes never touch RLS-sensitive data paths.

---

*Companion documents: `PRD.md` (scope), `architecture.md` (system design), `rules.md` (standards), `phases.doc.md` (build phases), `schema_v2.sql` (database schema).*
