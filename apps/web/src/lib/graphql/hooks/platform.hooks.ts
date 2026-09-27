import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { toast } from "sonner";
import { graphqlQuery, graphqlMutate } from '../core'
import { queryKeys } from '../keys'
import { api } from '@/lib/api'
import { 
  BILLING_DATA, TENANTS, USERS, AUDIT_LOGS, 
  CREATE_TENANT, UPDATE_TENANT, DELETE_TENANT, TOGGLE_TENANT_STATUS, SUBSCRIPTIONS,
  TOGGLE_USER_STATUS, CREATE_USER, UPDATE_USER, TENANT_DETAIL, RESTORE_TENANT, TENANT_METADATA
} from '../queries'
import { 
  BillingDataResponse, TenantsResponse, UsersResponse, 
  AuditLogsResponse, TenantInput, TenantBasic, SubscriptionsResponse, TenantDetailData
} from '../types'

export function useTenantResolution(slug?: string) {
  return useQuery({
    queryKey: ['tenant-resolution', slug],
    queryFn: () => api.get(`/tenants/resolve/${slug}`),
    enabled: !!slug && !['profile', 'dashboard', 'tenants', 'billing', 'users', 'audit-logs', 'platform-analytics', 'settings', 'subscriptions', 'deleted-tenants', 'bulk-attendance-import', 'roadmap', 'integrations', 'roles', 'staff', 'manage-admins', 'school-subscriptions', 'platform-notices', 'reports'].includes(slug),
    staleTime: Infinity,
  })
}

export function useBillingData(type?: 'school' | 'parent') {
  return useQuery({
    queryKey: queryKeys.billing(type),
    queryFn: () => graphqlQuery<{ billingData: BillingDataResponse }>(BILLING_DATA, { type }).then(d => d.billingData),
    staleTime: 30 * 1000,
  })
}

export function useTenants(filters?: { status?: string; plan?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.tenants(filters),
    queryFn: () => graphqlQuery<{ tenants: TenantsResponse }>(TENANTS, filters as Record<string, unknown>).then(d => d.tenants),
    staleTime: 60 * 1000,
  })
}

export function useTenantsInfinite(filters?: { status?: string; plan?: string; search?: string; limit?: number }) {
  return useInfiniteQuery({
    queryKey: ['tenants-infinite', filters],
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) => 
      graphqlQuery<{ tenants: TenantsResponse }>(TENANTS, { 
        ...filters, 
        page: pageParam, 
        limit: filters?.limit || 20 
      }).then(d => d.tenants),
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.page;
      const totalPages = lastPage.totalPages;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    staleTime: 60 * 1000,
  })
}

export function useUsers(filters?: { role?: string; tenantId?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.users(filters),
    queryFn: () => graphqlQuery<{ users: UsersResponse }>(USERS, filters as Record<string, unknown>).then(d => d.users),
    staleTime: 60 * 1000,
  })
}

export function useAuditLogs(filters?: { action?: string; role?: string; tenantId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.auditLogs(filters),
    queryFn: () => graphqlQuery<{ auditLogs: AuditLogsResponse }>(AUDIT_LOGS, filters as Record<string, unknown>).then(d => d.auditLogs),
    staleTime: 60 * 1000,
  })
}

export function useSubscriptions(
  filters?: { tenantId?: string; status?: string; search?: string; startDate?: string; endDate?: string; page?: number; limit?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...queryKeys.subscriptions, filters],
    queryFn: async () => {
      const data = await graphqlQuery<{ subscriptions: SubscriptionsResponse }>(SUBSCRIPTIONS, filters || {})
      return data.subscriptions
    },
    staleTime: 60 * 1000, // 1 minute cache
    gcTime: 15 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}

export function useTenantDetail(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.tenantDetail(tenantId),
    queryFn: () => graphqlQuery<{ tenantDetail: TenantDetailData }>(TENANT_DETAIL, { tenantId })
      .then(d => d.tenantDetail),
    staleTime: 60 * 1000,
    enabled: !!tenantId,
  })
}

export function useTenantMetadata(tenantId: string) {
  return useQuery({
    queryKey: ['tenant', 'metadata', tenantId],
    queryFn: () => graphqlQuery<{ tenantDetail: TenantDetailData }>(TENANT_METADATA, { tenantId })
      .then(d => d.tenantDetail),
    staleTime: 60 * 1000,
    enabled: !!tenantId,
  })
}

export function useCreateTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== "logoFile") {
          formData.append(key, String(value));
        }
      });
      if (data.logoFile) {
        if (data.logoFile.size > 5 * 1024 * 1024) {
          throw new Error("Logo file size must be less than 5MB");
        }
        formData.append("logoFile", data.logoFile);
      }
      return api.post('/tenants', formData);
    },
    onSuccess: (response: any) => {
      const newTenant = response.tenant;
      toast.success('School created successfully')
      queryClient.setQueriesData({ queryKey: ['tenants'] }, (old: any) => {
        if (!old) return old
        if (Array.isArray(old)) return [newTenant, ...old]
        if (old.tenants) return { ...old, tenants: [newTenant, ...old.tenants], total: (old.total || 0) + 1 }
        return old
      })
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['platform', 'stats'] })
    },
    onError: (error: any) => {
      toast.error('Failed to create tenant', { description: error.message })
    },
  })
}

export function useUpdateTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const formData = new FormData();
      formData.append("id", id);
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== "logoFile") {
          formData.append(key, String(value));
        }
      });
      if (data.logoFile) {
        if (data.logoFile.size > 5 * 1024 * 1024) {
          throw new Error("Logo file size must be less than 5MB");
        }
        formData.append("logoFile", data.logoFile);
      }
      return api.put('/tenants', formData);
    },
    onSuccess: (response: any) => {
      const updatedTenant = response.tenant;
      toast.success('School updated successfully')
      queryClient.setQueriesData({ queryKey: ['tenants'] }, (old: any) => {
        if (!old) return old
        if (Array.isArray(old)) return old.map((t: any) => t.id === updatedTenant.id ? { ...t, ...updatedTenant } : t)
        if (old.tenants) return { 
          ...old, 
          tenants: old.tenants.map((t: any) => t.id === updatedTenant.id ? { ...t, ...updatedTenant } : t) 
        }
        return old
      })
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
    onError: (error: any) => {
      toast.error('Failed to update tenant', { description: error.message })
    },
  })
}


export function useDeleteTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => graphqlMutate<{ deleteTenant: boolean }>(DELETE_TENANT, { id }).then(d => d.deleteTenant),
    onSuccess: (_, deletedId) => {
      toast.error('School moved to bin')
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['platform', 'stats'] })
    },
    onError: (error) => {
      toast.error('Failed to delete tenant', { description: error.message })
    },
  })
}

export function useRestoreTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => graphqlMutate<{ restoreTenant: TenantBasic }>(RESTORE_TENANT, { id }).then(d => d.restoreTenant),
    onSuccess: () => {
      toast.success('School restored successfully')
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['platform', 'stats'] })
    },
    onError: (error) => {
      toast.error('Failed to restore school', { description: error.message })
    },
  })
}

export function usePermanentDeleteTenant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.del(`/tenants/permanent?id=${id}`),
    onSuccess: () => {
      toast.error('School permanently removed')
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['platform', 'stats'] })
    },
    onError: (error: any) => {
      toast.error('Failed to remove school', { description: error.message })
    },
  })
}

export function useToggleTenantStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => graphqlMutate<{ toggleTenantStatus: TenantBasic }>(TOGGLE_TENANT_STATUS, { id, status }).then(d => d.toggleTenantStatus),
    onSuccess: () => {
      toast.success('Tenant status updated')
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
    onError: (error) => {
      toast.error('Failed to update status', { description: error.message })
    },
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => graphqlMutate<{ toggleUserStatus: any }>(TOGGLE_USER_STATUS, { id, isActive }).then(d => d.toggleUserStatus),
    onSuccess: (data) => {
      toast.success(`User ${data.isActive ? 'enabled' : 'disabled'} successfully`)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error) => {
      toast.error('Failed to update user status', { description: error.message })
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => graphqlMutate<{ createUser: any }>(CREATE_USER, { data }).then(d => d.createUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User account created successfully')
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      graphqlMutate<{ updateUser: any }>(UPDATE_USER, { id, data }).then(d => d.updateUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User details updated successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to update user', { description: error.message })
    },
  })
}
