import { useQuery, useMutation } from '@tanstack/react-query'
import { graphqlQuery, graphqlMutate } from '../core'

export function useGraphQLQuery<T>(
  key: any[],
  query: string,
  variables?: Record<string, unknown>,
  options?: any
) {
  return useQuery<T, Error>({
    queryKey: key,
    queryFn: () => graphqlQuery<T>(query, variables),
    ...options,
  })
}

export function useGraphQLMutation<T, V>(
  mutation: string,
  options?: any
) {
  // graphqlMutate already triggers the global refresh, so no extra
  // invalidation is needed here; callers can still pass their own onSuccess.
  return useMutation<T, Error, V>({
    mutationFn: (variables: V) => graphqlMutate<T>(mutation, variables as any),
    ...options,
  })
}
