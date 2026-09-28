import { test, expect, describe } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { moduleCatalogue } from "../dashboard/components/adminDashboard/moduleCatalogue";
import { adminPanelSections, buildAdminRail } from "@/components/layout/sidebar/module-nav-config";

const APP_ROOT = resolve(import.meta.dir, "..", "..", "..");

// Same oracle as module-catalogue.test.ts: a key absent from both dispatchers renders
// the tenant fallback, which reads to a user as an empty state rather than a dead link.
const REGISTRY_PATHS = [
  "src/app/(authenticated)/[slug]/[screen]/tenant-screen-dispatcher.tsx",
  "src/app/(authenticated)/[slug]/generic-slug-dispatcher.tsx",
];
const KEY_RE = /case\s(['"])([a-z0-9-]+)\1/g;

const routable = new Set(
  REGISTRY_PATHS.flatMap((p) =>
    [...readFileSync(join(APP_ROOT, p), "utf8").matchAll(KEY_RE)].map((m) => m[2]),
  ),
);

const rail = buildAdminRail();
const railKeys = rail.map((m) => m.key);

describe("admin module rail", () => {
  test("the rail is not empty", () => {
    expect(rail.length).toBeGreaterThan(0);
  });

  test("rail keys are unique", () => {
    expect(new Set(railKeys).size).toBe(railKeys.length);
  });

  test("every rail module opens on a screen that routes", () => {
    const dead = rail
      .map((m) => ({ key: m.key, screen: m.defaultScreen ?? m.sections[0]?.items[0]?.key }))
      .filter((m) => !m.screen || !routable.has(m.screen))
      .map((m) => `${m.key} -> ${m.screen}`);
    expect(dead).toEqual([]);
  });

  test("every contextual sub-link routes", () => {
    const dead = rail.flatMap((m) =>
      m.sections
        .flatMap((s) => s.items)
        .filter((i) => !routable.has(i.key))
        .map((i) => `${m.key} / ${i.key}`),
    );
    expect(dead).toEqual([]);
  });

  test("every rail module has at least one sub-link", () => {
    const empty = rail.filter((m) => m.sections.length === 0).map((m) => m.key);
    expect(empty).toEqual([]);
  });

  test("panel sections are keyed to a rail module, with no orphans", () => {
    const orphans = Object.keys(adminPanelSections).filter((id) => !railKeys.includes(id));
    expect(orphans).toEqual([]);
  });

  test("every inRail card is actually a live module", () => {
    const placeholders = moduleCatalogue
      .filter((c) => c.inRail && c.screen === null)
      .map((c) => c.id);
    expect(placeholders).toEqual([]);
  });

  test("the dashboard is reachable from the rail", () => {
    // Every live grid screen is reachable by tapping it, so the rail only has to
    // keep the dashboard itself available for the rest to be one tap away.
    expect(railKeys).toContain("dashboard");
  });
});
