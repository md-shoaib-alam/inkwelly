// Web feature-module relocator — bun scratch/relocate-web-modules.mjs (--dry | --map | --go)
//
// Nothing is written unless --go is passed explicitly. Importing this file for inspection
// must never move 537 files; that happened once and needed a `git checkout -- apps/web`.
//
// Turns the role axis (components/screens/{admin,teacher,…}/) into the 16 feature modules.
// Adapted from scratch/relocate-server-modules.mjs; three things differ:
//   1. files are addressed by `@/…` aliases as well as relatively, and a file's existing
//      style is preserved rather than normalised (the two dispatchers disagree on quote
//      style, so normalising would be a 93-line diff for no benefit);
//   2. extensions include .tsx/.jsx/.css/.svg;
//   3. naming is derived from a role+entry table instead of ~530 literal lines.
//
// Naming (spec §5 rule 7, extended — see the note at ROLE_PREFIX):
//   screens/<role>/<entry>.tsx        -> modules/<m>/components/<Role><Entry>.tsx
//   screens/<role>/<entry>/<sub…>     -> modules/<m>/components/<role><Entry>/<sub…>
import {
  readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync,
} from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO = resolve(import.meta.dir, '..');
const APP = join(REPO, 'apps', 'web');
const SRC = join(APP, 'src');
const SCREENS = 'components/screens';
const DRY = !process.argv.includes('--go');

/** screens/<role>/<entry> -> module. Taxonomy: spec §3. */
const ENTRY_MODULE = {
  'admin/academic-years': 'academics',
  'admin/admit-cards': 'certificates',
  'admin/attendance': 'attendance',
  'admin/calendar': 'timetable',
  'admin/certificates': 'certificates',
  'admin/classes': 'academics',
  'admin/dashboard': 'dashboard',
  'admin/dashboard_components': 'dashboard',
  'admin/exams': 'assessment',
  'admin/expenses': 'finance',
  'admin/fees': 'finance',
  'admin/leaves': 'attendance',
  'admin/manage-plan': 'tenancy',
  'admin/notices': 'communication',
  'admin/parents': 'people',
  'admin/print-marksheet': 'assessment',
  'admin/promotions': 'academics',
  'admin/reports': 'data-io',
  'admin/roles': 'access-control',
  'admin/school-settings': 'tenancy',
  'admin/staff': 'people',
  'admin/staff-attendance': 'attendance',
  'admin/students': 'people',
  'admin/subjects': 'academics',
  'admin/subscription': 'tenancy',
  'admin/teachers': 'people',
  'admin/tickets': 'support',
  'admin/timetable': 'timetable',

  'super-admin/analytics': 'platform',
  'super-admin/audit-logs': 'platform',
  'super-admin/billing': 'finance',
  'super-admin/bulk-attendance-import': 'attendance',
  'super-admin/dashboard': 'dashboard',
  'super-admin/dashboard_components': 'dashboard',
  'super-admin/deleted-tenants': 'tenancy',
  'super-admin/integrations': 'platform',
  'super-admin/manage-admins': 'people',
  'super-admin/platform-notices': 'communication',
  'super-admin/queue-status': 'platform',
  'super-admin/reports': 'data-io',
  'super-admin/roadmap': 'platform',
  'super-admin/roles': 'access-control',
  'super-admin/school-detail': 'tenancy',
  'super-admin/school-subscriptions': 'tenancy',
  'super-admin/send-notification': 'communication',
  'super-admin/settings': 'platform',
  'super-admin/staff': 'people',
  'super-admin/subscriptions': 'tenancy',
  'super-admin/tenants': 'tenancy',
  'super-admin/users': 'people',

  'teacher/calendar': 'timetable',
  'teacher/dashboard': 'dashboard',
  'teacher/dashboard_components': 'dashboard',
  'teacher/exams-entry': 'assessment',
  'teacher/grade-management': 'assessment',
  'teacher/homework': 'assessment',
  'teacher/leaves': 'attendance',
  'teacher/my-attendance': 'attendance',
  'teacher/my-classes': 'academics',
  'teacher/my-subjects': 'academics',
  'teacher/notices': 'communication',
  'teacher/take-attendance': 'attendance',
  'teacher/tickets': 'support',
  'teacher/timetable': 'timetable',

  'parent/ChildSelector': 'people',
  'parent/attendance': 'attendance',
  'parent/calendar': 'timetable',
  'parent/children': 'people',
  'parent/dashboard': 'dashboard',
  'parent/dashboard_components': 'dashboard',
  'parent/fees': 'finance',
  'parent/grades': 'assessment',
  'parent/homework': 'assessment',
  'parent/notices': 'communication',
  'parent/subscription': 'tenancy',
  'parent/tickets': 'support',
  'parent/timetable': 'timetable',

  'student/calendar': 'timetable',
  'student/dashboard': 'dashboard',
  'student/fees': 'finance',
  'student/homework': 'assessment',
  'student/leaves': 'attendance',
  'student/marksheet': 'assessment',
  'student/my-attendance': 'attendance',
  'student/my-classes': 'academics',
  'student/my-grades': 'assessment',
  'student/notices': 'communication',
  'student/tickets': 'support',
  'student/timetable': 'timetable',

  'staff/dashboard': 'dashboard',

  // Not under a role folder, so no role prefix is needed to disambiguate.
  'login': 'auth',
  'profile': 'auth',
  'subscription-expired': 'tenancy',
};

/**
 * error/{maintenance,not-found} deliberately stay OUT of modules/ — they are app-level
 * fallback views with no domain, imported by the root layout before any tenant resolves.
 * They move to components/shared/, which is a shared layer alongside components/ui.
 */
const ERROR_DEST = 'components/shared/error';

const ROLE_PASCAL = {
  admin: 'Admin', 'super-admin': 'SuperAdmin', teacher: 'Teacher',
  parent: 'Parent', student: 'Student', staff: 'Staff',
};

const camel = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const pascalSeg = (s) => s.split(/[-_\s]+/).filter(Boolean)
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');

/** src-relative path (posix) -> new src-relative path, or null when the file stays put. */
function targetFor(srcRel) {
  const segs = srcRel.split('/');

  if (segs[0] === 'hooks' || segs[0] === 'lib') {
    const DOMAIN = {
      'hooks/use-fees.ts': 'finance',
      'hooks/use-expenses.ts': 'finance',
      'hooks/use-academic-years.ts': 'academics',
      'hooks/use-permissions.ts': 'access-control',
      'lib/billing-constants.tsx': 'finance',
    };
    const mod = DOMAIN[srcRel];
    if (!mod) return null; // generic infra stays in hooks/ and lib/ (spec §4)
    const sub = srcRel.startsWith('hooks/') ? 'hooks'
      : srcRel === 'lib/billing-constants.tsx' ? 'data' : 'lib';
    return `modules/${mod}/${sub}/${segs[segs.length - 1]}`;
  }

  if (segs[0] !== 'components' || segs[1] !== 'screens') return null;
  const rest = segs.slice(2);

  if (rest[0] === 'error') return `${ERROR_DEST}/${rest.slice(1).join('/')}`;

  // screens/<role>/login.tsx — files sitting directly in screens/ have no role to prefix with.
  if (rest.length === 1) {
    const base = rest[0].replace(/\.(tsx|ts)$/, '');
    const mod = ENTRY_MODULE[base];
    if (!mod) return null;
    return `modules/${mod}/components/${pascalSeg(base)}.tsx`;
  }

  // screens/profile/<part>.tsx — a shared profile screen split across five panels, not a role.
  if (rest[0] === 'profile') return `modules/auth/components/profile/${rest.slice(1).join('/')}`;

  const [role, entry, ...subParts] = rest;
  const mod = ENTRY_MODULE[`${role}/${entry.replace(/\.(tsx|ts|jsx|js)$/, '')}`];
  if (!mod) throw new Error(`No module assigned for ${srcRel}`);
  const prefixed = ROLE_PASCAL[role] + pascalSeg(entry.replace(/\.tsx$/, ''));

  // A screen component sits at components/<Role><Entry>.tsx; everything under a same-named
  // folder moves into components/<role><Entry>/ so the two can never shadow each other.
  return subParts.length
    ? `modules/${mod}/components/${camel(prefixed)}/${subParts.join('/')}`
    : `modules/${mod}/components/${prefixed}.tsx`;
}

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const toPosix = (p) => p.split('\\').join('/');
const srcRelOf = (abs) => toPosix(relative(SRC, abs));
const CODE_EXT = /\.(ts|tsx|js|jsx)$/;

// ---------------------------------------------------------------- build moves
const moves = new Map(); // oldSrcRel -> newSrcRel
for (const abs of walk(SRC)) {
  const key = srcRelOf(abs);
  if (!key.startsWith('components/screens/') && !key.startsWith('hooks/') && !key.startsWith('lib/')) continue;
  const next = targetFor(key);
  if (next && next !== key) moves.set(key, next);
}

const destSeen = new Map();
for (const [from, to] of moves) {
  if (destSeen.has(to)) throw new Error(`Collision: ${from} and ${destSeen.get(to)} both -> ${to}`);
  destSeen.set(to, from);
}

// ------------------------------------------------------------- import rewrite
// Covers `from '…'`, `import('…')`, bare side-effect `import '…'` and `require('…')`. Missing the
// dynamic form cost a stale-depth bug on the server pass, and the mobile pass proved require() has
// to be here too — React Native loads assets that way and tsc never complains about a bad depth.
const SPEC_RE = /(\bfrom\s+|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"])((?:\.{1,2}\/|@\/)[^'"]+)\2/g;

function resolveSpecifier(fromAbs, spec) {
  const base = spec.startsWith('@/') ? join(SRC, spec.slice(2)) : resolve(dirname(fromAbs), spec);
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
    if (existsSync(base + ext) && statSync(base + ext).isFile()) return base + ext;
  }
  for (const ext of ['.ts', '.tsx']) {
    const idx = join(base, `index${ext}`);
    if (existsSync(idx)) return idx;
  }
  return null;
}

const movesAbs = new Map();
for (const [oldRel, newRel] of moves) movesAbs.set(join(SRC, oldRel), join(SRC, newRel));

function newSpecFor(fromAbs, spec) {
  const targetAbs = resolveSpecifier(fromAbs, spec);
  if (!targetAbs) return null;
  const targetRel = srcRelOf(targetAbs);
  const finalRel = moves.get(targetRel) ?? targetRel;
  const ownOldRel = srcRelOf(fromAbs);
  const ownDir = dirname(join(SRC, moves.get(ownOldRel) ?? ownOldRel));
  // The original spec never carries an extension for a TS module (allowImportingTsExtensions is
  // off), so re-deriving one from the resolved filename would make typecheck fail.
  const withExt = (p) =>
    p.replace(/\.(ts|tsx|js|jsx)$/, (m) => (spec.endsWith(m) ? m : ''));
  if (spec.startsWith('@/')) return `@/${withExt(finalRel)}`;
  let rel = toPosix(relative(ownDir, join(SRC, finalRel)));
  if (!rel.startsWith('.')) rel = './' + rel;
  return withExt(rel);
}

const unresolved = [];
function rewriteImports() {
  const changed = [];
  for (const abs of walk(SRC)) {
    if (!CODE_EXT.test(abs) || !abs.startsWith(SRC)) continue;
    const before = readFileSync(abs, 'utf8');
    const after = before.replace(SPEC_RE, (whole, kw, quote, spec) => {
      if (!spec.startsWith('.') && !spec.startsWith('@/')) return whole;
      const next = newSpecFor(abs, spec);
      if (next === null) {
        if ((spec.startsWith('.') || spec.startsWith('@/components/screens')) && !spec.includes('node_modules')) {
          unresolved.push(`${srcRelOf(abs)} -> ${spec}`);
        }
        return whole;
      }
      return `${kw}${quote}${next}${quote}`;
    });
    if (after !== before) {
      if (!DRY) writeFileSync(abs, after);
      changed.push(srcRelOf(abs));
    }
  }
  return changed;
}

function run() {
  if (process.argv.includes('--map')) {
    const rows = [...moves].map(([f, t]) => `${f}\t${t}`).sort().join('\n') + '\n';
    writeFileSync(join(REPO, 'scratch', 'web-module-mapping.tsv'), rows);
    console.log(`wrote ${moves.size} mappings to scratch/web-module-mapping.tsv`);
    return;
  }
  console.log(`${DRY ? '[dry] ' : ''}${moves.size} files to move`);
  const byModule = new Map();
  for (const [, to] of moves) {
    const m = to.startsWith('components/') ? to.split('/').slice(0, 3).join('/') : to.split('/').slice(0, 2).join('/');
    byModule.set(m, (byModule.get(m) ?? 0) + 1);
  }
  for (const [m, n] of [...byModule].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${m}`);

  // Validate every rename before touching a single file. An abort halfway through the git mv
  // loop leaves the tree half-moved with rewritten imports — the worst state to debug from.
  const problems = [];
  for (const [oldRel, newRel] of moves) {
    const from = join(SRC, oldRel);
    const dest = join(SRC, newRel);
    if (!existsSync(from)) problems.push(`missing source: ${oldRel}`);
    if (existsSync(dest)) problems.push(`destination exists: ${newRel}`);
    for (let p = dirname(dest); p.length > SRC.length; p = dirname(p)) {
      if (existsSync(p) && !statSync(p).isDirectory()) {
        problems.push(`ancestor is a file: ${newRel} (via ${toPosix(relative(SRC, p))})`);
        break;
      }
    }
  }
  if (problems.length) {
    console.error(`${problems.length} rename problem(s):`);
    for (const p of [...new Set(problems)].slice(0, 20)) console.error('  ' + p);
    return;
  }

  const changed = rewriteImports();
  console.log(`${DRY ? '[dry] ' : ''}rewrote imports in ${changed.length} files`);
  if (unresolved.length) {
    console.log(`\n${unresolved.length} specifiers did not resolve:`);
    for (const u of [...new Set(unresolved)].slice(0, 40)) console.log('  ' + u);
  }
  if (DRY) return;

  for (const [oldRel, newRel] of moves) {
    const dest = join(SRC, newRel);
    mkdirSync(dirname(dest), { recursive: true });
    execFileSync('git', ['mv', join(SRC, oldRel), dest], { cwd: APP, stdio: 'inherit' });
  }
  console.log(`moved ${moves.size} files`);
}

run();
