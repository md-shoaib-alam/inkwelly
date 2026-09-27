import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlQuery, graphqlMutate } from '@/lib/graphql/core';

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

  const { data, isLoading, error } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => graphqlQuery<{ academicYears: any[] }>(GET_ACADEMIC_YEARS),
  });

  const createMutation = useMutation({
    mutationFn: (input: any) => graphqlMutate(CREATE_ACADEMIC_YEAR, { input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['academic-years'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      graphqlMutate(UPDATE_ACADEMIC_YEAR, { id, input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['academic-years'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => graphqlMutate(DELETE_ACADEMIC_YEAR, { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['academic-years'] }),
  });

  const setCurrentMutation = useMutation({
    mutationFn: (id: string) => graphqlMutate(SET_CURRENT_ACADEMIC_YEAR, { id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['academic-years'] }),
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
