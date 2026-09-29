import { test, expect, describe } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const APP_ROOT = resolve(import.meta.dir, "..", "..", "..");

/** A '@/' specifier resolves as .ts, .tsx, .js, .jsx, or an index file inside a folder. */
function resolvesToAFile(specifier: string): boolean {
  if (!specifier.startsWith("@/")) return false;
  const base = join(APP_ROOT, "src", specifier.slice(2));
  return (
    [".ts", ".tsx", ".js", ".jsx"].some((ext) => existsSync(base + ext)) ||
    [".ts", ".tsx"].some((ext) => existsSync(join(base, `index${ext}`)))
  );
}

// Counts measured on the pre-move tree, 2026-09-28; raised to 69/60 on 2026-09-29 for the
// IAM landing screen and Permissions Catalog, to 70/61 for Role Assignments, then dropped to
// 69/60 and 25/19 when the profile screen was removed; raised to 62 on 2026-09-29 for the two
// dispatcher cases 67bc4ab added without a test update; raised to 71 on 2026-09-29 by folder-layout
// Task 5, which gave bulk-promote and graduated their own entries, and to 74 by Task 7, which gave
// staff-attendance and the two remaining leave tabs their own, and to 75 by Task 8, which gave transport-fee a
// thin entry over the shared fee screen. 75 -> 77 on 2026-09-29: the eight thin entries each take their own
// specifier. Changing one of these numbers
// must be a deliberate act in a task step, never a side effect of a rewrite.
const REGISTRIES = [
  {
    name: "tenant-screen-dispatcher",
    path: "src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx",
    specifiers: 77,
    keys: 62,
  },
  {
    name: "generic-slug-dispatcher",
    path: "src/app/(authenticated)/[slug]/generic-slug-dispatcher.tsx",
    specifiers: 25,
    keys: 19,
  },
];

// Quote style differs between the two files (single vs double), so match both.
const SPECIFIER_RE = /import\((['"])(@[^'"]+)\1\)/g;
const KEY_RE = /case\s(['"])([a-z0-9-]+)\1/g;

for (const reg of REGISTRIES) {
  describe(reg.name, () => {
    const src = readFileSync(join(APP_ROOT, reg.path), "utf8");

    test("every lazy import specifier points at a real file", () => {
      const specifiers = [...src.matchAll(SPECIFIER_RE)].map((m) => m[2]);
      expect(specifiers.length).toBe(reg.specifiers);
      const broken = specifiers.filter((s) => !resolvesToAFile(s));
      expect(broken).toEqual([]);
    });

    test("screen-key count is unchanged", () => {
      const keys = [...new Set([...src.matchAll(KEY_RE)].map((m) => m[2]))];
      expect(keys.length).toBe(reg.keys);
    });
  });
}

test("finance keys are still routed across both registries", () => {
  const read = (p: string) => readFileSync(join(APP_ROOT, p), "utf8");
  const tenant = new Set(
    [...read(REGISTRIES[0].path).matchAll(KEY_RE)].map((m) => m[2]),
  );
  const generic = new Set(
    [...read(REGISTRIES[1].path).matchAll(KEY_RE)].map((m) => m[2]),
  );
  for (const key of [
    "fees", "fee-categories", "fee-concessions", "fee-status",
    "make-payment", "check-receipt", "check-payments", "expenses", "transport-fee",
  ]) {
    expect(tenant.has(key)).toBe(true);
  }
  expect(generic.has("billing")).toBe(true);
});

// The staff permission guard and the screen switch must both read the resolved
// key. Reading the raw `screen` param was a privilege escalation once URLs became
// module-scoped: /slug/academics/classes puts "academics" in `screen`, which is in
// neither STAFF_FORBIDDEN_SCREENS nor STAFF_SCREEN_MODULES, so the guard checked
// the wrong word and passed. If you are about to undo this, undo the module-scoped
// URLs instead — or add /slug/academics/classes as a staff user and watch it render
// the admin class editor.
test("the dispatcher guards and switches on the resolved key, not the raw param", () => {
  const src = readFileSync(
    join(APP_ROOT, "src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx"),
    "utf8",
  );
  expect(src).toMatch(/STAFF_FORBIDDEN_SCREENS\.has\(screenKey\)/);
  expect(src).toMatch(/STAFF_SCREEN_MODULES\[screenKey\]/);
  expect(src).toMatch(/switch \(screenKey\) \{/);
  expect(src).not.toMatch(/STAFF_FORBIDDEN_SCREENS\.has\(screen\)/);
});
