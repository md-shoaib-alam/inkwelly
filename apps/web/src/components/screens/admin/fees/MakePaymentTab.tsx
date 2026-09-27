"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { toast } from "sonner";
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useCreateFeeReceipt, useFeeConcessions } from '@/hooks/use-fees';
import type { StudentOption, ClassOption, FeeItem } from './types';

// Sub-components
import { StudentSelector } from './payment/StudentSelector';
import { PendingFeesChecklist } from './payment/PendingFeesChecklist';
import { PaymentSummary } from './payment/PaymentSummary';
import { SuccessDialog } from './payment/SuccessDialog';
import { AddManualFeeDialog } from './payment/AddManualFeeDialog';
import { PaymentSummaryCards } from './PaymentSummaryCards';

interface MakePaymentTabProps {
  canCreate: boolean;
}

export function MakePaymentTab({ canCreate }: MakePaymentTabProps) {
  const createReceipt = useCreateFeeReceipt();

  const [classFilter, setClassFilter] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [pendingFees, setPendingFees] = useState<FeeItem[]>([]);
  const { data: concessions = [] } = useFeeConcessions(selectedStudent?.id);
  const [selectedFeeIds, setSelectedFeeIds] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loadingFees, setLoadingFees] = useState(false);
  const [paying, setPaying] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [customPaidAmount, setCustomPaidAmount] = useState<number | null>(null);
  const [manualPayOpen, setManualPayOpen] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);

  const { data: students = [] } = useQuery<StudentOption[]>({
    queryKey: ['students', classFilter],
    enabled: !!classFilter,
    queryFn: async () => {
      const res = await apiFetch(`/api/students?mode=min&classId=${classFilter}`);
      const data = await res.json();
      const items = data.items || [];
      return items.map((s: any) => ({ 
        id: s.id, 
        name: s.name, 
        className: s.className, 
        classId: s.classId, 
        rollNumber: s.rollNumber, 
        phone: s.phone || '' 
      }));
    }
  });

  const { data: classes = [] } = useQuery<ClassOption[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await apiFetch('/api/classes?mode=min');
      return res.json();
    }
  });

  const filteredStudents = useMemo(() => {
    if (!classFilter) return [];
    let result = students;
    if (!studentSearch) return result.slice(0, 20);
    const q = studentSearch.toLowerCase();
    return result.filter(s => s.name.toLowerCase().includes(q) || (s.phone && s.phone.toLowerCase().includes(q)));
  }, [students, studentSearch, classFilter]);

  const [siblings, setSiblings] = useState<{ id: string; name: string; className: string }[]>([]);

  const handleSelectSibling = async (siblingId: string) => {
    setLoadingFees(true);
    try {
      const res = await apiFetch(`/api/students/${siblingId}`);
      if (res.ok) {
        const fullSib = await res.json();
        const sibOption: StudentOption = {
          id: fullSib.id,
          name: fullSib.name,
          className: fullSib.className,
          classId: fullSib.classId,
          rollNumber: fullSib.rollNumber,
          phone: fullSib.phone || '',
        };
        await handleSelectStudent(sibOption);
      } else {
        toast.error("Failed to load sibling profile");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to switch to sibling");
    }
  };

  const handleSelectStudent = async (student: StudentOption) => {
    setSelectedStudent(student);
    setSelectedFeeIds(new Set());
    setReceiptNumber('');
    setShowSuccess(false);
    setLoadingFees(true);
    setCustomPaidAmount(null);
    setSiblings([]);
    try {
      apiFetch(`/api/students/${student.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.siblings) {
            setSiblings(data.siblings);
          }
        })
        .catch(err => console.error("Error loading siblings:", err));

      const feesRes = await apiFetch(`/api/fees?studentId=${student.id}&status=pending,overdue,partially_paid`);
      if (feesRes.ok) {
        const data = await feesRes.json();
        setPendingFees(data.items || []);
      }
    } catch { console.error('Error fetching fees'); }
    setLoadingFees(false);
  };

  const toggleFee = (id: string) => {
    setSelectedFeeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedFeeIds.size === pendingFees.length) {
      setSelectedFeeIds(new Set());
    } else {
      setSelectedFeeIds(new Set(pendingFees.map(f => f.id)));
    }
  };

  const selectedFees = useMemo(() => pendingFees.filter(f => selectedFeeIds.has(f.id)), [pendingFees, selectedFeeIds]);

  const calculation = useMemo(() => {
    const totalAmount = selectedFees.reduce((s, f) => s + f.amount, 0);
    const concessionTotal = selectedFees.reduce((s, f) => s + f.concession, 0);
    const alreadyPaid = selectedFees.reduce((s, f) => s + (f.paidAmount || 0), 0);
    const payable = Math.max(0, totalAmount - concessionTotal - alreadyPaid);
    return { totalAmount, concessionTotal, payable, alreadyPaid };
  }, [selectedFees]);

  const handlePay = async () => {
    if (selectedFeeIds.size === 0) { toast.error('Select at least one fee to pay'); return; }
    if (!selectedStudent) return;
    
    const finalPaidAmount = customPaidAmount !== null ? customPaidAmount : calculation.payable;
    if (finalPaidAmount <= 0) { toast.error('Amount must be greater than zero'); return; }

    setPaying(true);
    try {
      const feeAmounts: Record<string, number> = {};
      // For the API, we just send how much the total PAID was. 
      // The backend will distribute it.
      const data = await createReceipt.mutateAsync({
        studentId: selectedStudent.id,
        feeIds: Array.from(selectedFeeIds),
        totalAmount: calculation.totalAmount,
        paidAmount: finalPaidAmount,
        concessionTotal: calculation.concessionTotal,
        paymentMethod,
      });
      
      setReceiptNumber(data.receiptNumber);
      setSuccessAmount(finalPaidAmount);
      setShowSuccess(true);
      setCustomPaidAmount(null);
      
      // Refresh fees manually
      const feesRes = await apiFetch(`/api/fees?studentId=${selectedStudent.id}&status=pending,overdue,partially_paid`);
      if (feesRes.ok) {
        const data = await feesRes.json();
        setPendingFees(data.items || []);
      }
      setSelectedFeeIds(new Set());
    } catch { /* handled by mutation */ }
    setPaying(false);
  };

  if (!canCreate) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <CreditCard className="size-10 mx-auto mb-2 opacity-30" /><p>You do not have permission to make payments.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PaymentSummaryCards />
      <SuccessDialog 
        open={showSuccess}
        onOpenChange={setShowSuccess}
        receiptNumber={receiptNumber}
        amount={successAmount}
      />

      {!selectedStudent ? (
        <StudentSelector 
          classFilter={classFilter}
          setClassFilter={setClassFilter}
          studentSearch={studentSearch}
          setStudentSearch={setStudentSearch}
          classes={classes}
          filteredStudents={filteredStudents}
          onSelectStudent={handleSelectStudent}
        />
      ) : (
        <div className="space-y-4">
          <PendingFeesChecklist 
            selectedStudent={selectedStudent}
            onChangeStudent={() => { setSelectedStudent(null); setPendingFees([]); setSelectedFeeIds(new Set<string>()); setSiblings([]); }}
            concessions={concessions}
            pendingFees={pendingFees}
            loadingFees={loadingFees}
            selectedFeeIds={selectedFeeIds}
            onToggleFee={toggleFee}
            onToggleAll={toggleAll}
            onOpenManualPayment={() => setManualPayOpen(true)}
            siblings={siblings}
            onSelectSibling={handleSelectSibling}
          />

          {selectedFeeIds.size > 0 && (
            <PaymentSummary 
              totalAmount={calculation.totalAmount}
              concessionTotal={calculation.concessionTotal}
              payable={calculation.payable}
              alreadyPaid={calculation.alreadyPaid}
              paidAmount={customPaidAmount}
              onPaidAmountChange={setCustomPaidAmount}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              onPay={handlePay}
              paying={paying}
            />
          )}
          {selectedStudent && (
            <AddManualFeeDialog 
              open={manualPayOpen}
              onOpenChange={setManualPayOpen}
              student={selectedStudent}
              onSuccess={() => handleSelectStudent(selectedStudent)}
            />
          )}
        </div>
      )}
    </div>
  );
}
