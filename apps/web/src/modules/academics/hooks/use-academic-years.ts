import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlQuery, graphqlMutate } from '@/lib/graphql/core';
import { useAppStore } from '@/store/use-app-store';

const GET_ACADEMIC_YEARS = `
  query GetAcademicYears {
    academicYears {
      id
      name
      startDate
      endDate
      status
      isCurrent
      createdAt
    }
  }
`;

const CREATE_ACADEMIC_YEAR = `
  mutation CreateAcademicYear($input: CreateAcademicYearInput!) {
    createAcademicYear(input: $input) {
      id
      name
    }
  }
`;

const UPDATE_ACADEMIC_YEAR = `
  mutation UpdateAcademicYear($id: String!, $input: CreateAcademicYearInput!) {
    updateAcademicYear(id: $id, input: $input) {
      id
      name
    }
  }
`;

const DELETE_ACADEMIC_YEAR = `
  mutation DeleteAcademicYear($id: String!) {
    deleteAcademicYear(id: $id)
  }
`;

const SET_CURRENT_ACADEMIC_YEAR = `
  mutation SetCurrentAcademicYear($id: String!) {
    setCurrentAcademicYear(id: $id) {
      id
      name
    }
  }
`;

export function useAcademicYears() {
  const queryClient = useQueryClient();
  const { currentUser, currentTenantSlug, currentTenantId } = useAppStore();
  // A super admin moving between schools must not see the previous school's
  // years while the new query is in flight; the chip would offer the wrong list.
  const tenantScope =
    currentTenantSlug || currentTenantId || currentUser?.tenantSlug || currentUser?.tenantId || '';
  const cacheKey = ['academic-years', tenantScope];

  const { data, isLoading, error } = useQuery({
    queryKey: cacheKey,
    queryFn: () => graphqlQuery<{ academicYears: any[] }>(GET_ACADEMIC_YEARS),
    // `academicYears` throws 'Tenant context required' for a user with no
    // school, and the app layout mounts this hook on platform screens too.
    enabled: tenantScope !== '',
  });

  const createMutation = useMutation({
    mutationFn: (input: any) => graphqlMutate(CREATE_ACADEMIC_YEAR, { input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cacheKey }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      graphqlMutate(UPDATE_ACADEMIC_YEAR, { id, input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cacheKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => graphqlMutate(DELETE_ACADEMIC_YEAR, { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cacheKey }),
  });

  const setCurrentMutation = useMutation({
    mutationFn: (id: string) => graphqlMutate(SET_CURRENT_ACADEMIC_YEAR, { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cacheKey }),
  });

  return {
    academicYears: data?.academicYears || [],
    isLoading,
    error,
    createAcademicYear: createMutation.mutateAsync,
    updateAcademicYear: updateMutation.mutateAsync,
    deleteAcademicYear: deleteMutation.mutateAsync,
    setCurrentAcademicYear: setCurrentMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSettingCurrent: setCurrentMutation.isPending,
  };
}
