// The launcher's rail row has one panel entry: the row just tapped. It used to be
// hidden by animating its width to zero, which left it painted for the length of the
// animation, and on the first paint `useIsMobile` still reads false so the desktop
// branch showed a 210 px panel on a phone. Both go away by not rendering it.

/** The rail module whose landing is the tenant launcher. */
export const LAUNCHER_RAIL_KEY = "modules";

/**
 * Screens that own the whole content area and so render with no contextual panel:
 * the launcher, and the standalone AI chat. The AI screen is not a sub-link of any
 * module, so `findModuleForScreen` matches nothing and the rail would otherwise keep
 * showing whichever module's panel was last open (AI Connect). Keyed on the resolved
 * screen, not the active module, because that module is exactly what goes stale here.
 */
export const PANEL_LESS_SCREENS = new Set(["modules", "ai"]);

export type PanelMode = "none" | "shown" | "hidden";

export function decidePanelMode(opts: {
  isMobile: boolean;
  collapsed: boolean;
  activeModuleKey: string;
  screen: string;
}): PanelMode {
  // Checked before the breakpoint so the answer cannot depend on a value the first
  // paint has not settled yet.
  if (opts.activeModuleKey === LAUNCHER_RAIL_KEY) return "none";
  if (PANEL_LESS_SCREENS.has(opts.screen)) return "none";
  if (opts.isMobile) return "shown";
  return opts.collapsed ? "hidden" : "shown";
}
