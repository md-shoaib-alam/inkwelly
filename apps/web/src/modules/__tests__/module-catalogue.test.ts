import { test, expect, describe } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { adminPanelSections } from "@/components/layout/sidebar/module-nav-config";
import {
  gridModuleCards,
  moduleCatalogue,
} from "../dashboard/components/adminDashboard/moduleCatalogue";

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
    // split is the whole of the dashboard's coming-soon styling. 27 unbuilt of 49 measured
    // 2026-09-29, after Tests and Homework were reclassified: they have no admin case in the
    // tenant dispatcher (both bare keys route only for teacher/student/parent), so an admin
    // who clicked either card was redirected back to the dashboard. That is "announced but
    // not built", which is what `screen: null` means everywhere else in this file. A card
    // added with a `parent` and a real screen — the Students dashboard — joins the built
    // half without joining the grid.
    const unbuilt = moduleCatalogue.filter((c) => c.screen === null);
    expect(unbuilt.length).toBe(27);
    expect(moduleCatalogue.length - unbuilt.length).toBe(23);
    // A dashed card must never be reachable from the rail or the favourites strip.
    const dashedButRoutable = unbuilt.filter((c) => c.inRail).map((c) => c.id);
    expect(dashedButRoutable).toEqual([]);
  });
});

/** The admin panels that list `screen` as a row, whether the row is live or "Soon". */
function panelsListing(screen: string): string[] {
  return Object.entries(adminPanelSections)
    .filter(([, sections]) => sections.some((s) => s.items.some((i) => i.key === screen)))
    .map(([moduleKey]) => moduleKey);
}

describe("the dashboard grid categorises modules", () => {
  test("no grid card advertises a screen another module's panel already owns", () => {
    // The bug this pins: Timetable, Events, School Settings, Promotions, Graduated
    // Students, Certificates, Tests, Homework and Reports were top-level dashboard cards
    // whose screens were already rows inside the Academics / Students / Examinations
    // panels, so one screen was sold as two modules.
    //
    // Rail modules are exempt by construction: their own screen is naturally a row of
    // their own panel, and two of them additionally share a row with a sibling
    // (employees/staff also in employee-attendance, transport/transport-fee also in
    // student-fees). Those are deliberate cross-links, not duplicates of a module.
    const leaked = gridModuleCards
      .filter((card) => card.screen !== null && !card.inRail)
      .flatMap((card) => {
        const owners = panelsListing(card.screen as string).filter((m) => m !== card.id);
        return owners.length
          ? [`${card.id} (${card.screen}) is a row in ${owners.join(", ")}`]
          : [];
      });
    expect(leaked).toEqual([]);
  });

  test("hiding a parented card never orphans its screen", () => {
    // A card leaves the grid only because its parent's panel already lists the screen.
    // Delete that row and the screen becomes unreachable, so the parent has to name a
    // panel that really contains it. `shared` is Reports' case: no single owner, but the
    // row must still exist in at least one panel.
    const orphaned = moduleCatalogue
      .filter((card) => card.parent !== undefined && card.screen !== null)
      .filter((card) => {
        const owners = panelsListing(card.screen as string);
        return card.parent === "shared"
          ? owners.length === 0
          : !owners.includes(card.parent as string);
      })
      .map((card) => `${card.id} (${card.screen}) named parent ${card.parent}`);
    expect(orphaned).toEqual([]);
  });

  test("the grid renders the 40 top-level cards, 15 of them live", () => {
    // 48 catalogue cards less the 8 that name a parent; 25 of the 40 are "Soon".
    expect(gridModuleCards.length).toBe(40);
    expect(gridModuleCards.filter((c) => c.screen !== null).length).toBe(15);
  });
});
