"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, KeyRound, LogOut } from "lucide-react";
import type { UserRole } from "@/store/use-app-store";

interface QuickActionsProps {
  role: UserRole;
  onPasswordChange: () => void;
  onLogout: () => void;
  onSubscriptionClick: () => void;
}

export function QuickActions({ role, onPasswordChange, onLogout, onSubscriptionClick }: QuickActionsProps) {
  return (
    <Card className="border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base font-bold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {(role === "admin" || role === "parent") && (
          <Button
            variant="outline"
            onClick={onSubscriptionClick}
            className="w-full h-11 justify-start gap-3 rounded-xl border-amber-200/80 hover:bg-amber-500/5 hover:text-amber-600 font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-[0.98]"
          >
            <Crown className="size-4 text-amber-500" />
            My Subscription
          </Button>
        )}

        <Button
          variant="outline"
          onClick={onPasswordChange}
          className="w-full h-11 justify-start gap-3 rounded-xl hover:bg-orange-500/5 hover:text-orange-600 font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-[0.98]"
        >
          <KeyRound className="size-4 text-orange-500" />
          Change Password
        </Button>

        <Button
          variant="destructive"
          onClick={onLogout}
          className="w-full h-11 justify-start gap-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 border-0 shadow-none font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-[0.98]"
        >
          <LogOut className="size-4" />
          Log Out Account
        </Button>
      </CardContent>
    </Card>
  );
}
