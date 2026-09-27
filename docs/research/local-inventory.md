# Local codebase inventory (as of 2026-09-28)

Use this as the fast-path index. Verify with Grep/Read before calling something PRESENT.

## apps/server — route files (`src/routes/`)
admit-cards, assessments, attendance, auth, certificates, classes, dashboard, events, exams, exports, fees, grades, homework, integrations, leaves, notices, notifications, parents, performance, platform-settings, platform, promotions, reports, roles, staff-attendance, staff, students, subjects, submissions, subscriptions, super-admins, teachers, tenant-settings, tenants, tickets, timetable, transport

Registered in `src/index.ts` via `.use(...)`: all of the above plus `imports`, `health`.

## apps/server — other src layout
`src/graphql/{resolvers,typeDefs}/`, `src/services/`, `src/lib/` (redis, env, validation, monitoring, integrations, plans.ts, permissions.ts), `src/db/` (schema.ts, schema/, relations.ts, seed.ts, full_seed_data.ts), `src/auth/`, `src/types/`

## apps/web — screen keys handled by `(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx`
academic-years, admit-cards, assessments, assignments, attendance, bulk-promote, calendar, certificates, check-payments, check-receipt, children, classes, dashboard, expenses, fee-categories, fee-concessions, fee-status, fees, grade-management, grades, graduated, homework, leaves, make-payment, manage-plan, my-attendance, my-classes, my-grades, my-subjects, notices, old-homework, parents, print-marksheet, profile, promotions, published-results, reports, results-entry, roles, school-exams, school-settings, school-subscription, staff, staff-attendance, staff-leaves, student-leaves, students, subjects, subscription, take-attendance, teacher-attendance, teacher-leaves, teachers, tickets, timetable, transport-fee, view-marksheet

Role screen folders: `src/components/screens/{admin,teacher,student,parent,staff,super-admin}/`

## apps/mobile — expo-router routes
tabs per role: admin (academic-years, attendance-staff, attendance-students, attendance-teachers, calendar, certificates, classes, dashboard, expenses, fees, leaves, more, notices, parents, profile, promotions, roles, school-settings, staff, student-leaves, students, subjects, teachers, tickets, timetable)
parent (attendance, child-profile, dashboard, fees, grades, homework, more, profile, tickets, timetable, subscription)
staff (attendance, classes, dashboard, expenses, fees, leaves, more, notices, profile, students, subjects, tasks, teachers, tickets, timetable)
student (assessments, attendance, dashboard, fees, homework, leaves, more, profile, report-card, tickets, timetable)
teacher (assessments, dashboard, exams-entry, homework, more, my-attendance, my-classes, my-leaves, my-subjects, profile, students, take-attendance, tickets, timetable)
superadmin (web-version), teacher/scan-qr, auth (login, login-new, forgot-password, change-password)

## Known-absent on first pass (verify, then keep as ABSENT if confirmed)
No AI chat / assistant module. No MCP server. No live bus tracking / GPS / odometer / fuel. No storefront / inventory / POS. No library. No house system. No grievance register. No letterhead. No class-test routine-assessment module. No enquiry/CRM pipeline. No payroll/HR (only `expenses`). No thermal printing. No DPDP-specific code.

## Rules for judging
- A feature is PRESENT only if runnable code implements the described behaviour (route + UI or at least the server capability).
- A name appearing in `docs/PRD.md`, `docs/plans/`, seed data, or a comment is **not** PRESENT.
- PARTIAL must say in one clause what specifically is missing.
