"use client";

import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpectedColumnsInfoProps {
  onDownloadSample: (e: React.MouseEvent) => void;
  importFileSelected: boolean;
  detectedHeaders: string[];
}

const EXPECTED_COLUMNS = [
  "name",
  "email",
  "phone",
  "class (e.g. 10-A)",
  "roll_number",
  "gender",
  "date_of_birth",
  "blood_group",
  "admission_date",
  "transport_route",
  "pickup_point",
];

function matchesColumn(expectedCol: string, detectedHeaders: string[]): boolean {
  const mapping: Record<string, string[]> = {
    "name": ["name", "student name", "studentname"],
    "email": ["email", "email address", "emailaddress"],
    "phone": ["phone", "phone number", "phonenumber", "mobile", "contact"],
    "class (e.g. 10-A)": ["class", "classname", "class_name", "grade", "section"],
    "roll_number": ["roll number", "rollnumber", "roll_number", "rollno", "roll"],
    "gender": ["gender", "sex"],
    "date_of_birth": ["date of birth", "dateofbirth", "date_of_birth", "dob", "birthdate"],
    "blood_group": ["blood group", "bloodgroup", "blood_group", "bloodtype", "blood"],
    "admission_date": ["admission date", "admissiondate", "admission_date", "date of admission"],
    "transport_route": ["transport route", "transportroute", "route", "bus route"],
    "pickup_point": ["pickup point", "pickuppoint", "pickup", "bus stop", "stop"]
  };

  const possibleKeys = mapping[expectedCol] || [expectedCol];
  return detectedHeaders.some(header => {
    const normHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");
    return possibleKeys.some(pKey => {
      const normPKey = pKey.toLowerCase().replace(/[^a-z0-9]/g, "");
      return normHeader === normPKey;
    });
  });
}

export function ExpectedColumnsInfo({ 
  onDownloadSample,
  importFileSelected,
  detectedHeaders 
}: ExpectedColumnsInfoProps) {
  return (
    <div className="rounded-lg bg-muted/50 p-4 space-y-2">
      <p className="text-sm font-medium">Expected spreadsheet columns:</p>
      <div className="flex flex-wrap gap-1.5">
        {EXPECTED_COLUMNS.map((col) => {
          const isMatched = matchesColumn(col, detectedHeaders);
          const badgeClass = !importFileSelected
            ? "bg-secondary text-secondary-foreground border-transparent"
            : isMatched
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60"
              : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-900/60";

          return (
            <Badge
              key={col}
              variant="outline"
              className={cn("text-xs font-mono border", badgeClass)}
            >
              {col}
            </Badge>
          );
        })}
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline mt-1"
        onClick={onDownloadSample}
      >
        <Download className="size-3.5" />
        Download Sample Template
      </button>
    </div>
  );
}
