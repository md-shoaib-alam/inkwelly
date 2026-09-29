"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Percent, DollarSign, Plus, ThumbsUp, Ban, Trash2 } from 'lucide-react';
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, fetchAllStudents } from '@/lib/api';
import { useFeeConcessions, useCreateFeeConcession, useFeeCategories } from '@/modules/student-fees/fees/hooks/use-fees';
import { concessionStatusConfig } from './config';
import type { FeeConcession, FeeCategory, StudentOption, ClassOption } from './types';

interface ConcessionsTabProps {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function ConcessionsTab({ canCreate, canEdit, canDelete }: ConcessionsTabProps) {
  const { data: concessions = [], isLoading: loadingConcessions } = useFeeConcessions();
  const { data: categories = [] } = useFeeCategories();
  const queryClient = useQueryClient();
  const createConcession = useCreateFeeConcession();

  const { data: studentsData } = useQuery({
    queryKey: ['students-min'],
    queryFn: () => fetchAllStudents()
  });

  const students = useMemo(() => {
    const raw = Array.isArray(studentsData) ? studentsData : [];
    return raw.map((s: any) => ({
      id: s.id,
      name: s.name,
      className: s.className,
      classId: s.classId,
      rollNumber: s.rollNumber,
      phone: s.phone || ''
    }));
  }, [studentsData]);

  const { data: classesData } = useQuery({
    queryKey: ['classes-min'],
    queryFn: async () => {
      const res = await apiFetch('/api/classes?mode=min');
      return res.json();
    }
  });

  const classes = useMemo(() => {
    return Array.isArray(classesData) ? classesData : classesData?.items || [];
  }, [classesData]);

  const loading = loadingConcessions;

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ classId: '', studentId: '', concessionType: 'percentage', amount: '', reason: '', feeCategoryId: '', validFrom: '', validUntil: '' });
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    return concessions.filter(c => {
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchType = typeFilter === 'all' || c.concessionType === typeFilter;
      const selectedClass = classes.find(cl => cl.id === classFilter);
      const matchClass = classFilter === 'all' || 
        (selectedClass && c.studentClass === `${selectedClass.name}-${selectedClass.section}`) || 
        c.studentClass === classFilter;
      return matchStatus && matchType && matchClass;
    });
  }, [concessions, statusFilter, typeFilter, classFilter, classes]);

  const activeConcessions = concessions.filter(c => c.status === 'active');
  const totalConcessionAmount = activeConcessions.reduce((sum, c) => sum + c.amount, 0);

  const handleAdd = async () => {
    if (!addForm.studentId || !addForm.concessionType) { toast.error('Student and concession type are required'); return; }
    setAdding(true);
    try {
      const { feeCategoryId, validFrom, validUntil, ...rest } = addForm;
      await createConcession.mutateAsync({
        ...rest,
        amount: Number(addForm.amount) || 0,
        feeCategoryId: feeCategoryId || null,
        validFrom: validFrom || null,
        validUntil: validUntil || null,
      });
      setAddOpen(false);
      setAddForm({ classId: '', studentId: '', concessionType: 'percentage', amount: '', reason: '', feeCategoryId: '', validFrom: '', validUntil: '' });
    } catch { /* handled by mutation */ }
    setAdding(false);
  };

  const handleAction = async (id: string, action: 'active' | 'revoked') => {
    try {
      const res = await apiFetch('/api/fee-concessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: action }),
      });
      if (res.ok) {
        toast.success(action === 'active' ? 'Concession approved!' : 'Concession revoked!');
        queryClient.invalidateQueries({ queryKey: ['fee-concessions'] });
      }
    } catch { toast.error('Error updating concession'); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/fee-concessions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Concession deleted!');
        queryClient.invalidateQueries({ queryKey: ['fee-concessions'] });
      }
      else toast.error('Failed to delete');
    } catch { toast.error('Error deleting'); }
    setDeleting(false);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"><Percent className="size-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Active Concessions</p>
              <p className="text-2xl font-bold">{activeConcessions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-xl flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"><DollarSign className="size-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Concession Amount</p>
              <p className="text-2xl font-bold">₹{totalConcessionAmount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Add */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="fixed">Fixed</SelectItem>
            <SelectItem value="full_waiver">Full Waiver</SelectItem>
          </SelectContent>
        </Select>
        <Select value={classFilter} onValueChange={v => { setClassFilter(v); }}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Class" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}-{c.section}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="sm:ml-auto">
          {canCreate && (
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setAddOpen(true)}>
              <Plus className="size-4 mr-2" />Add Concession
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fee Concessions</CardTitle>
          <CardDescription>{filtered.length} records</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6 h-12">Student</TableHead>
                    <TableHead className="hidden sm:table-cell h-12">Type</TableHead>
                    <TableHead className="h-12">Amount</TableHead>
                    <TableHead className="hidden md:table-cell h-12">Reason</TableHead>
                    <TableHead className="hidden lg:table-cell h-12">Valid Until</TableHead>
                    <TableHead className="h-12">Status</TableHead>
                    {(canEdit || canDelete) && <TableHead className="w-28 text-center h-12">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Percent className="size-10 mx-auto mb-2 opacity-30" /><p>No concessions found</p>
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(c => {
                    const statusCfg = concessionStatusConfig[c.status] || concessionStatusConfig.active;
                    return (
                      <TableRow key={c.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors">
                        <TableCell className="pl-6 py-4">
                          <div>
                            <span className="font-medium text-sm">{c.studentName}</span>
                            <span className="text-xs text-muted-foreground ml-1">({c.studentClass})</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell py-4">
                          <Badge variant="outline" className="capitalize">{c.concessionType.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold py-4">{c.concessionType === 'percentage' ? `${c.amount}%` : c.concessionType === 'full_waiver' ? 'Full' : `₹${c.amount.toLocaleString()}`}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-32 py-4">{c.reason || '–'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground py-4">{c.validUntil || '–'}</TableCell>
                        <TableCell className="py-4">
                          <Badge variant="outline" className={`${statusCfg.bg} border-0 capitalize`}>{c.status}</Badge>
                        </TableCell>
                        {(canEdit || canDelete) && (
                          <TableCell className="text-center py-4">
                            <div className="flex items-center justify-center gap-1">
                              {canEdit && c.status !== 'active' && (
                                <Button variant="ghost" size="icon" className="size-7 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" onClick={() => handleAction(c.id, 'active')} title="Approve"><ThumbsUp className="size-3.5" /></Button>
                              )}
                              {canEdit && c.status === 'active' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-7 text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30" title="Revoke"><Ban className="size-3.5" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Revoke Concession</AlertDialogTitle>
                                      <AlertDialogDescription>Are you sure you want to revoke this concession for {c.studentName}? This will reset the concession discount on pending fees.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleAction(c.id, 'revoked')} className="bg-amber-600 hover:bg-amber-700 text-white">Revoke</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                              {canDelete && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 className="size-3.5" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Delete Concession</AlertDialogTitle><AlertDialogDescription>Delete concession for {c.studentName}?</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(c.id)} disabled={deleting} className="bg-red-600 hover:bg-red-700">{deleting ? 'Deleting...' : 'Delete'}</AlertDialogAction>
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

      {/* Add Concession Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add Concession</DialogTitle><DialogDescription>Grant fee concession to a student</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Class *</Label>
              <Select value={addForm.classId} onValueChange={v => setAddForm(p => ({ ...p, classId: v, studentId: '' }))}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>{(Array.isArray(classes) ? classes : []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}-{c.section}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Student *</Label>
              <Select value={addForm.studentId} onValueChange={v => setAddForm(p => ({ ...p, studentId: v }))} disabled={!addForm.classId}>
                <SelectTrigger><SelectValue placeholder={addForm.classId ? 'Select student' : 'Select class first'} /></SelectTrigger>
                <SelectContent>{(Array.isArray(students) ? students : []).filter(s => !addForm.classId || s.classId === addForm.classId).map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.className})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type *</Label>
                <Select value={addForm.concessionType} onValueChange={v => setAddForm(p => ({ ...p, concessionType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="full_waiver">Full Waiver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Amount</Label>
                <Input type="number" min="0" value={addForm.amount} onChange={e => setAddForm(p => ({ ...p, amount: e.target.value }))} placeholder={addForm.concessionType === 'percentage' ? 'e.g. 50' : 'e.g. 1000'} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Fee Category (optional)</Label>
              <Select value={addForm.feeCategoryId} onValueChange={v => setAddForm(p => ({ ...p, feeCategoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>{categories.filter(c => c.status === 'active').map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Valid From</Label><Input type="date" value={addForm.validFrom} onChange={e => setAddForm(p => ({ ...p, validFrom: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Valid Until</Label><Input type="date" value={addForm.validUntil} onChange={e => setAddForm(p => ({ ...p, validUntil: e.target.value }))} /></div>
            </div>
            <div className="grid gap-2"><Label>Reason</Label><Input value={addForm.reason} onChange={e => setAddForm(p => ({ ...p, reason: e.target.value }))} placeholder="Reason for concession" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleAdd} disabled={adding || !addForm.studentId}>{adding ? 'Adding...' : 'Add Concession'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
