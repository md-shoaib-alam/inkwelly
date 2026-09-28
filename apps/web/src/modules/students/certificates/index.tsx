'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import { useAppStore } from '@/store/use-app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import {
  Award, Eye, Plus, Printer, ShieldBan, Loader2, Download, MoreVertical, X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { apiFetch, fetchAllStudents } from '@/lib/api';
import { CertificateTemplate } from './adminCertificates/certificate-template';

// ── Types ──

interface CertificateRecord {
  id: string;
  certificateType: string;
  certificateNo: string;
  issueDate: string;
  content: any;
  status: string;
  student: any;
}

const CERT_TYPE_COLORS: Record<string, string> = {
  transfer: 'bg-blue-100 text-blue-700 border-blue-200',
  bonafide: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  character: 'bg-purple-100 text-purple-700 border-purple-200',
  migration: 'bg-amber-100 text-amber-700 border-amber-200',
  provisional: 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

export function AdminCertificates() {
  const queryClient = useQueryClient();
  const { currentTenantId } = useAppStore();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [viewCert, setViewCert] = useState<CertificateRecord | null>(null);
  const [revokeCert, setRevokeCert] = useState<CertificateRecord | null>(null);
  const [downloading, setDownloading] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: viewCert ? `Certificate_${viewCert.certificateNo}` : 'Certificate',
  });

  const handleDownloadPDF = async () => {
    if (!viewCert) return;
    setDownloading(true);
    try {
      const { downloadContainerAsPDF } = await import('@/lib/pdf-export');
      const filename = `${viewCert.certificateType}_${viewCert.certificateNo.replace(/\//g, '_')}.pdf`;
      
      // The user loves the Print UI, so we ensure the PDF capture uses the EXACT same styles
      await downloadContainerAsPDF({
        containerRef: contentRef,
        pageClassName: 'print-container',
        filename,
        width: 794, // Standard A4 width at 96 DPI
        height: 1123, // Standard A4 height at 96 DPI
        onStart: () => {
          toast.info("Generating PDF, please wait...", { id: 'pdf-progress' });
          // Inject the "perfect" print styles into the capture process
          const style = document.createElement('style');
          style.id = 'pdf-capture-styles';
          style.innerHTML = `
            .cert-frame { 
              width: 190mm !important; 
              height: 272mm !important; 
              margin: auto !important; 
              margin-top: 12mm !important;
              border: 12px double #92400e !important; 
              background: white !important;
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact;
            }
          `;
          document.head.appendChild(style);
        },
        onComplete: () => {
          setDownloading(false);
          toast.success("PDF downloaded successfully!", { id: 'pdf-progress' });
          document.getElementById('pdf-capture-styles')?.remove();
        },
        onError: (err: any) => {
          setDownloading(false);
          toast.error("Failed to generate PDF: " + err.message, { id: 'pdf-progress' });
          document.getElementById('pdf-capture-styles')?.remove();
        }
      });
    } catch (err: any) {
      console.error(err);
      setDownloading(false);
      toast.error("An error occurred during PDF generation.", { id: 'pdf-progress' });
    }
  };

  const [form, setForm] = useState({ 
    studentId: '', 
    certificateType: 'bonafide', 
    issueDate: new Date().toISOString().split('T')[0], 
    notes: '' 
  });

  // ── Queries (Optimized REST mode=min) ──

  const { data: certificatesData, isLoading: certsLoading } = useQuery({
    queryKey: ['certificates', 'history'],
    queryFn: async () => {
      const res = await apiFetch('/api/certificates?limit=50');
      if (!res.ok) throw new Error('Failed to fetch certificates');
      return res.json();
    },
  });

  const certificates = certificatesData?.items || [];

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', 'min'],
    queryFn: async () => {
      const res = await apiFetch('/api/classes?mode=min');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: students = [], isFetching: studentsLoading } = useQuery({
    queryKey: ['students', 'min', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      return fetchAllStudents({ classId: selectedClassId });
    },
    enabled: !!selectedClassId,
  });

  // Fetch tenant details (name, address, etc.) for certificate rendering
  const { data: tenantData } = useQuery({
    queryKey: ['tenant-settings', 'profile'],
    queryFn: async () => {
      const res = await apiFetch('/api/tenant-settings');
      if (!res.ok) return {};
      return res.json();
    },
  });

  // ── Mutations ──

  const generateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiFetch('/api/certificates', { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to generate');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Certificate Generated');
      setGenerateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
    onError: () => toast.error('Generation failed'),
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch('/api/certificates', { method: 'PUT', body: JSON.stringify({ id, status: 'revoked' }) });
      if (!res.ok) throw new Error('Failed to revoke');
    },
    onSuccess: () => {
      toast.success('Certificate Revoked');
      setRevokeCert(null);
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
    onError: () => toast.error('Revocation failed'),
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white !important; }
          .cert-frame { 
            width: 190mm !important; 
            height: 272mm !important; 
            margin: auto !important; 
            margin-top: 12mm !important;
            border: 12px double #92400e !important; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Award className="size-6 sm:h-7 sm:h-7 text-amber-600 shrink-0" /> 
            <span className="truncate">Certificates</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1 sm:line-clamp-none">Official student documentation management.</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700 h-9 sm:h-10 px-3 sm:px-4 shrink-0 gap-2" onClick={() => setGenerateOpen(true)}>
          <Plus className="size-4" /> 
          <span className="text-sm font-medium">Generate</span>
        </Button>
      </div>

      <Card className="no-print">
        <CardContent className="p-0">
          {certsLoading ? (
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b pb-4">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-16 ml-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <Table className="w-full min-w-[600px]">
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="hidden sm:table-cell px-2 sm:px-4">No.</TableHead>
                    <TableHead className="px-2 sm:px-4">Student & Type</TableHead>
                    <TableHead className="hidden sm:table-cell px-2 sm:px-4">Type</TableHead>
                    <TableHead className="px-2">Status</TableHead>
                    <TableHead className="text-right px-2 sm:px-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="hidden sm:table-cell font-mono text-xs px-2 sm:px-4 whitespace-nowrap">{c.certificateNo}</TableCell>
                      <TableCell className="px-2 sm:px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-sm whitespace-nowrap">{c.student?.user?.name || c.content?.studentName}</span>
                          <div className="sm:hidden flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">{c.certificateNo.split('/').pop()}</span>
                            <Badge variant="outline" className={`scale-75 origin-left px-1.5 py-0 ${CERT_TYPE_COLORS[c.certificateType]}`}>{c.certificateType}</Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell px-2 sm:px-4 whitespace-nowrap">
                        <Badge variant="outline" className={CERT_TYPE_COLORS[c.certificateType]}>{c.certificateType}</Badge>
                      </TableCell>
                      <TableCell className="px-2 whitespace-nowrap">
                        <Badge variant={c.status === 'active' ? 'default' : 'destructive'} className={`text-[10px] sm:text-xs h-5 sm:h-6 ${c.status === 'active' ? 'bg-emerald-500' : ''}`}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-2 sm:px-4 whitespace-nowrap w-[1%]">
                        <div className="flex items-center justify-end gap-1">
                          {/* Desktop Actions (xl and above) */}
                          <div className="hidden xl:flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setViewCert(c)}>
                              <Eye className="size-3.5 mr-1.5" /> 
                              <span>View</span>
                            </Button>
                            {c.status === 'active' && (
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setRevokeCert(c)}>
                                <ShieldBan className="size-3.5 mr-1.5" /> 
                                <span>Revoke</span>
                              </Button>
                            )}
                          </div>

                          {/* Mobile/Tablet Actions (below xl) */}
                          <div className="xl:hidden">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem onClick={() => setViewCert(c)}>
                                  <Eye className="size-4 mr-2" />
                                  <span>View</span>
                                </DropdownMenuItem>
                                {c.status === 'active' && (
                                  <DropdownMenuItem 
                                    onClick={() => setRevokeCert(c)}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  >
                                    <ShieldBan className="size-4 mr-2" />
                                    <span>Revoke</span>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {certificates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-sm text-muted-foreground">
                        No certificates issued yet. Click "Generate" to create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="no-print">
          <VisuallyHidden.Root>
            <DialogHeader>
              <DialogTitle>New Certificate</DialogTitle>
              <DialogDescription>Form to generate a new certificate for a student.</DialogDescription>
            </DialogHeader>
          </VisuallyHidden.Root>
          <DialogHeader><DialogTitle>New Certificate</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
              <SelectContent>{classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}-{c.section}</SelectItem>)}</SelectContent>
            </Select>

            <Select value={form.studentId} onValueChange={v => setForm({...form, studentId: v})} disabled={!selectedClassId || studentsLoading}>
              <SelectTrigger>{studentsLoading ? <Loader2 className="size-4 animate-spin mx-auto" /> : <SelectValue placeholder="Select Student" />}</SelectTrigger>
              <SelectContent>{students.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name || 'Unknown'}</SelectItem>)}</SelectContent>
            </Select>

            <Select value={form.certificateType} onValueChange={v => setForm({...form, certificateType: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bonafide">Bonafide Certificate</SelectItem>
                <SelectItem value="transfer">Transfer Certificate</SelectItem>
                <SelectItem value="character">Character Certificate</SelectItem>
              </SelectContent>
            </Select>

            <Input type="date" value={form.issueDate} onChange={e => setForm({...form, issueDate: e.target.value})} />
            <Textarea placeholder="Additional Notes..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>
          <DialogFooter>
            <Button className="bg-amber-600" onClick={() => generateMutation.mutate({ studentId: form.studentId, certificateType: form.certificateType, issueDate: form.issueDate, content: { notes: form.notes } })} disabled={generateMutation.isPending}>
              {generateMutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />} Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewCert} onOpenChange={v => !v && setViewCert(null)}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden no-print text-zinc-900">
          <VisuallyHidden.Root>
            <DialogHeader>
              <DialogTitle>Certificate Preview</DialogTitle>
              <DialogDescription>Full preview of the student certificate before printing.</DialogDescription>
            </DialogHeader>
          </VisuallyHidden.Root>
          <div className="p-3 sm:p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10">
            <h3 className="font-semibold text-zinc-900 truncate mr-2">Preview</h3>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => handlePrint()} 
                className="hidden sm:inline-flex bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-3 shrink-0 gap-2"
              >
                <Printer className="size-4" /> 
                <span className="text-sm font-bold">Print</span>
              </Button>
              <Button 
                onClick={handleDownloadPDF} 
                disabled={downloading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-3 shrink-0 gap-2"
              >
                {downloading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                <span className="text-sm font-bold">Download</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-zinc-500"
                onClick={() => setViewCert(null)}
              >
                <X className="size-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>
          <div className="max-h-[75vh] overflow-y-auto p-4 sm:p-8 bg-zinc-100/50 flex justify-center">
            <div className="scale-[0.38] xs:scale-[0.45] sm:scale-[0.7] lg:scale-100 origin-top">
              <div ref={contentRef} className="w-[210mm] bg-white shadow-2xl">
                <CertificateTemplate 
                  cert={viewCert} 
                  formatDate={formatDate}
                  schoolName={tenantData?.tenantName}
                  affiliation={tenantData?.affiliation}
                  schoolAddress={tenantData?.tenantAddress}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!revokeCert} onOpenChange={v => !v && setRevokeCert(null)}>
        <DialogContent>
           <VisuallyHidden.Root>
             <DialogHeader>
               <DialogTitle>Revoke Certificate</DialogTitle>
               <DialogDescription>Confirmation dialog to revoke an issued certificate.</DialogDescription>
             </DialogHeader>
           </VisuallyHidden.Root>
           <DialogHeader><DialogTitle className="text-red-600">Revoke Certificate</DialogTitle></DialogHeader>
           <p className="py-4 text-sm">Are you sure you want to revoke <strong>{revokeCert?.certificateNo}</strong>?</p>
           <DialogFooter>
              <Button variant="outline" onClick={() => setRevokeCert(null)}>Cancel</Button>
              <Button className="bg-red-600" onClick={() => revokeCert && revokeMutation.mutate(revokeCert.id)} disabled={revokeMutation.isPending}>Confirm Revoke</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
