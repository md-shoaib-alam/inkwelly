// Mobile feature-module relocator — bun scratch/relocate-mobile-modules.mjs [--map | --go]
//
// Mobile is the third axis the spec describes: role folders (admin, teacher, …) and feature
// folders (attendance, students, timetable) both in use at once, under components/.
// Naming follows what the web slice settled on (spec §12.1): role-prefixed folders, because the
// same feature name appears under several roles.
//
// Nothing is written unless --go is passed explicitly.
import {
  readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, renameSync,
} from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO = resolve(import.meta.dir, '..');
const APP = join(REPO, 'apps', 'mobile');
const SRC = join(APP, 'src');
const GO = process.argv.includes('--go');

const ROLES = { admin: 'Admin', teacher: 'Teacher', parent: 'Parent', student: 'Student', staff: 'Staff' };

/** components/<role>/<entry> -> module.  Taxonomy: spec §3. */
const ROLE_ENTRY = {
  'admin/academic-years': 'academics', 'admin/classes': 'academics', 'admin/promotions': 'academics',
  'admin/subjects': 'academics', 'admin/ClassSelector': 'academics',
  'admin/certificates': 'certificates',
  'admin/expenses': 'finance', 'admin/fees': 'finance',
  'admin/leaves': 'attendance',
  'admin/notices': 'communication',
  'admin/parents': 'people', 'admin/staff': 'people', 'admin/students': 'people',
  'admin/teachers': 'people',
  'admin/roles': 'access-control',
  'admin/tickets': 'support',
  'admin/timetable': 'timetable',
  'admin/AdminDashboard': 'dashboard', 'admin/DashboardCharts': 'dashboard',
  'admin/MetricStats': 'dashboard', 'admin/SubscriptionAlert': 'dashboard',

  'teacher/dashboard_components': 'dashboard', 'teacher/TeacherDashboard': 'dashboard',
  'teacher/my-attendance': 'attendance', 'teacher/TeacherQRScanModal': 'attendance',

  'parent/attendance': 'attendance', 'parent/fees': 'finance', 'parent/grades': 'assessment',
  'parent/subscription-promos': 'tenancy', 'parent/SubscriptionLockModal': 'tenancy',
  'parent/SubscriptionPromoModal': 'tenancy', 'parent/ChildSelector': 'people',
  'parent/ParentDashboard': 'dashboard',

  'student/StudentDashboard': 'dashboard',
  'staff/StaffDashboard': 'dashboard', 'staff/TaskList': 'dashboard', 'staff/StaffCard': 'people',
};

/** Top-level folders that are already feature-named: the folder itself becomes the module path. */
const FEATURE_DIR = {
  attendance: 'attendance', students: 'people', timetable: 'timetable', dashboard: 'dashboard',
};

/** Loose files sitting directly in components/ that carry a domain. */
const LOOSE = {
  ChangePasswordModal: 'auth', ProfileCard: 'auth', SchoolSettingsModal: 'tenancy',
  StaffManagementModal: 'people', AboutAppModal: 'platform',
  // Deliberately NOT moved — generic UI/infra with no domain: GlobalErrorBoundary,
  // GlobalOfflineGuard, NetworkStatusBar, OfflineState, Skeleton, TabIcon, themed-*,
  // and components/common/ + components/onboarding/ + components/ui/ + components/providers/.
};

const EXT = /\.(tsx|ts|jsx|js)$/;
const pascal = (s) => s.split(/[-_\s]+/).filter(Boolean)
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
const camel = (s) => s.charAt(0).toLowerCase() + s.slice(1);

function targetFor(srcRel) {
  if (srcRel === 'store/protected-route.tsx') return 'modules/auth/ProtectedRoute.tsx';
  const segs = srcRel.split('/');
  if (segs[0] !== 'components' || segs.length < 2) return null;
  const [head, ...rest] = segs.slice(1);

  if (ROLES[head]) {
    const role = ROLES[head];
    const leaf = rest[rest.length - 1];
    if (rest.length === 1) {
      const base = leaf.replace(EXT, '');
      const mod = ROLE_ENTRY[`${head}/${base}`];
      if (!mod) throw new Error(`No module for components/${head}/${leaf}`);
      // Only .tsx components get the role prefix; an asset keeps its own name.
      if (leaf !== `${base}.tsx`) return `modules/${mod}/components/${leaf}`;
      const named = base.startsWith(role) ? base : role + pascal(base);
      return `modules/${mod}/components/${named}.tsx`;
    }
    const dirName = rest[0];
    const mod = ROLE_ENTRY[`${head}/${dirName}`];
    if (!mod) throw new Error(`No module for components/${head}/${dirName}`);
    const folder = camel(role + pascal(dirName));
    return `modules/${mod}/components/${folder}/${rest.slice(1).join('/')}`;
  }

  if (FEATURE_DIR[head]) {
    const mod = FEATURE_DIR[head];
    // `components/attendance/…` into `modules/attendance/components/attendance/…` is a stutter;
    // the folder name only earns its keep when it differs from the module it lands in.
    const nested = head === mod ? [] : [head];
    return `modules/${mod}/components/${[...nested, ...rest].join('/')}`;
  }

  if (rest.length === 0) {
    const mod = LOOSE[head.replace(EXT, '')];
    if (!mod) return null;
    return `modules/${mod}/components/${head}`;
  }
  return null; // components/ui, providers, common, onboarding, themed-*, …
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

const moves = new Map();
for (const abs of walk(SRC)) {
  const key = srcRelOf(abs);
  if (!key.startsWith('components/') && key !== 'store/protected-route.tsx') continue;
  const next = targetFor(key);
  if (next && next !== key) moves.set(key, next);
}
for (const [from, to] of moves) {
  for (const [other, otherTo] of moves) {
    if (other !== from && otherTo === to) throw new Error(`Collision: ${from} and ${other} -> ${to}`);
  }
}

// `require('…')` has to be in here: React Native loads assets that way, and a moved file kept a
// stale `../../../assets/…` depth that typecheck accepted and only a Metro bundle surfaced.
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

function newSpecFor(fromAbs, spec) {
  const targetAbs = resolveSpecifier(fromAbs, spec);
  if (!targetAbs) return null;
  const targetRel = srcRelOf(targetAbs);
  const finalRel = moves.get(targetRel) ?? targetRel;
  const ownRel = srcRelOf(fromAbs);
  const ownDir = dirname(join(SRC, moves.get(ownRel) ?? ownRel));
  const strip = (p) => p.replace(/\.(ts|tsx|js|jsx)$/, (m) => (spec.endsWith(m) ? m : ''));
  if (spec.startsWith('@/')) return `@/${strip(finalRel)}`;
  let rel = toPosix(relative(ownDir, join(SRC, finalRel)));
  if (!rel.startsWith('.')) rel = './' + rel;
  return strip(rel);
}

const unresolved = [];
function rewriteImports() {
  const changed = [];
  for (const abs of walk(SRC)) {
    if (!CODE_EXT.test(abs)) continue;
    const before = readFileSync(abs, 'utf8');
    const after = before.replace(SPEC_RE, (whole, kw, quote, spec) => {
      const next = newSpecFor(abs, spec);
      if (next === null) {
        // @/assets is a real tsconfig path alias pointing outside src/, so it never resolves here.
        if (spec.startsWith('@/') && !spec.startsWith('@/assets')) unresolved.push(`${srcRelOf(abs)} -> ${spec}`);
        return whole;
      }
      return `${kw}${quote}${next}${quote}`;
    });
    if (after !== before) {
      if (GO) writeFileSync(abs, after);
      changed.push(srcRelOf(abs));
    }
  }
  return changed;
}

function run() {
  if (process.argv.includes('--map')) {
    const rows = [...moves].map(([f, t]) => `${f}\t${t}`).sort().join('\n') + '\n';
    writeFileSync(join(REPO, 'scratch', 'mobile-module-mapping.tsv'), rows);
    console.log(`wrote ${moves.size} mappings`);
    return;
  }
  console.log(`${GO ? '' : '[dry] '}${moves.size} files to move`);
  const byModule = new Map();
  for (const [, to] of moves) byModule.set(to.split('/').slice(0, 2).join('/'), (byModule.get(to.split('/').slice(0, 2).join('/')) ?? 0) + 1);
  for (const [m, n] of [...byModule].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${m}`);

  const problems = [];
  for (const [oldRel, newRel] of moves) {
    if (!existsSync(join(SRC, oldRel))) problems.push(`missing source: ${oldRel}`);
    if (existsSync(join(SRC, newRel))) problems.push(`destination exists: ${newRel}`);
  }
  if (problems.length) {
    console.error(`${problems.length} rename problem(s):`);
    for (const p of [...new Set(problems)].slice(0, 20)) console.error('  ' + p);
    return;
  }

  const changed = rewriteImports();
  console.log(`${GO ? '' : '[dry] '}rewrote imports in ${changed.length} files`);
  if (unresolved.length) {
    console.log(`${unresolved.length} @/ specifiers did not resolve:`);
    for (const u of [...new Set(unresolved)].slice(0, 15)) console.log('  ' + u);
  }
  if (!GO) return;

  const tracked = new Set(execFileSync('git', ['ls-files', 'src'], { cwd: APP, encoding: 'utf8' })
    .split('\n').map(toPosix));
  for (const [oldRel, newRel] of moves) {
    const dest = join(SRC, newRel);
    mkdirSync(dirname(dest), { recursive: true });
    // git is run from the app root, so it needs the src/ prefix the moves map omits.
    if (tracked.has(`src/${oldRel}`)) {
      execFileSync('git', ['mv', `src/${oldRel}`, `src/${newRel}`], { cwd: APP, stdio: 'pipe' });
    } else {
      // Untracked (possibly gitignored) source: move it on disk and stage it, so a file can
      // never vanish from version control the way web's certificate-template.tsx already had.
      renameSync(join(SRC, oldRel), dest);
      execFileSync('git', ['add', `src/${newRel}`], { cwd: APP, stdio: 'pipe' });
    }
  }
  console.log(`moved ${moves.size} files`);
}

run();
