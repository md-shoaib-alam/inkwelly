"use client";

import { FileSpreadsheet, Upload } from "lucide-react";

interface FileUploadZoneProps {
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileClick: () => void;
  importFile: File | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileUploadZone({
  dragOver,
  setDragOver,
  onDrop,
  onFileClick,
  importFile,
  fileInputRef,
  onFileChange,
}: FileUploadZoneProps) {
  return (
    <button
      type="button"
      className={`w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragOver ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-muted-foreground/25 hover:border-emerald-400 hover:bg-muted/50"}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={onFileClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onFileClick();
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={onFileChange}
      />
      {importFile ? (
        <div className="flex flex-col items-center gap-2">
          <FileSpreadsheet className="size-10 text-emerald-600" />
          <p className="text-sm font-medium text-foreground">
            {importFile.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {(importFile.size / 1024).toFixed(1)} KB: Click or drop to
            replace
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="size-10 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Drop your Excel or CSV file here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supports .xlsx, .xls, and .csv files
          </p>
        </div>
      )}
    </button>
  );
}
