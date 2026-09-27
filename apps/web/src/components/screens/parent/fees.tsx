import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useAppStore } from "@/store/use-app-store";
import { useQueryClient } from "@tanstack/react-query";
import { useParentDashboard } from "@/lib/graphql/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import type { StudentInfo, FeeRecord } from "@/lib/types";

// Sub-components
import { FeeSummary } from "./fees/FeeSummary";
import { FeeTable } from "./fees/FeeTable";
import { FeesSkeleton } from "./fees/FeesSkeleton";
import { ChildSelector } from "./ChildSelector";

export function ParentFees() {
  const queryClient = useQueryClient();
  const { currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState("");
  const [allChildrenFees, setAllChildrenFees] = useState<FeeRecord[]>([]);

  const { data, isPending } = useParentDashboard(currentUser?.name || "");
  const students = (data?.children || []) as unknown as StudentInfo[];
  const isPremium = data?.subscriptionPlan?.toLowerCase().includes('premium');

  // Persistence logic
  useEffect(() => {
    if (students.length > 0) {
      const savedTab = document.cookie
        .split("; ")
        .find((row) => row.startsWith("lastSelectedStudent="))
        ?.split("=")[1];
      
      if (savedTab && students.some(s => s.id === savedTab)) {
        setActiveTab(savedTab);
      } else if (!activeTab) {
        setActiveTab(students[0].id);
      }
    }
  }, [students, activeTab]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    document.cookie = `lastSelectedStudent=${val}; path=/; max-age=31536000`;
  };

  useEffect(() => {
    async function fetchFees() {
      if (students.length === 0) return;
      try {
        const studentIds = students.map((s: StudentInfo) => s.id);
        const promises = studentIds.map((id) => apiFetch(`/api/fees?studentId=${id}`));
        const responses = await Promise.all(promises);
        const results = await Promise.all(responses.map(async (r) => {
          if (!r.ok) return [];
          const data = await r.json();
          return Array.isArray(data) ? data : (data.items || []);
        }));
        setAllChildrenFees(results.flat() as FeeRecord[]);
      } catch (e) {
        console.error("Failed to fetch data:", e);
      }
    }
    fetchFees();
  }, [students.length]);

  const summary = useMemo(() => {
    const total = allChildrenFees.reduce((sum, f) => sum + f.amount, 0);
    const paid = allChildrenFees
      .filter((f) => f.status === "paid")
      .reduce((sum, f) => sum + f.paidAmount, 0);
    const pending = allChildrenFees
      .filter((f) => f.status === "pending")
      .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
    const overdue = allChildrenFees
      .filter((f) => f.status === "overdue")
      .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
    return { total, paid, pending, overdue };
  }, [allChildrenFees]);

  const handlePayNow = async (feeId: string) => {
    const fee = allChildrenFees.find(f => f.id === feeId);
    if (!fee) return;

    try {
      const paymentPromise = (async () => {
        const res = await apiFetch("/api/fee-receipts", {
          method: "POST",
          body: JSON.stringify({
            studentId: fee.studentId,
            feeIds: [fee.id],
            totalAmount: fee.amount,
            paidAmount: fee.amount,
            concessionTotal: 0,
            paymentMethod: "online",
            feeAmounts: { [fee.id]: fee.amount }
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Payment failed");
        }

        queryClient.invalidateQueries({ queryKey: ["parent", "dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["fees"] });

        setAllChildrenFees((prev) =>
          prev.map((f) => (f.id === feeId ? { ...f, status: "paid", paidAmount: f.amount } : f))
        );
      })();

      toast.promise(paymentPromise, {
        loading: "Processing payment...",
        success: "Payment successful!",
        error: (err: any) => `Error: ${err.message}`,
      });
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  if (isPending) return <FeesSkeleton />;

  if (students.length === 0) {
    return (
      <Card className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 shadow-sm">
        <CardContent className="p-16 text-center">
          <CreditCard className="size-12 mx-auto text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-4">
            No children found
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            No students are linked to your account.
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedStudent = students.find((s) => s.id === activeTab) || students[0];
  const studentFees = allChildrenFees.filter(f => f.studentId === selectedStudent?.id);

  return (
    <div className="space-y-6 pb-10 animate-fade-in select-none">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-5">
        <div className="space-y-3.5 text-left">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
              Fee Management
            </h2>
          </div>
          {/* Children switcher */}
          <ChildSelector 
            students={students} 
            selectedStudentId={selectedStudent.id} 
            onSelect={handleTabChange} 
          />
        </div>
      </div>

      <FeeSummary 
        total={summary.total}
        paid={summary.paid}
        pending={summary.pending}
        overdue={summary.overdue}
      />

      {selectedStudent && (
        <div className="mt-6 animate-in fade-in duration-300">
          <FeeTable 
            studentName={selectedStudent.name}
            fees={studentFees}
            onPay={handlePayNow}
            isPremium={isPremium}
          />
        </div>
      )}
    </div>
  );
}
