# Scan-to-sign-in (QR login) — Design Spec

Date: 2026-10-01
Status: approved in design, awaiting implementation plan
Reference: inkwelly.com changelog entry #11 — "sign in on any school computer by scanning a QR code" (`docs/research/changelog-gap-ledger.md:21`, marked **ABSENT**: this codebase has QR for *attendance* only). Screenshot supplied by the product owner shows the target panel: `HAVE THE APP? / Scan to sign in. / No OTP to wait for. Your phone confirms it's you.` + QR + manual fallback code `2JR-YMP` + three steps.

## Problem

Signing in on a school computer means typing an email, a password, and (for some accounts) an OTP, on a shared machine, often while a queue of parents or students waits. The admin's phone is already authenticated. The phone should be able to vouch for the browser.

This is a **port of a shipped feature**, not an invention. The UX is fixed by the screenshot and by prod; what is ours to decide is the security contract underneath it.

## Scope (as agreed)

| Surface | In this slice | Out of this slice |
|---|---|---|
| Web login page | **Full panel**: QR, expired state + manual "Show a new code", manual fallback code, the 3-step copy, the shared-computer option, and the session handoff | Nothing on web is deferred |
| Web | **Signed-in devices**, as an account-menu dialog (not a new nav row — see "Surfaces"): list every device/session, revoke one or all | — |
| Mobile app | **One entry point, admin only** ("Sign in on web") + the **Signed-in devices** list it can revoke from | Every other role (teacher / staff / student / parent) |

The role gate is a single list on the server (`APPROVE_ROLES`) so widening it later is one edit, not a rewrite.

**Placement decision, recorded because the product owner's two phrasings differ** ("admin dashboard" vs "in more tab"): the entry goes in the admin **More** tab's *Account Settings* section. That file gates its admin sections on `isAdmin` (`apps/mobile/src/app/(admin)/(tabs)/more.tsx:57`), but that flag is `role === 'admin' || role === 'super_admin'` — the new row gates on `role === 'admin'` **alone**, matching the server's `APPROVE_ROLES`, so a super-admin is never shown a button the server will refuse. The row opens the scanner sheet; nothing else changes.

Why not the admin dashboard: `apps/mobile/src/app/(admin)/(tabs)/dashboard.tsx` is a one-line re-export of `CommonDashboard`, a component **shared by every role**, and putting an admin-only affordance inside a role-shared component is the pattern this project has explicitly rejected.

## Non-goals

- No change to password login's **behaviour** (credentials, rate limits, response shape). It does gain
  one column on the row it writes — see "Signed-in devices".
- Device list and per-device revoke **are** in scope (see below). This closes the half of changelog
  #102 that the gap ledger marks PARTIAL — "Revoke-all on replay; **no device list**"
  (`docs/research/changelog-gap-ledger.md:112`).
- No super-admin approval path.
- No push notification to the phone; the web polls. (Prod's copy says "No OTP to wait for", not "no internet".)

## Signed-in devices (DB-backed, revocable)

The product owner's requirement: every machine signed in from must be **visible in the app, stored in
the database, and individually removable.**

The table already exists — `RefreshToken` (`apps/server/src/db/schema.ts:82-94`) carries `userId`,
`tenantId`, `userAgent`, `ipAddress`, `expiresAt`, `createdAt`, with `RefreshToken_userId_idx` already
there to make "this user's sessions" an index scan. Sessions are not a new concept to invent a table
for; a second source of truth about who is signed in would drift the first time a rotation deletes a
row in one place only.

**The wrinkle that makes this a migration and not a SELECT.** Refresh tokens **rotate**: `refresh.ts:132`
deletes the presented row and inserts a new one on every refresh, so a row `id` names *one token*, not
*one device*. A device list built on row ids would rename itself every few minutes. Two columns close
that gap:

```sql
ALTER TABLE "RefreshToken" ADD COLUMN "sessionFamily" text;   -- stable per sign-in, carried through rotation
ALTER TABLE "RefreshToken" ADD COLUMN "lastSeenAt" timestamp; -- bumped on each rotation
ALTER TABLE "RefreshToken" ADD COLUMN "isShared" boolean;     -- shared-computer mode, see below
CREATE INDEX "RefreshToken_userId_sessionFamily_idx" ON "RefreshToken" ("userId", "sessionFamily");
```

All three columns are nullable, so existing rows and the pre-existing insert path keep compiling
untouched — the migration has no data dependency and no backfill.

- Minted at `login.ts` and at scan-approve: `sessionFamily = crypto.randomUUID()`, `lastSeenAt = now`.
- Carried forward by the rotation in `refresh.ts` — the new row copies the old row's `sessionFamily`
  and refreshes `lastSeenAt`. Existing rows get `NULL` and are displayed as one entry per row
  ("Unknown session · signed in <createdAt>"), which is honest and needs no backfill.
- `GET /auth/sessions` → `DISTINCT ON (sessionFamily)` latest row per family: `{ id: sessionFamily,
  device, browser, ip, signedInAt, lastSeenAt, expiresAt, current: <the family that served this request> }`.
  `device`/`browser` are parsed from the stored `userAgent` server-side — the phone must not be sent a
  raw UA string to interpret.
- `DELETE /auth/sessions/:family` → deletes that family's rows for **that user only** (the `userId`
  predicate is not optional; a family id is a UUID, but authorising by it alone is how cross-tenant
  reads get written).
- `POST /auth/sessions/revoke-all` → the existing `denyAllRefreshTokens(userId)` (`lib/jwt.ts:65`).

**What revoking actually does, stated plainly because it is not instant.** `lib/auth.ts:73-74`
invalidates access tokens by comparing the token's `iat` against `users.updatedAt` — a **whole-account**
mechanism, which is exactly why `denyAllRefreshTokens` bumps `updatedAt`. Bumping it to kill one laptop
would sign out every other device too. So:

| Action | Effect on the revoked device | Latency |
|---|---|---|
| Revoke one device | Its refresh row is gone, so it cannot renew | ≤ **15 minutes** — the already-issued access token stays valid until `ACCESS_TOKEN_EXPIRY` (`lib/jwt.ts:13`) |
| Revoke all devices | `denyAllRefreshTokens` deletes every row **and** bumps `updatedAt` | **immediate** — the next guarded request fails |

A per-device *immediate* kill needs a jti denylist consulted on every request (a Redis read on the hot
path of every guarded route, for all traffic, to save 15 minutes on a rare action). Not worth it here;
the UI says "This device will be signed out within 15 minutes" rather than pretending otherwise. If
that copy ever reads wrong to the product owner, the denylist is the change to make — and it should be
its own decision, not a silent addition to this one.

Surfaces:
- **Mobile (the product owner's ask):** a **Signed-in devices** screen in the admin app, same role gate
  as the scan button, reachable from the admin More section.
- **Web:** the same list as a dialog opened from the existing account affordances — the header account
  dropdown (`components/layout/header.tsx:354`, which already holds "Change password") and the sidebar
  footer (`components/layout/sidebar/SidebarFooter.tsx:88`). It deliberately does **not** get a sidebar
  nav row: this project mirrors prod's navigation and refuses to invent rows prod does not have, so a
  session list lives where the account controls already live — the same shape as
  `components/modals/change-password-modal.tsx`, mounted from `app-layout.tsx:486` with the
  `open-change-password` event pattern at `:386-392` reused for "open-devices".

The row that is serving the current request is labelled "This device" and its revoke control reads
"Sign out of this browser" — revoking your own session out from under yourself is a footgun worth one
conditional.

## Shared-computer mode (the checkbox at the bottom of the reference panel)

The screenshot carries one more promise than the copy above it: **"This is a shared computer — Signs out
after 12 hours and leaves nothing on this machine."** It is in the reference, so it is in the web
surface. Two effects, and both have to be real or the checkbox is a lie:

1. **12 hours, not 7 days.** The checkbox is set when the challenge is *created*, stored on the
   challenge, and honoured at mint time: the refresh row is issued with `expiresAt = now + 12h` and
   `isShared = true` (a third column on the same migration), instead of the `REFRESH_TOKEN_EXPIRY`
   default of 7 days (`lib/jwt.ts:14`). The device list then shows "Shared computer · expires in 11 h"
   so the promise is visible where it is kept.
2. **Nothing persisted.** Today `Login.tsx:92-93` writes the token to **both** `localStorage` and a
   cookie with `SESSION_EXPIRY_DAYS`. In shared mode the session lives in memory only: a session cookie
   (no `max-age`, no persistent entry) and **no `localStorage` write**, so closing the tab ends it and a
   walk-up user cannot press the up-arrow in the address bar and be signed in. This is the one place the
   scan path must *not* reuse the password path's storage code verbatim, so `applySession(data, {
   shared })` takes the flag explicitly rather than the panel growing its own storage logic.

Consequence worth stating before it surprises anyone: in shared mode a page reload signs the user out,
because there is no persisted token to reload with. That is what "leaves nothing on this machine" costs,
and it is the correct trade on a school front-desk terminal. The panel says so in the sub-copy rather
than letting the user discover it.

## Contract

The challenge flow below is **three** endpoints; the device list adds **three** more, defined with their
signatures in "Signed-in devices" (`GET /auth/sessions`, `DELETE /auth/sessions/:family`,
`POST /auth/sessions/revoke-all`) — six in total. All of them live under the existing `/auth` prefix so
they inherit **both** API groups (`apps/server/src/index.ts:299` mounts `/api/v1`, `:349` mounts the
legacy `/api`; `authRoutes` is `.use()`d in each at `:301` and `:351`). Adding them to a new top-level
module would make them reachable on one group only — the silent-404 failure this repo has been bitten
by before.

1. `POST /auth/login-challenge` — **unauthenticated** (called from the login page), body
   `{ shared?: boolean }`.
   → `{ challengeId, code, expiresAt }`, `Cache-Control: no-store`.
2. `GET /auth/login-challenge/:id` — **unauthenticated** poll.
   → pending: `{ status: 'pending' }`; approved: `{ status: 'approved', token, refreshToken, user }` — **the identical shape `POST /auth/login` returns** (`modules/auth/login.ts:140`), which is what makes this invisible to everything downstream; expired/burned: `{ status: 'expired' }` / `{ status: 'consumed' }` with `set.status = 410`.
3. `POST /auth/login-challenge/:id/approve` — **authenticated** (the app's own bearer), body `{ code }`.
   → `{ status: 'approved', user: { name, email } }` for the phone's confirmation toast. The session is minted for **the approver**, never for whoever created the challenge.

The QR payload carries **`inkwelly://login?c=<challengeId>` and nothing else.** No token, no email, no tenant id, no user id — the PRD's own privacy line (`apps/server/docs/PRD.md:309`, "PII never in QR payloads or logs") applies with more force to a login bearer than to an attendance code. The short `code` is *not* in the QR either; it is rendered as text beside it, so a camera-only attacker who photographs the screen still cannot approve without also reading the visible code aloud or typing it.

## State

No table, no migration **for the challenge itself** (the device list does get a migration — see
"Signed-in devices"). A login challenge is a 90-second secret with no life after use; persisting it to
Postgres creates a row that must be swept and buys nothing an audit log does not already record.

Stored in Redis with an in-memory fallback, following the pattern already used for security-bearing counters in `apps/server/src/lib/ratelimit.ts:82` (`if (redis.status === 'ready') … else local Map`):

```
login_challenge:<id>  → JSON { code, status, shared, ua, ip, createdAt }   TTL 90 s
login_challenge:code:<CODE> → <id>                                 TTL 90 s  (for code-only approval)
```

`status` ∈ `pending` → `consumed` | `expired`. Approve does a **compare-and-set** on that key: read, verify, write `consumed` — the same "burn the code instantly" rule the attendance kiosk already enforces (`modules/employee-attendance/staffAttendance.routes.ts:492`, `activeQRSessions.delete(tenantId)` on a successful scan), and for the same reason: a code that can be used twice is a code that can be relayed.

Deliberate upgrade over the attendance kiosk: that one keeps its sessions in a process-local `Map` (`staffAttendance.routes.ts:543`), so a second server instance cannot see the code it is being asked to validate. Challenges are stored in Redis *because* a login must not depend on which instance answers the poll.

Generation: `challengeId` = 24 chars from `crypto` (not `Math.random`). `code` = 5 chars from a no-ambiguous-alphabet (`23456789ABCDEFGHJKMNPQRSTUVWXYZ`, i.e. Crockford-style, no `0O1IL`) — `2JR-YMP` in the screenshot is that shape, hyphen included for readability and stripped before comparison.

## Security analysis

The threat is not "can an attacker guess a code". It is **relay**: someone photographs the login screen (or is shown it over a video call) and gets a second person to approve it. Three defences, all cheap:

1. **The approver sees what they are approving.** The confirm sheet renders the challenge's captured `userAgent` and `ip`-derived location, e.g. *"Chrome · Windows · Mumbai · 2 seconds ago"* — data `/auth/login` already captures for its audit line (`lib/ip.ts:37`, changelog #49), so this is reuse, not new plumbing. A parent in Kolkata approving a challenge created in Delhi is the thing this makes visible.
2. **Explicit tap.** Scanning never approves. Product owner chose this over instant-approve; the extra tap is the whole cost of the defence.
3. **Short TTL, single use, bounded guesses.** 90 s; burned on approval; **5 wrong-code attempts per challenge** (counter on the same key, then the challenge is consumed-as-failed), because 5 chars over a 32-char alphabet is ~33 M combinations and an unbounded loop against a 90-second window is a realistic phone-side attack.

Plus the ordinary hygiene: rate-limit `POST /auth/login-challenge` on the same IP+account helper pattern as `getLoginAttempts` (an unbounded create endpoint is a Redis-filler); rate-limit `approve` per user; `Cache-Control: no-store` on both the challenge create and poll responses so a shared school computer's browser does not cache an approved session out of the poll body; no `challengeId`, `code`, `token` or `refreshToken` in any log line; and the minted `refreshTokens` row carries the **browser's** UA and IP, not the phone's, so revocation and any future device list describe the machine that got the session.

Session equivalence: the minted access token is signed by the same `signAccessToken` with the same claims, so RBAC, tenant scoping and every existing guard apply unchanged. There is no "lesser" scan session — a hidden second class of session is how a feature like this leaks.

Implementation note the plan must honour: `login.ts:103-127` currently inlines access-token signing, refresh-token signing, `hashToken`, the `refreshTokens` insert, logging and PostHog capture. The approve route needs the same. Extract **one** `issueSession(user, { ip, userAgent })` helper and call it from both; do not copy the block. (Duplicating a security-critical issuance path is the kind of thing that silently diverges the first time someone rotates a TTL in one place only.)

## Web UI

`apps/web/src/modules/auth/components/Login.tsx` (459 lines) gains the panel as a **separate component**, `ScanToSignInPanel.tsx`, mounted beside the credentials card — not woven into the existing form's JSX.

- Fetches a challenge on mount, renders the QR with the already-installed `qrcode` dep (`apps/web/package.json:52`), precedent for the data-URL call at `modules/employee-attendance/teacher-attendance/adminStaffAttendance/LiveAttendanceQRModal.tsx`.
- Polls `GET /auth/login-challenge/:id` every 2 s while the code is live.
- **On expiry the panel stops polling and shows the expired state from the reference — the QR blurred
  behind a "Code expired" heading and a single `Show a new code` button. Nothing regenerates on a
  timer.** The first draft of this spec had it auto-regenerate once; the product owner ruled that out,
  and the reasoning is sound: an unattended login page (the front desk of a school, open all day) would
  otherwise mint a challenge, poll it 45 times, expire, and repeat forever — requests and Redis writes
  that sign nobody in. One create call per human glance at the button is the correct cost.
- Polling also pauses when the tab is hidden (`document.visibilityState`) and stops on unmount, so a
  login page left open in a background tab is silent.
- On `approved`, calls a **newly extracted** `applySession(data, { shared })` — the exact body of the current success handler at `Login.tsx:92-95` (`localStorage.setItem('school_token', …)` + `setCookie(…, SESSION_EXPIRY_DAYS)` + `login({...})`), with `shared` deciding whether anything is persisted (see "Shared-computer mode"). Password login and scan login then share one post-login path, so the tenant launcher, sidebar gating and refresh loop cannot behave differently between the two.
- Renders the reference's **"This is a shared computer"** checkbox with its sub-copy, and passes the flag
  in the challenge create body. The checkbox's state is the *request*; the server's `isShared` column is
  the *record*. A panel that styles the box without sending it is the defect to watch for.
- The panel must not be built as a second login form. If it needs its own submit/redirect logic, that is a defect.

## Mobile UI

Two rows in the admin More tab, both inside the *Account Settings* group (`more.tsx:130`, which today
holds "Profile Settings" and "Change Password" and is **not** role-gated — the new rows join it behind
the `role === 'admin'` check, the same way the `isAdmin` block at `more.tsx:136` already adds gated
groups to an ungated section):

1. **Sign in on web** → a sheet with two paths:
- **Scan**: reuse the `expo-camera` (`apps/mobile/package.json:14`, `~57.0.5`) pattern from `src/modules/attendance/components/TeacherQRScanModal.tsx`. Parse the payload, reject anything that is not an `inkwelly://login?c=` URL (a school attendance QR scanned here must say "not a sign-in code", not silently post something), then show the confirm sheet → `approve`.
- **Type the code**: the same `approve` call with the 5-char code, for a camera that will not focus. One endpoint, one gate, so no role can be reachable by one path and not the other.
2. **Signed-in devices** → the list screen: one row per `sessionFamily` with the parsed device/browser,
   IP, "signed in", "last seen", and expiry; a revoke control per row and "Sign out of all devices". The
   row serving the phone's own session is marked "This device" and offers no revoke, deliberately unlike
   the web row: signing a browser out of a shared computer is the point, while signing the phone out of
   itself only locks the admin out of the tool that revokes devices. Uses the repo's existing list-screen fetch/refresh
   pattern; no new state library.

`apps/mobile/src/lib/api.ts:334` is `api.get<T = any>`-shallow: the response types for all six endpoints get declared explicitly, the same lesson that made this session's classLevel rename survivable.

## Verification

- **Unit** (`bun test`): store lifecycle — create, poll-pending, approve, second approve rejected, expiry, 6th wrong code consumes the challenge, code comparison is case- and hyphen-insensitive.
- **Route tests**: create unauthenticated OK; approve without a bearer → 401; approve as a non-admin role → refused by `APPROVE_ROLES`; poll a burned id → 410 `consumed`. Proving the role gate needs the throwaway-refused-request method this repo already uses for Elysia guards (they enforce nothing when mounted wrong).
- **Live end-to-end against the real server**: create → capture UA/IP → approve with a real admin token → poll → assert the returned `token` **authenticates** a follow-up `GET /auth/me`. This is the only test that proves the feature does anything; a passing typecheck proves nothing here.
- **Sessions / devices**: migration applied as committed SQL run directly (this repo's `db:migrate`
  exits 1 locally and `drizzle-kit` cannot detect drift — the established path is applying the SQL and
  then reading `information_schema` to prove the three columns and the index exist); sign in → refresh →
  assert **one** `sessionFamily` with a newer `lastSeenAt`; revoke one → that family's rows are gone and
  the other survives; revoke-all → immediate, proven by a guarded request failing; **cross-user
  authorisation** proven by a throwaway `DELETE /auth/sessions/:family` issued with user B's token
  against user A's family, which must be refused and must leave A's row intact (a UUID is not an
  authorisation boundary).
- **Role gate, both sides**: a `super_admin` bearer must be **refused** by `approve` (the gate is
  `role === 'admin'`, not `isAdmin`), and the same account must see **neither** new mobile row. The web
  devices dialog is reachable for any signed-in role that can reach the account menu — sessions are
  scoped by `userId`, so this is not a privilege boundary and must not be described as one. Read the
  rendered row list and the HTTP status; a gate that "looks right" in JSX while the server accepts the
  request is the failure this repo has already been bitten by twice.
- **Shared mode**: after a shared scan-sign-in, assert in the browser that `localStorage` has **no**
  `school_token` key and the cookie has no `max-age`, and that the minted refresh row's `expiresAt` is
  ~12 h out, not 7 days. Read the storage and the row — the checkbox's rendered state proves nothing.
- **Browser pass** on `/login` with the panel visible, verified from the **network log** (a 404 on the challenge endpoint renders as a healthy-looking empty QR box). Docker Desktop must be running or server route tests time out at 5000 ms for reasons unrelated to this code.
- **Mobile**: compile target (`cd apps/mobile && bun run typecheck`) plus one real-device pass if the owner has the dev client up; the scanner cannot be verified in a simulator-less environment, and "it typechecks" must not be reported as "sign-in works on the phone".

## Risks

| Risk | Mitigation |
|---|---|
| Redis down → challenges vanish between create and approve | Local-Map fallback, same as `ratelimit.ts`; a challenge is then pinned to one process, which works on the single-instance dev box and degrades loudly rather than silently on a multi-instance deploy |
| Poll loop hammering the server on a stuck login page | Fixed 2 s interval, paused on hidden tab, stopped on unmount, and **`expired` terminates polling** — a new challenge exists only because a human pressed "Show a new code" |
| Rotation forgets to carry `sessionFamily` | The device list silently splits one laptop into a dozen entries, which is the failure mode this whole feature exists to prevent. Covered by an explicit test: sign in, refresh, assert **one** family with a newer `lastSeenAt` |
| Revoking the device you are standing at | "This device" row reads "Sign out of this browser" and the screen is re-fetched after; no ghost row left in the list |
| Shared mode surprises someone who expects a reload to survive it | Stated in the panel's own sub-copy, and the device list labels the family "Shared computer" |
| Approver is an admin whose own session is stale | Approve runs under the normal auth guard, so an expired bearer fails before any minting |
| Someone later treats the scan session as lower-trust | Explicit non-goal above: one `issueSession`, one session class, one revocation path |
