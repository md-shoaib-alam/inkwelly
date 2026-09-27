"use client";

import { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Search, Plus, Tag, CheckCircle2, Ban, Pencil, Trash2 } from 'lucide-react';
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useFeeCategories, useCreateFeeCategory } from '@/hooks/use-fees';
import { frequencyConfig } from './config';
import type { FeeCategory } from './types';

interface FeeCategoriesTabProps {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

type State = {
  search: string;
  addOpen: boolean;
  addForm: { name: string; code: string; description: string; frequency: string };
  adding: boolean;
  editOpen: boolean;
  editItem: FeeCategory | null;
  editForm: { name: string; code: string; description: string; frequency: string };
  saving: boolean;
  deleting: boolean;
};

type Action =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_ADD_OPEN'; payload: boolean }
  | { type: 'SET_ADD_FORM'; payload: Partial<State['addForm']> }
  | { type: 'SET_ADDING'; payload: boolean }
  | { type: 'OPEN_EDIT'; payload: FeeCategory }
  | { type: 'SET_EDIT_OPEN'; payload: boolean }
  | { type: 'SET_EDIT_FORM'; payload: Partial<State['editForm']> }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_DELETING'; payload: boolean }
  | { type: 'RESET_ADD_FORM' };

const initialAddForm = { name: '', code: '', description: '', frequency: 'yearly' };
const initialState: State = {
  search: '',
  addOpen: false,
  addForm: { ...initialAddForm },
  adding: false,
  editOpen: false,
  editItem: null,
  editForm: { name: '', code: '', description: '', frequency: '' },
  saving: false,
  deleting: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_ADD_OPEN':
      return { ...state, addOpen: action.payload };
    case 'SET_ADD_FORM':
      return { ...state, addForm: { ...state.addForm, ...action.payload } };
    case 'SET_ADDING':
      return { ...state, adding: action.payload };
    case 'OPEN_EDIT':
      return {
        ...state,
        editOpen: true,
        editItem: action.payload,
        editForm: {
          name: action.payload.name,
          code: action.payload.code,
          description: action.payload.description || '',
          frequency: action.payload.frequency,
        },
      };
    case 'SET_EDIT_OPEN':
      return { ...state, editOpen: action.payload, editItem: action.payload ? state.editItem : null };
    case 'SET_EDIT_FORM':
      return { ...state, editForm: { ...state.editForm, ...action.payload } };
    case 'SET_SAVING':
      return { ...state, saving: action.payload };
    case 'SET_DELETING':
      return { ...state, deleting: action.payload };
    case 'RESET_ADD_FORM':
      return { ...state, addForm: { ...initialAddForm } };
    default:
      return state;
  }
}

export function FeeCategoriesTab({ canCreate, canEdit, canDelete }: FeeCategoriesTabProps) {
  const { data: categories = [], isLoading: loading } = useFeeCategories();
  const queryClient = useQueryClient();
  const createCategory = useCreateFeeCategory();

  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    search,
    addOpen,
    addForm,
    adding,
    editOpen,
    editItem,
    editForm,
    saving,
    deleting,
  } = state;

  const filtered = useMemo(() => {
    if (!search) return categories;
    const q = search.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [categories, search]);

  const handleAdd = async () => {
    if (!addForm.name || !addForm.code) { toast.error('Name and code are required'); return; }
    dispatch({ type: 'SET_ADDING', payload: true });
    try {
      await createCategory.mutateAsync(addForm);
      dispatch({ type: 'SET_ADD_OPEN', payload: false });
      dispatch({ type: 'RESET_ADD_FORM' });
    } catch { /* handled by mutation */ }
    dispatch({ type: 'SET_ADDING', payload: false });
  };

  const handleEdit = (cat: FeeCategory) => {
    dispatch({ type: 'OPEN_EDIT', payload: cat });
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    dispatch({ type: 'SET_SAVING', payload: true });
    try {
      const res = await apiFetch('/api/fee-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editItem.id, ...editForm, code: editForm.code.toUpperCase() }),
      });
      if (res.ok) {
        toast.success('Category updated!');
        queryClient.invalidateQueries({ queryKey: ['fee-categories'] });
        dispatch({ type: 'SET_EDIT_OPEN', payload: false });
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to update');
      }
    } catch { toast.error('Error updating'); }
    dispatch({ type: 'SET_SAVING', payload: false });
  };

  const toggleStatus = async (cat: FeeCategory) => {
    try {
      const newStatus = cat.status === 'active' ? 'inactive' : 'active';
      const res = await apiFetch('/api/fee-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Category ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
        queryClient.invalidateQueries({ queryKey: ['fee-categories'] });
      }
    } catch { toast.error('Error updating status'); }
  };

  const handleDelete = async (id: string) => {
    dispatch({ type: 'SET_DELETING', payload: true });
    try {
      const res = await apiFetch(`/api/fee-categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Category deleted!');
        queryClient.invalidateQueries({ queryKey: ['fee-categories'] });
      }
      else toast.error('Failed to delete');
    } catch { toast.error('Error deleting'); }
    dispatch({ type: 'SET_DELETING', payload: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            className="pl-9"
            value={search}
            onChange={e => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
          />
        </div>
        <div className="sm:ml-auto">
          {canCreate && (
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => dispatch({ type: 'SET_ADD_OPEN', payload: true })}>
              <Plus className="size-4 mr-2" />Add Category
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fee Categories</CardTitle>
          <CardDescription>{filtered.length} categories</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6 h-12">Name</TableHead>
                    <TableHead className="hidden sm:table-cell h-12">Code</TableHead>
                    <TableHead className="hidden sm:table-cell h-12">Frequency</TableHead>
                    <TableHead className="h-12">Status</TableHead>
                    <TableHead className="hidden md:table-cell h-12">Fees Count</TableHead>
                    {(canEdit || canDelete) && <TableHead className="w-36 text-center h-12">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <Tag className="size-10 mx-auto mb-2 opacity-30" /><p>No categories found</p>
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(cat => {
                    const freq = frequencyConfig[cat.frequency] || frequencyConfig.yearly;
                    return (
                      <TableRow key={cat.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div className="font-medium text-sm">{cat.name}</div>
                          {cat.description && <div className="text-xs text-muted-foreground truncate max-w-48">{cat.description}</div>}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell py-4"><Badge variant="outline">{cat.code}</Badge></TableCell>
                        <TableCell className="hidden sm:table-cell py-4">
                          <Badge variant="outline" className={`${freq.bg} border-0 font-medium`}>{freq.label}</Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="outline" className={cat.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0' : 'bg-zinc-100 dark:bg-zinc-900/30 text-zinc-500 border-0'}>
                            {cat.status === 'active' ? <CheckCircle2 className="size-3 mr-1" /> : <Ban className="size-3 mr-1" />}
                            {cat.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm py-4">{cat.feesCount}</TableCell>
                        {(canEdit || canDelete) && (
                          <TableCell className="text-center py-4">
                            <div className="flex items-center justify-center gap-1">
                              {canEdit && (
                                <>
                                  <Button variant="ghost" size="icon" className="size-7 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" onClick={() => handleEdit(cat)} title="Edit"><Pencil className="size-3.5" /></Button>
                                  <Button variant="ghost" size="icon" className="size-7 text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30" onClick={() => toggleStatus(cat)} title="Toggle status">
                                    {cat.status === 'active' ? <Ban className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                                  </Button>
                                </>
                              )}
                              {canDelete && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 className="size-3.5" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Delete Category</AlertDialogTitle><AlertDialogDescription>Delete &quot;{cat.name}&quot;? This will also remove associated structures.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(cat.id)} disabled={deleting} className="bg-red-600 hover:bg-red-700">{deleting ? 'Deleting...' : 'Delete'}</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => dispatch({ type: 'SET_ADD_OPEN', payload: o })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add Fee Category</DialogTitle><DialogDescription>Create a new fee category</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Name *</Label><Input value={addForm.name} onChange={e => dispatch({ type: 'SET_ADD_FORM', payload: { name: e.target.value } })} placeholder="Tuition Fee" /></div>
              <div className="grid gap-2"><Label>Code *</Label><Input value={addForm.code} onChange={e => dispatch({ type: 'SET_ADD_FORM', payload: { code: e.target.value } })} placeholder="TUITION" className="uppercase" /></div>
            </div>
            <div className="grid gap-2"><Label>Description</Label><Input value={addForm.description} onChange={e => dispatch({ type: 'SET_ADD_FORM', payload: { description: e.target.value } })} placeholder="Optional description" /></div>
            <div className="grid gap-2">
              <Label>Frequency *</Label>
              <Select value={addForm.frequency} onValueChange={v => dispatch({ type: 'SET_ADD_FORM', payload: { frequency: v } })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="one_time">One Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => dispatch({ type: 'SET_ADD_OPEN', payload: false })}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAdd} disabled={adding || !addForm.name || !addForm.code}>{adding ? 'Adding...' : 'Add Category'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => dispatch({ type: 'SET_EDIT_OPEN', payload: o })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Edit Category</DialogTitle><DialogDescription>Update &quot;{editItem?.name}&quot;</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Name</Label><Input value={editForm.name} onChange={e => dispatch({ type: 'SET_EDIT_FORM', payload: { name: e.target.value } })} /></div>
              <div className="grid gap-2"><Label>Code</Label><Input value={editForm.code} onChange={e => dispatch({ type: 'SET_EDIT_FORM', payload: { code: e.target.value } })} className="uppercase" /></div>
            </div>
            <div className="grid gap-2"><Label>Description</Label><Input value={editForm.description} onChange={e => dispatch({ type: 'SET_EDIT_FORM', payload: { description: e.target.value } })} /></div>
            <div className="grid gap-2">
              <Label>Frequency</Label>
              <Select value={editForm.frequency} onValueChange={v => dispatch({ type: 'SET_EDIT_FORM', payload: { frequency: v } })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="one_time">One Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => dispatch({ type: 'SET_EDIT_OPEN', payload: false })}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleEditSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

