import { test, expect, describe } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  adminLandingRoots,
  adminModuleLandings,
  resolveAdminRoute,
} from "@/components/layout/sidebar/module-roots";
import {
  buildAdminRail,
  getDefaultScreen,
  isAdminModuleScreen,
} from "@/components/layout/sidebar/module-nav-config";
import { componentKey, parseRoute } from "@/lib/routing/module-routes";

const APP_ROOT = resolve(import.meta.dir, "..", "..", "..");
const DISPATCHER = "src/app/(authenticated)/[slug]/[...segments]/tenant-screen-dispatcher.tsx";
const KEY_RE = /case\s(['"])([a-z0-9-]+)\1/g;
const routedKeys = new Set(
  [...readFileSync(join(APP_ROOT, DISPATCHER), "utf8").matchAll(KEY_RE)].map((m) => m[2]),
);

// Nine of the twelve rail modules open on a screen whose name is not the module's
// own, which is why `/slug/academics` used to bounce: no dispatcher case is named
// `academics`. Measured off the rail, so this pin is the list of roots that need
// resolving, and a card that starts or stops naming its own screen must change it.
const EXPECTED_LANDINGS: [string, string][] = [
  ["academics", "academics-dashboard"],
  ["employee-attendance", "staff-attendance"],
  ["employees", "staff"],
  ["examinations", "exams"],
  ["iam", "iam-dashboard"],
  ["money-book", "expenses"],
  ["student-attendance", "attendance"],
  ["student-fees", "fees"],
  ["transport", "transport-fee"],
];

describe("module roots", () => {
  test("every rail module is addressable by its own name", () => {
    const bounced = buildAdminRail()
      .map((item) => ({ item, key: screenKeyOfRoot(item.key) }))
      .filter(({ key }) => !routedKeys.has(key))
      .map(({ item }) => `${item.key} -> ${screenKeyOfRoot(item.key)}`);
    expect(bounced).toEqual([]);
  });

  test("the landings are exactly the nine non-identity roots", () => {
    expect(Object.entries(adminModuleLandings).sort()).toEqual(
      [...EXPECTED_LANDINGS].sort(),
    );
  });

  test("no landing is shared and none is a module id", () => {
    // A shared landing would make `adminLandingRoots` last-write-wins, and a landing
    // that is also a module id would make one root name two screens.
    const moduleIds = new Set(buildAdminRail().map((m) => m.key));
    expect(Object.keys(adminLandingRoots).length).toBe(Object.keys(adminModuleLandings).length);
    expect(Object.keys(adminLandingRoots).filter((l) => moduleIds.has(l))).toEqual([]);
  });

  test("every rail row's default screen is what its root renders", () => {
    for (const item of buildAdminRail()) {
      expect(resolveAdminRoute(null, item.key).screen).toBe(getDefaultScreen(item));
    }
  });
});

describe("resolveAdminRoute", () => {
  test("a bare module id renders that module's landing screen and needs no redirect", () => {
    expect(resolveAdminRoute(null, "academics")).toEqual({
      module: "academics",
      screen: "academics-dashboard",
      canonicalTail: null,
    });
  });

  test("a doubled root collapses to the module", () => {
    expect(resolveAdminRoute("academics", "academics-dashboard").canonicalTail).toBe("academics");
    expect(resolveAdminRoute("iam", "iam-dashboard").canonicalTail).toBe("iam");
  });

  test("a bare landing screen goes to the root, not to the doubled form", () => {
    expect(resolveAdminRoute(null, "academics-dashboard")).toEqual({
      module: "academics",
      screen: "academics-dashboard",
      canonicalTail: "academics",
    });
  });

  test("an owned row is resolved for rendering but left to canonicalAdminTail for the URL", () => {
    // `academics/timetable` is that file's answer, and keeping it there also keeps the
    // staff role out of a redirect it cannot satisfy.
    expect(resolveAdminRoute(null, "timetable")).toEqual({
      module: "academics",
      screen: "timetable",
      canonicalTail: null,
    });
    expect(resolveAdminRoute("academics", "timetable").canonicalTail).toBeNull();
  });

  test("dashboard, an identity root and an unknown key are untouched", () => {
    for (const screen of ["dashboard", "students", "leaves", "ai-connect", "nope"]) {
      expect(resolveAdminRoute(null, screen)).toEqual({ module: null, screen, canonicalTail: null });
    }
  });

  test("`/academics/session` is a qualified route that is already canonical", () => {
    // Read through the same contract the dispatcher uses. If `session` were not a
    // declared sub-link, parseRoute would hand back the bare screen `academics` and the
    // session screen would never mount.
    const parts = parseRoute("/demo-academy/2026-2027/academics/session", {
      isModuleScreen: isAdminModuleScreen,
      isTenantRoot: (first) => first === "demo-academy",
      yearSlugs: ["2026-2027"],
    });
    expect(parts).toEqual({ year: "2026-2027", module: "academics", screen: "session" });
    expect(resolveAdminRoute(parts.module, parts.screen).canonicalTail).toBeNull();
    expect(routedKeys.has("session")).toBe(true);
    // The legacy key still routes: the year gate's no-year escape hatch and the staff
    // accordion both redirect to it.
    expect(routedKeys.has("academic-years")).toBe(true);
  });

  test("no canonical tail is itself redirectable, which is what ends the chain", () => {
    // Exhaustive over every rail module and every row it declares, not by example: a
    // redirect that targets a URL this file wants to redirect again is a loop, and a
    // target whose screen no case serves is a bounce.
    const loops: string[] = [];
    const bounces: string[] = [];
    for (const item of buildAdminRail()) {
      for (const row of item.sections.flatMap((s) => s.items)) {
        for (const start of [
          resolveAdminRoute(item.key, row.key),
          resolveAdminRoute(null, row.key),
        ]) {
          if (!start.canonicalTail) continue;
          const back = parseRoute(`/demo/${start.canonicalTail}`, {
            isModuleScreen: isAdminModuleScreen,
            isTenantRoot: (first) => first === "demo",
          });
          const next = resolveAdminRoute(back.module, back.screen);
          if (next.canonicalTail) {
            loops.push(`${item.key}/${row.key} -> ${start.canonicalTail} -> ${next.canonicalTail}`);
          }
          if (!routedKeys.has(componentKey(next.module, next.screen))) {
            bounces.push(`${item.key}/${row.key} -> ${start.canonicalTail} renders ${next.screen}`);
          }
        }
      }
    }
    expect(loops).toEqual([]);
    expect(bounces).toEqual([]);
  });

  test("a root and its long form render the same screen", () => {
    for (const [module, landing] of EXPECTED_LANDINGS) {
      const short = resolveAdminRoute(null, module);
      const long = resolveAdminRoute(module, landing);
      expect(componentKey(short.module, short.screen)).toBe(
        componentKey(long.module, long.screen),
      );
      expect(long.canonicalTail).toBe(module);
    }
  });
});

function screenKeyOfRoot(moduleId: string): string {
  const resolved = resolveAdminRoute(null, moduleId);
  return componentKey(resolved.module, resolved.screen);
}
