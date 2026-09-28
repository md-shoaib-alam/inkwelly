// Server feature-module relocator — bun scratch/relocate-server-modules.mjs [domain]
// Moves files into src/modules/<domain>/ and rewrites every relative import specifier by
// resolving it against the file's POST-move directory. Correct whether or not the
// referenced file also moved, so cross-domain passes fix up what earlier passes left valid.
import {
  readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync,
} from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const REPO = resolve(import.meta.dir, '..');
const SRC = join(REPO, 'apps', 'server', 'src');

// old path relative to src/  ->  new path relative to src/.  null = delete after rewriting referrers.
// Taxonomy: docs/superpowers/specs/2026-09-28-feature-module-restructure-design.md §3
const MAPPING = {
  finance: {
    'routes/fees.ts': 'modules/finance/fees.routes.ts',
    'services/fee.service.ts': 'modules/finance/fee.service.ts',
    'services/fee-receipt.service.ts': 'modules/finance/fee-receipt.service.ts',
    'types/fees.ts': 'modules/finance/fees.types.ts',
    'graphql/resolvers/finance.resolvers.ts': 'modules/finance/finance.resolvers.ts',
    'graphql/typeDefs/finance.typeDefs.ts': 'modules/finance/finance.typeDefs.ts',
  },
  attendance: {
    'routes/attendance.ts': 'modules/attendance/attendance.routes.ts',
    'routes/staff-attendance.ts': 'modules/attendance/staffAttendance.routes.ts',
    'routes/leaves.ts': 'modules/attendance/leaves.routes.ts',
  },
  people: {
    'routes/students.ts': 'modules/people/students.routes.ts',
    'routes/teachers.ts': 'modules/people/teachers.routes.ts',
    'routes/staff.ts': 'modules/people/staff.routes.ts',
    'routes/parents.ts': 'modules/people/parents.routes.ts',
    'services/student.service.ts': 'modules/people/student.service.ts',
    'services/teacher.service.ts': 'modules/people/teacher.service.ts',
    'services/parent.service.ts': 'modules/people/parent.service.ts',
  },
  academics: {
    'routes/classes.ts': 'modules/academics/classes.routes.ts',
    'routes/subjects.ts': 'modules/academics/subjects.routes.ts',
    'routes/promotions.ts': 'modules/academics/promotions.routes.ts',
    'services/class.service.ts': 'modules/academics/class.service.ts',
    'services/subject.service.ts': 'modules/academics/subject.service.ts',
  },
  assessment: {
    'routes/exams.ts': 'modules/assessment/exams.routes.ts',
    'routes/grades.ts': 'modules/assessment/grades.routes.ts',
    'routes/assessments.ts': 'modules/assessment/assessments.routes.ts',
    'routes/homework.ts': 'modules/assessment/homework.routes.ts',
    'routes/submissions.ts': 'modules/assessment/submissions.routes.ts',
  },
  timetable: { 'routes/timetable.ts': 'modules/timetable/timetable.routes.ts' },
  communication: {
    'routes/notices.ts': 'modules/communication/notices.routes.ts',
    'routes/events.ts': 'modules/communication/events.routes.ts',
    'routes/notifications.ts': 'modules/communication/notifications.routes.ts',
    'graphql/resolvers/notification.resolvers.ts': 'modules/communication/notification.resolvers.ts',
    'graphql/typeDefs/notification.typeDefs.ts': 'modules/communication/notification.typeDefs.ts',
  },
  support: {
    'routes/tickets.ts': 'modules/support/tickets.routes.ts',
    'graphql/resolvers/common.resolvers.ts': 'modules/support/common.resolvers.ts',
    'graphql/typeDefs/common.typeDefs.ts': 'modules/support/common.typeDefs.ts',
  },
  certificates: {
    'routes/certificates.ts': 'modules/certificates/certificates.routes.ts',
    'routes/admit-cards.ts': 'modules/certificates/admitCards.routes.ts',
  },
  transport: { 'routes/transport.ts': 'modules/transport/transport.routes.ts' },
  'data-io': {
    'routes/reports.ts': 'modules/data-io/reports.routes.ts',
    'routes/exports.ts': 'modules/data-io/exports.routes.ts',
  },
  dashboard: {
    'routes/dashboard.ts': 'modules/dashboard/dashboard.routes.ts',
    'graphql/resolvers/dashboard.resolvers.ts': 'modules/dashboard/dashboard.resolvers.ts',
    'graphql/typeDefs/dashboard.typeDefs.ts': 'modules/dashboard/dashboard.typeDefs.ts',
  },
  tenancy: {
    'routes/tenants.ts': 'modules/tenancy/tenants.routes.ts',
    'routes/tenant-settings.ts': 'modules/tenancy/tenantSettings.routes.ts',
    'routes/subscriptions.ts': 'modules/tenancy/subscriptions.routes.ts',
  },
  platform: {
    'routes/platform.ts': 'modules/platform/platform.routes.ts',
    'routes/platform-settings.ts': 'modules/platform/platformSettings.routes.ts',
    'routes/super-admins.ts': 'modules/platform/superAdmins.routes.ts',
    'routes/integrations.ts': 'modules/platform/integrations.routes.ts',
    'routes/performance.ts': 'modules/platform/performance.routes.ts',
    'graphql/resolvers/platform.resolvers.ts': 'modules/platform/platform.resolvers.ts',
    'graphql/typeDefs/platform.typeDefs.ts': 'modules/platform/platform.typeDefs.ts',
  },
  'access-control': { 'routes/roles.ts': 'modules/access-control/roles.routes.ts' },
  // academic.* spans academics AND assessment; auth.resolvers spans auth AND people.
  // spec §2 decision 2 is relocate-only, so they park in the dominant domain and get
  // split in the follow-up oversized-file pass rather than hand-cut 920 lines blind.
  'graphql-remainder': {
    'graphql/resolvers/academic.resolvers.ts': 'modules/academics/academic.resolvers.ts',
    'graphql/typeDefs/academic.typeDefs.ts': 'modules/academics/academic.typeDefs.ts',
    'graphql/resolvers/auth.resolvers.ts': 'modules/auth/auth.resolvers.ts',
  },
  // src/auth/ is a composition pattern (index.ts wires the sub-route files); it moves whole.
  auth: {
    'auth/index.ts': 'modules/auth/index.ts',
    'auth/login.ts': 'modules/auth/login.ts',
    'auth/logout.ts': 'modules/auth/logout.ts',
    'auth/me.ts': 'modules/auth/me.ts',
    'auth/password.ts': 'modules/auth/password.ts',
    'auth/profile.ts': 'modules/auth/profile.ts',
    'auth/refresh.ts': 'modules/auth/refresh.ts',
    'routes/auth.ts': null, // re-export shim; its only consumer is the composition root
  },
};

const SPEC_RE = /(\bfrom\s+|\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"]+)\2/g;

function allTs(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith('.') || e.name === 'node_modules') return [];
    const full = join(dir, e.name);
    return e.isDirectory() ? allTs(full) : e.name.endsWith('.ts') ? [full] : [];
  });
}

const srcRel = (abs) => {
  const r = relative(SRC, abs).replace(/\\/g, '/');
  return r.startsWith('..') ? null : r;
};

function resolveSpecifier(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec);
  for (const ext of ['.ts', '.tsx', '.js']) if (existsSync(base + ext) && statSync(base + ext).isFile()) return base + ext;
  for (const ext of ['.ts', '.tsx']) {
    const idx = join(base, `index${ext}`);
    if (existsSync(idx)) return idx;
  }
  return null;
}

const ONLY = process.argv[2];
const domains = ONLY ? [ONLY] : Object.keys(MAPPING);
if (ONLY && !MAPPING[ONLY]) { console.error(`unknown domain: ${ONLY}`); process.exit(1); }

const globalMove = new Map();
for (const t of Object.values(MAPPING)) for (const [o, n] of Object.entries(t)) if (n) globalMove.set(o, n);

for (const domain of domains) {
  const table = MAPPING[domain];
  const present = Object.entries(table).filter(([oldP]) => existsSync(join(SRC, oldP)));
  if (!present.length) { console.log(`\n== ${domain}: nothing to do`); continue; }
  const moveSet = new Map(present.filter(([, n]) => n));
  console.log(`\n== ${domain}: ${moveSet.size} move(s)`);

  // Pass 1 — rewrite every ts file in src, resolving against post-move dirs.
  const changed = [];
  for (const f of allTs(SRC)) {
    const key = srcRel(f);
    const before = readFileSync(f, 'utf8');
    const ownNewRel = moveSet.get(key) ?? key;
    const ownDir = dirname(join(SRC, ownNewRel));
    const after = before.replace(SPEC_RE, (whole, kw, q, spec) => {
      const absBefore = resolveSpecifier(f, spec);
      if (!absBefore) return whole;                       // package import or missing — untouched
      const beforeRel = srcRel(absBefore);
      if (beforeRel === null) return whole;               // outside src/
      const newRel = moveSet.get(beforeRel) ?? beforeRel;
      const newAbs = join(SRC, newRel);
      let next = relative(ownDir, newAbs).replace(/\\/g, '/').replace(/\.(ts|tsx|js)$/, '');
      if (!next.startsWith('.')) next = './' + next;
      return `${kw}${q}${next}${q}`;
    });
    if (after !== before) { writeFileSync(f, after); changed.push(key); }
  }

  // Pass 2 — move with git mv so history is preserved as renames.
  for (const [oldP, newP] of moveSet) {
    const dest = join(SRC, newP);
    mkdirSync(dirname(dest), { recursive: true });
    if (!existsSync(dest)) execFileSync('git', ['mv', join(SRC, oldP), dest], { cwd: REPO, stdio: 'inherit' });
    console.log(`  ${oldP} -> ${newP}`);
  }

  // Pass 3 — remove shims whose referrers have been rewritten.
  for (const [oldP, newP] of present) {
    if (newP !== null) continue;
    const abs = join(SRC, oldP);
    if (!existsSync(abs)) continue;
    const stillUsed = allTs(SRC).some((f) => f !== abs && srcRel(f) !== null && resolveSpecifier(f, './' + oldP.replace(/\.ts$/, '')) === abs);
    if (stillUsed) { console.log(`  [keep] ${oldP} still imported`); continue; }
    rmSync(abs);
    console.log(`  [rm] ${oldP}`);
  }

  // Pass 4 — barrel: named re-exports only (export * would collide on duplicate local types).
  // Grouped by destination module dir, not by the domain key, so a domain may fill two modules.
  const touchedModules = [...new Set([...moveSet.values()].map((n) => dirname(n)))];
  for (const modRel of touchedModules) {
  const modDir = join(SRC, modRel);
  const barrelPath = join(modDir, 'index.ts');
  const existing = existsSync(barrelPath) ? readFileSync(barrelPath, 'utf8') : '';
  const lines = [];
  for (const [, newP] of moveSet) {
    if (dirname(newP) !== modRel) continue;
    const base = newP.split('/').pop();
    if (base === 'index.ts') continue;
    if (existing.includes(`'./${base.replace(/\.ts$/, '')}'`)) continue;
    const abs = join(SRC, newP);
    if (!existsSync(abs)) continue;
    const src = readFileSync(abs, 'utf8');
    const names = new Set();
    const typeNames = new Set();
    for (const m of src.matchAll(/^export\s+(?:async\s+)?(?:const|function|class|let|var)\s+([A-Za-z0-9_$]+)/gm)) names.add(m[1]);
    // verbatimModuleSyntax is on in apps/server: type/interface re-exports must use `export type`.
    for (const m of src.matchAll(/^export\s+(?:type|interface)\s+([A-Za-z0-9_$]+)/gm)) typeNames.add(m[1]);
    for (const m of src.matchAll(/^export\s+(?:enum)\s+([A-Za-z0-9_$]+)/gm)) names.add(m[1]);
    for (const m of src.matchAll(/^export\s*\{([^}]*)\}\s*(?:from[^;'"]*)?;?/gm)) {
      for (const part of m[1].split(',')) {
        const n = part.trim().split(/\s+as\s+/).pop()?.trim();
        if (n) names.add(n);
      }
    }
    const mod = './' + base.replace(/\.ts$/, '');
    if (!names.size && !typeNames.size) { lines.push(`// FIXME: no named export parsed in ${base}; add its barrel entry by hand`); continue; }
    if (names.size) lines.push(`export { ${[...names].join(', ')} } from '${mod}';`);
    if (typeNames.size) lines.push(`export type { ${[...typeNames].join(', ')} } from '${mod}';`);
  }
  if (lines.length) {
    writeFileSync(barrelPath, (existing ? existing.replace(/\n$/, '') + '\n' : '') + lines.join('\n') + '\n');
    console.log(`  ${modRel}/index.ts += ${lines.filter((l) => !l.startsWith('//')).length} re-export(s)`);
  }
  }
  console.log(`  referrers rewritten: ${changed.filter((c) => !moveSet.has(c)).join(', ') || 'none'}`);
}

console.log('\nnext: bunx turbo run typecheck --filter=@inkwelly/server');
