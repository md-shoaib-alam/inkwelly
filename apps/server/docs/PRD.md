# PRD: SchoolSaaS — Multi-Tenant School Management Platform

**Version**: v1.1
**Author**: [founder]
**Date**: 2026-09-24
**Status**: Draft (living document) — v1.1 adds the nine GA-blocking gaps found in the v1.0 review
**Product type**: B2B SaaS (multi-tenant), India K-12 schools
**Depth**: Platform overview — each module is specified at review depth, not dev depth. Per-module detailed PRDs are spun off from this document.

---

## 1. Background & Goals

### 1.1 Background

Indian K-12 schools still run daily operations on paper registers, WhatsApp groups, and Excel. The result: teachers lose 20–40 minutes per day on attendance and notices, parents get unreliable updates, and fee collection is opaque and slow to reconcile.

Why now:

1. **Cheap smartphones + UPI are universal** among parents and teachers, so a mobile-first school app no longer has an adoption barrier.
2. **UPI/subscription billing (Razorpay)** makes a ₹499–₹3,999/month SaaS price point viable for small and mid-size schools.
3. **The product is past the MVP stage** — attendance (including QR-based staff attendance), fees with receipts, notices with push notifications, and subscription billing are already built and running on production infrastructure. This PRD consolidates what exists, defines what "general availability" means, and sets the sequencing for what comes next.

Cost of not doing it: the platform stays a collection of features without a clear GA bar — plan limits, history windows, and quiet-hours rules get decided ad hoc (several already have, and are codified here so they stop being re-litigated).

### 1.2 Target users

| User role | Who they are | Core need | Primary surface |
|---|---|---|---|
| **Super Admin** (platform operator) | The SaaS owner/ops — that's you | Onboard schools, manage plans & billing, keep the platform alive | Web platform console |
| **School Admin** | Principal / office staff of a school | Run the school: people, classes, fees, attendance, announcements | Web admin panel |
| **Teacher** | Class/subject teachers | Mark attendance fast, assign homework, record grades, see their day | Web + mobile |
| **Student** | Enrolled students | See attendance, timetable, homework, grades, notices | Mobile app |
| **Parent** | Parents/guardians | Know their child is safe & progressing; pay fees without queueing | Mobile app |
| **Staff** | Non-teaching staff (bus, office, security) | Check in/out, receive notices | Mobile app |

### 1.3 Business goals & success metrics

> Targets below are **proposed defaults** for a solo-founder launch — confirm or replace before treating them as committed.

| Goal | Metric | Target (proposed) | Measured via |
|---|---|---|---|
| Prove willingness to pay | Paying schools on active subscription | 5 schools within 90 days of GA push | Subscriptions dashboard |
| Retain paying schools | Monthly logo churn | < 5% | Subscription status over time |
| Become daily-use for staff | Daily active teachers / total teachers (school-day average) | > 60% | PostHog activity |
| Own the parent relationship | Parents opening the app on a school day | > 40% of linked parents | PostHog activity |
| Keep attendance honest | QR/scanned check-ins vs manually-overridden ones | > 80% scanned | Attendance source breakdown |
| Fee collection online share | Fees paid online (Razorpay) / total fees collected | > 30% by month 6 | Fee receipts by payment mode |

---

## 2. Requirements overview

One platform where a school runs its daily operations (people, attendance, fees, academics, communication), parents and students get a mobile window into the school, and the platform operator manages tenants, plans, and billing — with every school's data fully isolated.

### 2.1 Explicitly out of scope (v1.x)

If it's not listed here and it isn't in §3, it doesn't exist until a PRD says so.

| Out of scope | Why not | Revisit when |
|---|---|---|
| Accounting / ERP / payroll / salary slips | Schools already run Tally or an accountant; we are not a ledger | paying school asks twice |
| Admission CRM & enquiry management | Different buyer (admissions office), different sales cycle | post-GA, separate product decision |
| Online exams with proctoring | Webcam proctoring is an engineering + trust sink; not a differentiator for our segment | demand + a partner |
| Live/recorded classes, LMS content library | Competes with paid platforms schools already use | never by default |
| WhatsApp/SMS as delivery channels | Not built; cost & template approval overhead | see open Q4 |
| Multi-school groups (one admin across brands) | One tenant per school today | group-school customer inquiry |
| Custom fields / report builder | Infinite scope; fixed exports cover most needs | month 6+ |
| Student library, inventory, hostel, canteen | Separate verticals | post-GA |


---

## 3. Functional design (module by module)

Priorities: **P0** = must be solid for GA, **P1** = strongly differentiating, **P2** = later.

### Domain A — Platform onboarding & accounts

#### 3.1 Authentication & roles (P0)
**What**: Login for all six roles via Firebase-backed identity; role decides the entire experience. JWT sessions with refresh-token rotation.
**Story**: As any user, I log in once and land on the right home for my role.
**Key rules**:
1. Exactly one role per account; a person with two roles (e.g., teacher + parent) uses separate accounts for now [open question: account linking, §12].
2. Session refresh uses rotating refresh tokens with reuse detection — a reused old token bans the pair.
3. Password reset and email verification go through the identity provider's flows.
**Exceptions**: expired session → silent refresh, else login screen; refresh-token reuse → force logout on all devices.

#### 3.2 Tenant onboarding & subscription management (P0)
**What**: A school signs up, picks a plan, pays via Razorpay, and gets a working workspace. Super Admin provisions/retires tenants.
**Story**: As a School Admin, I subscribe in minutes and invite my staff; as Super Admin, I can see every tenant, its plan, and its billing status.
**Key rules**:
1. Plans (INR/month): **Starter ₹499** — 100 students / 20 teachers / 100 parents / 10 classes; **Growth ₹1,499** — 500/50/500/30; **Institution ₹3,999** — 2,000/150/2,000/100.
2. Attempting to add people beyond plan limits shows an **upgrade prompt (CTA), never a hard error** — the upgrade path is always one click.
3. Subscription states: active, past-due (grace period [TBD: days]), suspended (read-only), cancelled.
4. Razorpay is the payment source of truth; webhook events drive subscription state.
**Exceptions**: webhook delayed/missed → reconcile on payment-verification retry, never block a successful payer; payment failure → clear message + retry path, school stays active during grace.

#### 3.3 People management & parent linking (P0)
**What**: CRUD + bulk import for the school's people, and the verified links that make them visible to each other (student ↔ parent ↔ class).
**Story**: As a School Admin, I bulk-import my students and parents at year start; as a Parent, I get one link that proves I own that child record — without support involvement.
**Key rules**:
1. Import validates rows and reports per-row failures with reasons; it never imports a partially-valid file silently.
2. Every person record belongs to exactly one school.
3. Archiving (not deleting) is the default removal — history must survive.
4. **A parent account only sees a child after the school asserts the link** — the school creates the link during import/onboarding (roll-number ↔ phone), and the parent confirms by phone OTP. Parents never self-serve "add my child" by search.
5. One student may have multiple linked guardians (mother, father, grandparent); all linked guardians see the same record, and all receive the same notifications.
6. A link is revocable by the school admin at any time; revocation is immediate on next request, and the removal is audit-logged with reason.
7. First-login setup: a newly linked parent/guardian must set a password and accept the data-processing consent before child data renders (DPDP posture, §7).
8. A student account is created by the school and issued with login credentials; students do not self-register.
**Exceptions**:
- Phone already attached to another parent account → offer "add as second guardian", never create a duplicate account.
- OTP wrong 5× in 15 min → throttled, admin notified.
- Import row where a student's guardian phone is missing → student imports fine, guardian row queued to a "needs linking" list for admin follow-up.
- Bulk import of >2,000 rows [TBD: hard cap].

### Domain B — School operations core

#### 3.4 Classes & subjects (P0)
**What**: Academic structure — classes/sections, subjects, teacher assignments.
**Rules**: a class has 1..n sections; subjects attach to classes; one designated class teacher per section.

#### 3.5 Student attendance (P0)
**What**: Teachers mark daily attendance (present/absent/late/half-day); admins see reports; parents and students see their own history.
**Key rules**:
1. **History visibility is plan-gated** (current policy): parent view — 1 month back on Starter/Growth, 6 months on Institution; student own view — 6 months; admin/teacher full-history browsing — 7 days Starter / 14 days Growth / 28 days Institution. Browsing a single specific date is always allowed.
2. Parents only ever see their own children; students only themselves.
3. An edit audit trail (who changed what, when) is kept for attendance changes after submission.
4. **Bulk-mark is the primary teacher path, not a convenience**: a teacher with 6 classes × ~40 students must be able to get a class fully marked in under 60 seconds — one tap per absent student against an "all present" default, no per-row confirming, no scrolling re-layout while typing. This is a hard usability requirement for the 07:45–08:15 IST window (§7).
5. The mark screen must be usable one-handed on a mid-range Android phone in a corridor, with class and date visible at all times.
**Exceptions**: marking after cut-off time → allowed but flagged as "late entry" [TBD: cut-off]; duplicate marking same date → replace with audit entry, not silent overwrite.

#### 3.6 Staff attendance via rotating QR kiosk (P0)
**What**: On-campus check-in for teachers/staff/admin via a live rotating QR code displayed on a school screen/kiosk, with a 6-digit backup code; checkout from the app.
**Key rules**:
1. QR rotates every **120 seconds**; a successful scan **burns the code instantly** (one scan, one person).
2. The kiosk token carries no personal data and is never cacheable; rotation is scheduled against the server clock.
3. **Remote self check-in is disabled** — check-in requires scanning the live QR or the kiosk backup code, on campus. Checkout is allowed from the app once checked in.
4. Scannable roles: teacher, staff, admin, super_admin. Students and parents cannot scan.
5. One check-in per person per day; second check-in is rejected with "already checked in".
**Exceptions**: expired QR between scan & submit → friendly "code expired, scan again"; kiosk offline → backup code path; screenshot relay attack mitigated by rotation + burn.

#### 3.7 Fees & receipts (P0)
**What**: Fee structures per class, invoices, online payment (Razorpay) and offline recording, receipts, dues tracking.
**Story**: As a parent, I pay my child's fee from the app and get a receipt instantly; as admin, I see collected vs dues at a glance and record cash/cheque payments.
**Key rules**:
1. Every payment generates a receipt (numbering per school, sequential).
2. Online payments confirm via Razorpay webhook before marking paid; the parent never sees a false "paid".
3. Offline payments recorded by admin show payer + recorder on the receipt.
4. Dues reminders go out respecting quiet hours (§3.9).
5. **Partial payment is a first-class case**: a parent may pay part of an invoice (admin-configurable minimum or free amount); the invoice shows paid / balance, and the remaining balance stays in dues — it never silently becomes "paid".
6. **Refunds**: a school admin can raise a refund against a receipt, full or partial, with a mandatory reason. Online refunds route back through the original payment method; cash refunds are recorded, not moved. A refunded receipt keeps its number and shows refund status — receipts are never deleted or renumbered.
7. **Advance / adjustment**: an overpayment or a fee waiver becomes a credit on the student's account that can be applied to a later invoice; every adjustment names the admin who made it.
8. **GST treatment**: fee receipts and SaaS subscription invoices carry GST per Indian rules — place-of-supply and rate configuration is school/platform-settable [TBD: which side configures GST, and whether the platform's own ₹499–₹3,999 billing is GST-registered from day 1]. See risks (§11) and open Q9.
9. Payment mode (online / cash / cheque / UPI-collected-on-campus) is stored on every receipt and is the basis of the "online share" metric (§1.3).
**Exceptions**: webhook arrives before redirect → idempotent, no double receipt; payment pending > 30 min → auto-expire and release the invoice; refund fails at gateway → invoice stays paid, admin sees a retryable refund error, parent sees nothing alarming; partial payment that overshoots the balance → rejected at entry, not corrected afterwards.

#### 3.8 Dashboards (P0)
**What**: Role-appropriate home: admin gets today (attendance %, fee collection, pending items); teacher gets their classes today; parents get their child's day.
**Rule**: dashboard data is cached and refreshed on school-day mornings (IST peak) without manual reload.

### Domain C — Teaching & learning

#### 3.9 Notices, events & notifications (P0)
**What**: School announcements and events, delivered in-app and via push (FCM), targeted by role/class.
**Key rules**:
1. **Quiet hours 21:00–07:00 IST**: queued notifications wait and go out at 07:00; nothing non-urgent pings a parent at night.
2. Targeting: whole school, role groups, or specific classes.
3. Every notice is readable in-app even if the push is missed.
**Exceptions**: push token invalid → prune and fall back to in-app only; delivery failure logged, never shown to sender as "sent" [TBD: current sender feedback].

#### 3.10 Homework & submissions (P1)
Teacher assigns (text/attachment) → student sees it → submits → teacher marks. Rules: due-date reminders respect quiet hours; late submissions visibly flagged.

#### 3.11 Exams, grades & assessments (P1)
Exam scheduling per class, marks entry by subject teachers, grade computation per school policy, report visibility to students/parents (subject to the same history windows as attendance).

#### 3.12 Timetable (P1)
Class-wise and teacher-wise weekly timetable; teacher's "today" view is the primary surface.

### Domain D — Communication & support

#### 3.13 Support tickets (P1)
School admin raises tickets to the platform operator; threaded replies; status lifecycle (open → in-progress → resolved). SLA [TBD].

#### 3.14 Student promotion (P1)
End-of-year bulk promotion of students to the next class, with a promotion history retained per student; reversible before the next session starts.

### Domain E — Platform operations & later modules

#### 3.15 Platform console (super admin) (P0)
Tenant list with plan & billing status, subscription lifecycle actions, platform settings, and an **audit log of every super-admin action** (who did what, when).

#### 3.16 Roles & permissions (custom roles) (P1)
School admins can define custom staff roles from permission bundles. Baseline six roles are fixed.

#### 3.17 Certificates & admit cards (P2)
Generate per-student PDFs (participation, merit) and exam admit cards from templates; stored files downloadable by the student/parent.

#### 3.18 Transport (P2)
Route/vehicle records and student-route assignment; parent view of assigned route.

#### 3.19 Import/export (P1)
Bulk export of people, attendance, and fees (CSV/Excel) for a school's own records — export scope never exceeds what that role can already see.

### Domain F — Resilience & reach

#### 3.20 Offline & low-connectivity operation (P1)
> **Priority downgraded P0 → P1 on 2026-09-25.** This was added because patchy connectivity is *plausible* in Indian schools, not because any school has reported it. It ships when the first pilot reports a connectivity failure, not before — building it blind means inventing conflict rules nobody has asked for. The rules below stand as the design when it is triggered.

**What**: The two highest-frequency actions — a teacher marking attendance and a staff member scanning the QR — must survive the network conditions Indian schools actually have (patchy campus WiFi, basement classrooms, 2G corners).
**Story**: As a teacher in a room with no signal at 08:00, I mark my class and the app does not lose it.
**Key rules**:
1. Attendance marking works offline: the class roster is available offline for today, entries are captured locally, and the queue uploads in the background when connectivity returns.
2. Offline entries are timestamped twice — when marked and when uploaded — and the record is attributed to the marked time, not the upload time.
3. Conflict rule: if the same class/date was already marked (by another device or an admin), the **later submission wins and the earlier one is kept in the audit trail** — never a silent merge, never a blocked teacher.
4. The screen always states the sync state ("saved on this device — not yet uploaded") while offline; a teacher is never told a mark is saved when it is only local.
5. **QR attendance is deliberately NOT offline** — an offline QR scan cannot be trusted (burn + rotation require the server). Offline fallback is the kiosk 6-digit backup code, recorded as pending-checkin with the same audit trail.
6. Notifications and receipts may fail offline; that is acceptable and must degrade to "will deliver when back online", not error.
**Exceptions**: local queue full (device storage) → warn the teacher to connect before marking more; upload rejected server-side (e.g. read-only suspended tenant) → surface the reason to the teacher, keep the local copy for support; app killed with unsent queue → queue survives restart.

#### 3.21 Localization (P2)
**What**: English plus Hindi and one school-configurable regional language for parent/student-facing screens; notice text stays as authored by the school.
**Rule**: language is a per-user preference with a school default; admin/teacher consoles stay English-only in v1 [TBD: which regional language first — decide from the first paying school's state].
**Rule**: dates, currency, and roll numbers render per locale; nothing in the permission or gating model changes with language.

---

## 4. Permissions matrix (role × capability × data scope)

| Capability | Super Admin | School Admin | Teacher | Student | Parent | Staff |
|---|---|---|---|---|---|---|
| Platform/tenants/billing | full | — | — | — | — | — |
| School people, classes, plans | — | full (own school) | read (assigned) | — | — | — |
| Student attendance | read | full (own school) | mark/view assigned | view own (6 mo) | view own kids (plan window) | — |
| Staff QR check-in | scan | scan + generate QR | scan | — | — | scan |
| Fees | read (ops) | full (own school) | — | view own dues | view/pay own kids' fees | — |
| Homework/grades/exams | — | full (own school) | manage assigned | view own | view own kids | — |
| Notices/events | platform-wide | publish (own school) | read | read | read | read |
| Tickets | full (platform queue) | raise for own school | — | — | — | — |
| Dashboards | platform health | school dashboard | teacher today | own | own kids | own |

**Data scope rules** (hold everywhere, every surface):
1. A school sees only its own data — no cross-school visibility, ever, including search and autocomplete.
2. Parents see only their linked children; students only their own records.
3. Super Admin sees operational/billing metadata across tenants; school academic content is accessed only for support, and every such access is audit-logged.
4. History windows (§3.5) apply identically on web and mobile.

---

## 5. Plans, limits & gating policy

| | Starter ₹499 | Growth ₹1,499 | Institution ₹3,999 |
|---|---|---|---|
| Students | 100 | 500 | 2,000 |
| Teachers | 20 | 50 | 150 |
| Parents | 100 | 500 | 2,000 |
| Classes | 10 | 30 | 100 |
| Attendance history (admin browse) | 7 days | 14 days | 28 days |
| Child attendance history (parent) | 1 month | 1 month | 6 months |
| Leaves history | 3 months | full | full |

> ⚠️ **Known inconsistency (decide before GA)**: attendance and leaves currently use two different gating schemes — day-level windows (attendance) vs the 3-months-on-basic policy (leaves). See open question 8, §12. Recommended default: unify on the 3-months-basic / full-history-standard+ family.

**Gating UX rule**: hitting any limit or window shows the data that is available plus an inline **upgrade CTA** — never a blank screen, never a bare 403. Every gated view fires an `upgrade_cta_shown` event (§8).

### 5.1 Commercial model additions

| Item | Policy | Status |
|---|---|---|
| Free trial | 14-day full-feature trial, no card required; trial schools get Institution-level history so the paywall is experienced as a downgrade, not a broken product | **proposed — confirm** |
| Annual billing | 2 months free on annual payment (≈16% discount); annual is the default pitch to schools, monthly is the entry path | **proposed — confirm** |
| Plan change mid-cycle | Upgrade prorated and immediate; downgrade takes effect next cycle (no partial refund of history already consumed) | **proposed — confirm** |
| Suspension | Past grace → workspace becomes read-only for the school; parents/students keep seeing published data (the school's reputation is not held hostage) | grace days TBD, open Q2 |
| Onboarding fee | Not charged; onboarding is bulk-import + parent linking done by the school, and it is counted as our real cost per logo (§1.3 churn risk) | decided: none |

### 5.2 Offboarding & data retention

1. A cancelled school can export all of its data (people, attendance, fees, grades, notices) in bulk before deletion — export is the same mechanism as §3.19, un-gated during cancellation.
2. Post-cancellation retention: [TBD — proposed 90 days for recovery, then deletion of personal data; academic aggregates may be retained anonymized for platform statistics].
3. Deletion is per-tenant and irreversible; the export window is stated to the school at cancellation, in writing.
4. Parent/guardian consent records (§3.3 rule 7) are retained with the school's records, since they are the school's compliance evidence, not ours.

---

## 6. Integrations & external dependencies

| System | Used for | Notes |
|---|---|---|
| Firebase Auth | identity, login | all roles |
| FCM (Firebase push) | notifications | quiet-hours aware |
| Razorpay | subscriptions & fee payments | webhooks are source of truth |
| Object storage (S3-compatible) | certificates, admit cards, attachments | private, signed URLs |
| PostHog | product analytics | §8 events |
| Sentry | error monitoring | ops only |

School-facing imports/exports use CSV/Excel. WhatsApp/SMS delivery [TBD: not built yet — decide before GA].

---

## 7. Non-functional requirements

| Category | Requirement | Acceptance |
|---|---|---|
| Performance | School-morning peak is 07:00–09:00 IST; QR scan → confirmation | < 1 s p95 for scan submit; dashboard < 2 s p95 at peak |
| Availability | School-day uptime priority | attendance + fees usable every school day 07:00–17:00 IST |
| Mobile release reality | App fixes need store review | server keeps backward compatibility with all published app versions; no breaking API changes without a migration window |
| Security | TLS everywhere; RBAC per §4; rate limiting on auth & QR endpoints | no cross-tenant access in any test; auth endpoints throttled |
| Privacy | India DPDP Act posture | PII never in QR payloads or logs; export limited to role scope |
| Reliability | Notifications | quiet-hours enforcement testable; failed pushes logged & retryable |
| Compatibility | Web: current Chrome/Edge/Safari; Mobile: Android + iOS via Expo app | core flows work on a 4-year-old mid-range Android |
| Offline capability *(conditional — binding only once §3.20 ships, P1)* | Attendance capture works with no connectivity; sync within 60 s of reconnect (§3.20) | airplane-mode marking, then reconnect → upload with no lost rows and no duplicates |
| Teacher throughput | One class of 40 marked in < 60 s on mobile | timed test on a mid-range Android, 3 consecutive runs |
| Localization | Parent/student surfaces available in English + Hindi at minimum (P2, §3.21) | no untranslated string on the 5 highest-traffic parent screens |
| Data lifecycle | Cancel → export window → deletion, per §5.2 | a cancelled tenant can produce a full export; deletion verified by query after retention period |
| Billing compliance | GST on fee receipts and on platform invoices; receipt numbering per school, gapless | a sample receipt and a sample platform invoice pass an accountant's review [TBD: legal] |

---

## 8. Data & analytics events

| Event | Fired when | Key properties | Purpose |
|---|---|---|---|
| `user_login` | login success | role, surface (web/mobile) | DAU by role |
| `attendance_marked` | student attendance submitted | method, class size | teacher adoption |
| `staff_checkin` | QR/backup-code check-in | role, method=qr/backup | honesty metric |
| `fee_paid` | payment confirmed | mode (online/offline), amount band | online share |
| `notice_published` / `notification_sent` | notice goes out | audience size, quiet-hours delayed? | comms health |
| `subscription_started` / `renewed` / `payment_failed` | billing events | plan, amount | revenue metrics |
| `upgrade_cta_shown` / `upgrade_clicked` | gating surfaces | gate type (limit/window) | conversion funnel |
| `guardian_link_sent` / `guardian_link_confirmed` | parent invited / OTP accepted | time-to-confirm | onboarding friction — the #1 adoption blocker |
| `attendance_offline_synced` | local queue uploads after reconnect | offline age, row count | how bad real connectivity is |
| `fee_refunded` / `fee_partially_paid` | admin or gateway refund / partial capture | amount vs invoice | collections reality |
| `trial_started` / `trial_converted` | trial lifecycle | plan, days to convert | trial ROI |
| `tenant_export_downloaded` | school exports data | module set, tenant age | churn early-warning |

---

## 9. Acceptance criteria (cross-module key flows)

| # | Scenario | Given | When | Then |
|---|---|---|---|---|
| AC1 | Teacher morning mark | teacher with an assigned class, school day | opens attendance and submits present/absent | saved in <2 s; absent students' parents become eligible for notification after submit |
| AC2 | QR honesty | live QR displayed, teacher on campus | scans QR | checked in instantly; code burns and won't scan again; kiosk shows the scan |
| AC3 | QR replay attack | one person scans | a second person scans the same code within the TTL | second scan is rejected and a fresh rotation is triggered |
| AC4 | Parent history gate on Starter | parent on Starter plan | opens child attendance history | sees the last 1 month + an upgrade CTA; no error |
| AC5 | Quiet hours | admin publishes a notice at 21:30 IST | — | parents receive the push at/after 07:00 IST; the notice is visible in-app immediately |
| AC6 | Fee payment truth | parent pays online | Razorpay webhook arrives before/after the redirect | exactly one receipt, status paid; refreshing never duplicates |
| AC7 | Plan limit | admin on Starter (100 students) tries to add student 101 | submit | inline upgrade prompt; existing 100 records unaffected |
| AC8 | Tenant isolation | user of School A searches people | any query | zero School B records appear in any result |
| AC9 | Suspended subscription | school past grace | any write attempt by school admin | read works; write shows reactivate prompt |
| AC10 | Refresh-token theft | attacker replays a used refresh token | reuse detected | token pair banned; legitimate user forced to re-login once |
| AC11 | Guardian linking | school imports a student with guardian phone | parent opens app and enters OTP | child visible only after confirm; before confirm, empty state with "your school is linking you" — no data leak |
| AC12 | Wrong guardian | two parents claim the same roll number | admin reviews the conflict | one student ends with two linked guardians, both notified; nothing is silently overwritten |
| AC13 | Offline marking | teacher in airplane mode, roster cached for today | marks 40 students and leaves | all 40 retained; on reconnect, uploaded once each; marked-time preserved, upload-time logged separately |
| AC14 | Offline conflict | another device already marked the same class/date | first teacher's queue uploads | later submission wins, earlier retained in audit trail, admin sees both entries |
| AC15 | Bulk-mark speed | mid-range Android, 40-student roster | teacher marks 3 absentees | done in < 60 s from opening the screen to submit, measured 3 runs |
| AC16 | Refund | parent paid ₹5,000 online; school refunds ₹2,000 | admin raises partial refund with reason | receipt keeps its number and shows ₹2,000 refunded / ₹3,000 net paid; dues recompute |
| AC17 | Cancellation export | school cancels | admin runs full export inside the window | file contains people, attendance, fees, grades for the tenant only; after retention period, data is gone and the deletion is evidenced |

---

## 10. Delivery phasing (solo-builder sequencing)

> Sizing assumes one full-stack builder; adjust after the first week of each phase.

| Phase | Scope | Exit bar |
|---|---|---|
| **1 — GA hardening (P0 only)** | auth, onboarding/billing, **guardian linking & consent**, people, classes, student + staff QR attendance (**incl. bulk-mark speed**), fees (**partial payment, refunds, advance, GST**), notices/notifications, dashboards | AC1–AC12 + AC15–AC17 pass on staging with seeded peak data; one pilot school runs live for 2 school weeks without data incidents; a timed bulk-mark run passes on a real school phone |
| **2 — Academic depth + resilience (P1)** | homework, exams/grades, timetable, tickets, promotion, custom roles, import/export, **offboarding export & retention**, **offline capture (§3.20, pulled forward the moment a pilot reports connectivity)** | each module ships behind the same permission & gating rules as P0; AC13/AC14 gate §3.20 |
| **3 — Long tail (P2)** | certificates, admit cards, transport, **Hindi/regional localization** | pulled forward if a paying school asks |

Rationale: P0 is the daily-operations loop a school pays for; P1 deepens stickiness; P2 is convenience. Sequencing follows willingness-to-pay, not build-order convenience.

---

## 11. Risks & dependencies

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Solo-builder bandwidth | high | P1/P2 slip | ruthless P0 focus; phase gates above |
| App-store review latency blocks mobile fixes | high | bugs linger on mobile | backward-compatible server; critical flows degrade to web |
| Razorpay webhook loss/misorder | medium | billing drift | idempotent handlers + scheduled reconciliation |
| Morning-peak load on free-tier cache/queue limits | medium | slow attendance at 07:50 IST | quiet-hours batching; cache hot paths; load-test before GA |
| Screenshot/relay cheating of QR attendance | medium | trust in data drops | rotation + burn (in); GPS/line-of-sight hardening (later) |
| DPDP compliance gap (parental consent for child data) | medium | legal exposure | consent at parent onboarding; PII minimization; [TBD: legal review] |
| Firebase/FCM quota or pricing change | low | notification cost spike | abstract push behind queue; monitor spend |
| Guardian linking stalls adoption | high | school signs but parents never activate → the app looks dead to the buyer | OTP self-confirm + "needs linking" queue + per-school activation rate on the dashboard (§1.3) |
| Offline queue diverges from server | medium | attendance disputes with parents | dual timestamps, later-wins + full audit trail (AC13–AC14), never silent merge |
| GST / invoicing wrong at scale | medium | rework across every receipt, accountant distrust | decide the GST model before the first paid receipt; legal review [TBD] |
| Cancellation data deletion done badly | low | legal + reputational, one-off and permanent | export-before-delete enforced in code; deletion evidenced (§5.2, AC17) |

---

## 12. Open questions

1. Account linking: one person, two roles (teacher who is also a parent) — separate accounts forever, or link later?
2. Past-due grace period length before suspension?
3. Emergency notices: does any category bypass quiet hours?
4. WhatsApp/SMS as a delivery channel for parents without the app?
5. Attendance "late entry" cut-off time — school-configurable or fixed?
6. Hard cap on bulk-import rows?
7. Support-ticket SLA commitment on a solo operation?
8. **Unify the gating policy?** Attendance gates at 7/14/28 days (admin browse) and 1/6 months (parent view); leaves gate at 3 months on Starter / full on Growth+. One policy family should win and the other migrate — recommended default: the 3-months-basic / full-history-standard+ family (the policy already chosen for leaves), because "3 months free, pay for history" is easier to sell and explain than day-count windows.
9. **GST model**: who sets rates — per-school (state/place-of-supply) or platform-global default? Is the platform itself GST-registered before the first ₹499 invoice?
10. **Guardian consent evidence**: where is the consent record stored so a school can prove it to an auditor (and can they export it)?
11. **Offline queue ceiling**: how long (age or rows) before a teacher is blocked from marking more rather than accumulating unsynced data?
12. **Commercial terms**: all four rows of §5.1 (trial, annual discount, mid-cycle changes, suspension behaviour) are proposals — confirm or replace.
13. **Retention days** after cancellation (§5.2) — 90 proposed.

---

## Appendix

### Changelog

**v1.0 → v1.1 (2026-09-24)** — v1.0's own review found nine gaps; all nine are now in:

| Gap | Where it landed |
|---|---|
| Out-of-scope list | §2.1 (8 explicit exclusions + revisit triggers) |
| Guardian↔student linking & consent | §3.3 rewritten (rules 4–8) + AC11/AC12 + risk + `guardian_link_*` events |
| Offline / low-connectivity | §3.20 (new) + NFR row + AC13/AC14 |
| Refunds, partial payment, advance | §3.7 rules 5–9 + AC16 |
| GST on receipts & platform invoices | §3.7 rule 8, NFR row, open Q9 |
| Trial & annual pricing | §5.1 (proposed, open Q12) |
| Cancellation export & retention | §5.2 + AC17 + risk |
| Bulk-mark throughput | §3.5 rules 4–5 + AC15 + NFR row |
| Localization | §3.21 (new, P2) + NFR row |

Also: 3 broken cross-references fixed, `[TBD]` markers normalized to English, phasing/§10 and risks/§11 realigned to the new P0 set.

### Pointers

- Canonical location of this document: `server/docs/PRD.md` (the backend repo). It describes all three apps — `server/`, `school-web/`, `test-app/` — so edit it here and link to it, never fork a copy.
- Module source of truth: `server/src/routes/*`, `server/src/graphql/*` (REST + GraphQL hybrid)
- Web app: `school-web/` (Next.js). Mobile app: `test-app/` (Expo).
- Billing catalog mirror lives in `server/src/lib/plans.ts` ↔ `school-web/src/lib/billing-constants.tsx` — single change must update both.
- Related detailed PRDs (to be spun off): QR staff attendance; fees & Razorpay billing; plan gating & upgrade funnel.
- Competitor reference: **not researched** — no competitor analysis has been done for this document; run `/竞品分析` before defending the ₹499 price point externally.
- Design/wireframe links: none yet — this PRD deliberately stops at interaction logic and information hierarchy.
