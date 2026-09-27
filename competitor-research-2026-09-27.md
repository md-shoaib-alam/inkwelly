# Competitor Research Report — Indian School ERP
**Date:** 2026-09-27 · **Window:** 2026-06-27 → 2026-09-27 · **Owner:** com (Product)

## Scope
Benchmark recent product change at Indian K-12 school management SaaS vendors, across the full
product surface (fees, parent comms, attendance, exams, mobile, AI, pricing), to inform our next
backlog prioritisation decision.

**Verified competitor set used:** Fedena, Vidyalaya (VapsTech), School Thinker, EduGradUP,
mPencil, Inkwelly, Entab/CampusCare, Pathshala ERP, OpenEduCat.

**Removed from scope — names proposed in scoping were unverified and wrong:**
- `C2Rihino` — not found. No site, listing, or press. Treat as fabricated.
- `Ganga Cloud` (as school ERP) — not found. Only `srigangacloud.in`, a Google Workspace reseller (different business).
- `Uniclox` — real but out of market: uniclox.com → uniclox.co.za, a South African biometric time-and-attendance vendor.
- `VidyaLeaf` — real but not an ERP: an Odisha exam-prep content site; vidyaleaf.com is a parked domain.

## Source Coverage
| Read directly | Blocked / unverifiable |
|---|---|
| fedena.com (home, our-story, pricing, feature-tour), Apple App Store Fedena listing, vidyalayaschoolsoftware.com (home, blog index, AI-SMS, Admission CRM), schoolthinker.com (2 posts), edugradup.com, mpencil.in, pathshalaerp.in, openeducat.org/pricing, inkwelly.com/pricing, schoolites.com, schoolerpindia.com, mysmartschool.co.in, EduFlex LinkedIn post, Mordor market report, clast.io, nascorptechnologies.com | Google Play "updated on" (JS-rendered — no parseable date), Capterra (403), G2 (403), Quora (403), Reddit threads (login wall), softwaresuggest pricing (404), Fedena Facebook post (metadata only), Scribd pricing PDF (truncated) |

**Critical structural gap:** no competitor in this market publishes a dated public changelog, and
mobile release recency cannot be verified on Play. Feature *shipping* dates are therefore
systematically softer than feature *announcement* dates.

## Executive Summary
Three things changed in this window, and none of them are feature launches we cannot answer.

1. **The mid-market battle has moved to pricing structure, not features.** Budget per-student
   pricing (₹49–199/student/yr, ₹9k/yr flat, freemium under 100 students) is now openly marketed
   against ₹50k–₹1L flat annual suites. School Thinker is running a land-grab (free onboarding for
   first 500 schools, dated 2026-08-20). This threatens our commercial position directly, our
   roadmap not so much.
2. **"AI" became a mid-market qualification keyword.** Vidyalaya published eight dated AI-positioned
   posts between Aug 18 and Sep 21 and packages AI modules as named SKUs. Fedena shows **zero** AI
   positioning. We show zero. This is a shortlisting/perception gap, not yet a proven value gap.
3. **Fee-collection reliability is the highest-confidence in-window pain signal**, and the strongest
   wedge available to us. Fedena shipped an iOS build on 2026-07-03 whose entire changelog is
   "payment issues fixed"; an Aug 31 vendor workflow piece describes the classic
   "debited but still shows due" reconciliation failure. We are Razorpay-native already.

**Recommended decision:** prioritise a **fee exception + reconciliation workflow** as the next
commercially differentiated build, ship **one** concrete AI admin assist (not an "AI copilot"
umbrella), and force a **pricing model decision** this quarter. Confidence: medium-high on pricing
and fee pain (multi-source, published), medium on AI (announcement-based, value unproven).

## Key Signals

### S1 — Fedena's only confirmed in-window change was a mobile payment bug fix
- **Change:** iOS v1.3.662 released 2026-07-03, changelog verbatim "payment issues fixed"; Play metadata date 2026-07-01.
- **Also:** latest versioned release is **Fedena 5.2, March 2026** — outside window, but still homepage-bannered as "New!" today. Notably 5.2's headline includes *Razorpay Payment Gateway Integration*, which we already run. No versioned release in ~6 months.
- **Sources:** [App Store](https://apps.apple.com/us/app/fedena-mobile-app/id1474936818) · [our-story](https://fedena.com/company/our-story) · [feature-tour](https://fedena.com/feature-tour)
- **Category:** UX/workflow change (mobile) + positioning (stale banner) · **Confidence: high** on the release date (read directly); medium on "momentum" inference from a single absence.
- **Why it matters:** fees is their demonstrated weak point *and* our existing strength. Their cadence suggests the installed base is in maintenance, not expansion.

### S2 — Vidyalaya is running a deliberate AI-first repositioning
- **Change:** dated posts — "AI Powered School Payroll Management" (Sep 21), "AI Copilots for School Administrators: 10 Tasks You Can Automate Today" (Sep 18), "AI Student ID Card Software" (Sep 16), "Why Every Modern School Needs an AI Powered School ERP" (Aug 26), "AI Based Student Academic Performance Software" (Aug 24), "School Bus GPS Tracking" (Aug 21), "Scheduling: Timetables, Exams & Staff" (Aug 18), "Outcome Based Education" (Aug 27). Product pages list AI modules as **named SKUs**: AI Timetable, Lesson Plan, Admission, Accounting, Exam Seating, Transport, Alumni, Fees, Attendance, Inventory, Holiday Planning — plus a standalone **Admission CRM**.
- **Sources:** [blog index](https://www.vidyalayaschoolsoftware.com/blog/) · [AI-powered SMS](https://www.vidyalayaschoolsoftware.com/ai-powered-school-management-software) · [Admission CRM](https://www.vidyalayaschoolsoftware.com/products-services/admission-crm-software)
- **Category:** new feature (claimed) + positioning change · **Confidence: high** for publication dates; **medium** that these are shipped features vs. content marketing — no changelog corroborates them.
- **Why it matters:** the SKU naming is what schools put in tenders. Their OBE content also tracks NEP 2020 / CBSE 2026-27 compliance language, which is a procurement checklist item we should confirm coverage of. No public pricing found (gap).

### S3 — Price-structure pincer on the mid-market
- **Change (state, partially in-window):** EduGradUP ₹9,000+/yr flat, 43 modules, no per-student fee (Mar 2026); mPencil "India's cheapest premium school ERP", free to 100 students, Core ₹21/student/yr, Premium ₹50/student/yr; Inkwelly ₹49/99/199 per student/yr with 90-day pilot; School ERP India ₹5k–20k with **50% renewal** and **+18% GST** stated openly; Schoolites ₹15/student/month with SMS/WhatsApp/GPS billed separately; Fedena ₹50k/₹75k/₹1L flat annual. School Thinker pushes a **₹4/student** narrative (Jul 21) and **free onboarding for first 500 schools** (Aug 20, confirmed on page).
- **Sources:** [schoolsoftwareindia.com](https://schoolsoftwareindia.com/) · [mPencil](https://www.mpencil.in/blog/cheapest-school-erp-india-2026) · [Inkwelly](https://inkwelly.com/pricing) · [School ERP India](https://schoolerpindia.com/pricing.php) · [Schoolites](https://schoolites.com/school-management-software-pricing) · [Fedena](https://fedena.com/pricing-and-plans) · [School Thinker](https://www.schoolthinker.com/blog/best-entab-campuscare-alternative-for-schools)
- **Category:** pricing/package change · **Confidence: high** (published, multi-vendor, cross-checked) — medium on staleness for MySmartSchool (₹5/student/month, date unconfirmed).
- **Why it matters:** we are structurally exposed in the ₹50k flat-annual band while the entry decision is now made at ₹9k flat or ₹50/student/yr. And "hidden costs" (GST, renewals, SMS) is the attack vector rivals are already using.

### S4 — Fee payment exceptions are the recurring, specific user pain
- **Change:** Schylva published a school fee-payment exceptions workflow (2026-08-31, in window) naming "Debited, but the fee still appears due", duplicate payment attempts, and manual reconciliation. Schoolites documents UPI errors, gateway downtime, and receipt gaps as standing school-side problems and separately monetises SMS/WhatsApp/GPS.
- **Sources:** [Schylva](https://schylva.com/resources/school-fee-payment-exceptions-workflow/) · [Schoolites](https://schoolites.com/school-problems/online-fee-payment-issues)
- **Category:** user pain point · **Confidence: medium-high** — in-window and specific, but **vendor-authored**, so it evidences a market talking point more than independently verified complaints.
- **Why it matters:** this is the one pain that maps exactly onto an area where our stack is already advantaged (native Razorpay, multi-role web + mobile). Fixing it is a credibility play, not a science project.

### S5 — Parent-app non-adoption is a stated theme but the weakest-evidenced one
- **Change:** multiple sources report parents defaulting to WhatsApp groups instead of school apps (Schoolites, date unconfirmed; Byntix 2026-04-25 vendor blog, outside window; CBGA article from 2019 on WhatsApp-in-school problems).
- **Category:** user pain point · **Confidence: medium-low**, and **heavily out-of-window / single-source**. Flagging as a hypothesis to validate, not a finding to build on.
- **Why it matters:** our Expo parent app is a real cost line. If non-adoption is structural in India, mobile investment may need to go into WhatsApp-side notification delivery rather than a better native app.

### S6 — Positioning whitespace: nobody publishes a changelog
- **Change:** Fedena's GitHub releases page reads "There aren't any releases here"; Softwarereviews' newest Fedena review is Oct 2024; no competitor in the verified set has a dated public changelog. Separately, OpenEduCat runs an active comparison page attacking Fedena for lacking a full ERP, built-in LMS, robust APIs, and for higher cost.
- **Sources:** [GitHub](https://github.com/projectfedena/fedena/releases) · [OpenEduCat](https://openeducat.org/compare/fedena/) · [Softwarereviews](https://www.softwarereviews.com/products/fedena?c_id=161)
- **Category:** positioning / opportunity · **Confidence: high** for the absence, **low** for the OpenEduCat claims themselves (vendor-biased).
- **Why it matters:** public shipping cadence is unclaimed in this category. A visible changelog is a cheap trust signal none of our verified rivals can match today.

## Feature / Positioning Comparison

| Dimension | Us (drizzelfull) | Fedena | Vidyalaya | Budget tier (EduGradUP / mPencil / Inkwelly) |
|---|---|---|---|---|
| Fee collection | Razorpay native | Razorpay added Mar 2026 | AI Fees SKU (claimed) | gateway-dependent |
| Fee exception handling | unverified | **actively patching bugs (Jul 2026)** | not stated | not stated |
| Mobile | Expo, current | iOS+Android, maintenance mode | app exists, update date unverifiable | mixed |
| AI positioning | **none** | **none** | **8 posts + full AI SKU line** | mostly none; ₹4/student AI narrative |
| Admissions CRM | not confirmed | add-on | **standalone product** | varies |
| Pricing transparency | not found | published flat | **not published** | published, aggressive |
| Public changelog | none | none | none | none |
| Modern web UX | Next.js 16 / Tailwind v4 | "dated UI" cited by third parties | n/a | unknown |

## Product Implications

**Threat (act):** pricing structure. Not a feature gap — a commercial-model gap that no roadmap item fixes.
**Parity gap (close, cheaply):** AI keyword presence in mid-market tenders, and NEP/OBE compliance language.
**Opportunity (wedge):** fee reliability + reconciliation, monetisable as the reason to switch from Fedena.
**Opportunity (cheap):** public changelog and visible shipping cadence — uncontested in this category.
**Not a gap yet:** parent-app adoption, which remains an unvalidated hypothesis with out-of-window evidence.

## Requirement Suggestions

> Each is a proposal with a hypothesis and validation path, not a committed scope item. All require owner sign-off before entering the backlog.

**R1 — Fee exception & reconciliation workflow** *(highest priority)*
Detect and surface: debited-but-unpaid, duplicate attempts, failed-webhook, and unreconcied Razorpay settlement vs. ledger; give accounts staff one resolution queue and auto-generated receipts/dunning.
- **Target user:** school admin / accounts desk, plus parents chasing receipts.
- **Hypothesis:** fee exception handling is the deciding operational pain when schools evaluate a switch, and our native Razorpay position makes it achievable at low cost.
- **Validation:** pull our own PostHog + support data on fee-related tickets before building; if volume is low, this is a *marketing* wedge rather than a build. Interview 3–5 school accounts staff on Fedena/Entab.
- **Evidence strength:** medium-high (in-window, multi-source, but vendor-authored).

**R2 — Ship one concrete AI admin assist, named as a task not a platform**
Auto-generated timetable or teacher-report drafting — whichever validation shows is actually bought. No "AI copilot" umbrella.
- **Target user:** principal / academic coordinator; procurement staff.
- **Hypothesis:** AI is currently a shortlisting keyword rather than a retention driver; matching one named SKU neutralises most of Vidyalaya's advantage at small effort.
- **Validation:** ask sales/CS whether AI appeared in any lost or stalled deal in the last 6 months. If it never did, downgrade this to messaging work and skip the build.
- **Evidence strength:** medium — announcement dates confirmed, shipped value unproven.

**R3 — Pricing model decision + honest cost disclosure page**
Decide between published per-student/yr entry pricing vs. flat annual, and publish a total-cost page that names GST and renewal explicitly (turning rivals' "hidden cost" attack into our credibility).
- **Target user:** budget-constrained 100–500 student schools.
- **Hypothesis:** we lose the sub-₹20k/yr segment entirely on structure, not product quality.
- **Validation:** win/loss review on the last 10 lost deals; model margin at ₹50–200/student/yr before committing.
- **Evidence strength:** high on competitor prices (published, cross-checked).

**R4 — Public changelog + mobile release visibility**
Ship a dated changelog page and in-app "what's new" on the Expo client.
- **Hypothesis:** visible cadence is an untaken trust signal in a category where no rival publishes anything.
- **Validation:** cheap enough to run as an experiment; measure against demo-request conversion.
- **Evidence strength:** high on the absence, unknown on impact.

**Explicitly not recommended:** a parent-app expansion on the strength of S5. Evidence is out-of-window, single-source, and vendor-authored. If parent engagement is to be pursued, test WhatsApp-channel delivery first.

## Open Questions and Next Sources
1. Are Vidyalaya's AI SKUs shipped or content-marketing? Needs a demo request / sales-engineering probe — no public changelog will tell us.
2. What is our own fee-ticket volume? R1's priority depends on our data, not competitor blogs. **Cheapest decisive next step.**
3. Did AI appear in any lost deal? Gates R2.
4. Google Play "updated on" dates for Fedena, Vidyalaya, EduGradUP — unreadable via fetch this session. Needs `browser-harness` (browser interaction) to confirm mobile release recency.
5. Independent complaint text: Capterra, G2, Quora, and Reddit all blocked (403 / login wall). A browser-harness pass with the user logged in would upgrade S4 and S5 from medium to high confidence.
6. Vidyalaya publishes no pricing — a quote request would reveal the mid-market band we're actually competing in.
7. Is NEP 2020 / OBE / UDISE+ compliance a scored tender requirement for our buyer profile, or content noise? Unresearched this pass.

## Confidence Statement
Pricing conclusions are the most reliable in this report (multi-vendor, published, cross-checked).
Fedena's mobile payment fix is the most reliable single in-window competitor *action*.
Everything about competitor *feature shipping* is soft, because this market publishes no
changelogs and app-store metadata was unreadable. Pain themes rest on vendor-authored content —
treat them as market talking points to validate against our own support data, not as independent
user research.
