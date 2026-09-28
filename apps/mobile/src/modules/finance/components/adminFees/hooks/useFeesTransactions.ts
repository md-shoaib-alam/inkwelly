import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { api } from '@/lib/api';
import { FeeCategory, StudentOption } from '../types';

interface UseFeesTransactionsProps {
  categories: FeeCategory[];
  canCreateFees: boolean;
  canEditFees: boolean;
  canDeleteFees: boolean;
  loadStatusData: (showLoader?: boolean) => Promise<void>;
  loadTabData: (tab: any) => Promise<void>;
  invalidateTab: (tab: any) => void;
  showCustomAlert: (
    title: string,
    message: string,
    type?: 'success' | 'error' | 'warning' | 'info' | 'confirm',
    onConfirm?: () => void,
    confirmText?: string,
    cancelText?: string
  ) => void;
}

export function useFeesTransactions({
  categories,
  canCreateFees,
  canEditFees,
  canDeleteFees,
  loadStatusData,
  loadTabData,
  invalidateTab,
  showCustomAlert
}: UseFeesTransactionsProps) {
  // Collect Fee / Make Payment States
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
  const [collectClassId, setCollectClassId] = useState('');
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [selectedFeeIds, setSelectedFeeIds] = useState<Record<string, boolean>>({});
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [payAmount, setPayAmount] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Stats, Sibling, and Concession States
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [siblings, setSiblings] = useState<any[]>([]);
  const [studentConcessions, setStudentConcessions] = useState<any[]>([]);
  const [loadingStudentDetails, setLoadingStudentDetails] = useState(false);

  // Complete Student Status (for Fee Status tab)
  // allFeesRef kept in sync WITHOUT a useEffect to avoid an extra render cycle.
  // We assign directly whenever setAllFees is called.
  const [allFees, setAllFees] = useState<any[]>([]);
  const allFeesRef = useRef<any[]>([]);
  const [studentReceipts, setStudentReceipts] = useState<any[]>([]);

  // Success Dialog States
  const [successVisible, setSuccessVisible] = useState(false);
  const [successReceiptNumber, setSuccessReceiptNumber] = useState('');
  const [successPaidAmount, setSuccessPaidAmount] = useState(0);

  // Add Manual Fee States
  const [addManualFeeVisible, setAddManualFeeVisible] = useState(false);
  const [manualCategory, setManualCategory] = useState('custom');
  const [manualCustomType, setManualCustomType] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualDueDate, setManualDueDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [manualRemarks, setManualRemarks] = useState('');
  const [manualMarkPaid, setManualMarkPaid] = useState(true);
  const [manualPaymentMethod, setManualPaymentMethod] = useState('cash');
  const [submittingManualFee, setSubmittingManualFee] = useState(false);
  const [dueDatePickerVisible, setDueDatePickerVisible] = useState(false);

  // Add Concession States
  const [concessionStudentId, setConcessionStudentId] = useState('');
  const [concessionCategoryId, setConcessionCategoryId] = useState(''); // Empty means All
  const [concessionType, setConcessionType] = useState('percentage');
  const [concessionAmount, setConcessionAmount] = useState('');
  const [concessionReason, setConcessionReason] = useState('');
  const [concessionDialogVisible, setConcessionDialogVisible] = useState(false);

  // Fee Category States
  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [categoryFreq, setCategoryFreq] = useState('monthly');
  const [categoryDialogVisible, setCategoryDialogVisible] = useState(false);

  // Details Modal
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [receiptDetailVisible, setReceiptDetailVisible] = useState(false);

  // Guard: only load monthly stats once unless refresh is requested
  const monthlyStatsLoadedRef = useRef(false);

  /**
   * Per-tab student cache:
   * - lastCollectStudentRef: which student's pending fees are currently loaded in Collect tab
   * - lastStatusStudentRef:  which student's complete status is loaded in Fee Status tab
   *
   * When the user slides between these two tabs with the same student selected,
   * we skip the re-fetch entirely. Cache is cleared after payment (so status
   * reflects the new receipt) or when the user explicitly changes student.
   */
  const lastCollectStudentRef = useRef<string | null>(null);
  const lastStatusStudentRef = useRef<string | null>(null);

  /** Call after student changes to force both tabs to re-fetch. */
  const invalidateStudentCache = useCallback(() => {
    lastCollectStudentRef.current = null;
    lastStatusStudentRef.current = null;
  }, []);

  const loadMonthlyStats = useCallback(async (refresh = false) => {
    if (!refresh && monthlyStatsLoadedRef.current) return;
    try {
      setLoadingStats(true);
      const d = new Date();
      d.setDate(1);
      const fromDate = d.toISOString().split('T')[0];
      const refreshParam = refresh ? '&refresh=true' : '';
      const res = await api.get<any>(`/fee-receipts?mode=stats&fromDate=${fromDate}${refreshParam}`);
      if (res) {
        setMonthlyStats(res);
        monthlyStatsLoadedRef.current = true;
      }
    } catch (error) {
      console.error('Failed to load monthly stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchStudentPendingFees = useCallback(async (sid: string, refresh = false, showSkeleton = true) => {
    if (!sid) return;
    // Skip if this student's pending fees are already loaded for the collect tab
    if (!refresh && lastCollectStudentRef.current === sid) return;

    // Optimize: If student complete status was already loaded in the fee-status tab, reuse it in-memory
    if (!refresh && lastStatusStudentRef.current === sid) {
      const pending = allFeesRef.current.filter((f: any) => f.status === 'pending' || f.status === 'overdue' || f.status === 'partially_paid');
      setStudentFees(pending);
      
      const selection: Record<string, boolean> = {};
      pending.forEach((f: any) => {
        selection[f.id] = true;
      });
      setSelectedFeeIds(selection);
      
      lastCollectStudentRef.current = sid;
      return;
    }

    if (showSkeleton) {
      setLoadingStudentDetails(true);
      setStudentFees([]);
      setSiblings([]);
      setStudentConcessions([]);
    }
    try {
      // Fire all 3 requests in parallel — ~3x faster than sequential awaits
      const [res, studentRes, concessionsRes] = await Promise.all([
        api.get<any>('/fees', { params: { studentId: sid, status: 'pending,overdue,partially_paid', refresh: refresh ? 'true' : undefined } }),
        api.get<any>(`/students/${sid}${refresh ? '?refresh=true' : ''}`),
        api.get<any>('/fee-concessions', { params: { studentId: sid, status: 'active', refresh: refresh ? 'true' : undefined } }),
      ]);

      if (res && Array.isArray(res.items)) {
        setStudentFees(res.items);
        const selection: Record<string, boolean> = {};
        res.items.forEach((f: any) => {
          selection[f.id] = true;
        });
        setSelectedFeeIds(selection);
      }

      if (studentRes) {
        setSelectedStudent(studentRes);
        setSiblings(Array.isArray(studentRes.siblings) ? studentRes.siblings : []);
      }

      setStudentConcessions(Array.isArray(concessionsRes) ? concessionsRes : []);
      // Mark this student as loaded for the collect tab
      lastCollectStudentRef.current = sid;
    } catch (error) {
      console.error('Failed to fetch student details and pending fees:', error);
    } finally {
      if (showSkeleton) setLoadingStudentDetails(false);
    }
  }, []);

  const fetchStudentCompleteStatus = useCallback(async (sid: string, refresh = false, showSkeleton = true) => {
    if (!sid) return;
    // Skip if this student's complete status is already loaded for the fee-status tab
    if (!refresh && lastStatusStudentRef.current === sid) return;
    if (showSkeleton) {
      setLoadingStudentDetails(true);
      allFeesRef.current = [];
      setAllFees([]);
      setStudentReceipts([]);
      setSiblings([]);
      setStudentConcessions([]);
    }
    try {
      const refreshParam = refresh ? 'true' : undefined;
      // Fire all 4 requests in parallel — ~4x faster than sequential awaits
      const [feesRes, receiptsRes, studentRes, concessionsRes] = await Promise.all([
        api.get<any>('/fees', { params: { studentId: sid, limit: 100, refresh: refreshParam } }),
        api.get<any>('/fee-receipts', { params: { studentId: sid, limit: 100, refresh: refreshParam } }),
        api.get<any>(`/students/${sid}${refresh ? '?refresh=true' : ''}`),
        api.get<any>('/fee-concessions', { params: { studentId: sid, status: 'active', refresh: refreshParam } }),
      ]);

      if (feesRes && Array.isArray(feesRes.items)) {
        allFeesRef.current = feesRes.items;  // keep ref in-sync without extra render
        setAllFees(feesRes.items);
      }
      if (receiptsRes && Array.isArray(receiptsRes.items)) setStudentReceipts(receiptsRes.items);

      if (studentRes) {
        setSelectedStudent(studentRes);
        setSiblings(Array.isArray(studentRes.siblings) ? studentRes.siblings : []);
      }

      setStudentConcessions(Array.isArray(concessionsRes) ? concessionsRes : []);
      // Mark this student as loaded for the fee-status tab
      lastStatusStudentRef.current = sid;
    } catch (error) {
      console.error('Failed to fetch complete student fee status:', error);
    } finally {
      if (showSkeleton) setLoadingStudentDetails(false);
    }
  }, []);

  // Derived: auto-fill payAmount from selected fees.
  // useMemo + one setState is cleaner than useEffect + setState (avoids an extra render / flush).
  const derivedPayAmount = useMemo(() => {
    const total = studentFees
      .filter(f => selectedFeeIds[f.id])
      .reduce((sum, f) => sum + (f.amount - (f.concession || 0) - (f.paidAmount || 0)), 0);
    return total > 0 ? String(total) : '';
  }, [selectedFeeIds, studentFees]);

  useEffect(() => {
    setPayAmount(derivedPayAmount);
  }, [derivedPayAmount]);

  const handleAddManualFee = useCallback(async () => {
    const amountNum = Number(manualAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showCustomAlert('Error', 'Please enter a valid amount.', 'error');
      return;
    }

    let feeType = manualCustomType.trim();
    if (manualCategory !== 'custom') {
      const matched = categories.find(c => c.id === manualCategory);
      feeType = matched ? matched.name : 'School Fee';
    }

    if (!feeType) {
      showCustomAlert('Error', 'Please enter a fee description.', 'error');
      return;
    }

    setSubmittingManualFee(true);
    try {
      const feeRes = await api.post<any>('/fees', {
        studentId: selectedStudentId,
        feeCategoryId: manualCategory === 'custom' ? null : manualCategory,
        amount: amountNum,
        type: feeType,
        dueDate: manualDueDate,
        remarks: manualRemarks.trim() || 'Manual payment entry',
      });

      if (!feeRes || !feeRes.id) {
        throw new Error('Failed to create fee record');
      }

      if (manualMarkPaid) {
        const receiptRes = await api.post<any>('/fee-receipts', {
          studentId: selectedStudentId,
          feeIds: [feeRes.id],
          totalAmount: amountNum,
          paidAmount: amountNum,
          concessionTotal: 0,
          paymentMethod: manualPaymentMethod,
        });
        setSuccessReceiptNumber(receiptRes?.receiptNumber || 'REC-MANUAL');
        setSuccessPaidAmount(amountNum);
        setSuccessVisible(true);
      } else {
        showCustomAlert('Success', 'Pending fee entry created successfully!', 'success');
      }

      setAddManualFeeVisible(false);
      setManualCategory('custom');
      setManualCustomType('');
      setManualAmount('');
      setManualRemarks('');
      setManualMarkPaid(true);
      setManualPaymentMethod('cash');

      await fetchStudentPendingFees(selectedStudentId, true, false);
      loadStatusData(false);
      loadMonthlyStats();
    } catch (err: any) {
      showCustomAlert('Error', err?.message || err?.error || 'Failed to add manual fee.', 'error');
    } finally {
      setSubmittingManualFee(false);
    }
  }, [
    manualAmount,
    manualCustomType,
    manualCategory,
    categories,
    selectedStudentId,
    manualDueDate,
    manualRemarks,
    manualMarkPaid,
    manualPaymentMethod,
    fetchStudentPendingFees,
    loadStatusData,
    loadMonthlyStats,
    showCustomAlert
  ]);

  const calculatePayableTotal = useCallback(() => {
    return studentFees
      .filter(f => selectedFeeIds[f.id])
      .reduce((sum, f) => sum + (f.amount - (f.concession || 0) - (f.paidAmount || 0)), 0);
  }, [studentFees, selectedFeeIds]);

  const handleMakePayment = useCallback(async () => {
    if (!canCreateFees && !canEditFees) {
      showCustomAlert('Permission Denied', 'You do not have permission to collect fees.', 'error');
      return;
    }
    const feeIds = Object.keys(selectedFeeIds).filter(id => selectedFeeIds[id]);
    if (!selectedStudentId) { showCustomAlert('Error', 'Please select a student.', 'error'); return; }
    if (feeIds.length === 0) { showCustomAlert('Error', 'Please select at least one fee item to pay.', 'error'); return; }
    if (!payAmount || Number(payAmount) <= 0) { showCustomAlert('Error', 'Please enter a valid amount.', 'error'); return; }

    const payableTotal = calculatePayableTotal();
    if (Number(payAmount) > payableTotal) {
      showCustomAlert('Validation Alert', `Entering ₹${payAmount} exceeds the remaining balance of ₹${payableTotal}. Please enter up to ₹${payableTotal}.`, 'warning');
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await api.post<any>('/fee-receipts', {
        studentId: selectedStudentId,
        feeIds,
        paidAmount: Number(payAmount),
        paymentMethod,
      });
      setSuccessReceiptNumber(res?.receiptNumber || 'REC-GENERATED');
      setSuccessPaidAmount(Number(payAmount));
      setSuccessVisible(true);
      
      setPayAmount('');
      setSelectedFeeIds({});
      // Force re-fetch pending fees for collect tab (payment changed fee state)
      lastCollectStudentRef.current = null;
      await fetchStudentPendingFees(selectedStudentId, true, false);
      // Invalidate fee-status cache so sliding to it shows the new receipt
      lastStatusStudentRef.current = null;
      await loadMonthlyStats(true);
      loadStatusData(false);
    } catch (e: any) {
      console.error('Payment failed:', e);
      showCustomAlert('Error', e?.message || e?.error || 'Payment failed or duplicate submission.', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  }, [
    canCreateFees,
    canEditFees,
    selectedFeeIds,
    selectedStudentId,
    payAmount,
    calculatePayableTotal,
    paymentMethod,
    fetchStudentPendingFees,
    loadMonthlyStats,
    loadStatusData,
    showCustomAlert
  ]);

  const resetConcessionForm = useCallback(() => {
    setConcessionStudentId('');
    setConcessionCategoryId('');
    setConcessionType('percentage');
    setConcessionAmount('');
    setConcessionReason('');
  }, []);

  const resetCategoryForm = useCallback(() => {
    setCategoryName('');
    setCategoryCode('');
    setCategoryDesc('');
    setCategoryFreq('monthly');
  }, []);

  const handleAddConcession = useCallback(async () => {
    if (!canCreateFees) {
      showCustomAlert('Permission Denied', 'You do not have permission to apply concessions.', 'error');
      return;
    }
    if (!concessionStudentId || !concessionAmount || !concessionReason.trim()) {
      showCustomAlert('Validation Error', 'Student, amount, and reason are required.', 'warning');
      return;
    }
    try {
      await api.post('/fee-concessions', {
        studentId: concessionStudentId,
        feeCategoryId: concessionCategoryId || null,
        concessionType,
        amount: Number(concessionAmount),
        reason: concessionReason.trim(),
        status: 'active',
      });
      setConcessionDialogVisible(false);
      resetConcessionForm();
      invalidateTab('concessions'); // bust cache so next load fetches fresh
      loadTabData('concessions');
      showCustomAlert('Success', 'Fee concession created and applied successfully!', 'success');
    } catch (e) {
      showCustomAlert('Error', 'Failed to add concession.', 'error');
    }
  }, [
    canCreateFees,
    concessionStudentId,
    concessionAmount,
    concessionReason,
    concessionCategoryId,
    concessionType,
    resetConcessionForm,
    loadTabData,
    showCustomAlert
  ]);

  const handleAddCategory = useCallback(async () => {
    if (!canCreateFees) {
      showCustomAlert('Permission Denied', 'You do not have permission to create fee categories.', 'error');
      return;
    }
    if (!categoryName.trim() || !categoryCode.trim()) {
      showCustomAlert('Validation Error', 'Category Name and Unique Code are required.', 'warning');
      return;
    }
    try {
      await api.post('/fee-categories', {
        name: categoryName.trim(),
        code: categoryCode.trim().toUpperCase(),
        description: categoryDesc.trim(),
        frequency: categoryFreq,
      });
      setCategoryDialogVisible(false);
      resetCategoryForm();
      invalidateTab('categories'); // bust cache so next load fetches fresh
      loadTabData('categories');
      showCustomAlert('Success', 'Fee category created successfully!', 'success');
    } catch (e) {
      showCustomAlert('Error', 'Failed to create fee category.', 'error');
    }
  }, [canCreateFees, categoryName, categoryCode, categoryDesc, categoryFreq, resetCategoryForm, loadTabData, showCustomAlert]);

  const handleDeleteConcession = useCallback((id: string) => {
    if (!canDeleteFees) {
      showCustomAlert('Permission Denied', 'You do not have permission to delete student concessions.', 'error');
      return;
    }
    showCustomAlert(
      'Confirm Delete',
      'Are you sure you want to remove this fee concession from the student?',
      'confirm',
      async () => {
        try {
          await api.delete(`/fee-concessions?id=${id}`);
          invalidateTab('concessions'); // bust cache
          loadTabData('concessions');
        } catch (e) {
          showCustomAlert('Error', 'Failed to remove concession.', 'error');
        }
      },
      'Remove'
    );
  // BUG FIX: invalidateTab was missing from the dependency array
  }, [canDeleteFees, invalidateTab, loadTabData, showCustomAlert]);

  return {
    selectedStudentId,
    setSelectedStudentId,
    selectedStudent,
    setSelectedStudent,
    collectClassId,
    setCollectClassId,
    studentFees,
    setStudentFees,
    selectedFeeIds,
    setSelectedFeeIds,
    paymentMethod,
    setPaymentMethod,
    payAmount,
    setPayAmount,
    submittingPayment,
    monthlyStats,
    loadingStats,
    siblings,
    setSiblings,
    studentConcessions,
    setStudentConcessions,
    loadingStudentDetails,
    allFees,
    setAllFees,
    studentReceipts,
    setStudentReceipts,
    successVisible,
    setSuccessVisible,
    successReceiptNumber,
    successPaidAmount,
    addManualFeeVisible,
    setAddManualFeeVisible,
    manualCategory,
    setManualCategory,
    manualCustomType,
    setManualCustomType,
    manualAmount,
    setManualAmount,
    manualDueDate,
    setManualDueDate,
    manualRemarks,
    setManualRemarks,
    manualMarkPaid,
    setManualMarkPaid,
    manualPaymentMethod,
    setManualPaymentMethod,
    submittingManualFee,
    dueDatePickerVisible,
    setDueDatePickerVisible,
    concessionStudentId,
    setConcessionStudentId,
    concessionCategoryId,
    setConcessionCategoryId,
    concessionType,
    setConcessionType,
    concessionAmount,
    setConcessionAmount,
    concessionReason,
    setConcessionReason,
    concessionDialogVisible,
    setConcessionDialogVisible,
    categoryName,
    setCategoryName,
    categoryCode,
    setCategoryCode,
    categoryDesc,
    setCategoryDesc,
    categoryFreq,
    setCategoryFreq,
    categoryDialogVisible,
    setCategoryDialogVisible,
    selectedReceipt,
    setSelectedReceipt,
    receiptDetailVisible,
    setReceiptDetailVisible,
    loadMonthlyStats,
    fetchStudentPendingFees,
    fetchStudentCompleteStatus,
    handleAddManualFee,
    calculatePayableTotal,
    handleMakePayment,
    resetConcessionForm,
    resetCategoryForm,
    handleAddConcession,
    handleAddCategory,
    handleDeleteConcession
  };
}
