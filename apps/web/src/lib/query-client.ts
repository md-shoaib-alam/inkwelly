import { QueryClient } from "@tanstack/react-query";

/**
 * Invalidates the query roots a write actually touched.
 *
 * `pathOrTag` is either a REST path (e.g. "/students/123") or a GraphQL
 * mutation document. Matching is keyword-based on a punctuation-stripped
 * string, so both "/staff-attendance" and "MarkStaffAttendance" map to the
 * same root and the logic survives production minification.
 */
export async function triggerGlobalRefresh(pathOrTag?: string) {
  const tag = String(pathOrTag || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  let matched = false;

  const invalidate = (queryKey: unknown[]) => {
    matched = true;
    return queryClient.invalidateQueries({ queryKey }); // active queries only
  };

  // Always refresh the dashboard stats
  queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["admin"] });

  // staff-attendance must be checked before attendance and excluded from staff
  if (tag.includes("staffattendance")) {
    await invalidate(["staff-attendance"]);
  } else if (tag.includes("attendance")) {
    await invalidate(["attendance"]);
  }

  if (tag.includes("student")) await invalidate(["students"]);
  if (tag.includes("teacher")) await invalidate(["teachers"]);
  if (tag.includes("parent")) await invalidate(["parents"]);
  if (tag.includes("staff") && !tag.includes("staffattendance")) await invalidate(["staff"]);
  if (tag.includes("fee")) await invalidate(["fees"]);
  if (tag.includes("class")) await invalidate(["classes"]);
  if (tag.includes("notice")) await invalidate(["notices"]);
  if (tag.includes("subject")) await invalidate(["teacher-subjects-mine-v2"]);

  // Unknown write: refresh whatever is currently on screen
  if (!matched) {
    queryClient.invalidateQueries({ refetchType: "active" });
  }
}

/**
 * Singleton QueryClient for the entire app
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes (standard for production dashboards)
      gcTime: 60 * 60 * 1000,    // 1 hour
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
