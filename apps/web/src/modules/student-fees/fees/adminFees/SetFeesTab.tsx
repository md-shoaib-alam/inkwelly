"use client";

import { useReducer, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tag, Layers, CircleDollarSign, Plus } from 'lucide-react';
import { toast } from "sonner";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useFeeCategories, useFeeStructures, useCreateFeeStructure, useFeeAssignment } from '@/modules/student-fees/fees/hooks/use-fees';
import { useActiveAcademicYear } from '@/modules/academics/hooks/use-active-academic-year';
import { useDebounce } from '@/hooks/use-debounce';
import type { FeeStructure, FeeCategory, ClassOption } from './types';

// Sub-components
import { FeeStructuresTable } from './structures/FeeStructuresTable';
import { AddFeeStructureDialog } from './structures/AddFeeStructureDialog';
import { EditFeeStructureDialog } from './structures/EditFeeStructureDialog';
import { AssignFeesDialog } from './structures/AssignFeesDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface SetFeesTabProps {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

type State = {
  yearFilter: string;
  catFilter: string;
  addOpen: boolean;
  addForm: { feeCategoryId: string; classId: string; amount: string; academicYear: string };
  adding: boolean;
  editOpen: boolean;
  editItem: FeeStructure | null;
  editAmount: string;
  saving: boolean;
  deleting: boolean;
  assignOpen: boolean;
  assignStruct: FeeStructure | null;
  assignSaving: boolean;
  selectedStudents: Set<string>;
  searchStudent: string;
};

type Action =
  | { type: 'SET_YEAR_FILTER'; payload: string }
  | { type: 'SET_CAT_FILTER'; payload: string }
  | { type: 'SET_ADD_OPEN'; payload: boolean }
  | { type: 'SET_ADD_FORM'; payload: Partial<State['addForm']> }
  | { type: 'SET_ADDING'; payload: boolean }
  | { type: 'OPEN_EDIT'; payload: FeeStructure }
  | { type: 'SET_EDIT_OPEN'; payload: boolean }
  | { type: 'SET_EDIT_AMOUNT'; payload: string }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_DELETING'; payload: boolean }
  | { type: 'OPEN_ASSIGN'; payload: FeeStructure }
  | { type: 'SET_ASSIGN_OPEN'; payload: boolean }
  | { type: 'SET_ASSIGN_SAVING'; payload: boolean }
  | { type: 'SET_SELECTED_STUDENTS'; payload: Set<string> | ((prev: Set<string>) => Set<string>) }
  | { type: 'SET_SEARCH_STUDENT'; payload: string }
  | { type: 'RESET_ADD_FORM' };

const getDefaultAcademicYear = () => {
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  return month < 3 ? `${year - 1}-${year}` : `${year}-${year + 1}`;
};

const initialState: State = {
  yearFilter: 'all',
  catFilter: 'all',
  addOpen: false,
  addForm: { feeCategoryId: '', classId: '', amount: '', academicYear: getDefaultAcademicYear() },
  adding: false,
  editOpen: false,
  editItem: null,
  editAmount: '',
  saving: false,
  deleting: false,
  assignOpen: false,
  assignStruct: null,
  assignSaving: false,
  selectedStudents: new Set(),
  searchStudent: '',
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_YEAR_FILTER': return { ...state, yearFilter: action.payload };
    case 'SET_CAT_FILTER': return { ...state, catFilter: action.payload };
    case 'SET_ADD_OPEN': return { ...state, addOpen: action.payload };
    case 'SET_ADD_FORM': return { ...state, addForm: { ...state.addForm, ...action.payload } };
    case 'SET_ADDING': return { ...state, adding: action.payload };
    case 'OPEN_EDIT': return { ...state, editItem: action.payload, editAmount: String(action.payload.amount), editOpen: true };
    case 'SET_EDIT_OPEN': return { ...state, editOpen: action.payload };
    case 'SET_EDIT_AMOUNT': return { ...state, editAmount: action.payload };
    case 'SET_SAVING': return { ...state, saving: action.payload };
    case 'SET_DELETING': return { ...state, deleting: action.payload };
    case 'OPEN_ASSIGN': return { ...state, assignStruct: action.payload, assignOpen: true, selectedStudents: new Set(), searchStudent: '' };
    case 'SET_ASSIGN_OPEN': return { ...state, assignOpen: action.payload };
    case 'SET_ASSIGN_SAVING': return { ...state, assignSaving: action.payload };
    case 'SET_SELECTED_STUDENTS':
      return {
        ...state,
        selectedStudents: typeof action.payload === 'function' ? action.payload(state.selectedStudents) : action.payload
      };
    case 'SET_SEARCH_STUDENT': return { ...state, searchStudent: action.payload };
    case 'RESET_ADD_FORM': return { ...state, addForm: initialState.addForm, addOpen: false };
    default: return state;
  }
}

export function SetFeesTab({ canCreate, canEdit, canDelete }: SetFeesTabProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    yearFilter, catFilter, addOpen, addForm, adding, editOpen, editItem,
    editAmount, saving, deleting, assignOpen, assignStruct, assignSaving,
    selectedStudents, searchStudent
  } = state;

  const debouncedSearch = useDebounce(searchStudent, 300);

  const { year, years: dbAcademicYears = [] } = useActiveAcademicYear();
  const [isYearFilterInitialized, setIsYearFilterInitialized] = useState(false);
  const [isAddFormInitialized, setIsAddFormInitialized] = useState(false);

  // The URL's session is what this screen shows; switching the header chip
  // re-filters the table. 'All Years' remains a choice the admin can make.
  useEffect(() => {
    const current = year?.name;
    if (!current) return;
    if (!isYearFilterInitialized || yearFilter !== current) {
      dispatch({ type: 'SET_YEAR_FILTER', payload: current });
      setIsYearFilterInitialized(true);
    }
    if (!isAddFormInitialized) {
      dispatch({ type: 'SET_ADD_FORM', payload: { academicYear: current } });
      setIsAddFormInitialized(true);
    }
  }, [year, isYearFilterInitialized, isAddFormInitialized]);

  const { data: structures = [], isLoading: loadingStructures } = useFeeStructures();
  const { data: categories = [], isLoading: loadingCategories } = useFeeCategories();
  const { data: minCategories = [] } = useFeeCategories('min');
  const { data: classes = [], isLoading: loadingClasses } = useQuery<ClassOption[]>({
    queryKey: ['classes', 'min'],
    queryFn: () => api.get('/classes?mode=min')
  });

  const loading = loadingStructures || loadingCategories || loadingClasses;

  const createStructure = useCreateFeeStructure();
  const queryClient = useQueryClient();

  const filterYears = useMemo(() => {
    const years = new Set(dbAcademicYears.map((y: any) => y.name));
    structures.forEach(s => years.add(s.academicYear));
    return ['all', ...Array.from(years).sort()];
  }, [dbAcademicYears, structures]);

  const filtered = useMemo(() => {
    return structures.filter(s => {
      const matchYear = yearFilter === 'all' || s.academicYear === yearFilter;
      const matchCat = catFilter === 'all' || s.feeCategoryId === catFilter;
      return matchYear && matchCat;
    });
  }, [structures, yearFilter, catFilter]);

  const totalRevenue = filtered.reduce((sum, s) => sum + s.amount, 0);

  const handleAdd = async () => {
    if (!addForm.feeCategoryId || !addForm.classId || !addForm.amount || !addForm.academicYear) {
      toast.error('All fields are required');
      return;
    }
    dispatch({ type: 'SET_ADDING', payload: true });
    try {
      await createStructure.mutateAsync({ ...addForm, amount: Number(addForm.amount) });
      dispatch({ type: 'RESET_ADD_FORM' });
    } catch { /* handled by mutation */ }
    dispatch({ type: 'SET_ADDING', payload: false });
  };

  const handleEdit = (s: FeeStructure) => {
    dispatch({ type: 'OPEN_EDIT', payload: s });
  };

  const handleEditSave = async () => {
    if (!editItem || !editAmount) return;
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      await api.put('/fee-structures', { id: editItem.id, amount: Number(editAmount) });
      toast.success('Fee structure updated!');
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      dispatch({ type: 'SET_EDIT_OPEN', payload: false });
    } catch { toast.error('Error updating'); }
    dispatch({ type: 'SET_SAVING', payload: false });
  };

  const handleDelete = async (id: string) => {
    dispatch({ type: 'SET_DELETING', payload: true });
    try {
      await api.delete(`/fee-structures?id=${id}`);
      toast.success('Fee structure deleted!');
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
    } catch { toast.error('Error deleting'); }
    dispatch({ type: 'SET_DELETING', payload: false });
  };

  // Assign to Students logic
  const { data: assignData, isLoading: assignLoading } = useFeeAssignment(
    assignStruct?.classId || '',
    assignStruct?.feeCategoryId || '',
    assignStruct?.academicYear || ''
  );

  const openAssignDialog = (s: FeeStructure) => {
    dispatch({ type: 'OPEN_ASSIGN', payload: s });
  };

  useEffect(() => {
    if (assignOpen && assignData?.students) {
      queueMicrotask(() => {
        const currentlyAssigned = assignData.students.filter((st: any) => st.isAssigned);
        if (currentlyAssigned.length > 0) {
          dispatch({
            type: 'SET_SELECTED_STUDENTS',
            payload: new Set<string>(currentlyAssigned.map((st: any) => st.id))
          });
        } else if (assignStruct?.feeCategoryCode === 'TRAN' || assignStruct?.feeCategoryName?.toLowerCase().includes('transport')) {
          const transportStudents = assignData.students.filter((st: any) => st.hasTransport);
          dispatch({
            type: 'SET_SELECTED_STUDENTS',
            payload: new Set<string>(transportStudents.map((st: any) => st.id))
          });
        } else {
          dispatch({
            type: 'SET_SELECTED_STUDENTS',
            payload: new Set<string>()
          });
        }
      });
    }
  }, [assignData, assignOpen, assignStruct]);

  const toggleStudent = (studentId: string) => {
    dispatch({
      type: 'SET_SELECTED_STUDENTS',
      payload: (prev) => {
        const next = new Set(prev);
        if (next.has(studentId)) next.delete(studentId);
        else next.add(studentId);
        return next;
      }
    });
  };

  const selectAll = () => {
    if (!assignData) return;
    const all = assignData.students.filter((s: any) => !s.isPaid);
    const allIds = new Set<string>(all.map((s: any) => s.id));
    if (selectedStudents.size === allIds.size) {
      dispatch({ type: 'SET_SELECTED_STUDENTS', payload: new Set<string>() });
    } else {
      dispatch({ type: 'SET_SELECTED_STUDENTS', payload: allIds });
    }
  };

  const selectTransport = () => {
    if (!assignData) return;
    const transportStudents = assignData.students.filter((s: any) => s.hasTransport && !s.isPaid);
    if (transportStudents.length === 0) { toast.info('No transport students in this class'); return; }
    dispatch({ type: 'SET_SELECTED_STUDENTS', payload: new Set(transportStudents.map((s: any) => s.id)) });
  };

  const handleAssignSave = async () => {
    if (!assignStruct || !assignData) return;
    const currentlyAssigned = new Set(assignData.students.filter((s: any) => s.isAssigned).map((s: any) => s.id));
    const toAssign = [...selectedStudents].filter(id => !currentlyAssigned.has(id));
    const toRemove = [...currentlyAssigned].filter(id => !selectedStudents.has(id));
    
    if (toAssign.length === 0 && toRemove.length === 0) {
      toast.info('No changes');
      dispatch({ type: 'SET_ASSIGN_OPEN', payload: false });
      return;
    }

    dispatch({ type: 'SET_ASSIGN_SAVING', payload: true });
    try {
      const promises: Promise<any>[] = [];
      if (toAssign.length > 0) {
        promises.push(api.post('/fee-assign', {
          classId: assignStruct.classId,
          feeCategoryId: assignStruct.feeCategoryId,
          studentIds: toAssign,
          academicYear: assignStruct.academicYear,
          action: 'assign'
        }));
      }
      if (toRemove.length > 0) {
        promises.push(api.post('/fee-assign', {
          classId: assignStruct.classId,
          feeCategoryId: assignStruct.feeCategoryId,
          studentIds: toRemove,
          academicYear: assignStruct.academicYear,
          action: 'remove'
        }));
      }
      await Promise.all(promises);
      toast.success('Assignment updated!');
      queryClient.invalidateQueries({ queryKey: ['fee-assign'] });
      dispatch({ type: 'SET_ASSIGN_OPEN', payload: false });
    } catch { toast.error('Error saving assignment'); }
    dispatch({ type: 'SET_ASSIGN_SAVING', payload: false });
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Tag className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-xl flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Layers className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Structures</p>
              <p className="text-2xl font-bold">{filtered.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-xl flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <CircleDollarSign className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revenue Expected</p>
              <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Add */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Select value={yearFilter} onValueChange={(v) => dispatch({ type: 'SET_YEAR_FILTER', payload: v })}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Academic Year" /></SelectTrigger>
          <SelectContent>
            {filterYears.map(y => <SelectItem key={y} value={y}>{y === 'all' ? 'All Years' : y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={catFilter} onValueChange={(v) => dispatch({ type: 'SET_CAT_FILTER', payload: v })}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="sm:ml-auto">
          {canCreate && (
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => dispatch({ type: 'SET_ADD_OPEN', payload: true })}>
              <Plus className="size-4 mr-2" />Add Structure
            </Button>
          )}
        </div>
      </div>

      <FeeStructuresTable 
        loading={loading}
        filtered={filtered}
        canEdit={canEdit}
        canDelete={canDelete}
        onAssign={openAssignDialog}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deleting={deleting}
      />

      <AddFeeStructureDialog 
        open={addOpen}
        onOpenChange={(v) => dispatch({ type: 'SET_ADD_OPEN', payload: v })}
        form={addForm}
        setForm={(data: any) => {
          if (typeof data === 'function') {
            dispatch({ type: 'SET_ADD_FORM', payload: data(addForm) });
          } else {
            dispatch({ type: 'SET_ADD_FORM', payload: data });
          }
        }}
        minCategories={minCategories}
        classes={classes}
        onAdd={handleAdd}
        adding={adding}
      />

      <EditFeeStructureDialog 
        open={editOpen}
        onOpenChange={(v) => dispatch({ type: 'SET_EDIT_OPEN', payload: v })}
        item={editItem}
        amount={editAmount}
        setAmount={(v) => dispatch({ type: 'SET_EDIT_AMOUNT', payload: v })}
        onSave={handleEditSave}
        saving={saving}
      />

      <AssignFeesDialog 
        open={assignOpen}
        onOpenChange={(v) => dispatch({ type: 'SET_ASSIGN_OPEN', payload: v })}
        struct={assignStruct}
        loading={assignLoading}
        data={assignData}
        selectedIds={selectedStudents}
        onToggle={toggleStudent}
        onSelectAll={selectAll}
        onSelectTransport={selectTransport}
        search={searchStudent}
        setSearch={(v) => dispatch({ type: 'SET_SEARCH_STUDENT', payload: v })}
        onSave={handleAssignSave}
        saving={assignSaving}
        debouncedSearch={debouncedSearch}
      />
    </div>
  );
}
