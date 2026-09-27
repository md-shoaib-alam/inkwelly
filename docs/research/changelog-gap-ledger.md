# Changelog parity ledger — inkwelly.com vs this repo

Generated 2026-09-28 from 148 published entries (10 Jan 15:00 IST → 27 Sept 23:07 IST), each checked against `apps/web`, `apps/server` and `apps/mobile`.

**Result: 5 present, 51 partial, 92 absent.**

Verdict rules: PRESENT = runnable code does what the entry claims. PARTIAL = some of it, with the gap named. ABSENT = no implementation anywhere (a PRD, roadmap or integration-catalog mention does not count).

| # | when | type | scope | feature | verdict | evidence | what this repo is missing |
|---|---|---|---|---|---|---|---|
| 1 | 27 Sept 23:07 IST | New | ai | Inkwelly AI answers whole-school questions with exact numbers | **ABSENT** | none found | No AI module in any app |
| 2 | 27 Sept 20:59 IST | New | ai | share any Inkwelly AI chat as a public link, no login needed | **ABSENT** | none found | No shareable chat or public-link code |
| 3 | 27 Sept 18:28 IST | New | ai | Inkwelly AI now calculates across the whole school's data | **ABSENT** | none found | No AI whole-school compute |
| 4 | 27 Sept 10:14 IST | New | ai | rich cards in AI chat — student profiles with photo, stats and charts | **ABSENT** | none found | No rich-card AI chat rendering |
| 5 | 27 Sept 08:57 IST | New | ai | Inkwelly AI creates Excel sheets and PDF reports right in the chat | **ABSENT** | none found | No AI Excel/PDF generation |
| 6 | 26 Sept 12:45 IST | New | ai | AI skills — teach it your school's ways, ask it how to use any screen | **ABSENT** | none found | No AI skills panel or screen guides |
| 7 | 25 Sept 22:17 IST | New | ai | launch Inkwelly AI — chat that answers and takes action | **ABSENT** | none found | No AI assistant launch, credits or actions |
| 8 | 24 Sept 17:53 IST | New | attendance | auto-mark staff absent when they never check in | **ABSENT** | staff-attendance.ts | No auto-absent job for missing check-ins |
| 9 | 24 Sept 12:54 IST | New | attendance | add face check-in for staff to stop proxy attendance | **ABSENT** | none found | No face or liveness check-in |
| 10 | 23 Sept 13:55 IST | New | attendance | remind staff to check in only when they forget | **ABSENT** | none found | No check-in reminder logic |
| 11 | 22 Sept 22:57 IST | New | auth | sign in on any school computer by scanning a QR code | **ABSENT** | src/auth | QR exists for attendance only, not sign-in |
| 12 | 22 Sept 21:13 IST | New | attendance | staff check in from their phone inside the school campus | **ABSENT** | staff-attendance.ts:212 | Remote self check-in disabled; no geofence |
| 13 | 18 Sept 14:02 IST | New | examinations | set the whole exam date sheet from one screen | **PARTIAL** | exams.ts:374; schema.ts:685 | Bulk exam create only; no duration or one-screen datesheet |
| 14 | 17 Sept 16:48 IST | New | student | control who can read and write each student's diary | **ABSENT** | none found | No student diary module |
| 15 | 17 Sept 16:32 IST | New | fees | UPI-style PIN and location check on every fee collection | **ABSENT** | none found | No PIN or geo gate on fee collection |
| 16 | 21 Aug 11:04 IST | New | student | undo a wrong promotion without hunting other screens | **ABSENT** | promotions.ts | No promotion undo or correction checklist |
| 17 | 21 Aug 10:03 IST | New | student | admit a whole class from one Excel sheet | **PARTIAL** | exports.ts:426 | Bulk student import; does not create parents or address |
| 18 | 16 Aug 14:42 IST | New | fees | chase unpaid late fees on school and bus fee bills | **ABSENT** | none found | No late-fee notification re-send |
| 19 | 16 Aug 12:19 IST | New | fees | charge late fees on the balance a family still owes | **ABSENT** | schema.ts | No lateFee field or percentage-on-balance logic |
| 20 | 12 Aug 16:14 IST | Fix | transport | show every overdue bus invoice on the late fees screen | **ABSENT** | none found | No transport late-fee or waiver paging |
| 21 | 11 Aug 17:36 IST | New | transport | track every bus's daily mileage and fuel spend | **ABSENT** | none found | No odometer or fuel tables |
| 22 | 11 Aug 16:34 IST | New | transport | give a discount or charge a fine on any bus bill | **PARTIAL** | fees.ts:493 | Fee concessions only; no per-bill fine or undo |
| 23 | 11 Aug 11:29 IST | New | timetable | build a whole timetable by chatting with Inkwelly AI | **ABSENT** | none found | No AI timetable builder |
| 24 | 11 Aug 08:22 IST | New | examinations | track and mark every class test across the school | **PARTIAL** | assessments.ts:33 | Assessment list only; no school-wide mark queue |
| 25 | 10 Aug 22:58 IST | New | transport | track school buses live and see who is on board [as ADMIN] | **ABSENT** | none found | No live GPS bus tracking |
| 26 | 10 Aug 22:29 IST | New | payroll | hold a salary, skip an employee, or add one-off amounts | **ABSENT** | schema.ts:745 | Only expenses; no payroll, hold or one-off amounts |
| 27 | 10 Aug 16:04 IST | New | parent | read and sign school diary notes on a full note page | **ABSENT** | none found | No parent diary note page or sign-off |
| 28 | 08 Aug 16:12 IST | New | student | show today's classes and live bus on the app home | **PARTIAL** | mobile student/dashboard.tsx | Student home exists; no live bus or grouped hub |
| 29 | 08 Aug 11:17 IST | New | fees | choose which invoice a discount or fine applies to | **PARTIAL** | fees.ts:577 | Concession targets pending fees; no invoice pick |
| 30 | 07 Aug 13:33 IST | New | student | see everything about one student on a single page | **PARTIAL** | admin/students/StudentProfileView.tsx | Profile exists; no 360 hostel health or house |
| 31 | 05 Aug 15:04 IST | New | academic | add study notes with images and video to syllabus topics | **ABSENT** | none found | No syllabus notes with media |
| 32 | 05 Aug 12:39 IST | New | employee | give teachers one screen for each subject they teach | **PARTIAL** | web+mobile my-subjects.tsx | Subject list only; no chapters or progress rings |
| 33 | 04 Aug 08:17 IST | New | student | let class teachers see the student details you allow | **ABSENT** | permissions.ts | No class-teacher data-sharing rules |
| 34 | 02 Aug 15:41 IST | New | employee | add a daily work screen and quick actions for staff | **PARTIAL** | teacher/dashboard/TodaySchedule.tsx | Web Today only; mobile has plain dashboard |
| 35 | 02 Aug 12:04 IST | New | achievements | add competitions, awards and student recognition | **ABSENT** | none found | No competitions, awards or leaderboards |
| 36 | 02 Aug 10:34 IST | New | grievances | add grievance redressal and safeguarding register | **ABSENT** | none found | No grievance or safeguarding register |
| 37 | 01 Aug 18:42 IST | New | student | see each child's complete school diary in one place | **ABSENT** | none found | No full-year child diary view |
| 38 | 27 Jul 21:56 IST | New | academic | add house system with inter-house points and standings | **ABSENT** | students/StudentDialog.tsx:428 | Disabled free-text field only; no house module |
| 39 | 18 Jul 12:41 IST | New | student | match student records with UDISE+ and fix mismatches | **ABSENT** | integrations/catalog.ts:342 | Catalog entry marked no public API; no code |
| 40 | 17 Jul 22:34 IST | New | academic | manage classes and timetable by asking AI | **ABSENT** | none found | No AI class or timetable management |
| 41 | 11 Jul 21:56 IST | New | letterhead | write official school letters with AI on your own letterhead | **ABSENT** | none found | No letterhead designer or serial numbering |
| 42 | 10 Jul 12:04 IST | New | platform | ask AI across all your schools at once | **ABSENT** | none found | No multi-school AI query |
| 43 | 08 Jul 06:40 IST | New | platform | let AI create homework and events with your approval | **ABSENT** | none found | No AI-generated homework with approval gate |
| 44 | 06 Jul 14:58 IST | New | platform | ask ChatGPT or Claude about staff, homework, transport and more | **ABSENT** | none found | No MCP or external assistant connector |
| 45 | 05 Jul 12:13 IST | New | attendance | ask AI anything about student attendance | **ABSENT** | none found | No AI attendance queries |
| 46 | 04 Jul 17:20 IST | New | platform | connect ChatGPT or Claude to ask about fees and students | **ABSENT** | none found | No MCP read-only streaming |
| 47 | 03 Jul 07:51 IST | New | fees | control which staff can see fee collection amounts | **ABSENT** | fees permissions | No fee-amount masking by role |
| 48 | 02 Jul 09:36 IST | New | admissions | track and convert admission enquiries end to end | **ABSENT** | none found | No enquiry, CRM or enrolment pipeline |
| 49 | 26 Jun 11:44 IST | New | audit | enhance IP logging accuracy and security for web logins | **PRESENT** | lib/ip.ts:37; auth/login.ts:23 | Trusted-proxy IP extraction and audit logging |
| 50 | 26 Jun 09:17 IST | New | store | buy school uniforms, books and supplies inside the app | **ABSENT** | none found | No store, product, order or inventory |
| 51 | 21 Jun 12:20 IST | New | health | add student health records, clinic and fitness tracking | **ABSENT** | schema.ts:105 | Only bloodGroup column; no clinic or fitness |
| 52 | 21 Jun 01:38 IST | New | store | sell uniforms and books online with live inventory | **ABSENT** | none found | No store checkout or POS |
| 53 | 20 Jun 23:39 IST | New | tests | add class tests with marks, grades and answer sheets | **PARTIAL** | assessments.ts; schema.ts:783 | Generic assessments; no class tests or answer sheets |
| 54 | 20 Jun 07:49 IST | New | communications | add promotional banners to the app home screen | **ABSENT** | none found | Static banners only; no carousel or campaigns |
| 55 | 18 Jun 09:15 IST | New | app | report problems and send feedback from any screen | **ABSENT** | none found | No shake feedback or offline queue |
| 56 | 18 Jun 06:57 IST | New | app | post photo, video and text status updates across the school | **ABSENT** | none found | No 24-hour status feed |
| 57 | 18 Jun 05:18 IST | Speed | app | open the school app far faster on cold start | **PARTIAL** | app/index.tsx:19 | Splash redirect exists; cold-start speed unverifiable |
| 58 | 16 Jun 10:55 IST | New | admissions | download a print-ready admission form for any student | **ABSENT** | exports.ts | No printable admission form |
| 59 | 16 Jun 07:09 IST | New | admissions | preview the next student ID and admission number | **ABSENT** | none found | No next ID or admission number preview |
| 60 | 15 Jun 20:17 IST | New | student | share transfer certificate designs between schools | **ABSENT** | certificates.ts:12 | Certificates list only; no design share |
| 61 | 14 Jun 04:32 IST | New | academic | manage classes, subjects and timetable in the staff app | **PARTIAL** | mobile admin classes+subjects+timetable | Browse only; no publish or substitution |
| 62 | 13 Jun 13:19 IST | New | games | launch Mind Arena, a mind-sports program for students | **ABSENT** | none found | No Mind Arena games |
| 63 | 12 Jun 10:32 IST | New | quiz | add AI-powered quizzes with gamified learning journeys | **ABSENT** | schema.ts:783 | quiz is an assessment type string, not a module |
| 64 | 07 Jun 15:16 IST | New | id-cards | ready-made ID card design library to pick and customise | **PARTIAL** | admin/admit-cards/templates | Fixed print templates; no drag-drop designer |
| 65 | 07 Jun 02:33 IST | New | transport | automate bus-fee billing with concessions and late fees | **PARTIAL** | transport.ts:230 | Invoices on assignment; no installments or auto-cycle |
| 66 | 06 Jun 18:27 IST | New | transport | online bus fee payment in the app with automatic receipts | **ABSENT** | parent/fees.tsx:361 | Shows Pay at School notice; no payment |
| 67 | 04 Jun 21:52 IST | New | location | implement prominent location consent dialog for drivers | **ABSENT** | none found | No driver app or location consent |
| 68 | 04 Jun 18:12 IST | New | transport | smoother, more accurate live school-bus tracking | **ABSENT** | none found | No route drawing or live map |
| 69 | 04 Jun 14:23 IST | New | transport | show parents why the live bus tracking pauses | **ABSENT** | none found | No GPS freshness or pause-reason UI |
| 70 | 03 Jun 19:05 IST | New | transport | alert parents instantly when a child misses the bus | **ABSENT** | none found | No missed-bus alerts |
| 71 | 01 Jun 03:02 IST | New | transport | live bus GPS tracking with stop-by-stop progress | **ABSENT** | none found | No stop-by-stop timeline |
| 72 | 31 May 23:35 IST | New | transport | one-tap bus start and live student boarding for drivers | **ABSENT** | schema.ts:392 | Driver name and phone fields only |
| 73 | 20 May 20:46 IST | New | fees | pay school fees online from the parent mobile app | **ABSENT** | lib/razorpay.ts (subscriptions only) | Gateway used for platform plans, not school fees |
| 74 | 17 May 20:37 IST | New | fees | receipt PDF reaches parents automatically with every fee payment | **ABSENT** | fee-receipt.service.ts:125 | Receipt rows only; no PDF, email or WhatsApp |
| 75 | 17 May 19:44 IST | New | fees | A4 fee receipts with QR verification and thermal printer settings | **PARTIAL** | fees/AdminReceiptTemplate.tsx:53 | Logo and amount-in-words; no QR, thermal or Hindi |
| 76 | 17 May 06:14 IST | New | payments | share UPI payment links with parents for unpaid fees | **ABSENT** | subscriptions.ts:646 is app plans | No invoice payment-link generation |
| 77 | 16 May 21:13 IST | New | fees | notify parents on all 4 channels when a fine is added | **PARTIAL** | fees.ts:251; lib/worker.ts:313 | Push and in-app only; no SMS, email or WhatsApp |
| 78 | 16 May 20:15 IST | New | payments | show Razorpay MDR and GST per online fee payment | **ABSENT** | schema.ts:348 | No MDR, GST or settlement fields |
| 79 | 16 May 18:09 IST | New | payments | parents can pay fees and transport online via Razorpay | **PARTIAL** | razorpay.ts:7; subscriptions.ts:198 | Gateway for subscriptions, not fee or transport bills |
| 80 | 16 May 15:44 IST | New | communications | built-in app push for every school from day one | **PRESENT** | firebase-admin.ts:8; worker.ts:489 | Platform-owned FCM push with Expo tokens |
| 81 | 15 May 15:22 IST | New | notifications | built-in email for every school from day one | **ABSENT** | lib/worker.ts:263 | Email worker is a console.log stub; no mailer dependency |
| 82 | 14 May 02:12 IST | New | fees | one-click thermal receipt printing at the fee counter | **ABSENT** | mobile lib/pdf-export.ts:360 | Browser print only; no thermal or 80mm code |
| 83 | 11 May 09:17 IST | New | attendance | employee attendance reports for HR and payroll | **PARTIAL** | staff-attendance.ts:19 | Live staff board only; no HR reports or LOP |
| 84 | 09 May 05:45 IST | New | hr | unified staff departments shared with attendance and payroll | **ABSENT** | StaffProfileView.tsx:674 | Free-text department notes; no department table |
| 85 | 09 May 24:16 IST | New | fees | annual promotion carries unpaid fees as one opening balance | **ABSENT** | promotions.ts | Promotion carries no fee or opening-balance logic |
| 86 | 07 May 21:41 IST | New | student | student promotion — guided wizard with eligibility checks, capacity caps, soft-undo, hard reverse, carry-forward, and exam-end reports | **PARTIAL** | BulkPromoteTab.tsx:186 | Preview-and-execute only; no eligibility, capacity or undo |
| 87 | 22 Apr 10:15 IST | New | student | Student performance overview with progress and attendance trends | **PARTIAL** | StudentProfileView.tsx:140 | Tabs render placeholder at line 343 |
| 88 | 21 Apr 11:30 IST | New | media | School-wide media library for logos, photos, certificates, and ID cards | **ABSENT** | lib/s3.ts used at tenants.ts:494 | Logo upload only; no media library |
| 89 | 20 Apr 15:30 IST | New | timetable | Substitute teacher assignment with one-click swap on absences | **ABSENT** | leaves.ts and timetable.ts unconnected | No substitute suggestion or swap |
| 90 | 18 Apr 16:10 IST | New | examinations | Examination reports — class-wise, student-wise, subject-wise | **PARTIAL** | reports.ts:34; print-marksheet.tsx | Grade analytics and printable marksheet; no toppers |
| 91 | 17 Apr 11:45 IST | New | parent | Parent portal redesigned for cheap Android phones | **PARTIAL** | parent portal web+mobile | Portal exists; no WhatsApp-chat access |
| 92 | 15 Apr 10:05 IST | New | timetable | Automatic timetable generation with conflict detection | **ABSENT** | timetable.ts; schema.ts:463 | Manual CRUD; no generator or conflict check |
| 93 | 14 Apr 13:20 IST | New | fees | UPI QR code on every fee receipt for instant smartphone payment | **ABSENT** | admin/fees | No QR on receipts and no auto-reconciliation |
| 94 | 12 Apr 14:50 IST | New | whatsapp | Parent communication via WhatsApp Business API | **PARTIAL** | ParentCreatedSuccessDialog.tsx:83 | Manual wa.me link only; no WhatsApp Business API |
| 95 | 11 Apr 09:50 IST | New | homework | Class teacher dashboard for daily homework tracking | **PARTIAL** | teacher/homework; homework.ts:80 | Teacher dashboard exists; no end-of-day WhatsApp summary |
| 96 | 10 Apr 09:25 IST | New | marksheets | Public marksheet verification page with QR code scanning | **ABSENT** | no verify route in web app | No public marksheet verification page |
| 97 | 09 Apr 15:00 IST | New | fees | Tally export improvements with per-line GST split for accountants | **ABSENT** | integrations/catalog.ts:104 | Tally is catalog copy; exports emit plain XLSX |
| 98 | 08 Apr 18:00 IST | Fix | whatsapp | Improved WhatsApp delivery reliability for low-signal areas | **PARTIAL** | lib/queue.ts:26 | Generic BullMQ backoff; no WhatsApp channel to retry |
| 99 | 06 Apr 12:30 IST | New | hr | Employee leave balance carry-forward across financial years | **ABSENT** | schema.ts:654 | Leave table has no balance or carry-forward |
| 100 | 05 Apr 12:15 IST | New | student | Student profile with full academic history and achievements timeline | **ABSENT** | none found | No co-scholastic or achievement data model |
| 101 | 03 Apr 10:45 IST | New | security | Two-factor authentication for school principals and org admins | **ABSENT** | none found | Password and JWT only; no second factor |
| 102 | 02 Apr 15:30 IST | New | security | Active session management for organisation admins | **PARTIAL** | auth/refresh.ts:220 | Revoke-all on replay; no device list |
| 103 | 31 Mar 11:15 IST | New | admissions | Bulk admission CSV import for board exam takers | **PARTIAL** | exports.ts:289 and 426 | Bulk import works; roll numbers read from file |
| 104 | 30 Mar 11:00 IST | New | attendance | IoT biometric device integration for staff attendance | **ABSENT** | catalog.ts:225 | Biometric named in catalog; attendance is QR or manual |
| 105 | 28 Mar 14:00 IST | New | fees | Instalment plans per student with auto-reminders for each instalment | **ABSENT** | super-admin/roadmap.tsx | Instalments appear only in roadmap text |
| 106 | 27 Mar 14:20 IST | New | subjects | Drag-and-drop subject reordering across teaching batches | **ABSENT** | schema.ts:164 | No order column on Subject |
| 107 | 25 Mar 16:10 IST | New | fees | Late fee rules with grace period configuration per fee head | **ABSENT** | none found | No auto late-fee accrual or per-head policy |
| 108 | 24 Mar 10:40 IST | New | examinations | Bulk Excel marks editor for fast class-wide entry | **PARTIAL** | exams-entry/results-table.tsx | On-screen grid with bulk upsert; no Excel paste |
| 109 | 22 Mar 13:00 IST | New | marksheets | Bulk lock and unlock marksheets with explicit status workflow | **ABSENT** | exams.ts:572 | Publish status only; no lock with logged reason |
| 110 | 21 Mar 16:00 IST | New | media | Inline image editor — crop, filter, resize, drop shadow | **ABSENT** | profile.tsx:139 | Plain FileReader upload; no crop or filter |
| 111 | 19 Mar 10:30 IST | New | media | Bulk ID card printing with reusable templates per academic year | **PARTIAL** | BatchPrintContainers.tsx:34 | A4 bulk print engine for admit cards; no QR |
| 112 | 18 Mar 09:50 IST | New | examinations | Per-exam class configuration with custom grade scales | **PARTIAL** | exams.ts:374; grades.ts:114 | Per-class exams; grade scale hardcoded |
| 113 | 16 Mar 15:30 IST | New | events | Multi-day event scheduling with parent RSVP via WhatsApp | **PARTIAL** | schema.ts:486; events.ts:51 | Multi-day events exist; no RSVP or WhatsApp |
| 114 | 15 Mar 13:25 IST | New | examinations | Exam clone — duplicate full exam config across grades and sections | **ABSENT** | none found | No exam clone or duplicate |
| 115 | 13 Mar 11:00 IST | New | cms | School website CMS with photo galleries and announcements | **ABSENT** | tenants.website text field | No website CMS or galleries |
| 116 | 12 Mar 17:10 IST | Speed | marksheets | Marksheet PDF generation now 3x faster on large batches | **PARTIAL** | exams/marksheetPrinter.tsx | Marksheet PDF exists; rendering-speed claim unverifiable |
| 117 | 09 Mar 11:45 IST | New | marksheets | Co-scholastic assessments with CBSE-compliant grade scales | **ABSENT** | marksheet-templates/CBSEStandard.tsx:14 | Co-scholastic is template mock only |
| 118 | 07 Mar 16:45 IST | Speed | dashboard | Principal dashboard widgets cached for instant load on large schools | **PRESENT** | dashboard.ts:21 | Dashboard widgets server-cached |
| 119 | 06 Mar 15:00 IST | New | marksheets | One-click marksheet PDF generation with QR verification | **PARTIAL** | exams/marksheet-templates | Marksheet PDF; no QR or public verification |
| 120 | 03 Mar 10:15 IST | New | marksheets | Bulk marksheet CSV upload for board exam results | **PARTIAL** | exams.ts:374; grades.ts:152 | Bulk results API; no CSV board upload |
| 121 | 01 Mar 14:30 IST | New | marksheets | Marksheet design templates with school branding controls | **PARTIAL** | exams/marksheet-templates fixed tsx | Selectable templates; no designer controls |
| 122 | 26 Feb 11:30 IST | New | attendance | Employee attendance with shift, late, and half-day rules | **PARTIAL** | staff-attendance.ts:82 | Attendance only; no shift, grace or half-day rules |
| 123 | 24 Feb 13:45 IST | New | employee | Employee onboarding with document collection and verification | **ABSENT** | none found | No staff onboarding or document collection |
| 124 | 22 Feb 16:20 IST | New | notifications | In-app notification centre across web and mobile apps | **PARTIAL** | schema.ts:435 isRead; notification-bell.tsx | Notification inbox; no read receipts for parent comms |
| 125 | 20 Feb 10:00 IST | New | homework | Homework module with parent acknowledgement on WhatsApp | **PARTIAL** | homework.ts:121 /complete | Homework completion exists; no WhatsApp ack |
| 126 | 18 Feb 10:00 IST | New | hr | Leave management for teaching and non-teaching staff | **PARTIAL** | leaves.ts:169 and 316 | Leave workflow; no substitute or payroll link |
| 127 | 16 Feb 14:30 IST | New | notifications | SMS gateway integration as WhatsApp delivery fallback | **ABSENT** | catalog.ts:181 | SMS only in integration catalog; no code |
| 128 | 14 Feb 13:40 IST | New | payroll | Payroll module — PF, ESI, TDS, and Form 16 generation | **ABSENT** | catalog.ts:326 offered:false | No payroll, PF, ESI, TDS or Form 16 |
| 129 | 13 Feb 11:30 IST | New | media | ID card generation with school template designer | **PARTIAL** | admin/admit-cards | Hall-ticket designer; not ID cards, no QR |
| 130 | 11 Feb 09:25 IST | New | transport | Transport module — route assignment, GPS tracking, parent app | **PARTIAL** | schema.ts:372; transport.ts | Routes and vehicles; no GPS tracking |
| 131 | 10 Feb 15:00 IST | New | library | Phone-based barcode scanning for library issue and return | **ABSENT** | none found | No library or barcode scanning |
| 132 | 09 Feb 17:50 IST | Speed | attendance | Faster attendance marking for schools with 5,000+ students | **PARTIAL** | attendance.ts:17 | Uses dataCache; speedup claim unverifiable |
| 133 | 07 Feb 11:15 IST | New | library | Library module — book catalog, issue/return, overdue fines | **ABSENT** | none found | No library module, ISBN or fines |
| 134 | 05 Feb 10:45 IST | New | transport | Driver app with route navigation and student boarding tracking | **ABSENT** | none found | No driver app or boarding tracking |
| 135 | 03 Feb 10:30 IST | New | attendance | Daily attendance with automatic WhatsApp parent notifications | **PARTIAL** | attendance.ts:204; worker.ts:443 | Absence alerts via FCM push, not WhatsApp |
| 136 | 02 Feb 16:00 IST | Fix | attendance | Class teacher attendance saves offline on patchy connectivity | **PARTIAL** | GlobalOfflineGuard.tsx; take-attendance.tsx:609 | Offline detection and local draft; no verifiable sync queue |
| 137 | 31 Jan 15:30 IST | New | admissions | Online admission with document upload and verification workflow | **ABSENT** | none found | No online-admission document verification |
| 138 | 29 Jan 15:45 IST | New | platform | Multi-tenant SaaS architecture with org-level data isolation | **PRESENT** | schema.ts:7; lib/resolve-tenant.ts | Multi-tenant isolation by tenantId throughout |
| 139 | 27 Jan 11:00 IST | New | security | Single sign-on for school principals via Google and Microsoft | **ABSENT** | none found | No Google or Microsoft SSO |
| 140 | 25 Jan 12:00 IST | New | dashboard | Role-based dashboards for principal, teacher, parent, and student | **PRESENT** | per-role dashboards web+mobile | Role-based dashboards exist |
| 141 | 23 Jan 14:15 IST | New | media | Student photo upload with automatic background removal | **PARTIAL** | schema.ts:63 avatar; s3.ts | Photo upload exists; no background removal |
| 142 | 22 Jan 10:20 IST | New | admissions | Online admission form with document upload and tracking | **ABSENT** | none found | No public admission form or conversion tracking |
| 143 | 20 Jan 16:30 IST | New | security | Audit log viewer for organisation admins | **PARTIAL** | schema.ts:35; super-admin/audit-logs.tsx | Audit log exists but super-admin scoped only |
| 144 | 18 Jan 14:10 IST | New | fees | Auto-generated fee receipts with school logo and Tally export | **PARTIAL** | fee-receipt.service.ts; schema.ts:348 | Branded receipts exist; no Tally export |
| 145 | 17 Jan 11:00 IST | New | events | School calendar with event creation and parent notifications | **PARTIAL** | events.ts; admin/calendar | Calendar and notify exist; no reminder scheduling |
| 146 | 15 Jan 09:30 IST | New | fees | Fee management with Razorpay, PayU, Cashfree, and Paytm integration | **PARTIAL** | lib/razorpay.ts; catalog.ts:358 | Razorpay only; PayU, Cashfree and Paytm absent |
| 147 | 12 Jan 13:30 IST | New | reports | Custom date-range reporting across attendance, fees, and exams | **PARTIAL** | reports.ts:34 and 101 | Class and exam reports; no date range or attendance report |
| 148 | 10 Jan 15:00 IST | Speed | platform | Multi-tenant query isolation 2x faster on large org workloads | **PARTIAL** | schema indexes; dataCache | Isolation and indexes present; 2x claim unverifiable |
