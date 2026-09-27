"use client";

import { useReducer } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "@/lib/graphql/hooks";
import { Loader2, KeyRound, Eye, EyeOff } from "lucide-react";

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type State = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  showOldPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  error: string;
};

type Action =
  | { type: 'SET_FIELD'; field: keyof State; value: string | boolean }
  | { type: 'TOGGLE_VISIBILITY'; field: 'showOldPassword' | 'showNewPassword' | 'showConfirmPassword' }
  | { type: 'RESET' };

const initialState: State = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
  showOldPassword: false,
  showNewPassword: false,
  showConfirmPassword: false,
  error: "",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'TOGGLE_VISIBILITY':
      return { ...state, [action.field]: !state[action.field] };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function ChangePasswordModal({
  open,
  onOpenChange,
}: ChangePasswordModalProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    oldPassword,
    newPassword,
    confirmPassword,
    showOldPassword,
    showNewPassword,
    showConfirmPassword,
    error,
  } = state;

  const changePasswordMutation = useChangePassword();

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      dispatch({ type: 'RESET' });
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_FIELD', field: 'error', value: "" });

    if (newPassword !== confirmPassword) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      dispatch({ type: 'SET_FIELD', field: 'error', value: "Password must be at least 6 characters" });
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({ oldPassword, newPassword });
      handleOpenChange(false);
      // Server invalidated all sessions — force re-login
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const [name] = cookie.split('=');
          document.cookie = name.trim() + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        }
        window.location.href = '/';
      }
    } catch (err: any) {
      // Error is handled by the hook's toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-b from-[#0F2042] to-[#061024] border-zinc-800 text-white shadow-2xl">
        <DialogHeader>
          <div className="mx-auto size-12 rounded-full bg-cyan-500/10 flex items-center justify-center mb-2">
            <KeyRound className="size-6 text-cyan-400" />
          </div>
          <DialogTitle className="text-center text-xl text-white">Change Password</DialogTitle>
          <DialogDescription className="text-center text-zinc-400 text-sm">
            Enter your current password and choose a secure new one.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="oldPassword" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">Current Password</Label>
            <div className="relative">
              <Input
                id="oldPassword"
                type={showOldPassword ? "text" : "password"}
                placeholder="Current Password"
                value={oldPassword}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'oldPassword', value: e.target.value })}
                required
                className="pr-10 bg-white/5 border-white/10 text-white placeholder-white/30 focus-visible:ring-cyan-400 focus-visible:border-cyan-400 rounded-full h-11 px-4"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                onClick={() => dispatch({ type: 'TOGGLE_VISIBILITY', field: 'showOldPassword' })}
              >
                {showOldPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password (Min 6 chars)"
                value={newPassword}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'newPassword', value: e.target.value })}
                required
                className="pr-10 bg-white/5 border-white/10 text-white placeholder-white/30 focus-visible:ring-cyan-400 focus-visible:border-cyan-400 rounded-full h-11 px-4"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                onClick={() => dispatch({ type: 'TOGGLE_VISIBILITY', field: 'showNewPassword' })}
              >
                {showNewPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'confirmPassword', value: e.target.value })}
                required
                className="pr-10 bg-white/5 border-white/10 text-white placeholder-white/30 focus-visible:ring-cyan-400 focus-visible:border-cyan-400 rounded-full h-11 px-4"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                onClick={() => dispatch({ type: 'TOGGLE_VISIBILITY', field: 'showConfirmPassword' })}
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-sm font-medium text-red-400 bg-red-950/30 border border-red-500/20 p-2.5 rounded-xl">
              {error}
            </p>
          )}
          <DialogFooter className="pt-4 flex flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={changePasswordMutation.isPending}
              className="flex-1 bg-white/5 border-white/20 text-zinc-300 hover:bg-white/10 hover:text-white rounded-full h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="flex-1 bg-gradient-to-r from-[#4F7DF9] via-[#82F3FF] to-[#12D0F6] text-[#0A1E40] font-bold hover:opacity-90 rounded-full h-11 border-0 shadow-lg shadow-cyan-500/20"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
