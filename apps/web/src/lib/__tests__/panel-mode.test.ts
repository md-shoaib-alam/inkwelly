import { test, expect, describe } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { decidePanelMode, LAUNCHER_RAIL_KEY } from "@/components/layout/sidebar/panel-mode";

const APP_ROOT = resolve(import.meta.dir, "..", "..", "..");
const SIDEBAR = join(APP_ROOT, "src", "components", "layout", "sidebar", "module-sidebar.tsx");

// Tapping the Dashboard rail entry used to leave the sub-panel on screen for about
// half a second: ~190 ms before React committed the hide, then a 300 ms width
// animation, and the drawer slid out with the panel still inside it. The panel is
// now not rendered at all for the launcher, so there is nothing to animate shut.
describe("the launcher never renders a sub-panel", () => {
  test("the launcher row gives no panel at either width", () => {
    for (const isMobile of [true, false]) {
      for (const collapsed of [true, false]) {
        expect(decidePanelMode({ isMobile, collapsed, activeModuleKey: LAUNCHER_RAIL_KEY })).toBe("none");
      }
    }
  });

  // The first paint used to run the desktop branch because `useIsMobile` starts
  // false, which painted a 210 px panel on a phone before correcting itself.
  // "none" is reached without reading isMobile, so it holds on that first paint.
  test("the answer does not depend on the breakpoint", () => {
    const modes = [true, false].flatMap((isMobile) =>
      [true, false].map((collapsed) =>
        decidePanelMode({ isMobile, collapsed, activeModuleKey: LAUNCHER_RAIL_KEY }),
      ),
    );
    expect(new Set(modes).size).toBe(1);
  });

  test("every other module keeps its panel behaviour", () => {
    // Mobile: the drawer stays open on the panel once a module is picked.
    expect(decidePanelMode({ isMobile: true, collapsed: false, activeModuleKey: "academics" })).toBe("shown");
    expect(decidePanelMode({ isMobile: true, collapsed: true, activeModuleKey: "academics" })).toBe("shown");
    // Desktop: the collapse toggle still animates the panel shut rather than removing it.
    expect(decidePanelMode({ isMobile: false, collapsed: false, activeModuleKey: "academics" })).toBe("shown");
    expect(decidePanelMode({ isMobile: false, collapsed: true, activeModuleKey: "academics" })).toBe("hidden");
  });
});

describe("the sidebar obeys the mode by not mounting the panel", () => {
  test("the panel subtree is guarded by the mode, not only by a width class", () => {
    const src = readFileSync(SIDEBAR, "utf8");
    expect(src).toContain("{panelMode === \"none\" ? null : (");
    expect(src).not.toContain('activeModule.key !== "modules"');
  });

  test("the collapse animation survives for the modules that use it", () => {
    const src = readFileSync(SIDEBAR, "utf8");
    expect(src).toContain("transition-[width,opacity]");
    expect(src).toContain('panelMode === "shown"');
  });
});
