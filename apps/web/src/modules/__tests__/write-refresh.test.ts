import { expect, test } from "bun:test";
import { queryClient, triggerGlobalRefresh } from "@/lib/query-client";

const DASHBOARD_ROOT = ["students-command-center"];
const ATTENDANCE_ROOT = ["attendance-command-center"];

/**
 * The Students dashboard counts and stamps the same rows a write just changed, so a
 * write has to invalidate its query root. If it does not, the screen keeps showing the
 * numbers from before the edit until a reload — which is indistinguishable from the
 * "Updated …" line being a decoration.
 *
 * Only writes that name a known root are worth asserting on. A path matching no keyword
 * falls through to the "refresh whatever is on screen" catch-all, which invalidates
 * every query and would pass with or without this root being wired up.
 */
function rootsInvalidatedBy(path: string) {
  const roots: Array<unknown[] | undefined> = [];
  const original = queryClient.invalidateQueries.bind(queryClient);
  queryClient.invalidateQueries = ((filters?: unknown) => {
    roots.push((filters as { queryKey?: unknown[] }).queryKey);
    return original(filters as never);
  }) as typeof queryClient.invalidateQueries;
  return triggerGlobalRefresh(path).then(() => {
    queryClient.invalidateQueries = original;
    return roots;
  });
}

test("editing a student refreshes the students dashboard", async () => {
  expect(await rootsInvalidatedBy("/api/students")).toContainEqual(DASHBOARD_ROOT);
});

test("restoring a student from trash refreshes the students dashboard", async () => {
  expect(await rootsInvalidatedBy("/api/students/restore")).toContainEqual(DASHBOARD_ROOT);
});

test("moving a class refreshes the students dashboard", async () => {
  // The path never says "student", so a keyword-only rule would miss class moves.
  expect(await rootsInvalidatedBy("/api/classes")).toContainEqual(DASHBOARD_ROOT);
});

test("marking a register refreshes the attendance dashboard", async () => {
  expect(await rootsInvalidatedBy("/api/attendance")).toContainEqual(ATTENDANCE_ROOT);
});
