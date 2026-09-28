import { useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { TabType } from './useFeesNavigation';
import { StudentOption, ClassOption, FeeItem, Receipt, Concession, FeeStructure, FeeCategory } from '../types';

export function useFeesData() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loadedTabs = useRef<Set<TabType>>(new Set());

  // Lists & Options
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [concessions, setConcessions] = useState<Concession[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  // Overall Stats
  const [totalInvoiced, setTotalInvoiced] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);

  const [setFeeYearFilter, setSetFeeYearFilter] = useState('all');
  const [setFeeCatFilter, setSetFeeCatFilter] = useState('all');
  const [structureYear, setStructureYear] = useState('2026-2027');

  const [allMonthlyFeeItems, setAllMonthlyFeeItems] = useState<FeeItem[]>([]);
  const [statusPage, setStatusPage] = useState(1);
  const [hasMoreStatus, setHasMoreStatus] = useState(true);

  // Pagination for receipts
  const [receiptsPage, setReceiptsPage] = useState(1);
  const [hasMoreReceipts, setHasMoreReceipts] = useState(true);
  const [isLoadingMoreReceipts, setIsLoadingMoreReceipts] = useState(false);

  // Pagination for students
  const [studentsPage, setStudentsPage] = useState(1);
  const [hasMoreStudents, setHasMoreStudents] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const loadStudents = useCallback(async (pageVal = 1, searchVal = '', classIdVal = '', refresh = false) => {
    try {
      setIsLoadingStudents(true);
      const searchParam = searchVal ? `&search=${encodeURIComponent(searchVal)}` : '';
      const classParam = classIdVal && classIdVal !== 'all' ? `&classId=${classIdVal}` : '';
      const res = await api.get<any>(`/students?mode=min&limit=50&page=${pageVal}${searchParam}${classParam}`);
      if (res && Array.isArray(res.items)) {
        if (pageVal === 1 || refresh) {
          setStudents(res.items);
        } else {
          setStudents(prev => {
            const existingIds = new Set(prev.map(s => s.id));
            const newItems = res.items.filter((s: any) => !existingIds.has(s.id));
            return [...prev, ...newItems];
          });
        }
        setStudentsPage(pageVal);
        setHasMoreStudents(res.hasMore);
      }
    } catch (error) {
      console.error('Failed to load students page:', error);
    } finally {
      setIsLoadingStudents(false);
    }
  }, []);

  const loadStatusData = useCallback(async (showLoader = true, refresh = false) => {
    try {
      if (showLoader) setIsLoading(true);
      const refreshParam = refresh ? '&refresh=true' : '';
      const refreshQuery = refresh ? '?refresh=true' : '';

      const [res, categoriesRes, yearsRes] = await Promise.all([
        api.get<any>(`/fees?mode=unified&limit=50${refreshParam}`),
        api.get<any>(`/fee-categories${refreshQuery}`),
        api.get<any>(`/academic-years${refreshQuery}`),
        loadStudents(1, '', '', refresh)
      ]);

      if (res) {
        if (res.stats) {
          const total = Number(res.stats.total || 0);
          const pending = Number(res.stats.pending || 0);
          setTotalInvoiced(total);
          setPendingAmount(pending);
          setTotalCollected(Math.max(0, total - pending));
        }
        if (res.items) {
          const mappedItems = res.items.map((item: any) => ({
            name: item.type || item.feeCategoryName || 'School Fee',
            amount: Number(item.amount || 0),
            deadline: item.dueDate || 'No Due Date',
            collected: Number(item.paidAmount || 0)
          }));
          setAllMonthlyFeeItems(mappedItems);
          setFeeItems(mappedItems.slice(0, 10));
          setStatusPage(1);
          setHasMoreStatus(mappedItems.length > 10);
        }
        if (Array.isArray(res.classes)) setClasses(res.classes);
      }
      
      if (categoriesRes && Array.isArray(categoriesRes)) {
        setCategories(categoriesRes);
      }

      if (yearsRes && Array.isArray(yearsRes)) {
        setAcademicYears(yearsRes);
        const activeYear = yearsRes.find((y: any) => y.isCurrent || y.status === 'active')?.name;
        if (activeYear) {
          setSetFeeYearFilter(activeYear);
          setStructureYear(activeYear);
        }
      }
    } catch (error) {
      console.error('Failed to load fee stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [loadStudents]);

  const loadTabData = useCallback(async (tab: TabType, refresh = false) => {
    if (refresh) {
      loadedTabs.current.delete(tab);
    } else if (loadedTabs.current.has(tab)) {
      return;
    }

    try {
      setIsLoading(true);
      const refreshParam = refresh ? '&refresh=true' : '';
      const refreshQuery = refresh ? '?refresh=true' : '';
      let success = false;

      if (tab === 'receipts') {
        setReceiptsPage(1);
        setHasMoreReceipts(true);
        const res = await api.get<any>(`/fee-receipts?limit=20&page=1${refreshParam}`);
        if (res && Array.isArray(res.items)) {
          setReceipts(res.items);
          if (res.items.length < 20) setHasMoreReceipts(false);
        }
        success = true;
      } else if (tab === 'concessions') {
        const res = await api.get(`/fee-concessions${refreshQuery}`);
        if (res && Array.isArray(res)) setConcessions(res);
        success = true;
      } else if (tab === 'structures') {
        const res = await api.get(`/fee-structures${refreshQuery}`);
        if (res && Array.isArray(res)) setStructures(res);
        success = true;
      } else if (tab === 'categories') {
        const res = await api.get(`/fee-categories${refreshQuery}`);
        if (res && Array.isArray(res)) setCategories(res);
        success = true;
      }

      if (success) {
        loadedTabs.current.add(tab);
      }
    } catch (e) {
      console.error('Failed to load tab data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Bust the cache for a specific tab so the next loadTabData call re-fetches.
   * Call this after any mutation (add/edit/delete) that affects a tab's data.
   */
  const invalidateTab = useCallback((tab: TabType) => {
    loadedTabs.current.delete(tab);
  }, []);

  const loadMoreStatusData = useCallback(() => {

    if (!hasMoreStatus) return;
    const nextPage = statusPage + 1;
    const nextLimit = nextPage * 10;
    setFeeItems(allMonthlyFeeItems.slice(0, nextLimit));
    setStatusPage(nextPage);
    if (nextLimit >= allMonthlyFeeItems.length) {
      setHasMoreStatus(false);
    }
  }, [statusPage, hasMoreStatus, allMonthlyFeeItems]);

  const loadMoreReceipts = useCallback(async () => {
    if (!hasMoreReceipts || isLoadingMoreReceipts) return;
    
    try {
      setIsLoadingMoreReceipts(true);
      const nextPage = receiptsPage + 1;
      const res = await api.get<any>('/fee-receipts', { params: { limit: 20, page: nextPage } });
      
      if (res && Array.isArray(res.items)) {
        if (res.items.length === 0) {
          setHasMoreReceipts(false);
        } else {
          setReceipts(prev => [...prev, ...res.items]);
          setReceiptsPage(nextPage);
          if (res.items.length < 20) setHasMoreReceipts(false);
        }
      } else {
        setHasMoreReceipts(false);
      }
    } catch (e) {
      console.error('Failed to load more receipts:', e);
    } finally {
      setIsLoadingMoreReceipts(false);
    }
  }, [receiptsPage, hasMoreReceipts, isLoadingMoreReceipts]);

  return {
    isLoading,
    setIsLoading,
    isRefreshing,
    setIsRefreshing,
    students,
    setStudents,
    classes,
    setClasses,
    feeItems,
    setFeeItems,
    receipts,
    setReceipts,
    concessions,
    setConcessions,
    structures,
    setStructures,
    categories,
    setCategories,
    academicYears,
    setAcademicYears,
    totalInvoiced,
    totalCollected,
    pendingAmount,
    setFeeYearFilter,
    setSetFeeYearFilter,
    setFeeCatFilter,
    setSetFeeCatFilter,
    structureYear,
    setStructureYear,
    loadStatusData,
    loadTabData,
    invalidateTab,
    loadMoreStatusData,
    hasMoreStatus,
    loadMoreReceipts,
    hasMoreReceipts,
    isLoadingMoreReceipts,
    studentsPage,
    hasMoreStudents,
    isLoadingStudents,
    loadStudents
  };
}
