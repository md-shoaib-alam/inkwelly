import fs from "node:fs";

const items = JSON.parse(fs.readFileSync(new URL("./changelog.json", import.meta.url), "utf8"));

// id | verdict | evidence | note   (from the four verification passes, 2026-09-28)
const rows = `1|ABSENT|none found|No AI module in any app
2|ABSENT|none found|No shareable chat or public-link code
3|ABSENT|none found|No AI whole-school compute
4|ABSENT|none found|No rich-card AI chat rendering
5|ABSENT|none found|No AI Excel/PDF generation
6|ABSENT|none found|No AI skills panel or screen guides
7|ABSENT|none found|No AI assistant launch, credits or actions
8|ABSENT|staff-attendance.ts|No auto-absent job for missing check-ins
9|ABSENT|none found|No face or liveness check-in
10|ABSENT|none found|No check-in reminder logic
11|ABSENT|src/auth|QR exists for attendance only, not sign-in
12|ABSENT|staff-attendance.ts:212|Remote self check-in disabled; no geofence
13|PARTIAL|exams.ts:374; schema.ts:685|Bulk exam create only; no duration or one-screen datesheet
14|ABSENT|none found|No student diary module
15|ABSENT|none found|No PIN or geo gate on fee collection
16|ABSENT|promotions.ts|No promotion undo or correction checklist
17|PARTIAL|exports.ts:426|Bulk student import; does not create parents or address
18|ABSENT|none found|No late-fee notification re-send
19|ABSENT|schema.ts|No lateFee field or percentage-on-balance logic
20|ABSENT|none found|No transport late-fee or waiver paging
21|ABSENT|none found|No odometer or fuel tables
22|PARTIAL|fees.ts:493|Fee concessions only; no per-bill fine or undo
23|ABSENT|none found|No AI timetable builder
24|PARTIAL|assessments.ts:33|Assessment list only; no school-wide mark queue
25|ABSENT|none found|No live GPS bus tracking
26|ABSENT|schema.ts:745|Only expenses; no payroll, hold or one-off amounts
27|ABSENT|none found|No parent diary note page or sign-off
28|PARTIAL|mobile student/dashboard.tsx|Student home exists; no live bus or grouped hub
29|PARTIAL|fees.ts:577|Concession targets pending fees; no invoice pick
30|PARTIAL|admin/students/StudentProfileView.tsx|Profile exists; no 360 hostel health or house
31|ABSENT|none found|No syllabus notes with media
32|PARTIAL|web+mobile my-subjects.tsx|Subject list only; no chapters or progress rings
33|ABSENT|permissions.ts|No class-teacher data-sharing rules
34|PARTIAL|teacher/dashboard/TodaySchedule.tsx|Web Today only; mobile has plain dashboard
35|ABSENT|none found|No competitions, awards or leaderboards
36|ABSENT|none found|No grievance or safeguarding register
37|ABSENT|none found|No full-year child diary view
38|ABSENT|students/StudentDialog.tsx:428|Disabled free-text field only; no house module
39|ABSENT|integrations/catalog.ts:342|Catalog entry marked no public API; no code
40|ABSENT|none found|No AI class or timetable management
41|ABSENT|none found|No letterhead designer or serial numbering
42|ABSENT|none found|No multi-school AI query
43|ABSENT|none found|No AI-generated homework with approval gate
44|ABSENT|none found|No MCP or external assistant connector
45|ABSENT|none found|No AI attendance queries
46|ABSENT|none found|No MCP read-only streaming
47|ABSENT|fees permissions|No fee-amount masking by role
48|ABSENT|none found|No enquiry, CRM or enrolment pipeline
49|PRESENT|lib/ip.ts:37; auth/login.ts:23|Trusted-proxy IP extraction and audit logging
50|ABSENT|none found|No store, product, order or inventory
51|ABSENT|schema.ts:105|Only bloodGroup column; no clinic or fitness
52|ABSENT|none found|No store checkout or POS
53|PARTIAL|assessments.ts; schema.ts:783|Generic assessments; no class tests or answer sheets
54|ABSENT|none found|Static banners only; no carousel or campaigns
55|ABSENT|none found|No shake feedback or offline queue
56|ABSENT|none found|No 24-hour status feed
57|PARTIAL|app/index.tsx:19|Splash redirect exists; cold-start speed unverifiable
58|ABSENT|exports.ts|No printable admission form
59|ABSENT|none found|No next ID or admission number preview
60|ABSENT|certificates.ts:12|Certificates list only; no design share
61|PARTIAL|mobile admin classes+subjects+timetable|Browse only; no publish or substitution
62|ABSENT|none found|No Mind Arena games
63|ABSENT|schema.ts:783|quiz is an assessment type string, not a module
64|PARTIAL|admin/admit-cards/templates|Fixed print templates; no drag-drop designer
65|PARTIAL|transport.ts:230|Invoices on assignment; no installments or auto-cycle
66|ABSENT|parent/fees.tsx:361|Shows Pay at School notice; no payment
67|ABSENT|none found|No driver app or location consent
68|ABSENT|none found|No route drawing or live map
69|ABSENT|none found|No GPS freshness or pause-reason UI
70|ABSENT|none found|No missed-bus alerts
71|ABSENT|none found|No stop-by-stop timeline
72|ABSENT|schema.ts:392|Driver name and phone fields only
73|ABSENT|lib/razorpay.ts (subscriptions only)|Gateway used for platform plans, not school fees
74|ABSENT|fee-receipt.service.ts:125|Receipt rows only; no PDF, email or WhatsApp
75|PARTIAL|fees/AdminReceiptTemplate.tsx:53|Logo and amount-in-words; no QR, thermal or Hindi
76|ABSENT|subscriptions.ts:646 is app plans|No invoice payment-link generation
77|PARTIAL|fees.ts:251; lib/worker.ts:313|Push and in-app only; no SMS, email or WhatsApp
78|ABSENT|schema.ts:348|No MDR, GST or settlement fields
79|PARTIAL|razorpay.ts:7; subscriptions.ts:198|Gateway for subscriptions, not fee or transport bills
80|PRESENT|firebase-admin.ts:8; worker.ts:489|Platform-owned FCM push with Expo tokens
81|ABSENT|lib/worker.ts:263|Email worker is a console.log stub; no mailer dependency
82|ABSENT|mobile lib/pdf-export.ts:360|Browser print only; no thermal or 80mm code
83|PARTIAL|staff-attendance.ts:19|Live staff board only; no HR reports or LOP
84|ABSENT|StaffProfileView.tsx:674|Free-text department notes; no department table
85|ABSENT|promotions.ts|Promotion carries no fee or opening-balance logic
86|PARTIAL|BulkPromoteTab.tsx:186|Preview-and-execute only; no eligibility, capacity or undo
87|PARTIAL|StudentProfileView.tsx:140|Tabs render placeholder at line 343
88|ABSENT|lib/s3.ts used at tenants.ts:494|Logo upload only; no media library
89|ABSENT|leaves.ts and timetable.ts unconnected|No substitute suggestion or swap
90|PARTIAL|reports.ts:34; print-marksheet.tsx|Grade analytics and printable marksheet; no toppers
91|PARTIAL|parent portal web+mobile|Portal exists; no WhatsApp-chat access
92|ABSENT|timetable.ts; schema.ts:463|Manual CRUD; no generator or conflict check
93|ABSENT|admin/fees|No QR on receipts and no auto-reconciliation
94|PARTIAL|ParentCreatedSuccessDialog.tsx:83|Manual wa.me link only; no WhatsApp Business API
95|PARTIAL|teacher/homework; homework.ts:80|Teacher dashboard exists; no end-of-day WhatsApp summary
96|ABSENT|no verify route in web app|No public marksheet verification page
97|ABSENT|integrations/catalog.ts:104|Tally is catalog copy; exports emit plain XLSX
98|PARTIAL|lib/queue.ts:26|Generic BullMQ backoff; no WhatsApp channel to retry
99|ABSENT|schema.ts:654|Leave table has no balance or carry-forward
100|ABSENT|none found|No co-scholastic or achievement data model
101|ABSENT|none found|Password and JWT only; no second factor
102|PARTIAL|auth/refresh.ts:220|Revoke-all on replay; no device list
103|PARTIAL|exports.ts:289 and 426|Bulk import works; roll numbers read from file
104|ABSENT|catalog.ts:225|Biometric named in catalog; attendance is QR or manual
105|ABSENT|super-admin/roadmap.tsx|Instalments appear only in roadmap text
106|ABSENT|schema.ts:164|No order column on Subject
107|ABSENT|none found|No auto late-fee accrual or per-head policy
108|PARTIAL|exams-entry/results-table.tsx|On-screen grid with bulk upsert; no Excel paste
109|ABSENT|exams.ts:572|Publish status only; no lock with logged reason
110|ABSENT|profile.tsx:139|Plain FileReader upload; no crop or filter
111|PARTIAL|BatchPrintContainers.tsx:34|A4 bulk print engine for admit cards; no QR
112|PARTIAL|exams.ts:374; grades.ts:114|Per-class exams; grade scale hardcoded
113|PARTIAL|schema.ts:486; events.ts:51|Multi-day events exist; no RSVP or WhatsApp
114|ABSENT|none found|No exam clone or duplicate
115|ABSENT|tenants.website text field|No website CMS or galleries
116|PARTIAL|exams/marksheetPrinter.tsx|Marksheet PDF exists; rendering-speed claim unverifiable
117|ABSENT|marksheet-templates/CBSEStandard.tsx:14|Co-scholastic is template mock only
118|PRESENT|dashboard.ts:21|Dashboard widgets server-cached
119|PARTIAL|exams/marksheet-templates|Marksheet PDF; no QR or public verification
120|PARTIAL|exams.ts:374; grades.ts:152|Bulk results API; no CSV board upload
121|PARTIAL|exams/marksheet-templates fixed tsx|Selectable templates; no designer controls
122|PARTIAL|staff-attendance.ts:82|Attendance only; no shift, grace or half-day rules
123|ABSENT|none found|No staff onboarding or document collection
124|PARTIAL|schema.ts:435 isRead; notification-bell.tsx|Notification inbox; no read receipts for parent comms
125|PARTIAL|homework.ts:121 /complete|Homework completion exists; no WhatsApp ack
126|PARTIAL|leaves.ts:169 and 316|Leave workflow; no substitute or payroll link
127|ABSENT|catalog.ts:181|SMS only in integration catalog; no code
128|ABSENT|catalog.ts:326 offered:false|No payroll, PF, ESI, TDS or Form 16
129|PARTIAL|admin/admit-cards|Hall-ticket designer; not ID cards, no QR
130|PARTIAL|schema.ts:372; transport.ts|Routes and vehicles; no GPS tracking
131|ABSENT|none found|No library or barcode scanning
132|PARTIAL|attendance.ts:17|Uses dataCache; speedup claim unverifiable
133|ABSENT|none found|No library module, ISBN or fines
134|ABSENT|none found|No driver app or boarding tracking
135|PARTIAL|attendance.ts:204; worker.ts:443|Absence alerts via FCM push, not WhatsApp
136|PARTIAL|GlobalOfflineGuard.tsx; take-attendance.tsx:609|Offline detection and local draft; no verifiable sync queue
137|ABSENT|none found|No online-admission document verification
138|PRESENT|schema.ts:7; lib/resolve-tenant.ts|Multi-tenant isolation by tenantId throughout
139|ABSENT|none found|No Google or Microsoft SSO
140|PRESENT|per-role dashboards web+mobile|Role-based dashboards exist
141|PARTIAL|schema.ts:63 avatar; s3.ts|Photo upload exists; no background removal
142|ABSENT|none found|No public admission form or conversion tracking
143|PARTIAL|schema.ts:35; super-admin/audit-logs.tsx|Audit log exists but super-admin scoped only
144|PARTIAL|fee-receipt.service.ts; schema.ts:348|Branded receipts exist; no Tally export
145|PARTIAL|events.ts; admin/calendar|Calendar and notify exist; no reminder scheduling
146|PARTIAL|lib/razorpay.ts; catalog.ts:358|Razorpay only; PayU, Cashfree and Paytm absent
147|PARTIAL|reports.ts:34 and 101|Class and exam reports; no date range or attendance report
148|PARTIAL|schema indexes; dataCache|Isolation and indexes present; 2x claim unverifiable`;

const byId = new Map();
for (const line of rows.split("\n")) {
  const [id, verdict, evidence, note] = line.split("|");
  byId.set(Number(id), { verdict, evidence: evidence.trim(), note: note.trim() });
}

const missing = items.filter((i) => !byId.has(i.id));
if (missing.length) throw new Error(`no verdict for ids: ${missing.map((m) => m.id).join(",")}`);

const tally = {};
for (const [, v] of byId) tally[v.verdict] = (tally[v.verdict] ?? 0) + 1;

const md = [];
md.push("# Changelog parity ledger — inkwelly.com vs this repo");
md.push("");
md.push(`Generated 2026-09-28 from ${items.length} published entries (${items.at(-1).when} → ${items[0].when}), each checked against \`apps/web\`, \`apps/server\` and \`apps/mobile\`.`);
md.push("");
md.push(`**Result: ${tally.PRESENT ?? 0} present, ${tally.PARTIAL ?? 0} partial, ${tally.ABSTENT ?? tally.ABSENT ?? 0} absent.**`);
md.push("");
md.push("Verdict rules: PRESENT = runnable code does what the entry claims. PARTIAL = some of it, with the gap named. ABSENT = no implementation anywhere (a PRD, roadmap or integration-catalog mention does not count).");
md.push("");
md.push("| # | when | type | scope | feature | verdict | evidence | what this repo is missing |");
md.push("|---|---|---|---|---|---|---|---|");
for (const it of items) {
  const v = byId.get(it.id);
  md.push(`| ${it.id} | ${it.when} | ${it.type} | ${it.scope} | ${it.title} | **${v.verdict}** | ${v.evidence} | ${v.note} |`);
}
fs.writeFileSync(new URL("./changelog-gap-ledger.md", import.meta.url), md.join("\n") + "\n");

console.log("ledger rows:", items.length, tally);
