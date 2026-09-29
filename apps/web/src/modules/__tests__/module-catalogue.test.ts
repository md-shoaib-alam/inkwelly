import { test, expect, describe } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { moduleCatalogue } from "../dashboard/components/adminDashboard/moduleCatalogue";

const APP_ROOT = resolve(import.meta.dir, "..", "..", "..");

// The two registries are the only thing that decides whether a screen key routes anywhere.
// A card that links a key absent from them renders a blank screen, which looks like an
// empty state rather than the broken link it is.
const REGISTRY_PATHS = [
  "src/app/(authenticated)/[slug]/[...segments]/tenant-screen-dispatcher.tsx",
  "src/app/(authenticated)/[slug]/generic-slug-dispatcher.tsx",
];
const KEY_RE = /case\s(['"])([a-z0-9-]+)\1/g;

const routable = new Set(
  REGISTRY_PATHS.flatMap((p) =>
    [...readFileSync(join(APP_ROOT, p), "utf8").matchAll(KEY_RE)].map((m) => m[2]),
  ),
);

describe("admin module catalogue", () => {
  test("every linked screen actually routes", () => {
    const dead = moduleCatalogue
      .filter((c) => c.screen !== null && !routable.has(c.screen as string))
      .map((c) => `${c.id} -> ${c.screen}`);
    expect(dead).toEqual([]);
  });

  test("ids are unique", () => {
    const ids = moduleCatalogue.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every card has a title, subtitle and icon", () => {
    const incomplete = moduleCatalogue
      .filter((c) => !c.title || !c.subtitle || !c.icon)
      .map((c) => c.id);
    expect(incomplete).toEqual([]);
  });

  test("linked cards name a permission module the roles actually use", () => {
    const knownPermModules = new Set(
      [
        ...readFileSync(
          join(APP_ROOT, "src/components/layout/nav-config.tsx"),
          "utf8",
        ).matchAll(/permModule:\s*"([a-z-]+)"/g),
      ].map((m) => m[1]),
    );
    const unknown = moduleCatalogue
      .filter((c) => c.permModule && !knownPermModules.has(c.permModule))
      .map((c) => `${c.id} -> ${c.permModule}`);
    expect(unknown).toEqual([]);
  });

  test("the grid is not empty and not every card is a placeholder", () => {
    expect(moduleCatalogue.length).toBeGreaterThan(0);
    const live = moduleCatalogue.filter((c) => c.screen !== null).length;
    expect(live).toBeGreaterThan(0);
    expect(live).toBeLessThan(moduleCatalogue.length);
  });

  test("a card is drawn as coming soon exactly when it has no screen", () => {
    // The grid derives the dashed, colourless, inert card from `screen === null`, so this
    // split is the whole of the dashboard's coming-soon styling. 25 of 48 measured 2026-09-29,
    // after AI Connect was given a status-only landing screen so its rail entry routes.
    const unbuilt = moduleCatalogue.filter((c) => c.screen === null);
    expect(unbuilt.length).toBe(25);
    expect(moduleCatalogue.length - unbuilt.length).toBe(23);
    // A dashed card must never be reachable from the rail or the favourites strip.
    const dashedButRoutable = unbuilt.filter((c) => c.inRail).map((c) => c.id);
    expect(dashedButRoutable).toEqual([]);
  });
});
