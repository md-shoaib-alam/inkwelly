import { useQuery, useMutation, useQueryClient, keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { toast } from "sonner";
import { graphqlQuery, graphqlMutate } from '../core'
import { queryKeys } from '../keys'
import { 
  SUBJECTS, CLASSES, CLASSES_FILTERED, CLASS_STATS, CLASS_FILTER_OPTIONS, TEACHERS, STUDENTS, PARENTS, NOTICES, FEES, ATTENDANCE, STAFF, CUSTOM_ROLES,
  CREATE_SUBJECT, UPDATE_SUBJECT, DELETE_SUBJECT,
  CREATE_CUSTOM_ROLE, UPDATE_CUSTOM_ROLE, DELETE_CUSTOM_ROLE, ASSIGN_ROLE_TO_USER
} from '../queries'
import { 
  SubjectsResponse, ClassesResponse, FilteredClassesResponse, ClassStatsResponse, ClassFilterOptionsResponse,
  TeachersResponse, StudentsResponse, ParentsResponse,
  NoticesResponse, FeesResponse, AttendanceResponse, StaffResponse
} from '../types/index'
import { classQueryArgs, type ClassFilters } from '@/lib/class-options'

export function useSubjects(tenantId?: string, page?: number, limit?: number) {
  return useQuery<SubjectsResponse>({
    queryKey: [...queryKeys.subjects, tenantId, page, limit],
    queryFn: () => graphqlQuery<{ subjects: SubjectsResponse }>(SUBJECTS, { tenantId, page, limit }).then(d => d.subjects),
    // Subject writes call invalidateQueries(queryKeys.subjects) from their own
    // onSuccess, so the 5-minute QueryClient default only covers reads between
    // writes rather than making every mount re-read.
    gcTime: 5 * 60 * 1000,
    enabled: !!tenantId,
  })
}

export function useClassesMin(tenantId?: string, page?: number, limit?: number) {
  return useQuery<ClassesResponse>({
    queryKey: [...queryKeys.classes, tenantId, page, limit],
    queryFn: () => graphqlQuery<{ classes: ClassesResponse }>(CLASSES, { tenantId, page, limit }).then(d => d.classes),
    // staleTime comes from the 5-minute QueryClient default; class writes go
    // through /api/classes, and triggerGlobalRefresh() maps any "class" path to
    // the ["classes"] prefix, so this cache is still cleared on every write.
    gcTime: 5 * 60 * 1000,
    enabled: !!tenantId,
  })
}

export function useClassesInfinite(tenantId?: string, filters?: { limit?: number }) {
  return useInfiniteQuery<ClassesResponse>({
    queryKey: [...queryKeys.classes, 'infinite', tenantId, filters],
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) =>
      graphqlQuery<{ classes: ClassesResponse }>(CLASSES, {
        tenantId,
        page: pageParam,
        limit: filters?.limit || 20,
      }).then(d => d.classes),
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.page;
      const totalPages = lastPage.totalPages;
      return currentPage < totalPages ? (currentPage + 1) : undefined;
    },
    // Same reasoning as useClassesMin: ["classes"] is invalidated on every class
    // write, so this can ride the 5-minute default instead of refetching on
    // every remount (ClassSelect remounts whenever a screen re-renders its tree).
    gcTime: 5 * 60 * 1000,
    enabled: !!tenantId,
  })
}

export function useTeachersMin(tenantId?: string, page?: number, limit?: number) {
  return useQuery<TeachersResponse>({
    queryKey: [...queryKeys.teachers, tenantId, page, limit],
    queryFn: () => graphqlQuery<{ teachers: TeachersResponse }>(TEACHERS, { tenantId, page, limit }).then(d => d.teachers),
    // ["teachers"] is invalidated by triggerGlobalRefresh() on every teacher
    // write, so this can ride the 5-minute default.
    gcTime: 5 * 60 * 1000,
    enabled: !!tenantId,
  })
}

// Shares useClassesMin's cache key and (now) its options, so the two hooks read
// the same ["classes"] entry instead of one pinning it stale on every mount.
export function useClasses(tenantId?: string, page?: number, limit?: number) {
  return useQuery<ClassesResponse>({
    queryKey: [...queryKeys.classes, tenantId, page, limit],
    queryFn: () => graphqlQuery<{ classes: ClassesResponse }>(CLASSES, { tenantId, page, limit }).then(d => d.classes),
    gcTime: 5 * 60 * 1000,
    enabled: !!tenantId,
  })
}

/**
 * The Classes screens: filter, sort and page in the database, so the request
 * carries the rows actually displayed rather than the tenant's whole class list.
 */
export function useClassesFiltered(
  tenantId: string | undefined,
  filters: ClassFilters,
  page: number,
  limit: number,
) {
  const args = classQueryArgs(filters);
  return useQuery<FilteredClassesResponse>({
    queryKey: [...queryKeys.classes, 'filtered', tenantId, args, page, limit],
    queryFn: () =>
      graphqlQuery<{ classes: FilteredClassesResponse }>(CLASSES_FILTERED, {
        tenantId, ...args, page, limit,
      }).then(d => d.classes),
    gcTime: 5 * 60 * 1000,
    // The panel changes one variable at a time; keeping the previous page on
    // screen avoids a blank flash between every keystroke and dropdown choice.
    placeholderData: keepPreviousData,
    enabled: !!tenantId,
  })
}

export function useClassStats(tenantId?: string) {
  return useQuery<ClassStatsResponse>({
    queryKey: [...queryKeys.classes, 'stats', tenantId],
    queryFn: () =>
      graphqlQuery<{ classStats: ClassStatsResponse }>(CLASS_STATS, { tenantId }).then(d => d.classStats),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!tenantId,
  })
}

export function useClassFilterOptions(tenantId?: string) {
  return useQuery<ClassFilterOptionsResponse>({
    queryKey: [...queryKeys.classes, 'filter-options', tenantId],
    queryFn: () =>
      graphqlQuery<{ classFilterOptions: ClassFilterOptionsResponse }>(CLASS_FILTER_OPTIONS, { tenantId })
        .then(d => d.classFilterOptions),
    // The values in use change only when a class is created or renamed.
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!tenantId,
  })
}

export function useTeachers(tenantId?: string, search?: string, page?: number, limit?: number) {
  return useQuery<TeachersResponse>({
    queryKey: [...queryKeys.teachers, tenantId, search, page, limit],
    queryFn: () => graphqlQuery<{ teachers: TeachersResponse }>(TEACHERS, { tenantId, search, page, limit }).then(d => d.teachers),
    staleTime: 30 * 60 * 1000,      // 30 minutes - data is fresh for this duration
    gcTime: 60 * 60 * 1000,         // 1 hour - keep in garbage collection
    refetchOnMount: true,             // Only refetch if stale (default, but explicit here)
    placeholderData: keepPreviousData,
    enabled: !!tenantId,
  })
}

export function useStudents(tenantId?: string, classId?: string, search?: string, status?: string, gender?: string, page?: number, limit?: number) {
  return useQuery<StudentsResponse>({
    queryKey: [...queryKeys.students, tenantId, classId, search, status, gender, page, limit],
    queryFn: () => graphqlQuery<{ students: StudentsResponse }>(STUDENTS, { tenantId, classId, search, status, gender, page, limit }).then(d => d.students),
    // staleTime comes from the 5-minute QueryClient default; every student
    // mutation calls invalidateQueries(queryKeys.students), so opening a
    // profile and coming back no longer re-reads the whole list.
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: !!tenantId,
  })
}

export function useParents(tenantId?: string, search?: string, page?: number, limit?: number, options?: { enabled?: boolean }) {
  return useQuery<ParentsResponse>({
    queryKey: [...queryKeys.parents, tenantId, search, page, limit],
    queryFn: () => graphqlQuery<{ parents: ParentsResponse }>(PARENTS, { tenantId, search, page, limit }).then(d => d.parents),
    staleTime: 60 * 1000,      // 1 minute cache
    gcTime: 60 * 60 * 1000,         // 1 hour - keep in garbage collection
    refetchOnMount: true,             // Only refetch if stale
    placeholderData: keepPreviousData,
    enabled: (options?.enabled ?? true) && !!tenantId,
  })
}

export function useNotices(tenantId?: string, page?: number, limit?: number) {
  return useQuery({
    queryKey: [...queryKeys.notices, tenantId, page, limit],
    queryFn: async () => {
      const data = await graphqlQuery<{ notices: NoticesResponse }>(NOTICES, { tenantId, page, limit })
      return data.notices
    },
    // ["notices"] is invalidated by triggerGlobalRefresh() on every notice write.
    gcTime: 5 * 60 * 1000,
    enabled: !!tenantId,
  })
}

export function useFees(tenantId?: string, page?: number, limit?: number) {
  return useQuery({
    queryKey: [...queryKeys.fees, tenantId, page, limit],
    queryFn: async () => {
      const data = await graphqlQuery<{ fees: FeesResponse }>(FEES, { tenantId, page, limit })
      return data.fees
    },
    // Shorter than the 5-minute default on purpose: the Expo app collects fees
    // out of band, so a web-only invalidation can't cover those writes.
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!tenantId,
  })
}

export function useAttendance(tenantId?: string, page?: number, limit?: number) {
  return useQuery<AttendanceResponse>({
    queryKey: [...queryKeys.attendance, tenantId, page, limit],
    queryFn: () => graphqlQuery<{ attendance: AttendanceResponse }>(ATTENDANCE, { tenantId, page, limit }).then(d => d.attendance),
    // Same reasoning as useFees: teachers mark attendance from the Expo app, and
    // those writes never reach this client's invalidation map.
    staleTime: 30 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: !!tenantId,
  })
}

export function useStaff(tenantId?: string, role?: string, search?: string, page: number = 1, limit: number = 12) {
  return useQuery<StaffResponse>({
    queryKey: [...queryKeys.staff, tenantId, role, search, page, limit],
    queryFn: () => graphqlQuery<{ staff: StaffResponse }>(STAFF, { tenantId, role, search, page, limit }).then(d => d.staff),
    // ["staff"] is invalidated by triggerGlobalRefresh() and directly by the
    // role-assignment mutation, so this can ride the 5-minute default.
    gcTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
    enabled: !!tenantId,
  })
}

export function useCustomRoles(tenantId?: string) {
  return useQuery<any[]>({
    queryKey: ['custom-roles', tenantId],
    queryFn: () => graphqlQuery<{ customRoles: any[] }>(CUSTOM_ROLES, { tenantId }).then(d => d.customRoles),
    staleTime: 10 * 60 * 1000,
    enabled: !!tenantId,
  })
}

function useCreateSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => graphqlMutate<{ createSubject: any }>(CREATE_SUBJECT, { data }).then(d => d.createSubject),
    onSuccess: () => {
      toast.success('Subject created successfully')
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects })
    },
    onError: (error) => toast.error('Error creating subject', { description: error.message }),
  })
}

function useUpdateSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => graphqlMutate<{ updateSubject: any }>(UPDATE_SUBJECT, { id, data }).then(d => d.updateSubject),
    onSuccess: () => {
      toast.success('Subject updated successfully')
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects })
    },
    onError: (error) => toast.error('Error updating subject', { description: error.message }),
  })
}

function useDeleteSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => graphqlMutate<{ deleteSubject: boolean }>(DELETE_SUBJECT, { id }),
    onSuccess: () => {
      toast.success('Subject deleted')
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects })
    },
    onError: (error) => toast.error('Error deleting subject', { description: error.message }),
  })
}

export function useCreateCustomRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: any) => graphqlMutate<{ createCustomRole: any }>(CREATE_CUSTOM_ROLE, vars).then(d => d.createCustomRole),
    onSuccess: () => {
      toast.success('Custom role created')
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] })
    },
    onError: (error) => toast.error('Error creating role', { description: error.message }),
  })
}

export function useUpdateCustomRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: any) => graphqlMutate<{ updateCustomRole: any }>(UPDATE_CUSTOM_ROLE, vars).then(d => d.updateCustomRole),
    onSuccess: () => {
      toast.success('Custom role updated')
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] })
    },
    onError: (error) => toast.error('Error updating role', { description: error.message }),
  })
}

export function useDeleteCustomRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => graphqlMutate<{ deleteCustomRole: boolean }>(DELETE_CUSTOM_ROLE, { id }),
    onSuccess: () => {
      toast.error('Role deleted permanently', {
        description: 'The custom role and its permissions have been removed.'
      })
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] })
    },
    onError: (error) => toast.error('Error deleting role', { description: error.message }),
  })
}

export function useAssignRoleToUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: any) => graphqlMutate<{ assignRoleToUser: boolean }>(ASSIGN_ROLE_TO_USER, vars),
    onSuccess: (data, variables) => {
      toast.success('Role assigned successfully')
      
      const { userId, roleId } = variables;
      
      // Get role details from custom-roles cache
      const roles: any[] = queryClient.getQueryData(['custom-roles']) || [];
      const newRole = roleId ? roles.find(r => r.id === roleId) : null;

      // Optimistically update all staff queries in the cache
      queryClient.setQueriesData({ queryKey: ['staff'] }, (oldData: any) => {
        if (!oldData) return oldData;
        if (oldData.staff && Array.isArray(oldData.staff)) {
          return {
            ...oldData,
            staff: oldData.staff.map((member: any) => {
              if (member.id === userId) {
                return {
                  ...member,
                  customRole: newRole ? {
                    id: newRole.id,
                    name: newRole.name,
                    color: newRole.color,
                  } : null
                };
              }
              return member;
            })
          };
        }
        if (Array.isArray(oldData)) {
          return oldData.map((member: any) => {
            if (member.id === userId) {
              return {
                ...member,
                customRole: newRole ? {
                  id: newRole.id,
                  name: newRole.name,
                  color: newRole.color,
                } : null
              };
            }
            return member;
          });
        }
        return oldData;
      });

      // Invalidate queries in the background without causing active query reloads
      queryClient.invalidateQueries({ queryKey: ['staff'], refetchType: 'none' })
      queryClient.invalidateQueries({ queryKey: ['all-staff'], refetchType: 'none' })
      queryClient.invalidateQueries({ queryKey: ['custom-roles'], refetchType: 'none' })
      queryClient.invalidateQueries({ queryKey: ['custom-roles-page'], refetchType: 'none' })
      queryClient.invalidateQueries({ queryKey: ['users'], refetchType: 'none' })
    },
    onError: (error) => toast.error('Error assigning role', { description: error.message }),
  })
}
