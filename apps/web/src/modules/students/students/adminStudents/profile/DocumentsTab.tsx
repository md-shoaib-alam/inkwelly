"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Plus,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export interface StudentDoc {
  id: string;
  name: string;
  type: string;
  category: "required" | "optional";
  status: "uploaded" | "pending";
  fileName?: string;
  fileSize?: string;
  uploadedAt?: string;
  description?: string;
  remarks?: string;
}

const INITIAL_DOCUMENTS: StudentDoc[] = [
  {
    id: "doc_adhaar",
    name: "Adhaar Card",
    type: "adhaar",
    category: "required",
    status: "pending",
  },
];

const STORAGE_KEY_PREFIX = "inkwelly:student-docs:";

export function DocumentsTab({ studentRef }: { studentRef: string }) {
  const [docs, setDocs] = useState<StudentDoc[]>(INITIAL_DOCUMENTS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state matching Screenshot 2
  const [documentType, setDocumentType] = useState<string>("adhaar");
  const [documentName, setDocumentName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!studentRef) return;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${studentRef}`);
      if (stored) {
        setDocs(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [studentRef]);

  const saveDocs = (newDocs: StudentDoc[]) => {
    setDocs(newDocs);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${studentRef}`, JSON.stringify(newDocs));
    } catch {
      // ignore
    }
  };

  const requiredDocs = docs.filter((d) => d.category === "required");
  const optionalDocs = docs.filter((d) => d.category === "optional");
  const uploadedRequired = requiredDocs.filter((d) => d.status === "uploaded").length;

  const handleOpenUpload = (docId?: string) => {
    if (docId) {
      const found = docs.find((d) => d.id === docId);
      if (found) {
        setDocumentType(found.type);
        setDocumentName(found.name);
      }
    } else {
      setDocumentType("adhaar");
      setDocumentName("");
    }
    setSelectedFile(null);
    setDescription("");
    setRemarks("");
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!documentName) {
        setDocumentName(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    setTimeout(() => {
      const nameToUse = documentName.trim() || (documentType === "adhaar" ? "Adhaar Card" : "Document");
      const existingIdx = docs.findIndex((d) => d.type === documentType);

      const updatedDoc: StudentDoc = {
        id: existingIdx >= 0 ? docs[existingIdx].id : `doc_${Date.now()}`,
        name: nameToUse,
        type: documentType,
        category: documentType === "adhaar" ? "required" : "optional",
        status: "uploaded",
        fileName: selectedFile ? selectedFile.name : `${nameToUse}.pdf`,
        fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : "1.2 MB",
        uploadedAt: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        description: description.trim() || undefined,
        remarks: remarks.trim() || undefined,
      };

      let next: StudentDoc[];
      if (existingIdx >= 0) {
        next = [...docs];
        next[existingIdx] = updatedDoc;
      } else {
        next = [...docs, updatedDoc];
      }

      saveDocs(next);
      setSaving(false);
      setDialogOpen(false);
      toast.success(`${nameToUse} uploaded successfully`);
    }, 500);
  };

  const handleRemoveDoc = (id: string) => {
    if (!confirm("Are you sure you want to remove this document?")) return;
    const next = docs.map((d) => {
      if (d.id === id) {
        return {
          ...d,
          status: "pending" as const,
          fileName: undefined,
          fileSize: undefined,
          uploadedAt: undefined,
        };
      }
      return d;
    });
    saveDocs(next);
    toast.success("Document removed");
  };

  return (
    <div className="space-y-4">
      {/* Top Header matching Screenshot 1 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100/80 dark:bg-emerald-950/60 dark:text-emerald-400 dark:ring-emerald-900/40">
            <FileText className="size-4.5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
              Documents
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {uploadedRequired} of {requiredDocs.length} required documents submitted
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleOpenUpload()}
          className="h-8.5 rounded-xl border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <Plus className="mr-1.5 size-3.5" />
          Upload
        </Button>
      </div>

      {/* Main Card with EXACT header: div.px-5.h-10.flex.items-center.border-b */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="px-5 h-10 flex items-center border-b border-slate-100 dark:border-zinc-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            REQUIRED DOCUMENTS
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {requiredDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Red exclamation circle matching Screenshot 1 */}
                {doc.status === "uploaded" ? (
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                  </div>
                ) : (
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-[#fee2e2] text-[#ef4444] text-xs font-bold select-none">
                    !
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    {doc.name}
                  </h3>
                  {doc.status === "uploaded" && doc.fileName && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                      {doc.fileName} • {doc.fileSize} • Uploaded {doc.uploadedAt}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {doc.status === "uploaded" ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toast.success(`Downloading ${doc.fileName}...`)}
                      className="h-8.5 rounded-xl border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Download className="mr-1.5 size-3.5" />
                      Download
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      aria-label="Remove document"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenUpload(doc.id)}
                    className="h-8.5 rounded-xl border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <Upload className="mr-1.5 size-3.5" />
                    Upload
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Documents if any exist */}
      {optionalDocs.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="px-5 h-10 flex items-center border-b border-slate-100 dark:border-zinc-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              OTHER DOCUMENTS
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {optionalDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-800/30"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                    <FileText className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                      {doc.name}
                    </h3>
                    {doc.fileName && (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                        {doc.fileName} • {doc.fileSize}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toast.success(`Downloading ${doc.fileName}...`)}
                    className="h-8.5 rounded-xl border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Download className="mr-1.5 size-3.5" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new document Dialog Modal matching Screenshot 2 EXACTLY */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl sm:max-w-[560px] p-6 rounded-2xl border-slate-100 shadow-xl [&>button]:hidden">
          <form onSubmit={handleSave}>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
              <DialogTitle className="text-lg font-bold tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
                Add new document
              </DialogTitle>
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Form Fields matching Screenshot 2 */}
            <div className="space-y-4 pt-4 pb-2 text-xs">
              {/* Field 1: DOCUMENT TYPE */}
              <div className="space-y-1.5">
                <Label htmlFor="docType" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  DOCUMENT TYPE <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={documentType}
                  onValueChange={(val) => {
                    setDocumentType(val);
                    if (val === "adhaar") setDocumentName("Adhaar Card");
                    else if (val === "birth") setDocumentName("Birth Certificate");
                    else if (val === "tc") setDocumentName("Transfer Certificate");
                  }}
                >
                  <SelectTrigger id="docType" className="h-11 rounded-xl border-slate-200 text-sm px-3.5 focus:ring-1 focus:ring-[#0d9488] focus:border-[#0d9488]">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adhaar" className="text-sm">
                      <span className="flex items-center gap-1.5">
                        <span>⭐</span>
                        <span className="font-medium">Adhaar Card</span>
                        <span className="text-slate-400">(Required)</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="birth" className="text-sm">
                      <span className="font-medium">Birth Certificate</span>
                    </SelectItem>
                    <SelectItem value="tc" className="text-sm">
                      <span className="font-medium">Transfer Certificate</span>
                    </SelectItem>
                    <SelectItem value="marksheet" className="text-sm">
                      <span className="font-medium">Marksheet</span>
                    </SelectItem>
                    <SelectItem value="other" className="text-sm">
                      <span className="font-medium">Other</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Field 2: Document Name Input */}
              <div className="space-y-1">
                <Input
                  id="docName"
                  placeholder="e.g., Birth Certificate - John Doe"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 text-sm px-3.5 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                />
                <p className="text-[11.5px] text-slate-400 dark:text-zinc-500">
                  Enter a descriptive name for this document
                </p>
              </div>

              {/* Field 3: DOCUMENT FILE Dropzone matching Screenshot 2 */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  DOCUMENT FILE <span className="text-red-500">*</span>
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-xl border border-dashed border-slate-300 p-8 text-center transition-colors hover:border-slate-400 hover:bg-slate-50/50 dark:border-zinc-700 dark:hover:bg-zinc-800/40"
                >
                  <div className="grid size-12 shrink-0 place-items-center rounded-full bg-[#dff8f1] text-[#0d9488] mx-auto mb-2">
                    <Upload className="size-5.5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
                    {selectedFile ? selectedFile.name : "Select or upload document"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-zinc-500">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB selected` : "Click to browse your media library"}
                  </p>
                </div>
              </div>

              {/* Field 4: DESCRIPTION (Optional) */}
              <div className="space-y-1">
                <Label htmlFor="desc" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  DESCRIPTION <span className="font-normal text-slate-400">(Optional)</span>
                </Label>
                <textarea
                  id="desc"
                  rows={2}
                  placeholder="Add any additional details about this document..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 text-sm p-3.5 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#0d9488] focus:border-[#0d9488] dark:border-zinc-800 dark:bg-zinc-900 resize-none"
                />
                <p className="text-[11.5px] text-slate-400 dark:text-zinc-500">
                  Provide context or notes about this document
                </p>
              </div>

              {/* Field 5: REMARKS (Optional) */}
              <div className="space-y-1">
                <Label htmlFor="rem" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  REMARKS <span className="font-normal text-slate-400">(Optional)</span>
                </Label>
                <Input
                  id="rem"
                  placeholder="Optional remarks or notes"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 text-sm px-3.5 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#0d9488] focus-visible:border-[#0d9488]"
                />
                <p className="text-[11.5px] text-slate-400 dark:text-zinc-500">
                  Add any special notes or comments
                </p>
              </div>
            </div>

            {/* Modal Footer matching Screenshot 2 */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
                className="h-10 px-5 rounded-xl border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-10 px-6 rounded-xl bg-[#475569] text-sm font-semibold text-white hover:bg-slate-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-xs cursor-pointer"
              >
                {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Create document
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
