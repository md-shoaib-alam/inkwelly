"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Upload,
  Loader2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

// Sub-components
import { FileUploadZone } from "./import/FileUploadZone";
import { ExpectedColumnsInfo } from "./import/ExpectedColumnsInfo";
import { ImportResultAlert } from "./import/ImportResultAlert";

interface ImportExportButtonsProps {
  canCreate: boolean;
  tenantId: string;
  onImportSuccess: () => void;
}

export function ImportExportButtons({
  canCreate,
  tenantId,
  onImportSuccess,
}: ImportExportButtonsProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported: number;
    skipped?: number;
    errors: number;
    total: number;
    errorDetails?: string[];
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseHeaders = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (sheetName) {
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
          if (rows.length > 0) {
            setDetectedHeaders(rows[0] || []);
            return;
          }
        }
        setDetectedHeaders([]);
      } catch (err) {
        console.error("Failed to parse excel headers", err);
        setDetectedHeaders([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const pollImportStatus = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/import/status/${jobId}`);
        if (!res.ok) {
          clearInterval(interval);
          setImporting(false);
          setProgress(null);
          toast.error("Failed to check import progress.");
          return;
        }
        const data = await res.json();
        
        if (data.state === "completed" || data.state === "failed") {
          clearInterval(interval);
          setImporting(false);
          setProgress(null);
          
          const result = data.result || data.details || { success: data.state === "completed", imported: 0, skipped: 0, errors: 0, total: 0 };
          setImportResult({
            success: data.state === "completed" && (!result.errors || result.errors === 0),
            imported: result.imported || 0,
            skipped: result.skipped || 0,
            errors: result.errors || 0,
            total: result.total || 0,
            errorDetails: result.errorDetails || []
          });
          
          if (data.state === "completed" && (!result.errors || result.errors === 0)) {
            const skippedMsg = result.skipped ? ` (${result.skipped} skipped)` : "";
            toast.success(`Successfully imported ${result.imported} of ${result.total} students${skippedMsg}.`);
            onImportSuccess();
            setTimeout(() => {
              setImportDialogOpen(false);
            }, 5000);
          } else {
            toast.error(`${result.errors || 0} of ${result.total || 0} records had errors.`);
            onImportSuccess(); // Refresh to show whatever did succeed
          }

        } else {
          setProgress(data.progress || 0);
          if (data.details) {
            setImportResult({
              success: false,
              imported: data.details.imported || 0,
              skipped: data.details.skipped || 0,
              errors: data.details.errors || 0,
              total: data.details.total || 0,
              errorDetails: data.details.errorDetails || []
            });
          }
        }
      } catch (err) {
        clearInterval(interval);
        setImporting(false);
        setProgress(null);
        toast.error("An error occurred during import progress check.");
      }
    }, 1500);
  };

  const downloadSampleTemplate = async () => {
    const XLSX = await import("xlsx");
    const data = [
      {
        "name": "John Doe",
        "email": "john@school.com",
        "phone": "+91 98765 43210",
        "class (e.g. 10-A)": "10-A",
        "roll_number": "001",
        "gender": "male",
        "date_of_birth": "2010-05-15",
        "blood_group": "O+",
        "admission_date": "2024-04-01",
        "transport_route": "Route 1",
        "pickup_point": "Sector 4 Main Gate"
      },
      {
        "name": "Jane Smith",
        "email": "jane@school.com",
        "phone": "+91 98765 43211",
        "class (e.g. 10-A)": "10-A",
        "roll_number": "002",
        "gender": "female",
        "date_of_birth": "2010-08-22",
        "blood_group": "A-",
        "admission_date": "2024-04-01",
        "transport_route": "",
        "pickup_point": ""
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set custom column widths (in characters) to make every column spacious and easy to read
    worksheet["!cols"] = [
      { wch: 20 }, // name
      { wch: 25 }, // email
      { wch: 18 }, // phone
      { wch: 20 }, // class (e.g. 10-A)
      { wch: 15 }, // roll_number
      { wch: 12 }, // gender
      { wch: 16 }, // date_of_birth
      { wch: 14 }, // blood_group
      { wch: 16 }, // admission_date
      { wch: 20 }, // transport_route
      { wch: 25 }  // pickup_point
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students Template");

    // Write workbook to array buffer and trigger download
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_students.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Excel template downloaded successfully.");
  };

  const handleImport = async () => {
    if (!importFile || !tenantId) {
      toast.error("Please select a file and ensure a tenant is selected.");
      return;
    }
    setImporting(true);
    setImportResult(null);
    setProgress(null);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      formData.append("tenantId", tenantId);
      formData.append("dataType", "students");
      const res = await apiFetch("/api/import", {
        method: "POST",
        body: formData,
      });

      // Parse body regardless of status to capture error details
      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned status ${res.status} with unreadable response`);
      }

      if (!res.ok) {
        throw new Error(data?.error || data?.message || `Import request failed (HTTP ${res.status})`);
      }
      
      if (data.status === "queued") {
        setProgress(0);
        toast.info("Large import job started. Tracking progress...");
        pollImportStatus(data.jobId);
      } else {
        setImportResult(data);
        if (data.success) {
          const skippedMsg = data.skipped ? ` (${data.skipped} skipped)` : "";
          toast.success(`Successfully imported ${data.imported} of ${data.total} students${skippedMsg}.`);
          onImportSuccess();
          setTimeout(() => {
            setImportDialogOpen(false);
          }, 5000);
        } else {
          // Show actual error details in the UI
          const details = data.errorDetails?.length ? data.errorDetails.slice(0, 3).join('; ') : 'Check the error details below.';
          toast.error(`Import issue: ${details}`);
          onImportSuccess(); // Refresh to show whatever succeeded
        }

        setImporting(false);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Unknown import error';
      console.error('[ImportStudents] Import failed:', errorMsg, err);
      setImportResult({ success: false, imported: 0, errors: 1, total: 0, errorDetails: [errorMsg] });
      toast.error(`Import error: ${errorMsg}`);
      setImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    const extension = file?.name.split('.').pop()?.toLowerCase();
    if (file && ["xlsx", "xls", "csv"].includes(extension || "")) {
      setImportFile(file);
      setImportResult(null);
      parseHeaders(file);
    } else {
      toast.error("Please upload an Excel (.xlsx, .xls) or CSV file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (["xlsx", "xls", "csv"].includes(extension || "")) {
        setImportFile(file);
        setImportResult(null);
        parseHeaders(file);
      } else {
        toast.error("Please upload an Excel (.xlsx, .xls) or CSV file.");
      }
    }
  };

  if (!canCreate) return null;

  return (
    <>
      <Button
        variant="outline"
        className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
        onClick={() => {
          setImportDialogOpen(true);
          setImportFile(null);
          setImportResult(null);
          setDetectedHeaders([]);
        }}
      >
        <Upload className="size-4 mr-2" />
        Import Students
      </Button>

      <Dialog
        open={importDialogOpen}
        onOpenChange={(open) => {
          setImportDialogOpen(open);
          if (!open) {
            setImportFile(null);
            setImportResult(null);
            setDetectedHeaders([]);
          }
        }}
      >
         <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Students</DialogTitle>
            <DialogDescription>
              Upload an Excel (.xlsx, .xls) or CSV (.csv) file to import students in bulk
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FileUploadZone 
              dragOver={dragOver}
              setDragOver={setDragOver}
              onDrop={handleDrop}
              onFileClick={() => fileInputRef.current?.click()}
              importFile={importFile}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
            />

            {progress !== null && (
              <div className="space-y-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-lg">
                <div className="flex justify-between items-center text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                    Adding students...
                  </span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-emerald-100 dark:bg-emerald-900/30" indicatorClassName="bg-emerald-600 dark:bg-emerald-400" />
                {importResult && (
                  <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                    <span>Imported: {importResult.imported}</span>
                    <span>Skipped: {importResult.skipped || 0}</span>
                    <span>Errors: {importResult.errors}</span>
                    <span>Total: {importResult.total}</span>
                  </div>
                )}
              </div>
            )}

            <ExpectedColumnsInfo 
              onDownloadSample={(e) => {
                e.stopPropagation();
                downloadSampleTemplate();
              }}
              importFileSelected={!!importFile}
              detectedHeaders={detectedHeaders}
            />

            {progress === null && <ImportResultAlert result={importResult} />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleImport}
              disabled={!importFile || importing}
            >
              {importing ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="size-4 mr-2" />
                  Import Students
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
