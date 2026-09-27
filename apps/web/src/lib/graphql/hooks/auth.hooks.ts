import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from "sonner";
import { graphqlMutate } from '../core'
import { REQUEST_PASSWORD_RESET, CHANGE_PASSWORD } from '../queries'

export function useRequestPasswordReset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (email: string) => graphqlMutate<{ requestPasswordReset: boolean }>(REQUEST_PASSWORD_RESET, { email }).then(d => d.requestPasswordReset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    }
  })
}

export function useChangePassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { oldPassword: string; newPassword: string }) => 
      graphqlMutate<{ changePassword: boolean }>(CHANGE_PASSWORD, vars as Record<string, unknown>).then(d => d.changePassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      toast.success('Password changed successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to change password', { description: error.message })
    }
  })
}
