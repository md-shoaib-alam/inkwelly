import { useQuery } from '@tanstack/react-query'
import { graphqlQuery } from '../core'
import { queryKeys } from '../keys'
import { 
  ADMIN_DASHBOARD, TEACHER_DASHBOARD, STUDENT_DASHBOARD, PARENT_DASHBOARD
} from '../queries'
import { 
  AdminDashboardData, TeacherDashboardData, StudentDashboardData, ParentDashboardData
} from '../types'

export function useAdminDashboard(tenantId: string) {
  return useQuery({
    queryKey: ['admin', 'dashboard', tenantId],
    queryFn: () => graphqlQuery<{ adminDashboard: AdminDashboardData }>(ADMIN_DASHBOARD, { tenantId }).then(d => d.adminDashboard),
    staleTime: 60 * 1000,
    enabled: !!tenantId && tenantId.trim().length > 0,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })
}

export function useTeacherDashboard(teacherName: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.teacherDashboard(teacherName),
    queryFn: () => graphqlQuery<{ teacherDashboard: TeacherDashboardData }>(TEACHER_DASHBOARD, { teacherName })
      .then(d => d.teacherDashboard),
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    enabled: (options?.enabled !== false) && !!teacherName && teacherName.trim().length > 0,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })
}

export function useStudentDashboard(studentEmail?: string) {
  return useQuery({
    queryKey: queryKeys.studentDashboard(studentEmail),
    queryFn: () => graphqlQuery<{ studentDashboard: StudentDashboardData }>(STUDENT_DASHBOARD, { studentEmail })
      .then(d => d.studentDashboard),
    staleTime: 60 * 1000,
    enabled: !!studentEmail && studentEmail.trim().length > 0,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })
}

export function useParentDashboard(parentName: string) {
  return useQuery({
    queryKey: queryKeys.parentDashboard(parentName),
    queryFn: () => graphqlQuery<{ parentDashboard: ParentDashboardData }>(PARENT_DASHBOARD, { parentName })
      .then(d => d.parentDashboard),
    staleTime: 60 * 1000,
    enabled: !!parentName && parentName.trim().length > 0,
    retry: 1,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })
}
