import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const at = (...p: string[]) => readFileSync(resolve(import.meta.dir, "..", "students", ...p), "utf8");

// This is a Radix ScrollArea inside a popover, and the same bug has now been paid for
// twice: `max-h-[420px]` on the root leaves its height auto, so the viewport's
// `height: 100%` resolves to the content height, nothing overflows, and the 40-row
// list runs past the bottom of the screen with no way to scroll it back into view.
// TypeScript cannot see this, so the shape is pinned as source text instead.
test("the bulk-update field picker gives its scroll root a definite height", () => {
  const source = at("bulk-update/components/field-picker.tsx");
  const area = source.match(/<ScrollArea className="([^"]*)"/);
  expect(area, "the picker no longer sets a className on its ScrollArea").toBeTruthy();
  expect(area![1]).toContain("h-[420px]");
  expect(area![1]).not.toContain("max-h-");
});
