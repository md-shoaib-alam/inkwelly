# Changelog parity — plan

Date: 2026-09-28
Input: `docs/research/changelog-gap-ledger.md` (148 entries, evidence per row), `docs/research/changelog.json` (raw)
Status: awaiting the decision in §1

## 0. Headline

inkwelly.com published 148 changes between 10 Jan and 27 Sep 2026. Against this repo copy: **5 present, 51 partial, 92 absent.**

The five that exist are infrastructure-shaped, not features: multi-tenant isolation, role dashboards, dashboard caching, platform-owned FCM push, and IP logging on login. Everything a school would notice as a *product* is either missing or a screen that does less than the changelog claims.

## 1. The decision that changes everything

92 absent entries cannot be "added" in one meaningfully different way from another, but they can be obtained in two completely different ways, and I need you to pick before any plan is real:

| | reading | what the work actually is |
|---|---|---|
| **A** | inkwelly.com is built from your **main repo**, which is far ahead of this copy | This is a **sync problem**. Reimplementing 92 features here would deliberately produce worse versions of code that already exists. The plan becomes: identify the production branch, merge or port it, then use this ledger as the verification checklist that nothing was lost. |
| **B** | this copy **is** the product, and the changelog describes what you intend to ship | This is a **roadmap**. The plan below is the build order, and it is roughly 12–18 months of solo work, not a weekend. |

Evidence for A: this copy has no AI module at all, yet the site shipped seven AI entries in September alone; it has no payment gateway in `fees.ts` (0 references), yet the site shipped Razorpay fee payment in May; the `emailWorker` in `apps/server/src/lib/worker.ts:263` is a `console.log` stub, yet the site claims automatic receipt email delivery. Real production could not have shipped those from this code.

**Do not start building until you answer A or B.** If A, the entire second half of this document is unnecessary.

## 2. Why the order below is dependency-ordered, not wish-ordered

Three findings from the ledger drive the sequence:

1. **A missing channel blocks ~20 separate features.** Email is a stub, and there is no SMS, WhatsApp or push-template plumbing for transactional messages. Entries 74, 77, 94, 95, 98, 124, 125, 127, 135 and the whole missed-bus/late-fee notification set all fail on the same absent layer. Build the channel once; nine changelog entries unblock.
2. **A missing gateway blocks the entire money spine.** Razorpay exists but is wired only to `subscriptions.ts` (the platform's own billing). Fee payment, transport payment, receipts, MDR/GST reconciliation, UPI links, late-fee charging and payment QRs are all downstream of wiring the gateway into `fees.ts` and `transport.ts`.
3. **Many "partial" rows are one field away from done.** 51 partials, and a large share are missing a single schema column (`lateFee`, subject `order`, leave `balance`, payment `settlementStatus`) rather than a whole screen. Cheap, high-count wins — but they still need a migration, so they cannot be scattered randomly.

## 3. Phases

### P0 — Delivery channels (unblocks the most per hour spent)
| work | changelog entries it lands |
|---|---|
| Replace the stubbed `emailWorker` with a real provider; per-tenant domain alignment | 81, 74 |
| Add a WhatsApp + SMS channel to the notification fan-out, with a quiet-hours filter and dedupe | 77, 94, 95, 98, 127, 135, 18 |
| Read receipts and delivery status on parent comms | 124, 125 |
| Notification preference centre (per role, per channel) — prerequisite for all of the above, currently absent | implied by 54, 56, 70 |

Exit bar: one seeded fee event produces a real email, a real push, and a logged WhatsApp attempt, visible in a status screen.

### P1 — Payments and receipts (the money spine)
| work | entries |
|---|---|
| Gateway on fee + transport invoices, not just platform plans | 66, 73, 79, 146 |
| Receipt PDF with QR verification, thermal sizing, Hindi | 75, 82, 93, 119, 144 |
| Auto-deliver receipt on payment across channels | 74, 77 |
| MDR / GST / settlement columns and a gateway-charges report | 78 |
| UPI collect links per invoice | 76 |
| UPI-style PIN + geo gate on counter collections | 15 |

### P2 — Fees and transport policy depth (17 + 13 gaps, the largest existing-module deficit)
Late-fee accrual with configurable base (balance vs full), waiver display, per-invoice concession and fine targeting with undo, bus-fee installments and mid-term catch-up, odometer and fuel logs, promotion carrying unpaid fees as one opening balance, promotion undo. Entries 16–22, 29, 65, 85, 105, 107.

### P3 — Whole missing modules (each is schema + routes + web + mobile)
Ordered by how often a school asks, not by size:
- **Attendance intelligence** — geofenced staff check-in, face/liveness tiers, auto-mark absent, check-in reminders, QR cross-device login (8–12, 104)
- **Live bus tracking** — driver app, GPS timeline, route drawing, boarding list, missed-bus alert, parent freshness UI (25, 67–72, 130, 134)
- **Payroll + HR** — departments, holds, skips, one-off amounts, HR reports, LOP, Tally export (26, 83, 84, 122, 128)
- **Student diary** — read/write with per-child permissions, parent note page, full-year view (14, 27, 37)
- **Admissions CRM** — enquiry pipeline, visit/offer automation, public admission form, document verification (48, 58, 59, 137, 142)
- **Marksheet depth** — co-scholastic model, custom grade scales, clone, publish lock, verification page (112, 114, 116, 117, 120, 121, 109)
- Smaller verticals, one screen each: house system, grievances/safeguarding, achievements/competitions, library, store, health records, letterhead, media library, quiz/games, class-test module (35, 36, 38, 50–53, 62, 63, 88, 100, 131, 133)

### P4 — AI (the September wave)
Seven entries dated 25–27 Sep plus three from July: assistant launch, whole-school data compute, Excel/PDF generation, rich cards, shareable chat links, skills and screen guides, AI timetable and class setup, MCP connectors. This is one platform decision, not seven features: model provider, tenant data access, row-limit policy, credit metering, approval-gated writes, audit. Budget it as its own project; it is the single largest item in this document and the one a solo builder is most likely to want to skip.

### P5 — Claims that are not features
Entries 57, 116, 132, 148 and the "2x/3x faster" language are performance statements. They cannot be implemented from a changelog; they need a measurement first (bulk-mark timing on a real device, dashboard p95, cold start). Treat as a benchmark task, then a fix list.

## 4. Relationship to the module restructure

The pending `docs/superpowers/specs/2026-09-28-feature-module-restructure-design.md` moves ~1,400 files into 16 modules. If you build the P0–P4 work first, the restructure gets 40% bigger and much harder. If you restructure first, every feature below lands in its final home and the boundary lint catches the drift.

Recommended: **restructure the finance slice (spec step 1) → then P0 and P1**, which are fees/payment-adjacent and land in the module you just shaped. Hold P3 and P4 until the layout is settled.

## 5. Also found while verifying (real defects, not gaps)

- `apps/server/src/lib/worker.ts:274` — `FEE_TEMPLATE_URL` hotlinks a image from `i.pinimg.com` as the fee receipt template. It will break in production, is not tenant-brandable, and leaks school traffic to a third-party CDN. Should be a local asset or an uploaded tenant logo.
- One changelog entry (`d56c480…`, 4 Jun, "location consent dialog for drivers") has an empty body on the live site — the entry was published with no description.

## 6. What I need from you

1. **A or B** from §1.
2. If B: which of P0–P4 is the goal for the next 4 weeks. Not all of it — the ledger says 92 absent, and I will not pretend that is a one-session job.
3. Whether the restructure spec stays ahead of this, as §4 assumes.
