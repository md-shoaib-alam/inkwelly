# Changelog batch 3 (entries 75-111 of 148)

#75 [New/fees] 17 May 19:44 IST — A4 fee receipts with QR verification and thermal printer settings
    A4 receipts: Schools can now print or share a polished A4 fee receipt with their own logo, signature, amount in words, and a tamper-proof verification QR. Labels render in English, Hindi, or both — useful for Hindi-medium schools. Part of the fee management module . | Receipt Template settings: A single screen controls
#76 [New/payments] 17 May 06:14 IST — share UPI payment links with parents for unpaid fees
    Payment links: School office staff can generate a Razorpay UPI payment link for any unpaid fee invoice and share it instantly over WhatsApp, SMS, email or app push, bilingual in English and Hindi. Parents tap once and pay via UPI (PhonePe, GPay, Paytm), cards or netbanking — the invoice is marked paid and the receipt f
#77 [New/fees] 16 May 21:13 IST — notify parents on all 4 channels when a fine is added
    Fees: When a school adds a fine to a student's fee account, parents now receive an instant alert on WhatsApp, SMS, email, and push notification — bilingual in English and Hindi out of the box. Saves school office staff from explaining the charge over phone and matches the parent communicationflow parents already trust 
#78 [New/payments] 16 May 20:15 IST — show Razorpay MDR and GST per online fee payment
    Reports: New Gateway Charges report at Student Fees → Reports. Shows exactly what Razorpay deducted per transaction — MDR + GST per method, net settlement to the school's bank, and any shortfall between what parents paid and what landed. Fee and transport online payments combined; filterable by date range, drill-down t
#79 [New/payments] 16 May 18:09 IST — parents can pay fees and transport online via Razorpay
    Payments: Parents can now pay fee and transport invoices online from the student portal using Razorpay — cards, UPI, netbanking, or wallets. Partial payments allowed; receipts and WhatsApp / SMS / email confirmations to parents continue to fire automatically. See fee management module . | Configuration: Three-tier setu
#80 [New/communications] 16 May 15:44 IST — built-in app push for every school from day one
    Push notifications: Parents on the Inkwelly Android app now receive instant alerts for fees, attendance, homework, and marksheets the moment they happen. Schools never configure Firebase or service-account keys — push is built into the platform from day one, alongside the parent communication module. | Multi-device: A 
#81 [New/notifications] 15 May 15:22 IST — built-in email for every school from day one
    Email notifications: Every Inkwelly school now sends transactional email — fee receipts, attendance updates, admission confirmations, exam results — without setting up an AWS account, DKIM keys, or DNS records. Messages go out as "<school name>" < [email protected] > with the school's chosen Reply-To address, so parent
#82 [New/fees] 14 May 02:12 IST — one-click thermal receipt printing at the fee counter
    Fee receipts: Cashiers can now print the school fee receipt directly to an 80mm or 58mm thermal printer (Olivetti PRT80, Epson TM-T82, similar) — no browser dialog, no PDF detour. A visual paper-size picker shows both widths side-by-side, and the workstation remembers the last choice for next time. Built for busy fee c
#83 [New/attendance] 11 May 09:17 IST — employee attendance reports for HR and payroll
    Employee attendance reports: Five new built-in reports for school HR — monthly register, salary-ready summary, late and short-leave tracker, leave balance with carry-forward, and a raw audit export. Replaces the manual Excel work office staff did every month. | Payroll-ready summary: The salary report computes LOP days
#84 [New/hr] 09 May 05:45 IST — unified staff departments shared with attendance and payroll
    HR: Schools now maintain Teaching, Admin, and Support staff departments in a single list with code, short name, colour, and display order. Per-department attendance behaviour — in/out timings, week-offs, work-from-home, short-leave rules, and leave approval chains — attaches to the same record. No more entering the sam
#85 [New/fees] 09 May 24:16 IST — annual promotion carries unpaid fees as one opening balance
    Fees: Unpaid fees now roll forward into one "Opening Balance" invoice on the new profile when a student is promoted. Previous-session invoices freeze automatically so the same dues cannot be collected twice. CBSE / ICSE / State-board schools running annual promotions with parents in arrears get a clean carry-forward wi
#86 [New/student] 07 May 21:41 IST — student promotion — guided wizard with eligibility checks, capacity caps, soft-undo, hard reverse, carry-forward, and exam-end reports
    Six-step promotion wizard: Promotion now happens in a clearly labelled flow — pick scope and target session, select students (search by name or admission number, or pick whole class rosters), check eligibility, place each student into a target class, review the diff, then execute. Nothing hits the database until the pr
#87 [New/student] 22 Apr 10:15 IST — Student performance overview with progress and attendance trends
    Students: Each student now has a single-screen overview showing exam scores, attendance trends, fee status, and co-scholastic grades across the academic year. Built for parent-teacher meetings at CBSE, ICSE, and State board schools.
#88 [New/media] 21 Apr 11:30 IST — School-wide media library for logos, photos, certificates, and ID cards
    Media: One organised place for every visual asset across the school. Folder hierarchy, duplicate detection, and direct integration with marksheet, ID card, and admit card flows. Office staff stop emailing the same logo around to teachers.
#89 [New/timetable] 20 Apr 15:30 IST — Substitute teacher assignment with one-click swap on absences
    Timetable: When a teacher applies for leave, the timetable suggests free substitute teachers across the school for every affected period. One click to swap. Saves 30 minutes a day for office staff at large schools.
#90 [New/examinations] 18 Apr 16:10 IST — Examination reports — class-wise, student-wise, subject-wise
    Reports: Principals can slice exam performance any way they want. Class topper lists, subject-level analytics, printable summary reports — all with one-click PDF export. Built for CBSE schools running large examination cycles.
#91 [New/parent] 17 Apr 11:45 IST — Parent portal redesigned for cheap Android phones
    Parents: Faster app on entry-level Android phones used in Tier-2 and Tier-3 cities. Single-tap access to attendance, fees, marksheets, and homework — no app install required, accessible on the same WhatsApp chat where reminders arrive.
#92 [New/timetable] 15 Apr 10:05 IST — Automatic timetable generation with conflict detection
    Timetable: Generate a full school timetable in seconds. Detects teacher clashes, room conflicts, and subject distribution rules across CBSE, ICSE, and State board patterns. Manual overrides preserved across regenerations.
#93 [New/fees] 14 Apr 13:20 IST — UPI QR code on every fee receipt for instant smartphone payment
    Fees: Every printed fee receipt now carries a UPI QR. Parents pay from any UPI app — PhonePe, Google Pay, Paytm, BHIM — by scanning at home. Auto-reconciled to the student account in the fee management module .
#94 [New/whatsapp] 12 Apr 14:50 IST — Parent communication via WhatsApp Business API
    WhatsApp: Inkwelly is WhatsApp-native . Attendance updates, fee reminders, marksheet links, and emergency notices reach parents on the channel they actually use — no app install required. See parent communication .
#95 [New/homework] 11 Apr 09:50 IST — Class teacher dashboard for daily homework tracking
    Homework: Teachers post daily homework once on the class dashboard — students and parents see it on web and on the parent app, and a WhatsApp summary goes to parents at the end of every school day.
#96 [New/marksheets] 10 Apr 09:25 IST — Public marksheet verification page with QR code scanning
    Marksheets: Universities, employers, and parents verify any Inkwelly-issued marksheet by scanning its QR. Anti-tampering signature with full audit trail. Useful for ICSE/ISC and CBSE schools whose students apply to universities abroad.
#97 [New/fees] 09 Apr 15:00 IST — Tally export improvements with per-line GST split for accountants
    Fees: Fee receipts export to Tally with proper GST line-item splits — service tax, GST, head-wise breakup. Schools with multiple fee heads (tuition, transport, lab, exam) reconcile in minutes instead of the month-end Excel chaos.
#98 [Fix/whatsapp] 08 Apr 18:00 IST — Improved WhatsApp delivery reliability for low-signal areas
    WhatsApp: Retry logic, exponential backoff, and message queue improvements for schools in Tier-2 and Tier-3 cities with patchy connectivity. Reliably delivers attendance and fee reminders even on 2G fallback.
#99 [New/hr] 06 Apr 12:30 IST — Employee leave balance carry-forward across financial years
    HR: Leave balances now carry forward from FY 2025-26 to FY 2026-27 with configurable rules per leave type. Casual, earned, sick, and compensatory leaves each follow your school's policy automatically.
#100 [New/student] 05 Apr 12:15 IST — Student profile with full academic history and achievements timeline
    Students: Every test, every assessment, every co-curricular achievement — preserved across academic years and visible to parents and class teachers. Data follows the student for the full school journey, board to board.
#101 [New/security] 03 Apr 10:45 IST — Two-factor authentication for school principals and org admins
    Security: TOTP-based 2FA (Google Authenticator, Authy, Microsoft Authenticator) for principals and organisation admins. Critical for schools storing student records, fee data, and parent contact information.
#102 [New/security] 02 Apr 15:30 IST — Active session management for organisation admins
    Security: See who's logged in, from which device, and revoke any session in one click. Critical for Indian schools with rotating administrative staff or shared computers in the office. March 2026 19 changes
#103 [New/admissions] 31 Mar 11:15 IST — Bulk admission CSV import for board exam takers
    Admissions: Schools that take 200+ board exam students every year can now bulk-import the admission list from a CSV. Auto-creates student records, generates roll numbers per CBSE / ICSE / State board conventions, and links to the admit card flow.
#104 [New/attendance] 30 Mar 11:00 IST — IoT biometric device integration for staff attendance
    Attendance: Plug-and-play support for ESSL, Mantra, and other biometric devices used in Indian schools. Live sync to staff attendance with shift, late, and overtime rules feeding directly into payroll.
#105 [New/fees] 28 Mar 14:00 IST — Instalment plans per student with auto-reminders for each instalment
    Fees: Set up custom instalment plans per student or per fee head. Each instalment triggers its own WhatsApp reminder schedule. Used by boarding schools, IGCSE schools, and budget private schools running flexible payment terms.
#106 [New/subjects] 27 Mar 14:20 IST — Drag-and-drop subject reordering across teaching batches
    Subjects: Subject order on report cards, marksheets, and dashboards now matches your school's preferred convention — board sequence, alphabetical, or custom. Set once, applies everywhere.
#107 [New/fees] 25 Mar 16:10 IST — Late fee rules with grace period configuration per fee head
    Fees: Different late-fee policies for tuition, transport, and exam fees. Configurable grace period, percentage / fixed amount, and capping rules. Auto-applied on the fee receipt without manual intervention.
#108 [New/examinations] 24 Mar 10:40 IST — Bulk Excel marks editor for fast class-wide entry
    Examinations: Class teachers paste marks directly from Excel — Inkwelly auto-validates against grade scales and flags out-of-range entries before saving. Saves hours on board exam result-day workloads.
#109 [New/marksheets] 22 Mar 13:00 IST — Bulk lock and unlock marksheets with explicit status workflow
    Marksheets: Once marksheets are issued they're locked from edits — only the principal can unlock with a written reason that's logged for audit. Critical for ICSE/ISC and IB schools who must maintain examination integrity.
#110 [New/media] 21 Mar 16:00 IST — Inline image editor — crop, filter, resize, drop shadow
    Media: Edit student photos, school logos, and certificate images directly in Inkwelly without bouncing to Photoshop or Canva. Background removal included. Saves the office staff at most schools a separate Canva subscription.
#111 [New/media] 19 Mar 10:30 IST — Bulk ID card printing with reusable templates per academic year
    ID cards: Design once at the start of the academic year, print for the entire school in one job. Front-back layout, photo placement, QR code with verification link, and academic-year-aware data binding.
