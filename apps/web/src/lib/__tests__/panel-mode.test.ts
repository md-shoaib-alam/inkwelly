import { test, expect, describe } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { decidePanelMode, LAUNCHER_RAIL_KEY, PANEL_LESS_SCREENS } from "@/components/layout/sidebar/panel-mode";

const APP_ROOT = resolve(import.meta.dir, "..", "..", "..");
const SIDEBAR = join(APP_ROOT, "src", "components", "layout", "sidebar", "module-sidebar.tsx");
const LAYOUT = join(APP_ROOT, "src", "components", "layout", "app-layout.tsx");

// Tapping the Dashboard rail entry used to leave the sub-panel on screen for about
// half a second: ~190 ms before React committed the hide, then a 300 ms width
// animation, and the drawer slid out with the panel still inside it. The panel is
// now not rendered at all for the launcher, so there is nothing to animate shut.
describe("the launcher never renders a sub-panel", () => {
  test("the launcher row gives no panel at either width", () => {
    for (const isMobile of [true, false]) {
      for (const collapsed of [true, false]) {
        expect(decidePanelMode({ isMobile, collapsed, activeModuleKey: LAUNCHER_RAIL_KEY, screen: "modules" })).toBe("none");
      }
    }
  });

  // The first paint used to run the desktop branch because `useIsMobile` starts
  // false, which painted a 210 px panel on a phone before correcting itself.
  // "none" is reached without reading isMobile, so it holds on that first paint.
  test("the answer does not depend on the breakpoint", () => {
    const modes = [true, false].flatMap((isMobile) =>
      [true, false].map((collapsed) =>
        decidePanelMode({ isMobile, collapsed, activeModuleKey: LAUNCHER_RAIL_KEY, screen: "modules" }),
      ),
    );
    expect(new Set(modes).size).toBe(1);
  });

  test("every other module keeps its panel behaviour", () => {
    // Mobile: the drawer stays open on the panel once a module is picked.
    expect(decidePanelMode({ isMobile: true, collapsed: false, activeModuleKey: "academics", screen: "academics" })).toBe("shown");
    expect(decidePanelMode({ isMobile: true, collapsed: true, activeModuleKey: "academics", screen: "academics" })).toBe("shown");
    // Desktop: the collapse toggle still animates the panel shut rather than removing it.
    expect(decidePanelMode({ isMobile: false, collapsed: false, activeModuleKey: "academics", screen: "academics" })).toBe("shown");
    expect(decidePanelMode({ isMobile: false, collapsed: true, activeModuleKey: "academics", screen: "academics" })).toBe("hidden");
  });
});

// The standalone AI chat is not a sub-link of any module, so `findModuleForScreen`
// matches nothing and the rail keeps whatever module's panel was last open (AI
// Connect). The panel-less decision keys on the resolved screen, not the stale module.
describe("the AI chat renders without a contextual panel", () => {
  test("a stale active module cannot keep its panel open over the AI screen", () => {
    for (const isMobile of [true, false]) {
      for (const collapsed of [true, false]) {
        expect(decidePanelMode({ isMobile, collapsed, activeModuleKey: "ai-connect", screen: "ai" })).toBe("none");
      }
    }
  });

  test("every panel-less screen is a launcher or the AI chat", () => {
    expect([...PANEL_LESS_SCREENS].sort()).toEqual(["ai", "modules"]);
  });
});

describe("the sidebar obeys the mode by not mounting the panel", () => {
  test("the panel subtree is guarded by the mode, not only by a width class", () => {
    const src = readFileSync(SIDEBAR, "utf8");
    // Exactly one guard, and it wraps the panel itself — the width wrapper stays
    // mounted so the space it occupied animates closed instead of snapping.
    expect(src.split('{panelMode === "none" ? null : (').length - 1).toBe(1);
    expect(src).toMatch(/\{panelMode === "none" \? null : \(\s*<ModulePanel/);
    expect(src).not.toContain('activeModule.key !== "modules"');
  });

  test("the collapse animation survives for the modules that use it", () => {
    const src = readFileSync(SIDEBAR, "utf8");
    expect(src).toContain("transition-[width,opacity]");
    expect(src).toContain('panelMode === "shown"');
  });
});

// The card's corners and the panel's presence were decided from different signals:
// the panel obeyed the rail key (immediate) while the layout obeyed the URL and the
// raw collapse toggle (both late, and neither true for the launcher). The card stayed
// square on its left edge for the length of the router transition.
describe("the layout hears the same decision the panel obeys", () => {
  test("the sidebar reports the effective mode, not the raw toggle", () => {
    const src = readFileSync(SIDEBAR, "utf8");
    expect(src).toContain("onPanelModeChange?.(panelMode)");
    expect(src).not.toContain("onCollapsedChange?.(collapsed)");
  });

  // A passive effect runs after the paint, so the card would show the previous mode's
  // corners for one frame against a panel that had already moved.
  test("the report is flushed before paint", () => {
    const src = readFileSync(SIDEBAR, "utf8");
    expect(src).toMatch(/useIsoLayoutEffect\(\(\) => \{\s*onPanelModeChange/);
    expect(src).not.toMatch(/useEffect\(\(\) => \{\s*onPanelModeChange/);
  });

  test("the content card rounds itself from the mode and eases the change", () => {
    const src = readFileSync(LAYOUT, "utf8");
    expect(src).toContain("lg:transition-[border-radius]");
    expect(src).not.toContain("setSidebarPanelCollapsed");
  });

  // The corner rule must not read the URL: while the address still said `modules` the
  // panel was already open against it, which painted a round left edge over the panel.
  test("the corners follow the panel while the gap follows the rail", () => {
    const src = readFileSync(LAYOUT, "utf8");
    expect(src).toMatch(/panelMode !== "shown" \? "lg:rounded-\[24px\]"/);
    expect(src).toMatch(/hideRailOnDesktop \? "lg:mx-2" : "lg:mr-2"/);
    const cornersTiedToUrl = src.split("\n").filter((l) => l.includes("hideRailOnDesktop") && l.includes("rounded"));
    expect(cornersTiedToUrl).toEqual([]);
  });
});
