"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Percent, CheckCircle2, Users } from "lucide-react";
import type { StudentOption, FeeItem, FeeConcession } from "../types";

interface PendingFeesChecklistProps {
  selectedStudent: StudentOption;
  onChangeStudent: () => void;
  concessions: FeeConcession[];
  pendingFees: FeeItem[];
  loadingFees: boolean;
  selectedFeeIds: Set<string>;
  onToggleFee: (id: string) => void;
  onToggleAll: () => void;
  onOpenManualPayment: () => void;
  siblings?: { id: string; name: string; className: string }[];
  onSelectSibling?: (siblingId: string) => void;
}

export function PendingFeesChecklist({
  selectedStudent,
  onChangeStudent,
  concessions,
  pendingFees,
  loadingFees,
  selectedFeeIds,
  onToggleFee,
  onToggleAll,
  onOpenManualPayment,
  siblings = [],
  onSelectSibling,
}: PendingFeesChecklistProps) {
  return (
    <div className="space-y-4">
      {/* Student Header */}
      <Card className="hover:shadow-md transition-shadow border-emerald-500/10 dark:border-emerald-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-lg font-bold shrink-0 shadow-sm">
              {selectedStudent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-base">{selectedStudent.name}</p>
              <p className="text-sm text-muted-foreground">{selectedStudent.className} • Roll: {selectedStudent.rollNumber}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onChangeStudent} className="hover:bg-accent border-muted-foreground/20">
              Change
            </Button>
          </div>

          {siblings.length > 0 && (
            <div className="mt-3 pt-3 border-t border-dashed border-secondary/80 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 shrink-0 select-none">
                <Users className="size-3.5 text-emerald-600" />
                Siblings:
              </span>
              <div className="flex flex-wrap gap-2">
                {siblings.map(sib => (
                  <button
                    key={sib.id}
                    type="button"
                    onClick={() => onSelectSibling?.(sib.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50/50 hover:bg-emerald-100/80 text-emerald-700 hover:text-emerald-800 border border-emerald-200/50 hover:border-emerald-300 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/40 transition-all cursor-pointer shadow-sm select-none"
                  >
                    <span>{sib.name}</span>
                    <span className="text-[10px] opacity-70 bg-emerald-100/50 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-md font-normal">{sib.className}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Concessions Info */}
      {concessions.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Percent className="size-4" />Active Concessions
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-1">
              {concessions.map(c => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs">{c.concessionType.replace('_', ' ')}</Badge>
                  <span>{c.concessionType === 'percentage' ? `${c.amount}%` : `₹${c.amount}`}</span>
                  {c.reason && <span className="text-muted-foreground">({c.reason})</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Fees */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Pending Fees</CardTitle>
              <CardDescription>{pendingFees.length} pending fee(s)</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                onClick={onOpenManualPayment}
              >
                Add Fee
              </Button>
              {pendingFees.length > 0 && (
                <Button variant="outline" size="sm" onClick={onToggleAll}>
                  {selectedFeeIds.size === pendingFees.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingFees ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : pendingFees.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <CheckCircle2 className="size-10 mx-auto mb-2 text-emerald-500 opacity-50" />
              <p className="mb-4">All fees paid! No pending fees.</p>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-600/10"
                onClick={onOpenManualPayment}
              >
                Record Manual Payment
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {pendingFees.map(fee => (
                <div 
                  key={fee.id} 
                  role="button"
                  className="w-full flex items-center gap-3 p-3 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer text-left" 
                  onClick={() => onToggleFee(fee.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onToggleFee(fee.id);
                    }
                  }}
                >
                  <Checkbox checked={selectedFeeIds.has(fee.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{fee.feeCategoryName || fee.type}</p>
                    <p className="text-xs text-muted-foreground">Due: {fee.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">₹{fee.amount.toLocaleString()}</p>
                    {fee.concession > 0 && <p className="text-xs text-amber-600">-₹{fee.concession.toLocaleString()} concession</p>}
                    {fee.paidAmount > 0 && <p className="text-xs text-blue-600">-₹{fee.paidAmount.toLocaleString()} previously paid</p>}
                    {(fee.paidAmount > 0 || fee.concession > 0) && (
                      <p className="text-xs font-bold text-emerald-600 border-t mt-1 pt-1">Bal: ₹{(fee.amount - fee.concession - fee.paidAmount).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
