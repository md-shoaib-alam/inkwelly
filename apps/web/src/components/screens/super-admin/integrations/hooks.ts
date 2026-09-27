"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { OverviewResponse, ProvidersResponse } from "./types";

export const INTEGRATIONS_KEYS = {
  providers: ["integrations", "providers"] as const,
  overview: ["integrations", "overview"] as const,
};

export function useIntegrationProviders() {
  return useQuery({
    queryKey: INTEGRATIONS_KEYS.providers,
    queryFn: () => api.get<ProvidersResponse>("/integrations/providers"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useIntegrationsOverview() {
  return useQuery({
    queryKey: INTEGRATIONS_KEYS.overview,
    queryFn: () => api.get<OverviewResponse>("/integrations/overview"),
  });
}

export interface SaveConnectionPayload {
  status?: string;
  accountLabel?: string | null;
  enabled?: boolean;
  fields?: Record<string, string | null>;
}

/**
 * One mutation for create and update — the server upserts on (tenant, provider).
 * A blank secret means "keep what is stored", so never prefill one.
 */
export function useSaveConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      provider,
      payload,
    }: {
      tenantId: string;
      provider: string;
      payload: SaveConnectionPayload;
    }) => api.put(`/integrations/tenant/${tenantId}/${provider}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: INTEGRATIONS_KEYS.overview }),
  });
}

export function useDeleteConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, provider }: { tenantId: string; provider: string }) =>
      api.del(`/integrations/tenant/${tenantId}/${provider}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: INTEGRATIONS_KEYS.overview }),
  });
}
