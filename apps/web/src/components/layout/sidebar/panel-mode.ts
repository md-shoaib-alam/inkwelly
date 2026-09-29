// The launcher's rail row has one panel entry: the row just tapped. It used to be
// hidden by animating its width to zero, which left it painted for the length of the
// animation, and on the first paint `useIsMobile` still reads false so the desktop
// branch showed a 210 px panel on a phone. Both go away by not rendering it.

/** The rail module whose landing is the tenant launcher. */
export const LAUNCHER_RAIL_KEY = "modules";

export type PanelMode = "none" | "shown" | "hidden";

export function decidePanelMode(opts: {
  isMobile: boolean;
  collapsed: boolean;
  activeModuleKey: string;
}): PanelMode {
  // Checked before the breakpoint so the answer cannot depend on a value the first
  // paint has not settled yet.
  if (opts.activeModuleKey === LAUNCHER_RAIL_KEY) return "none";
  if (opts.isMobile) return "shown";
  return opts.collapsed ? "hidden" : "shown";
}
