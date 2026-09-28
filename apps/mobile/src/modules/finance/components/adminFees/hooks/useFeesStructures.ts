import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { FeeStructure } from '../types';

interface UseFeesStructuresProps {
  canCreateFees: boolean;
  canEditFees: boolean;
  canDeleteFees: boolean;
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

export function useFeesStructures({
  canCreateFees,
  canEditFees,
  canDeleteFees,
  loadTabData,
  invalidateTab,
  showCustomAlert
}: UseFeesStructuresProps) {
  // Set Fee Structure States
  const [structureCategoryId, setStructureCategoryId] = useState('');
  const [structureClassId, setStructureClassId] = useState('');
  const [structureAmount, setStructureAmount] = useState('');
  const [structureYear, setStructureYear] = useState('2026-2027');
  const [structureDialogVisible, setStructureDialogVisible] = useState(false);

  // Edit Fee Structure Dialog States
  const [editStructureDialogVisible, setEditStructureDialogVisible] = useState(false);
  const [editingStructureItem, setEditingStructureItem] = useState<FeeStructure | null>(null);
  const [editingStructureAmount, setEditingStructureAmount] = useState('');
  const [savingStructure, setSavingStructure] = useState(false);

  // Assign Fee Dialog States
  const [assignDialogVisible, setAssignDialogVisible] = useState(false);
  const [assignStructureItem, setAssignStructureItem] = useState<FeeStructure | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignData, setAssignData] = useState<any>(null);
  const [assignSelectedIds, setAssignSelectedIds] = useState<Set<string>>(new Set());
  const [assignSearch, setAssignSearch] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);

  const resetStructureForm = useCallback(() => {
    setStructureCategoryId('');
    setStructureClassId('');
    setStructureAmount('');
  }, []);

  const handleAddStructure = useCallback(async () => {
    if (!canCreateFees) {
      showCustomAlert('Permission Denied', 'You do not have permission to configure class fees.', 'error');
      return;
    }
    if (!structureCategoryId || !structureClassId || !structureAmount) {
      showCustomAlert('Validation Error', 'Category, Class, and Amount are required.', 'warning');
      return;
    }
    try {
      await api.post('/fee-structures', {
        feeCategoryId: structureCategoryId,
        classId: structureClassId,
        amount: Number(structureAmount),
        academicYear: structureYear,
      });
      setStructureDialogVisible(false);
      resetStructureForm();
      invalidateTab('structures');
      loadTabData('structures');
      showCustomAlert('Success', 'Fee structure configured successfully!', 'success');
    } catch (e) {
      showCustomAlert('Error', 'Failed to configure fee structure.', 'error');
    }
  }, [
    canCreateFees,
    structureCategoryId,
    structureClassId,
    structureAmount,
    structureYear,
    resetStructureForm,
    loadTabData,
    showCustomAlert
  ]);

  const handleEditStructureSave = useCallback(async () => {
    if (!editingStructureItem || !editingStructureAmount) return;
    setSavingStructure(true);
    try {
      await api.put('/fee-structures', {
        id: editingStructureItem.id,
        amount: Number(editingStructureAmount),
      });
      setEditStructureDialogVisible(false);
      invalidateTab('structures');
      loadTabData('structures');
      showCustomAlert('Success', 'Fee structure updated successfully!', 'success');
    } catch (e) {
      console.error(e);
      showCustomAlert('Error', 'Failed to update fee structure.', 'error');
    } finally {
      setSavingStructure(false);
    }
  }, [editingStructureItem, editingStructureAmount, loadTabData, showCustomAlert]);

  const fetchFeeAssignment = useCallback(async (s: FeeStructure) => {
    setAssignStructureItem(s);
    setAssignLoading(true);
    setAssignDialogVisible(true);
    setAssignSelectedIds(new Set());
    setAssignSearch('');
    try {
      const res = await api.get<any>('/fee-assign', {
        params: {
          classId: s.classId,
          feeCategoryId: s.feeCategoryId,
          academicYear: s.academicYear
        }
      });
      if (res) {
        setAssignData(res);
        const currentlyAssigned = res.students?.filter((st: any) => st.isAssigned) || [];
        if (currentlyAssigned.length > 0) {
          setAssignSelectedIds(new Set(currentlyAssigned.map((st: any) => st.id)));
        } else if (s.feeCategoryCode === 'TRAN' || s.feeCategoryName?.toLowerCase().includes('transport')) {
          const transportStudents = res.students?.filter((st: any) => st.hasTransport) || [];
          setAssignSelectedIds(new Set(transportStudents.map((st: any) => st.id)));
        }
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      showCustomAlert('Error', 'Failed to load student assignments.', 'error');
    } finally {
      setAssignLoading(false);
    }
  }, [showCustomAlert]);

  const handleAssignSave = useCallback(async () => {
    if (!assignStructureItem || !assignData) return;
    const currentlyAssigned = new Set<string>(
      assignData.students?.filter((st: any) => st.isAssigned).map((st: any) => st.id) || []
    );
    const toAssign = [...assignSelectedIds].filter(id => !currentlyAssigned.has(id));
    const toRemove = [...currentlyAssigned].filter(id => !assignSelectedIds.has(id));

    if (toAssign.length === 0 && toRemove.length === 0) {
      showCustomAlert('Info', 'No changes detected.', 'info');
      setAssignDialogVisible(false);
      return;
    }

    setAssignSaving(true);
    try {
      const promises: Promise<any>[] = [];
      if (toAssign.length > 0) {
        promises.push(
          api.post('/fee-assign', {
            classId: assignStructureItem.classId,
            feeCategoryId: assignStructureItem.feeCategoryId,
            studentIds: toAssign,
            academicYear: assignStructureItem.academicYear,
            action: 'assign',
          })
        );
      }
      if (toRemove.length > 0) {
        promises.push(
          api.post('/fee-assign', {
            classId: assignStructureItem.classId,
            feeCategoryId: assignStructureItem.feeCategoryId,
            studentIds: toRemove,
            academicYear: assignStructureItem.academicYear,
            action: 'remove',
          })
        );
      }
      await Promise.all(promises);
      setAssignDialogVisible(false);
      invalidateTab('structures');
      loadTabData('structures');
      showCustomAlert('Success', 'Assignments updated successfully!', 'success');
    } catch (e) {
      console.error(e);
      showCustomAlert('Error', 'Failed to save assignments.', 'error');
    } finally {
      setAssignSaving(false);
    }
  }, [assignStructureItem, assignData, assignSelectedIds, loadTabData, showCustomAlert]);

  const handleDeleteStructure = useCallback((id: string) => {
    if (!canDeleteFees) {
      showCustomAlert('Permission Denied', 'You do not have permission to delete class fees.', 'error');
      return;
    }
    showCustomAlert(
      'Confirm Delete',
      'Are you sure you want to delete this fee structure configuration?',
      'confirm',
      async () => {
        try {
          await api.delete(`/fee-structures?id=${id}`);
          invalidateTab('structures');
          loadTabData('structures');
        } catch (e) {
          showCustomAlert('Error', 'Failed to delete structure.', 'error');
        }
      },
      'Delete'
    );
  }, [canDeleteFees, loadTabData, showCustomAlert]);

  return {
    structureCategoryId,
    setStructureCategoryId,
    structureClassId,
    setStructureClassId,
    structureAmount,
    setStructureAmount,
    structureYear,
    setStructureYear,
    structureDialogVisible,
    setStructureDialogVisible,
    editStructureDialogVisible,
    setEditStructureDialogVisible,
    editingStructureItem,
    setEditingStructureItem,
    editingStructureAmount,
    setEditingStructureAmount,
    savingStructure,
    assignDialogVisible,
    setAssignDialogVisible,
    assignStructureItem,
    assignLoading,
    assignData,
    assignSelectedIds,
    setAssignSelectedIds,
    assignSearch,
    setAssignSearch,
    assignSaving,
    resetStructureForm,
    handleAddStructure,
    handleEditStructureSave,
    fetchFeeAssignment,
    handleAssignSave,
    handleDeleteStructure
  };
}
