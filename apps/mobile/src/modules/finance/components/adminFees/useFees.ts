import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSettings } from '@/store/settings-context';
import { useAuth } from '@/store/auth-context';
import { hasPermission } from '@/lib/permissions';
import { Colors } from '@/constants/theme';

// Sub-hooks
import { useFeesNavigation } from './hooks/useFeesNavigation';
import { useFeesData } from './hooks/useFeesData';
import { useFeesTransactions } from './hooks/useFeesTransactions';
import { useFeesStructures } from './hooks/useFeesStructures';

export type TabType = 'status' | 'fee-status' | 'collect' | 'receipts' | 'concessions' | 'structures' | 'categories' | 'transport';

export function useFees() {
  const { activeTheme } = useSettings();
  const colors = Colors[activeTheme];
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const canViewFees = isAdmin || hasPermission(user, 'fees', 'view');
  const canCreateFees = isAdmin || hasPermission(user, 'fees', 'create');
  const canEditFees = isAdmin || hasPermission(user, 'fees', 'edit');
  const canDeleteFees = isAdmin || hasPermission(user, 'fees', 'delete');

  // Shared / Bridge State
  const [parentModalToRestore, setParentModalToRestore] = useState<'concession' | 'structure' | 'manual' | null>(null);

  // Simple Picker and Search states
  const [receiptSearch, setReceiptSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  // Debounced version of studentSearch — filteredStudents only recalculates 200ms after typing stops
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [studentPickerVisible, setStudentPickerVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [classPickerVisible, setClassPickerVisible] = useState(false);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [tenantPickerVisible, setTenantPickerVisible] = useState(false);

  const [selectedTenantId, setSelectedTenantId] = useState('');

  // Premium Custom Alert State
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showCustomAlert = useCallback((
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm' = 'info',
    onConfirm?: () => void,
    confirmText = 'OK',
    cancelText = 'Cancel'
  ) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      type,
      onConfirm,
      confirmText,
      cancelText
    });
  }, []);

  // Tabs List
  const tabs = useMemo(() => {
    return [
      { id: 'status', label: 'Summary', icon: 'analytics-outline' },
      { id: 'fee-status', label: 'Fee Status', icon: 'people-outline' },
      ...((isAdmin || canCreateFees || canEditFees) ? [
        { id: 'collect', label: 'Collect Fee', icon: 'card-outline' },
      ] : []),
      ...(canViewFees ? [
        { id: 'receipts', label: 'Receipts', icon: 'document-text-outline' },
        { id: 'concessions', label: 'Concessions', icon: 'gift-outline' },
        { id: 'structures', label: 'Set Fees', icon: 'business-outline' },
        { id: 'categories', label: 'Categories', icon: 'grid-outline' },
        { id: 'transport', label: 'Transport', icon: 'bus-outline' },
      ] : [])
    ] as { id: TabType; label: string; icon: string }[];
  }, [isAdmin, canCreateFees, canEditFees, canViewFees]);

  // Data fetching hook
  const dataHook = useFeesData();

  // Navigation & animation hook
  const navHook = useFeesNavigation({ tabs });

  // Structures & assign hook
  const structuresHook = useFeesStructures({
    canCreateFees,
    canEditFees,
    canDeleteFees,
    loadTabData: dataHook.loadTabData,
    invalidateTab: dataHook.invalidateTab,
    showCustomAlert
  });

  // Transactions, siblings, and concessions hook
  const txHook = useFeesTransactions({
    categories: dataHook.categories,
    canCreateFees,
    canEditFees,
    canDeleteFees,
    loadStatusData: dataHook.loadStatusData,
    loadTabData: dataHook.loadTabData,
    invalidateTab: dataHook.invalidateTab,
    showCustomAlert
  });

  // Fee Status Tab States
  const [feeStatusClassId, setFeeStatusClassId] = useState('');
  const [feeStatusSearchQuery, setFeeStatusSearchQuery] = useState('');
  const [debouncedFeeStatusSearchQuery, setDebouncedFeeStatusSearchQuery] = useState('');
  const feeStatusDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (feeStatusDebounceTimerRef.current) clearTimeout(feeStatusDebounceTimerRef.current);
    };
  }, []);

  const handleStudentSearchChange = useCallback((value: string) => {
    setStudentSearch(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedStudentSearch(value);
      dataHook.loadStudents(1, value, txHook.collectClassId, true);
    }, 200);
  }, [dataHook.loadStudents, txHook.collectClassId]);

  const handleFeeStatusSearchChange = useCallback((value: string) => {
    setFeeStatusSearchQuery(value);
    if (feeStatusDebounceTimerRef.current) clearTimeout(feeStatusDebounceTimerRef.current);
    feeStatusDebounceTimerRef.current = setTimeout(() => {
      setDebouncedFeeStatusSearchQuery(value);
      dataHook.loadStudents(1, value, feeStatusClassId, true);
    }, 200);
  }, [dataHook.loadStudents, feeStatusClassId]);

  const handleFeeStatusClassChange = useCallback((classId: string) => {
    setFeeStatusClassId(classId);
    dataHook.loadStudents(1, debouncedFeeStatusSearchQuery, classId, true);
  }, [dataHook.loadStudents, debouncedFeeStatusSearchQuery]);

  const loadMoreStudents = useCallback(() => {
    if (dataHook.hasMoreStudents && !dataHook.isLoadingStudents) {
      if (navHook.activeTab === 'fee-status') {
        dataHook.loadStudents(dataHook.studentsPage + 1, debouncedFeeStatusSearchQuery, feeStatusClassId);
      } else if (navHook.activeTab === 'collect') {
        dataHook.loadStudents(dataHook.studentsPage + 1, debouncedStudentSearch, txHook.collectClassId);
      } else {
        dataHook.loadStudents(dataHook.studentsPage + 1, debouncedStudentSearch);
      }
    }
  }, [
    dataHook.hasMoreStudents,
    dataHook.isLoadingStudents,
    dataHook.studentsPage,
    dataHook.loadStudents,
    navHook.activeTab,
    debouncedFeeStatusSearchQuery,
    feeStatusClassId,
    debouncedStudentSearch,
    txHook.collectClassId
  ]);

  const restoreParentModal = useCallback(() => {
    if (parentModalToRestore === 'concession') {
      txHook.setConcessionDialogVisible(true);
    } else if (parentModalToRestore === 'structure') {
      structuresHook.setStructureDialogVisible(true);
    } else if (parentModalToRestore === 'manual') {
      txHook.setAddManualFeeVisible(true);
    }
    setParentModalToRestore(null);
  }, [parentModalToRestore, txHook.setConcessionDialogVisible, txHook.setAddManualFeeVisible, structuresHook.setStructureDialogVisible]);

  // Load initial data on mount
  // Note: loadStatusData already calls loadStudents(1) internally — no separate call needed
  useEffect(() => {
    dataHook.loadStatusData(true);
  }, [dataHook.loadStatusData]);

  // Fetch data on tab change
  useEffect(() => {
    if (navHook.activeTab === 'status') return;
    dataHook.loadTabData(navHook.activeTab);
    
    if (navHook.activeTab === 'collect') {
      txHook.loadMonthlyStats();
    }
  }, [navHook.activeTab, dataHook.loadTabData, txHook.loadMonthlyStats]);

  // Load students for collectClassId when it changes
  useEffect(() => {
    if (navHook.activeTab === 'collect') {
      dataHook.loadStudents(1, debouncedStudentSearch, txHook.collectClassId, true);
    }
  }, [txHook.collectClassId, navHook.activeTab, debouncedStudentSearch, dataHook.loadStudents]);

  // Fetch student-specific details when active student or tab changes
  useEffect(() => {
    if (!txHook.selectedStudentId) return;
    
    if (navHook.activeTab === 'collect') {
      txHook.fetchStudentPendingFees(txHook.selectedStudentId);
    } else if (navHook.activeTab === 'fee-status') {
      txHook.fetchStudentCompleteStatus(txHook.selectedStudentId);
    }
  }, [navHook.activeTab, txHook.selectedStudentId, txHook.fetchStudentPendingFees, txHook.fetchStudentCompleteStatus]);

  // Memoized lists and calculations
  const filteredReceipts = useMemo(() => {
    return dataHook.receipts.filter(r =>
      r.receiptNumber.toLowerCase().includes(receiptSearch.toLowerCase()) ||
      r.studentName.toLowerCase().includes(receiptSearch.toLowerCase())
    );
  }, [dataHook.receipts, receiptSearch]);

  const filteredStudents = useMemo(() => {
    return dataHook.students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(debouncedStudentSearch.toLowerCase());
      if (navHook.activeTab === 'collect' && txHook.collectClassId) {
        return matchesSearch && s.classId === txHook.collectClassId;
      }
      return matchesSearch;
    });
  }, [dataHook.students, debouncedStudentSearch, navHook.activeTab, txHook.collectClassId]);

  const collectionPercentage = useMemo(() => {
    return dataHook.totalInvoiced > 0 ? Math.round((dataHook.totalCollected / dataHook.totalInvoiced) * 100) : 0;
  }, [dataHook.totalInvoiced, dataHook.totalCollected]);

  const handleRefresh = useCallback(() => {
    dataHook.setIsRefreshing(true);
    if (navHook.activeTab === 'status') {
      dataHook.loadStatusData(false, true);
    } else {
      const promises = [dataHook.loadTabData(navHook.activeTab, true)];
      if (navHook.activeTab === 'collect') {
        promises.push(txHook.loadMonthlyStats(true));
        if (txHook.selectedStudentId) {
          promises.push(txHook.fetchStudentPendingFees(txHook.selectedStudentId, true));
        }
      } else if (navHook.activeTab === 'fee-status') {
        promises.push(dataHook.loadStatusData(false, true));
        if (txHook.selectedStudentId) {
          promises.push(txHook.fetchStudentCompleteStatus(txHook.selectedStudentId, true));
        }
      }
      Promise.all(promises).finally(() => dataHook.setIsRefreshing(false));
    }
  }, [navHook.activeTab, dataHook.loadStatusData, dataHook.loadTabData, dataHook.setIsRefreshing, txHook.loadMonthlyStats, txHook.selectedStudentId, txHook.fetchStudentPendingFees, txHook.fetchStudentCompleteStatus]);

  const handleSelectSibling = useCallback(async (siblingId: string) => {
    txHook.setSelectedStudentId(siblingId);
    if (navHook.activeTab === 'fee-status') {
      await txHook.fetchStudentCompleteStatus(siblingId, true, false);
    } else {
      await txHook.fetchStudentPendingFees(siblingId, true, false);
    }
  }, [navHook.activeTab, txHook.fetchStudentCompleteStatus, txHook.fetchStudentPendingFees, txHook.setSelectedStudentId]);

  return {
    // Shared / Permissions
    colors,
    isAdmin,
    canViewFees,
    canCreateFees,
    canEditFees,
    canDeleteFees,
    tabs,
    parentModalToRestore,
    setParentModalToRestore,
    restoreParentModal,

    // Custom Alert
    customAlert,
    setCustomAlert,
    showCustomAlert,

    // Navigation Hook values
    activeTab: navHook.activeTab,
    setActiveTab: navHook.setActiveTab,
    layoutWidth: navHook.layoutWidth,
    scrollX: navHook.scrollX,
    scrollViewRef: navHook.scrollViewRef,
    tabBarScrollRef: navHook.tabBarScrollRef,
    tabLayouts: navHook.tabLayouts,
    setTabLayouts: navHook.setTabLayouts,
    handleTabPress: navHook.handleTabPress,
    handleMomentumScrollEnd: navHook.handleMomentumScrollEnd,
    onLayout: navHook.onLayout,
    inputRange: navHook.inputRange,
    indicatorTranslateX: navHook.indicatorTranslateX,
    indicatorWidth: navHook.indicatorWidth,
    parentScrollEnabled: navHook.parentScrollEnabled,
    setParentScrollEnabled: navHook.setParentScrollEnabled,

    // Search & Picker States
    receiptSearch,
    setReceiptSearch,
    studentSearch,
    setStudentSearch: handleStudentSearchChange,
    studentPickerVisible,
    setStudentPickerVisible,
    categoryPickerVisible,
    setCategoryPickerVisible,
    classPickerVisible,
    setClassPickerVisible,
    yearPickerVisible,
    setYearPickerVisible,
    tenantPickerVisible,
    setTenantPickerVisible,
    selectedTenantId,
    setSelectedTenantId,

    // Data Hook values
    isLoading: dataHook.isLoading,
    isRefreshing: dataHook.isRefreshing,
    students: dataHook.students,
    classes: dataHook.classes,
    feeItems: dataHook.feeItems,
    receipts: dataHook.receipts,
    concessions: dataHook.concessions,
    structures: dataHook.structures,
    categories: dataHook.categories,
    academicYears: dataHook.academicYears,
    totalInvoiced: dataHook.totalInvoiced,
    totalCollected: dataHook.totalCollected,
    pendingAmount: dataHook.pendingAmount,
    setFeeYearFilter: dataHook.setFeeYearFilter,
    setSetFeeYearFilter: dataHook.setSetFeeYearFilter,
    setFeeCatFilter: dataHook.setFeeCatFilter,
    setSetFeeCatFilter: dataHook.setSetFeeCatFilter,
    structureYear: dataHook.structureYear,
    setStructureYear: dataHook.setStructureYear,
    loadStatusData: dataHook.loadStatusData,
    loadTabData: dataHook.loadTabData,
    invalidateTab: dataHook.invalidateTab,
    loadMoreStatusData: dataHook.loadMoreStatusData,
    hasMoreStatus: dataHook.hasMoreStatus,
    loadMoreReceipts: dataHook.loadMoreReceipts,
    hasMoreReceipts: dataHook.hasMoreReceipts,
    isLoadingMoreReceipts: dataHook.isLoadingMoreReceipts,

    // Transactions Hook values
    selectedStudentId: txHook.selectedStudentId,
    setSelectedStudentId: txHook.setSelectedStudentId,
    selectedStudent: txHook.selectedStudent,
    setSelectedStudent: txHook.setSelectedStudent,
    collectClassId: txHook.collectClassId,
    setCollectClassId: txHook.setCollectClassId,
    studentFees: txHook.studentFees,
    setStudentFees: txHook.setStudentFees,
    selectedFeeIds: txHook.selectedFeeIds,
    setSelectedFeeIds: txHook.setSelectedFeeIds,
    paymentMethod: txHook.paymentMethod,
    setPaymentMethod: txHook.setPaymentMethod,
    payAmount: txHook.payAmount,
    setPayAmount: txHook.setPayAmount,
    submittingPayment: txHook.submittingPayment,
    monthlyStats: txHook.monthlyStats,
    loadingStats: txHook.loadingStats,
    siblings: txHook.siblings,
    setSiblings: txHook.setSiblings,
    studentConcessions: txHook.studentConcessions,
    setStudentConcessions: txHook.setStudentConcessions,
    loadingStudentDetails: txHook.loadingStudentDetails,
    allFees: txHook.allFees,
    setAllFees: txHook.setAllFees,
    studentReceipts: txHook.studentReceipts,
    setStudentReceipts: txHook.setStudentReceipts,
    successVisible: txHook.successVisible,
    setSuccessVisible: txHook.setSuccessVisible,
    successReceiptNumber: txHook.successReceiptNumber,
    successPaidAmount: txHook.successPaidAmount,
    addManualFeeVisible: txHook.addManualFeeVisible,
    setAddManualFeeVisible: txHook.setAddManualFeeVisible,
    manualCategory: txHook.manualCategory,
    setManualCategory: txHook.setManualCategory,
    manualCustomType: txHook.manualCustomType,
    setManualCustomType: txHook.setManualCustomType,
    manualAmount: txHook.manualAmount,
    setManualAmount: txHook.setManualAmount,
    manualDueDate: txHook.manualDueDate,
    setManualDueDate: txHook.setManualDueDate,
    manualRemarks: txHook.manualRemarks,
    setManualRemarks: txHook.setManualRemarks,
    manualMarkPaid: txHook.manualMarkPaid,
    setManualMarkPaid: txHook.setManualMarkPaid,
    manualPaymentMethod: txHook.manualPaymentMethod,
    setManualPaymentMethod: txHook.setManualPaymentMethod,
    submittingManualFee: txHook.submittingManualFee,
    dueDatePickerVisible: txHook.dueDatePickerVisible,
    setDueDatePickerVisible: txHook.setDueDatePickerVisible,
    concessionStudentId: txHook.concessionStudentId,
    setConcessionStudentId: txHook.setConcessionStudentId,
    concessionCategoryId: txHook.concessionCategoryId,
    setConcessionCategoryId: txHook.setConcessionCategoryId,
    concessionType: txHook.concessionType,
    setConcessionType: txHook.setConcessionType,
    concessionAmount: txHook.concessionAmount,
    setConcessionAmount: txHook.setConcessionAmount,
    concessionReason: txHook.concessionReason,
    setConcessionReason: txHook.setConcessionReason,
    concessionDialogVisible: txHook.concessionDialogVisible,
    setConcessionDialogVisible: txHook.setConcessionDialogVisible,
    categoryName: txHook.categoryName,
    setCategoryName: txHook.setCategoryName,
    categoryCode: txHook.categoryCode,
    setCategoryCode: txHook.setCategoryCode,
    categoryDesc: txHook.categoryDesc,
    setCategoryDesc: txHook.setCategoryDesc,
    categoryFreq: txHook.categoryFreq,
    setCategoryFreq: txHook.setCategoryFreq,
    categoryDialogVisible: txHook.categoryDialogVisible,
    setCategoryDialogVisible: txHook.setCategoryDialogVisible,
    selectedReceipt: txHook.selectedReceipt,
    setSelectedReceipt: txHook.setSelectedReceipt,
    receiptDetailVisible: txHook.receiptDetailVisible,
    setReceiptDetailVisible: txHook.setReceiptDetailVisible,
    loadMonthlyStats: txHook.loadMonthlyStats,
    fetchStudentPendingFees: txHook.fetchStudentPendingFees,
    fetchStudentCompleteStatus: txHook.fetchStudentCompleteStatus,
    handleSelectSibling,
    handleAddManualFee: txHook.handleAddManualFee,
    calculatePayableTotal: txHook.calculatePayableTotal,
    handleMakePayment: txHook.handleMakePayment,
    resetConcessionForm: txHook.resetConcessionForm,
    resetCategoryForm: txHook.resetCategoryForm,
    handleAddConcession: txHook.handleAddConcession,
    handleAddCategory: txHook.handleAddCategory,
    handleDeleteConcession: txHook.handleDeleteConcession,

    // Structures Hook values
    structureCategoryId: structuresHook.structureCategoryId,
    setStructureCategoryId: structuresHook.setStructureCategoryId,
    structureClassId: structuresHook.structureClassId,
    setStructureClassId: structuresHook.setStructureClassId,
    structureAmount: structuresHook.structureAmount,
    setStructureAmount: structuresHook.setStructureAmount,
    structureDialogVisible: structuresHook.structureDialogVisible,
    setStructureDialogVisible: structuresHook.setStructureDialogVisible,
    editStructureDialogVisible: structuresHook.editStructureDialogVisible,
    setEditStructureDialogVisible: structuresHook.setEditStructureDialogVisible,
    editingStructureItem: structuresHook.editingStructureItem,
    setEditingStructureItem: structuresHook.setEditingStructureItem,
    editingStructureAmount: structuresHook.editingStructureAmount,
    setEditingStructureAmount: structuresHook.setEditingStructureAmount,
    savingStructure: structuresHook.savingStructure,
    assignDialogVisible: structuresHook.assignDialogVisible,
    setAssignDialogVisible: structuresHook.setAssignDialogVisible,
    assignStructureItem: structuresHook.assignStructureItem,
    assignLoading: structuresHook.assignLoading,
    assignData: structuresHook.assignData,
    assignSelectedIds: structuresHook.assignSelectedIds,
    setAssignSelectedIds: structuresHook.setAssignSelectedIds,
    assignSearch: structuresHook.assignSearch,
    setAssignSearch: structuresHook.setAssignSearch,
    assignSaving: structuresHook.assignSaving,
    resetStructureForm: structuresHook.resetStructureForm,
    handleAddStructure: structuresHook.handleAddStructure,
    handleEditStructureSave: structuresHook.handleEditStructureSave,
    fetchFeeAssignment: structuresHook.fetchFeeAssignment,
    handleAssignSave: structuresHook.handleAssignSave,
    handleDeleteStructure: structuresHook.handleDeleteStructure,

    // Derived memoized values / combined operations
    filteredReceipts,
    filteredStudents,
    collectionPercentage,
    handleRefresh,
    loadMoreStudents,
    isLoadingStudents: dataHook.isLoadingStudents,
    hasMoreStudents: dataHook.hasMoreStudents,
    loadStudents: dataHook.loadStudents,

    // Lifted Fee Status search/filter states
    feeStatusClassId,
    setFeeStatusClassId: handleFeeStatusClassChange,
    feeStatusSearchQuery,
    setFeeStatusSearchQuery: handleFeeStatusSearchChange
  };
}
