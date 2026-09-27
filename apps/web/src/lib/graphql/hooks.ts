'use client'

// Core utilities
export { graphqlQuery, graphqlMutate } from './core'

// Query Strings
export * from './queries'

// Types
export * from './types'

// Selection Keys
export { queryKeys } from './keys'

// Generic Hooks
export { useGraphQLQuery, useGraphQLMutation } from './hooks/generic.hooks'

// Platform Hooks
export { 
  useBillingData, useTenants, useTenantsInfinite, useUsers, useAuditLogs, 
  useSubscriptions, useTenantDetail, useTenantMetadata, useCreateTenant, useUpdateTenant, 
  useDeleteTenant, useRestoreTenant, usePermanentDeleteTenant, 
  useToggleTenantStatus, useToggleUserStatus, useCreateUser, useUpdateUser 
} from './hooks/platform.hooks'

// Academic Hooks
export { 
  useClassesMin, useClasses, useTeachers, 
  useStudents, useParents, useNotices, useStaff, 
  useCustomRoles, useFees, useAttendance,
  useCreateCustomRole, useUpdateCustomRole, useDeleteCustomRole, useAssignRoleToUser
} from './hooks/academic.hooks'

// Dashboard Hooks
export { 
  useAdminDashboard, 
  useTeacherDashboard, useStudentDashboard, useParentDashboard 
} from './hooks/dashboard.hooks'

// Auth Hooks
export { useRequestPasswordReset, useChangePassword } from './hooks/auth.hooks'
