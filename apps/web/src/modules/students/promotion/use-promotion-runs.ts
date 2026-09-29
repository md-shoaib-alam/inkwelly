"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAppStore } from "@/store/use-app-store";
import { PromotionRun, RunsResponse } from "./promotion-types";

const EMPTY: RunsResponse = {
  items: [],
  counts: { draft: 0, pending: 0, executing: 0, completed: 0, reversed: 0 },
};

/**
 * The hub lists runs and the wizard resolves `?run=` against the same list, so both
 * read one cache entry rather than each declaring the query.
 */
export function usePromotionRuns() {
  const currentTenantId = useAppStore((s) => s.currentTenantId);
  const queryClient = useQueryClient();

  const query = useQuery<RunsResponse>({
    queryKey: ["promotion-runs", currentTenantId],
    queryFn: async () => {
      const res = await apiFetch("/api/promotions/runs");
      if (!res.ok) throw new Error("Failed to load promotion runs");
      return res.json();
    },
  });

  return {
    ...query,
    data: query.data ?? EMPTY,
    refresh: () => queryClient.invalidateQueries({ queryKey: ["promotion-runs"] }),
  };
}

export const findRun = (runs: PromotionRun[], id: string | null): PromotionRun | null =>
  runs.find((r) => r.id === id) ?? null;
