"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School, Users, ArrowRight } from "lucide-react";

interface MyClassesOverviewProps {
  classes: any[];
  onViewAll: () => void;
}

export function MyClassesOverview({ classes, onViewAll }: MyClassesOverviewProps) {
  return (
    <Card className="rounded-xl shadow-sm border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <School className="size-4 text-blue-500" />
            My Classes
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-500 dark:text-blue-400 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20"
            onClick={onViewAll}
          >
            View All <ArrowRight className="size-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map((cls) => (
            <button
              key={cls.id}
              type="button"
              className="w-full text-left bg-transparent p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all cursor-pointer"
              onClick={onViewAll}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onViewAll();
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <School className="size-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {cls.name}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Section {cls.section}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  <Users className="size-3 inline mr-1" />
                  {cls.studentCount} Students
                </span>
                <ArrowRight className="size-3.5 text-zinc-300 dark:text-zinc-600" />
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
