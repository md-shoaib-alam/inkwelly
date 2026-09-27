"use client";

import React from "react";
import { Check, Users, School, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SCHOOL_PLANS, SchoolPlan } from "@/lib/billing-constants";

interface PricingPlansProps {
  currentPlan: string;
  onSelectPlan: (plan: SchoolPlan) => void;
  isLoading?: boolean;
}

export function PricingPlans({ currentPlan, onSelectPlan, isLoading }: PricingPlansProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
      {SCHOOL_PLANS.map((plan) => {
        const isCurrent = currentPlan.toLowerCase() === plan.id.toLowerCase();
        
        const colorStyles = {
          violet: "text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/50 bg-violet-50/50 dark:bg-violet-900/20",
          emerald: "text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/20",
          amber: "text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/20",
          rose: "text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-900/20",
          blue: "text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/20",
        }[plan.color as 'violet' | 'emerald' | 'amber' | 'rose' | 'blue'];

        const buttonStyles = {
          violet: "bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600",
          emerald: "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600",
          amber: "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600",
          rose: "bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600",
          blue: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
        }[plan.color as 'violet' | 'emerald' | 'amber' | 'rose' | 'blue'];

        return (
          <Card 
            key={plan.id} 
            className={cn(
              "relative flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden border-2",
              plan.popular ? "border-violet-600 shadow-violet-100 shadow-lg" : "border-zinc-100"
            )}
          >
            {(plan.popular || plan.badge) && (
              <div className="absolute top-0 right-0">
                <div className={cn(
                  "text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider",
                  plan.badgeColor || "bg-violet-600"
                )}>
                  {plan.badge || "Recommended"}
                </div>
              </div>
            )}
            <CardHeader className="pb-4">
              <div className={cn("size-12 rounded-xl flex items-center justify-center mb-4", colorStyles)}>
                {plan.icon}
              </div>
              <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-2 h-10 mt-1">{plan.description}</p>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">₹{plan.price.toLocaleString()}</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Resource Limits
                </div>
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="size-3.5 text-zinc-400" />
                    <span>{plan.limits.students.toLocaleString()} Students</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <UserPlus className="size-3.5 text-zinc-400" />
                    <span>{plan.limits.teachers} Teachers</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <School className="size-3.5 text-zinc-400" />
                    <span>{plan.limits.classes} Classes</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                {plan.features.map((feature, i) => {
                  const text = typeof feature === 'string' ? feature : feature.text;
                  const included = typeof feature === 'string' ? true : feature.included;
                  
                  if (!included) return null;

                  return (
                    <div key={text} className="flex items-start gap-2 text-sm">
                      <div className="mt-1 size-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Check className="size-2.5 text-emerald-600" />
                      </div>
                      <span className="text-zinc-600 dark:text-zinc-300">{text}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="pt-6">
              <Button 
                className={cn("w-full font-bold h-11", isCurrent ? "bg-zinc-100 text-zinc-500 hover:bg-zinc-100" : buttonStyles)}
                disabled={isCurrent || isLoading}
                onClick={() => onSelectPlan(plan)}
              >
                {isCurrent ? "Current Plan" : "Choose " + plan.name}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
export type { SchoolPlan };
