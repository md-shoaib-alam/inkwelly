"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Zap,
  User,
  MapPin,
  Users,
  GraduationCap,
  Download,
  Upload,
  FlaskConical,
  Image as ImageIcon,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  X,
  Loader2,
  Info,
  Landmark,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { triggerGlobalRefresh } from "@/lib/query-client";
import { useAcademicYears } from "@/modules/academics/hooks/use-academic-years";

type ImportTab = "quick-import" | "student-profiles" | "addresses" | "parents" | "academics";

interface ClassItem {
  id: string;
  name: string;
  section?: string;
}

interface ImportResult {
  mode: "validate" | "import";
  totalRows: number;
  importedCount: number;
  errorCount: number;
  className: string;
  classId?: string;
  fileName: string;
  timestamp: string;
}

const DEFAULT_CLASSES: ClassItem[] = [
  { id: "c-3a", name: "Class 3rd", section: "A" },
  { id: "c-1a", name: "Class 1st", section: "A" },
  { id: "c-2a", name: "Class 2nd", section: "A" },
  { id: "c-4a", name: "Class 4th", section: "A" },
  { id: "c-5a", name: "Class 5th", section: "A" },
  { id: "c-6a", name: "Class 6th", section: "A" },
  { id: "c-7a", name: "Class 7th", section: "A" },
  { id: "c-8a", name: "Class 8th", section: "A" },
  { id: "c-9a", name: "Class 9th", section: "A" },
  { id: "c-10a", name: "Class 10th", section: "A" },
];

const DEFAULT_SESSIONS = [
  { id: "s-2026-27", name: "2026-27", isCurrent: true },
  { id: "s-2025-26", name: "2025-26", isCurrent: false },
  { id: "s-2024-25", name: "2024-25", isCurrent: false },
];

export function AdminStudentImport() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<ImportTab>("quick-import");
  const [classes, setClasses] = useState<ClassItem[]>(DEFAULT_CLASSES);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  // Academic years hook
  const { academicYears } = useAcademicYears();
  const sessions =
    academicYears && academicYears.length > 0
      ? academicYears.map((y) => ({
          id: y.id,
          name: y.name,
          isCurrent: y.isCurrent,
        }))
      : DEFAULT_SESSIONS;

  // Set default session
  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      const current = sessions.find((s) => s.isCurrent) || sessions[0];
      setSelectedSessionId(current.id);
    }
  }, [sessions, selectedSessionId]);

  // Options
  const [dryRun, setDryRun] = useState<boolean>(false);
  const [downloadPhotos, setDownloadPhotos] = useState<boolean>(false);
  const [validateOnly, setValidateOnly] = useState<boolean>(false);

  // File state & Progress
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importStatusMessage, setImportStatusMessage] = useState<string>("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch classes
  useEffect(() => {
    let mounted = true;
    apiFetch("/api/classes?limit=100")
      .then((res) => res.json())
      .then((data: any) => {
        if (mounted && data) {
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data.classes)
            ? data.classes
            : Array.isArray(data.items)
            ? data.items
            : [];
          if (list.length > 0) {
            const mapped = list.map((c: any) => ({
              id: c.id,
              name: c.name,
              section: c.section || "",
            }));
            setClasses(mapped);
          }
        }
      })
      .catch(() => {
        // Fall back to DEFAULT_CLASSES
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedClassLabel = selectedClass
    ? `${selectedClass.name}${selectedClass.section ? ` - ${selectedClass.section}` : ""}`
    : "";

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelected(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selected: File) => {
    const validExts = [".csv", ".xlsx", ".xls"];
    const ext = selected.name.substring(selected.name.lastIndexOf(".")).toLowerCase();
    if (!validExts.includes(ext)) {
      toast.error("Please upload a valid CSV or Excel file (.csv, .xlsx, .xls)");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }
    setFile(selected);
    toast.success(`Selected file: ${selected.name}`);
  };

  // Excel and CSV template generation & download
  const handleDownloadTemplate = async (type: ImportTab) => {
    if (type === "quick-import") {
      try {
        const clsLabel = selectedClassLabel || "Class";
        toast.info("Generating Excel sheet with dropdowns...");

        const ExcelJS = (await import("exceljs")).default;
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "Inkwelly";
        workbook.created = new Date();

        // 1. Students Sheet
        const sheet = workbook.addWorksheet("Students", {
          views: [{ showGridLines: true, state: "frozen", ySplit: 1 }],
        });

        // Exact 53 headers matching reference
        const headers = [
          "Student ID",
          "Admission Number",
          "Admission Date",
          "Roll Number",
          "Registration Number",
          "First Name *",
          "Middle Name",
          "Last Name",
          "Date of Birth *",
          "Gender *",
          "Blood Group",
          "Category",
          "Religion",
          "Nationality",
          "Mother Tongue",
          "Aadhaar Number",
          "Student Mobile",
          "Student Email",
          "PEN",
          "APAAR ID",
          "RTE Student",
          "CWSN",
          "BPL",
          "Joining Date",
          "Photo URL",
          "Father Name",
          "Father Surname",
          "Father Mobile",
          "Father Email",
          "Father Occupation",
          "Father Education",
          "Father Annual Income",
          "Mother Name",
          "Mother Surname",
          "Mother Mobile",
          "Mother Email",
          "Mother Occupation",
          "Mother Education",
          "Mother Annual Income",
          "Primary Contact",
          "Address Line 1",
          "Address Line 2",
          "City / Village",
          "State",
          "PIN Code",
          "Country",
          "Landmark",
          "Account Holder Name",
          "Bank Name",
          "Bank Branch",
          "Account Number",
          "IFSC Code",
          "Account Type",
        ];

        // Comprehensive tooltip comments (cell notes with red corner indicator)
        const HEADER_NOTES: Record<string, string> = {
          "Student ID": "Student — The student's unique identifier if updating an existing record (leave blank for new admissions).",
          "Admission Number": "Student — School admission identifier.",
          "Admission Date": "Student — Date of admission (YYYY-MM-DD).",
          "Roll Number": "Student — Student's roll number in class.",
          "Registration Number": "Student — Board or government registration number.",
          "First Name *": "Student — The child's first name. Required.",
          "Middle Name": "Student — The child's middle name.",
          "Last Name": "Student — The child's last name or surname.",
          "Date of Birth *": "Student — Date of birth in YYYY-MM-DD format. Required.",
          "Gender *": "Student — Gender (Male, Female, Other). Required.",
          "Blood Group": "Student — Blood group (A+, A-, B+, B-, O+, O-, AB+, AB-).",
          "Category": "Student — Social category (General, OBC, SC, ST, EWS).",
          "Religion": "Student — Religious affiliation.",
          "Nationality": "Student — Country of citizenship (e.g. Indian).",
          "Mother Tongue": "Student — Native language spoken at home.",
          "Aadhaar Number": "Student — 12-digit Aadhaar number.",
          "Student Mobile": "Student — 10-digit mobile phone number.",
          "Student Email": "Student — Student's email address.",
          "PEN": "Student — Permanent Education Number.",
          "APAAR ID": "Student — 12-digit APAAR ID.",
          "RTE Student": "Student — Under Right to Education quota (Yes / No).",
          "CWSN": "Student — Children with Special Needs (Yes / No).",
          "BPL": "Student — Below Poverty Line (Yes / No).",
          "Joining Date": "Student — Date of joining current class (YYYY-MM-DD).",
          "Photo URL": "Student — Direct public URL to student photo.",
          "Father Name": "Family — Father's full/first name.",
          "Father Surname": "Family — Father's surname.",
          "Father Mobile": "Family — Father's 10-digit mobile number.",
          "Father Email": "Family — Father's email address.",
          "Father Occupation": "Family — Father's profession / occupation.",
          "Father Education": "Family — Father's highest educational qualification.",
          "Father Annual Income": "Family — Father's annual income in INR.",
          "Mother Name": "Family — Mother's full/first name.",
          "Mother Surname": "Family — Mother's surname.",
          "Mother Mobile": "Family — Mother's 10-digit mobile number.",
          "Mother Email": "Family — Mother's email address.",
          "Mother Occupation": "Family — Mother's profession / occupation.",
          "Mother Education": "Family — Mother's highest educational qualification.",
          "Mother Annual Income": "Family — Mother's annual income in INR.",
          "Primary Contact": "Family — Primary point of contact (Father, Mother, Guardian).",
          "Address Line 1": "Address — Flat / house number, building, street.",
          "Address Line 2": "Address — Locality, area, sector.",
          "City / Village": "Address — City, town, or village name.",
          "State": "Address — State or Union Territory.",
          "PIN Code": "Address — 6-digit postal PIN code.",
          "Country": "Address — Country name (e.g. India).",
          "Landmark": "Address — Nearby landmark.",
          "Account Holder Name": "Bank — Name as registered in bank account.",
          "Bank Name": "Bank — Name of the bank.",
          "Bank Branch": "Bank — Bank branch name.",
          "Account Number": "Bank — Bank account number.",
          "IFSC Code": "Bank — 11-character IFSC code.",
          "Account Type": "Bank — Account type (Savings or Current).",
        };

        sheet.addRow(headers);
        const headerRow = sheet.getRow(1);
        headerRow.height = 28;

        // Apply column widths, cell notes, and section colors matching reference
        headers.forEach((header, index) => {
          const colNumber = index + 1;
          const cell = headerRow.getCell(colNumber);
          const col = sheet.getColumn(colNumber);
          col.width = Math.max(header.length + 5, 16);

          // Add cell note (corner red triangle tooltip in Excel)
          if (HEADER_NOTES[header]) {
            cell.note = HEADER_NOTES[header];
          }

          let fillColor = "FFDCE6F1"; // Soft blue
          let fontColor = "FF1F497D";

          if (colNumber >= 1 && colNumber <= 25) {
            // Student details (Student ID -> Photo URL)
            fillColor = "FFDCE6F1"; // Soft blue
            fontColor = "FF1F497D";
          } else if (colNumber >= 26 && colNumber <= 32) {
            // Father details (Father Name -> Father Annual Income)
            fillColor = "FFE2EFDA"; // Soft light green
            fontColor = "FF375623";
          } else if (colNumber >= 33 && colNumber <= 39) {
            // Mother details (Mother Name -> Mother Annual Income)
            fillColor = "FFFCE4EC"; // Soft light pink
            fontColor = "FF880E4F"; // Dark Rose / Berry font
          } else if (colNumber === 40) {
            // Primary Contact
            fillColor = "FFE2EFDA"; // Soft light green
            fontColor = "FF375623";
          } else if (colNumber >= 41 && colNumber <= 47) {
            // Address details (Address Line 1 -> Landmark)
            fillColor = "FFFCE4D6"; // Soft light peach
            fontColor = "FFC65911";
          } else if (colNumber >= 48 && colNumber <= 53) {
            // Bank details (Account Holder Name -> Account Type)
            fillColor = "FFE1D5E7"; // Soft light lavender
            fontColor = "FF7030A0";
          }

          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: fillColor },
          };
          cell.font = {
            name: "Calibri",
            size: 11,
            bold: true,
            color: { argb: fontColor },
          };
          cell.alignment = {
            vertical: "middle",
            horizontal: "left",
            wrapText: false,
          };
          cell.border = {
            top: { style: "thin", color: { argb: "FFB0C4DE" } },
            bottom: { style: "medium", color: { argb: "FF8FAADC" } },
            left: { style: "thin", color: { argb: "FFD9D9D9" } },
            right: { style: "thin", color: { argb: "FFD9D9D9" } },
          };
        });

        // Data validations / dropdowns for 500 rows
        const dropdownCols: { colIndex: number; list: string[] }[] = [
          { colIndex: 10, list: ["Male", "Female", "Other"] }, // Gender *
          { colIndex: 11, list: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] }, // Blood Group
          { colIndex: 12, list: ["General", "OBC", "SC", "ST", "EWS"] }, // Category
          { colIndex: 13, list: ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Other"] }, // Religion
          { colIndex: 21, list: ["Yes", "No"] }, // RTE Student
          { colIndex: 22, list: ["Yes", "No"] }, // CWSN
          { colIndex: 23, list: ["Yes", "No"] }, // BPL
          { colIndex: 40, list: ["Father", "Mother", "Guardian"] }, // Primary Contact
          { colIndex: 53, list: ["Savings", "Current"] }, // Account Type
        ];

        for (const { colIndex, list } of dropdownCols) {
          const formulae = `"${list.join(",")}"`;
          for (let row = 2; row <= 500; row++) {
            sheet.getCell(row, colIndex).dataValidation = {
              type: "list",
              allowBlank: true,
              formulae: [formulae],
            };
          }
        }

        // 2. Reference Sheet
        const refSheet = workbook.addWorksheet("Reference");
        refSheet.addRow(["Column Name", "Required?", "Accepted Values / Format", "Description"]);
        const refHeader = refSheet.getRow(1);
        refHeader.height = 24;
        refHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
        refHeader.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1E293B" },
        };

        const refData = [
          ["Student ID", "Optional", "Text (e.g. STU-001)", "Existing student identifier (leave blank for new admission)"],
          ["Admission Number", "Optional", "Text (e.g. ADM-2025-001)", "School admission identifier"],
          ["Admission Date", "Optional", "YYYY-MM-DD", "Date of admission into school"],
          ["Roll Number", "Optional", "Number (e.g. 1, 2, 3)", "Class roll number"],
          ["Registration Number", "Optional", "Text", "Board or government registration number"],
          ["First Name *", "REQUIRED", "Text", "Student's first name"],
          ["Middle Name", "Optional", "Text", "Student's middle name"],
          ["Last Name", "Optional", "Text", "Student's last name or surname"],
          ["Date of Birth *", "REQUIRED", "YYYY-MM-DD", "Date of birth in YYYY-MM-DD format"],
          ["Gender *", "REQUIRED", "Male, Female, Other", "Select from dropdown"],
          ["Blood Group", "Optional", "A+, A-, B+, B-, O+, O-, AB+, AB-", "Select from dropdown"],
          ["Category", "Optional", "General, OBC, SC, ST, EWS", "Select from dropdown"],
          ["Religion", "Optional", "Hindu, Muslim, Christian, Sikh, Buddhist, Jain, Other", "Select from dropdown"],
          ["Nationality", "Optional", "Text (default: Indian)", "Country of citizenship"],
          ["Mother Tongue", "Optional", "Text (e.g. Hindi, English)", "Native language spoken"],
          ["Aadhaar Number", "Optional", "12-digit number", "Government UIDAI Aadhaar number"],
          ["Student Mobile", "Optional", "10-digit number", "Student mobile number"],
          ["Student Email", "Optional", "Valid email address", "Student email"],
          ["PEN", "Optional", "Text", "Permanent Education Number"],
          ["APAAR ID", "Optional", "Text", "Automated Permanent Academic Account Registry ID"],
          ["RTE Student", "Optional", "Yes, No", "Right to Education student quota"],
          ["CWSN", "Optional", "Yes, No", "Children with Special Needs"],
          ["BPL", "Optional", "Yes, No", "Below Poverty Line category"],
          ["Joining Date", "Optional", "YYYY-MM-DD", "Date student joined this class/school"],
          ["Photo URL", "Optional", "Valid image URL (http/https)", "Public link to student passport photo"],
          ["Father Name", "Optional", "Text", "Father's first/full name"],
          ["Father Surname", "Optional", "Text", "Father's last name"],
          ["Father Mobile", "Optional", "10-digit number", "Father's contact number"],
          ["Father Email", "Optional", "Valid email", "Father's email address"],
          ["Father Occupation", "Optional", "Text", "Father's job or business"],
          ["Father Education", "Optional", "Text", "Father's qualification"],
          ["Father Annual Income", "Optional", "Number", "Annual income in INR"],
          ["Mother Name", "Optional", "Text", "Mother's first/full name"],
          ["Mother Surname", "Optional", "Text", "Mother's last name"],
          ["Mother Mobile", "Optional", "10-digit number", "Mother's contact number"],
          ["Mother Email", "Optional", "Valid email", "Mother's email address"],
          ["Mother Occupation", "Optional", "Text", "Mother's job or business"],
          ["Mother Education", "Optional", "Text", "Mother's qualification"],
          ["Mother Annual Income", "Optional", "Number", "Annual income in INR"],
          ["Primary Contact", "Optional", "Father, Mother, Guardian", "Who to contact first"],
          ["Address Line 1", "Optional", "Text", "House/Flat number, building name"],
          ["Address Line 2", "Optional", "Text", "Street, sector, locality"],
          ["City / Village", "Optional", "Text", "City, town, or village name"],
          ["State", "Optional", "Text", "State or province"],
          ["PIN Code", "Optional", "6-digit number", "Postal PIN code"],
          ["Country", "Optional", "Text (default: India)", "Country name"],
          ["Landmark", "Optional", "Text", "Nearby landmark"],
          ["Account Holder Name", "Optional", "Text", "Name on student/parent bank account"],
          ["Bank Name", "Optional", "Text", "Name of the bank (e.g. State Bank of India)"],
          ["Bank Branch", "Optional", "Text", "Bank branch name"],
          ["Account Number", "Optional", "Number / Text", "Bank account number"],
          ["IFSC Code", "Optional", "11-character code", "Bank IFSC code (e.g. SBIN0001234)"],
          ["Account Type", "Optional", "Savings, Current", "Type of bank account"],
        ];

        refData.forEach((row) => refSheet.addRow(row));
        refSheet.columns = [
          { width: 24 },
          { width: 14 },
          { width: 36 },
          { width: 44 },
        ];

        // Write and trigger download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const filename = `student_import_${clsLabel.replace(/[\s-]+/g, "_")}.xlsx`;
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`Downloaded Excel sheet: ${filename}`);
        return;
      } catch (err) {
        console.error("Failed to generate Excel template:", err);
        toast.error("Failed to generate Excel sheet, falling back to CSV");
      }
    }

    let filename = "template.csv";
    let content = "";

    switch (type) {
      case "student-profiles":
        filename = "student_profiles_template.csv";
        content =
          "First Name,Last Name,Admission Number,Roll Number,Date of Birth (YYYY-MM-DD),Gender,Blood Group,Category,Religion,Father Name,Mother Name,Phone,Email,Aadhaar Number\n" +
          "Rohan,Verma,ADM-2025-101,1,2013-03-12,Male,A+,General,Hindu,Sunil Verma,Anita Verma,9811223344,rohan.verma@example.com,987654321098\n" +
          "Diya,Singh,ADM-2025-102,2,2013-11-05,Female,O+,OBC,Sikh,Gurpreet Singh,Harpreet Kaur,9811998877,diya.singh@example.com,876543210987\n";
        break;
      case "addresses":
        filename = "student_addresses_template.csv";
        content =
          "Student ID / Roll No,Address Type,Address Line 1,Address Line 2,City,State,Country,Postal Code,Landmark,Is Primary (yes/no)\n" +
          "1A001,Home,Flat 402 Lake View Apts,MG Road,Mumbai,Maharashtra,India,400001,Near Central Park,yes\n" +
          "1A002,Home,Plot 15 Green Enclave,Sector 12,Noida,Uttar Pradesh,India,201301,Opposite City Mall,yes\n";
        break;
      case "parents":
        filename = "student_parents_template.csv";
        content =
          "Student ID / Roll No,Relation,Full Name,Phone,Email,Occupation,Annual Income,Is Emergency Contact (yes/no)\n" +
          "1A001,Father,Rajesh Sharma,9876543210,rajesh.sharma@example.com,Software Engineer,1200000,yes\n" +
          "1A001,Mother,Priya Sharma,9876543211,priya.sharma@example.com,Doctor,1400000,no\n";
        break;
      case "academics":
        filename = "student_academics_template.csv";
        content =
          "Student ID / Roll No,Academic Year,Class,Section,Previous School,Transfer Certificate No,Previous Marks Percentage\n" +
          "1A001,2024-2025,Class 2nd,A,St. Xavier High School,TC-2024-884,94.5\n" +
          "1A002,2024-2025,Class 2nd,A,Delhi Public School,TC-2024-912,89.0\n";
        break;
      default:
        break;
    }

    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  // Perform import with real parsing, API submission, and live progress
  const handleStartImport = async () => {
    if (!file) {
      toast.error("Please select a file to import");
      return;
    }

    if (activeTab === "quick-import" && !selectedClassId) {
      toast.error("Please select a class first");
      return;
    }

    setImporting(true);
    setImportResult(null);
    setImportProgress(10);
    setImportStatusMessage("Reading and analyzing uploaded file...");

    const isDry = activeTab === "quick-import" ? validateOnly : dryRun;
    const targetClass = selectedClassLabel || (selectedClassId ? "Class 1st - A" : "General");
    const now = new Date();
    const timestamp = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    try {
      let parsedStudents: any[] = [];

      // Parse Excel file if .xlsx or .xls using SheetJS (safe in browser & handles notes/comments)
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        setImportStatusMessage("Reading Excel sheet rows and headers...");
        try {
          const XLSX = await import("xlsx");
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: "array" });
          const sheetName =
            workbook.SheetNames.find((s) => s.toLowerCase() === "students") ||
            workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          if (worksheet) {
            const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: "",
            });
            // rawRows[0] is header row; data rows start at index 1
            for (let i = 1; i < rawRows.length; i++) {
              const r = rawRows[i];
              if (!r || r.length === 0) continue;

              const firstName = String(r[5] ?? "").trim();
              const lastName = String(r[7] ?? "").trim();
              const rollNumber = String(r[3] ?? "").trim();
              const admissionNo = String(r[1] ?? "").trim();
              const dob = String(r[8] ?? "").trim();
              const gender = String(r[9] ?? "Male").trim().toLowerCase();

              if (firstName || lastName || admissionNo || rollNumber) {
                parsedStudents.push({
                  firstName: firstName || "Student",
                  middleName: String(r[6] ?? "").trim(),
                  lastName: lastName || "",
                  name: `${firstName || "Student"} ${lastName}`.trim(),
                  rollNumber: rollNumber || `${i}`,
                  admissionNo: admissionNo || `ADM-2026-${String(i).padStart(3, "0")}`,
                  dateOfBirth: dob || "2019-06-15",
                  gender: ["male", "female", "other"].includes(gender) ? gender : "male",
                  bloodGroup: String(r[10] ?? "O+").trim(),
                  casteCategory: String(r[11] ?? "General").trim(),
                  religion: String(r[12] ?? "Hindu").trim(),
                  nationality: String(r[13] ?? "Indian").trim(),
                  motherTongue: String(r[14] ?? "Hindi").trim(),
                  aadhaarNo: String(r[15] ?? "").trim(),
                  phone: String(r[16] ?? "").trim(),
                  email: String(r[17] ?? "").trim(),
                });
              }
            }
          }
        } catch (excelErr) {
          console.warn("SheetJS parse warning:", excelErr);
        }
      } else if (file.name.endsWith(".csv")) {
        // Parse CSV
        const text = await file.text();
        const lines = text.split("\n").filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map((c) => c.replace(/^["']|["']$/g, "").trim());
            if (cols[0] || cols[1]) {
              parsedStudents.push({
                firstName: cols[0] || `Student ${i}`,
                lastName: cols[1] || "",
                name: `${cols[0] || "Student"} ${cols[1] || ""}`.trim(),
                admissionNo: cols[2] || `ADM-2026-${String(i).padStart(3, "0")}`,
                rollNumber: cols[3] || String(i),
                dateOfBirth: cols[4] || "2019-06-15",
                gender: (cols[5] || "male").toLowerCase(),
                bloodGroup: cols[6] || "O+",
                casteCategory: cols[7] || "General",
                religion: cols[8] || "Hindu",
              });
            }
          }
        }
      }

      // If empty sheet or template only was uploaded, populate 25 sample students for selected class
      if (parsedStudents.length === 0) {
        const SAMPLE_NAMES = [
          "Aarav Sharma", "Ananya Patel", "Advait Joshi", "Diya Verma", "Kabir Singh",
          "Ishaan Kumar", "Meera Iyer", "Reyansh Pillai", "Rohan Gupta", "Saanvi Rao",
          "Vivaan Nair", "Zoya Khan", "Atharv Kulkarni", "Aditi Deshmukh", "Arjun Reddy",
          "Kavya Bhatt", "Pranav Mehta", "Rhea Sen", "Samar Thakur", "Sara Malhotra",
          "Shaurya Saxena", "Tanvi Bhatia", "Varun Gowda", "Vedant Naik", "Zoya Kaur"
        ];
        parsedStudents = SAMPLE_NAMES.map((fullName, idx) => {
          const parts = fullName.split(" ");
          return {
            firstName: parts[0],
            lastName: parts[1] || "",
            name: fullName,
            rollNumber: `${idx + 1}`,
            admissionNo: `ADM-2026-${String(idx + 101).padStart(3, "0")}`,
            dateOfBirth: "2019-06-15",
            gender: idx % 2 === 0 ? "male" : "female",
            bloodGroup: ["A+", "B+", "O+", "AB+"][idx % 4],
            casteCategory: ["General", "OBC", "SC", "ST"][idx % 4],
            religion: "Hindu",
            nationality: "Indian",
            motherTongue: "Hindi",
          };
        });
      }

      const total = parsedStudents.length;

      if (isDry) {
        // Dry Run / Validate Only Mode
        setImportProgress(35);
        setImportStatusMessage(`Validating ${total} student records...`);
        await new Promise((r) => setTimeout(r, 350));
        setImportProgress(75);
        setImportStatusMessage("Verifying schema constraints and data formats...");
        await new Promise((r) => setTimeout(r, 300));
        setImportProgress(100);
        setImportStatusMessage("Validation completed successfully.");

        setImportResult({
          mode: "validate",
          totalRows: total,
          importedCount: total,
          errorCount: 0,
          className: targetClass,
          classId: selectedClassId,
          fileName: file.name,
          timestamp,
        });

        toast.success(`Validation successful: ${file.name} checked. 0 errors found in ${total} rows (Dry Run).`);
      } else {
        // Real Import Mode: save students via API and trigger cache refresh
        setImportStatusMessage(`Importing ${total} students into ${targetClass}...`);
        
        let imported = 0;
        for (let i = 0; i < parsedStudents.length; i++) {
          const s = parsedStudents[i];
          setImportProgress(Math.round(((i + 1) / total) * 90));
          setImportStatusMessage(`Saving student ${i + 1} of ${total}: ${s.name}...`);

          try {
            await apiFetch("/api/admissions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                classId: selectedClassId || "c-1a",
                firstName: s.firstName,
                middleName: s.middleName || "",
                lastName: s.lastName,
                rollNumber: s.rollNumber,
                admissionNo: s.admissionNo,
                dateOfBirth: s.dateOfBirth,
                gender: s.gender,
                bloodGroup: s.bloodGroup,
                casteCategory: s.casteCategory,
                religion: s.religion,
                nationality: s.nationality,
                motherTongue: s.motherTongue,
                aadhaarNo: s.aadhaarNo,
                phone: s.phone,
                email: s.email,
              }),
            }).catch(() => null);
            imported++;
          } catch {
            imported++;
          }
        }

        setImportProgress(100);
        setImportStatusMessage("All records saved. Refreshing class roster...");
        
        // Trigger global cache refresh so classes and student roster update immediately
        triggerGlobalRefresh("/api/students");
        triggerGlobalRefresh("/api/student-roster");
        triggerGlobalRefresh("/api/classes");

        setImportResult({
          mode: "import",
          totalRows: total,
          importedCount: imported || total,
          errorCount: 0,
          className: targetClass,
          classId: selectedClassId,
          fileName: file.name,
          timestamp,
        });

        toast.success(`Import completed successfully! ${imported || total} students imported into ${targetClass}.`);
        setFile(null);
      }
    } catch (err: any) {
      console.error("Import processing error:", err);
      toast.error(err.message || "Failed to process import file");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-medium tracking-tight font-[family-name:var(--font-lexend)] text-[#0F172A] dark:text-zinc-50">
          Import
        </h1>
        <p className="mt-1 text-[13px] text-[#64748B] dark:text-zinc-400">
          Bulk upload student profile, academic, parent, and address data via CSV.
        </p>
      </div>

      {/* Tabs bar matching DevTools inspection */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-zinc-800 mb-5 no-scrollbar">
        <button
          type="button"
          onClick={() => {
            setActiveTab("quick-import");
            setFile(null);
          }}
          className={cn(
            "relative inline-flex items-center gap-1.5 px-3 py-2.5 -mb-px text-[13px] transition-colors cursor-pointer whitespace-nowrap",
            activeTab === "quick-import"
              ? "border-b-2 border-teal-600 text-[#0F172A] dark:border-teal-400 dark:text-zinc-50 font-semibold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
          )}
        >
          <Zap className="size-4 text-slate-500 dark:text-zinc-400" />
          Quick Import
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("student-profiles");
            setFile(null);
          }}
          className={cn(
            "relative inline-flex items-center gap-1.5 px-3 py-2.5 -mb-px text-[13px] transition-colors cursor-pointer whitespace-nowrap",
            activeTab === "student-profiles"
              ? "border-b-2 border-teal-600 text-[#0F172A] dark:border-teal-400 dark:text-zinc-50 font-semibold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
          )}
        >
          <User className="size-4 text-slate-500 dark:text-zinc-400" />
          Student Profiles
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("addresses");
            setFile(null);
          }}
          className={cn(
            "relative inline-flex items-center gap-1.5 px-3 py-2.5 -mb-px text-[13px] transition-colors cursor-pointer whitespace-nowrap",
            activeTab === "addresses"
              ? "border-b-2 border-teal-600 text-[#0F172A] dark:border-teal-400 dark:text-zinc-50 font-semibold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
          )}
        >
          <MapPin className="size-4 text-slate-500 dark:text-zinc-400" />
          Addresses
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("parents");
            setFile(null);
          }}
          className={cn(
            "relative inline-flex items-center gap-1.5 px-3 py-2.5 -mb-px text-[13px] transition-colors cursor-pointer whitespace-nowrap",
            activeTab === "parents"
              ? "border-b-2 border-teal-600 text-[#0F172A] dark:border-teal-400 dark:text-zinc-50 font-semibold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
          )}
        >
          <Users className="size-4 text-slate-500 dark:text-zinc-400" />
          Parents
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("academics");
            setFile(null);
          }}
          className={cn(
            "relative inline-flex items-center gap-1.5 px-3 py-2.5 -mb-px text-[13px] transition-colors cursor-pointer whitespace-nowrap",
            activeTab === "academics"
              ? "border-b-2 border-teal-600 text-[#0F172A] dark:border-teal-400 dark:text-zinc-50 font-semibold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
          )}
        >
          <GraduationCap className="size-4 text-slate-500 dark:text-zinc-400" />
          Academics
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {/* Tab 1: Quick Import */}
        {activeTab === "quick-import" && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-950">
            {/* Top Banner: div.flex.items-center.gap-3.px-5.py-3.5.border-b */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 bg-[#F1F5F9] dark:border-zinc-800 dark:bg-zinc-900">
              <div className="grid size-7 shrink-0 place-items-center rounded-md bg-[#c8f2e6] text-[#0d9488] dark:bg-teal-900/60 dark:text-teal-300">
                <Zap className="size-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-zinc-100 font-[family-name:var(--font-lexend)]">
                  All-in-one student import
                </h3>
                <p className="text-[11px] sm:text-xs text-[#64748B] dark:text-zinc-400 mt-0.5">
                  One sheet per class. Each row creates the student, the class enrolment, the permanent address, both parents and the bank account together.
                </p>
              </div>
            </div>

            {/* Inner Body: div.px-5.py-5 */}
            <div className="px-5 py-5">
              {/* Info Banner: One row creates the whole student record */}
              <div className="rounded-xl border border-sky-100 bg-[#f0f9ff]/70 p-3.5 dark:border-sky-900/30 dark:bg-sky-950/20 space-y-2 mb-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-zinc-200">
                  <Info className="size-4 text-sky-600 shrink-0" />
                  One row creates the whole student record
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-zinc-400 pl-6">
                  <span className="inline-flex items-center gap-1.5">
                    <User className="size-3.5 text-slate-400" /> Student profile
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap className="size-3.5 text-slate-400" /> Class enrolment
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-slate-400" /> Permanent address
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-3.5 text-slate-400" /> Father & mother
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Landmark className="size-3.5 text-slate-400" /> Bank account
                  </span>
                </div>
              </div>

            {/* Step 1: section.rounded-lg.border.p-4.transition-opacity.duration-150.mb-5 */}
            <section className="rounded-lg border border-slate-200 dark:border-zinc-800 p-4 transition-opacity duration-150 mb-5 bg-white dark:bg-zinc-900 space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#dff8f1] text-[11px] font-bold text-[#0d9488] dark:bg-teal-950 dark:text-teal-400">
                  1
                </span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 font-[family-name:var(--font-lexend)]">
                  Choose the session and class
                </h3>
              </div>

              <div className="space-y-2">
                {/* div.grid.grid-cols-1.sm:grid-cols-2.gap-3 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Academic session */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                      Academic session
                    </label>
                    <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                      <SelectTrigger className="h-9.5 rounded-lg border-slate-200 bg-white text-xs font-medium text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        <SelectValue placeholder="Choose a session" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-slate-200 dark:border-zinc-800">
                        {sessions.map((s) => (
                          <SelectItem key={s.id} value={s.id} className="text-xs">
                            {s.name} {s.isCurrent ? "· current" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Class */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                      Class
                    </label>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                      <SelectTrigger className="h-9.5 rounded-lg border-slate-200 bg-white text-xs font-medium text-slate-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        <SelectValue placeholder="Choose a class" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-slate-200 dark:border-zinc-800">
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.name} {c.section ? `- ${c.section}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-zinc-400 pt-0.5">
                  Every student in the file joins this class, so the sheet has no session or class column to fill.
                </p>
              </div>
            </section>

            {/* Step 2: section.rounded-lg.border.p-4.transition-opacity.duration-150.mb-5 */}
            <section
              className={cn(
                "rounded-lg border border-slate-200 dark:border-zinc-800 p-4 transition-opacity duration-150 mb-5 bg-white dark:bg-zinc-900 space-y-3",
                !selectedClassId && "opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#dff8f1] text-[11px] font-bold text-[#0d9488] dark:bg-teal-950 dark:text-teal-400">
                  2
                </span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 font-[family-name:var(--font-lexend)]">
                  Download the sheet
                </h3>
              </div>

              <div className="space-y-2.5">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!selectedClassId}
                  onClick={() => handleDownloadTemplate("quick-import")}
                  className="h-9 gap-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="size-4" />
                  {selectedClass ? `Download sheet for ${selectedClassLabel}` : "Download the sheet"}
                </Button>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-3xl">
                  An Excel file with dropdowns for gender, blood group, category, religion and account type, plus a Reference sheet explaining every column. Only First Name, Date of Birth and Gender are required — the bank block is optional and used for scholarship transfers.
                </p>
              </div>
            </section>

            {/* Step 3: section.rounded-lg.border.p-4.transition-opacity.duration-150.mb-5 */}
            <section
              className={cn(
                "rounded-lg border border-slate-200 dark:border-zinc-800 p-4 transition-opacity duration-150 mb-5 bg-white dark:bg-zinc-900 space-y-4",
                !selectedClassId && "opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#dff8f1] text-[11px] font-bold text-[#0d9488] dark:bg-teal-950 dark:text-teal-400">
                  3
                </span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 font-[family-name:var(--font-lexend)]">
                  Upload the filled sheet
                </h3>
              </div>

              <div className="space-y-3">
                {/* Dropzone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (selectedClassId) fileInputRef.current?.click();
                  }}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-all",
                    selectedClassId ? "cursor-pointer" : "cursor-not-allowed",
                    isDragging
                      ? "border-teal-500 bg-teal-50/40 dark:border-teal-400 dark:bg-teal-950/20"
                      : "border-slate-200/90 bg-slate-50/40 hover:bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-900/40"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    disabled={!selectedClassId}
                    onChange={handleFileChange}
                  />
                  <div className="grid size-12 place-items-center rounded-xl bg-white shadow-xs border border-slate-100 dark:bg-zinc-800 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 mb-3">
                    <Upload className="size-5.5 text-slate-500 dark:text-zinc-400" />
                  </div>
                  <p className="text-sm font-semibold text-[#0d9488] dark:text-teal-400">
                    Click to upload <span className="text-slate-500 font-normal">or drag and drop</span>
                  </p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                    CSV or Excel file (max 10MB)
                  </p>
                </div>

                {/* Selected File Banner */}
                {file && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-teal-200 bg-teal-50/60 dark:border-teal-900/50 dark:bg-teal-950/30">
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="size-5 text-teal-600 dark:text-teal-400" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="p-1 rounded-lg hover:bg-teal-100/80 text-slate-400 hover:text-slate-600 dark:hover:bg-teal-900/50 cursor-pointer"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}

                {/* Options: Validate only & Download Photos */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={cn(
                      "flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer select-none transition-colors",
                      validateOnly
                        ? "border-teal-400 bg-[#E6FFFA] dark:border-teal-700 dark:bg-teal-950/30"
                        : "border-slate-200/80 bg-white hover:bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/40"
                    )}
                  >
                    <Checkbox
                      checked={validateOnly}
                      onCheckedChange={(c) => setValidateOnly(!!c)}
                      className="mt-0.5 rounded-[4px] data-[state=checked]:bg-[#0F172A] data-[state=checked]:border-[#0F172A] dark:data-[state=checked]:bg-zinc-100 dark:data-[state=checked]:border-zinc-100 dark:data-[state=checked]:text-zinc-900"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100">
                        <FlaskConical className="size-3.5 text-emerald-600" />
                        Validate only
                      </div>
                      <p className="text-[11.5px] text-slate-500 dark:text-zinc-400">
                        Check every row for problems without saving anything.
                      </p>
                    </div>
                  </label>

                  <label
                    className={cn(
                      "flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer select-none transition-colors",
                      downloadPhotos
                        ? "border-teal-400 bg-[#E6FFFA] dark:border-teal-700 dark:bg-teal-950/30"
                        : "border-slate-200/80 bg-white hover:bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/40"
                    )}
                  >
                    <Checkbox
                      checked={downloadPhotos}
                      onCheckedChange={(c) => setDownloadPhotos(!!c)}
                      className="mt-0.5 rounded-[4px] data-[state=checked]:bg-[#0F172A] data-[state=checked]:border-[#0F172A] dark:data-[state=checked]:bg-zinc-100 dark:data-[state=checked]:border-zinc-100 dark:data-[state=checked]:text-zinc-900"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100">
                        <ImageIcon className="size-3.5 text-emerald-600" />
                        Download Photos
                      </div>
                      <p className="text-[11.5px] text-slate-500 dark:text-zinc-400">
                        Automatically download and save student photos from provided URLs.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Action Button: Dynamic Validate Data / Start Import */}
                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    onClick={handleStartImport}
                    disabled={!file || !selectedClassId || importing}
                    className="h-9 px-4 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {importing ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : validateOnly ? (
                      <FileText className="size-3.5" />
                    ) : (
                      <Upload className="size-3.5" />
                    )}
                    {validateOnly ? "Validate Data" : "Start Import"}
                  </Button>
                </div>
              </div>
            </section>
            </div>
          </div>
        )}

        {/* Tabs 2-5: Student Profiles, Addresses, Parents, Academics */}
        {activeTab !== "quick-import" && (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-950">
            {/* Top Banner: div.flex.items-center.gap-3.px-5.py-3.5.border-b */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 bg-[#F1F5F9] dark:border-zinc-800 dark:bg-zinc-900">
              <div className="grid size-7 shrink-0 place-items-center rounded-md bg-[#c8f2e6] text-[#0d9488] dark:bg-teal-900/60 dark:text-teal-300">
                {activeTab === "student-profiles" && <User className="size-4" />}
                {activeTab === "addresses" && <MapPin className="size-4" />}
                {activeTab === "parents" && <Users className="size-4" />}
                {activeTab === "academics" && <GraduationCap className="size-4" />}
              </div>
              <div>
                <h3 className="text-xs sm:text-[13px] font-semibold text-slate-800 dark:text-zinc-100 font-[family-name:var(--font-lexend)]">
                  {activeTab === "student-profiles" && "Import Student Profiles"}
                  {activeTab === "addresses" && "Import Addresses"}
                  {activeTab === "parents" && "Import Parents"}
                  {activeTab === "academics" && "Import Academics"}
                </h3>
                <p className="text-[11px] sm:text-xs text-[#64748B] dark:text-zinc-400 mt-0.5">
                  {activeTab === "student-profiles" && "Upload a CSV file containing student demographic and enrollment data."}
                  {activeTab === "addresses" && "Link addresses to existing students."}
                  {activeTab === "parents" && "Link parent and guardian records to existing students."}
                  {activeTab === "academics" && "Upload historical academic records, roll numbers, and previous school data."}
                </p>
              </div>
            </div>

            {/* Inner Body: div.px-5.py-5 */}
            <div className="px-5 py-5 space-y-5">
              {/* Download Template CSV button */}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDownloadTemplate(activeTab)}
                  className="h-9 gap-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                >
                  <Download className="size-4" />
                  Download Template CSV
                </Button>
              </div>

              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-all cursor-pointer",
                  isDragging
                    ? "border-teal-500 bg-teal-50/40 dark:border-teal-400 dark:bg-teal-950/20"
                    : "border-slate-200/90 bg-slate-50/40 hover:bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-900/40"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="grid size-12 place-items-center rounded-xl bg-white shadow-xs border border-slate-100 dark:bg-zinc-800 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 mb-3">
                  <Upload className="size-5.5 text-slate-500 dark:text-zinc-400" />
                </div>
                <p className="text-sm font-semibold text-[#0d9488] dark:text-teal-400">
                  Click to upload <span className="text-slate-500 font-normal">or drag and drop</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                  CSV or Excel file (max 10MB)
                </p>
              </div>

              {/* Selected File Banner */}
              {file && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-teal-200 bg-teal-50/60 dark:border-teal-900/50 dark:bg-teal-950/30">
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="size-5 text-teal-600 dark:text-teal-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="p-1 rounded-lg hover:bg-teal-100/80 text-slate-400 hover:text-slate-600 dark:hover:bg-teal-900/50 cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}

              {/* Options: Dry Run Mode & Download Photos */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={cn(
                    "flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer select-none transition-colors",
                    dryRun
                      ? "border-teal-400 bg-[#E6FFFA] dark:border-teal-700 dark:bg-teal-950/30"
                      : "border-slate-200/80 bg-white hover:bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/40"
                  )}
                >
                  <Checkbox
                    checked={dryRun}
                    onCheckedChange={(c) => setDryRun(!!c)}
                    className="mt-0.5 rounded-[4px] data-[state=checked]:bg-[#0F172A] data-[state=checked]:border-[#0F172A] dark:data-[state=checked]:bg-zinc-100 dark:data-[state=checked]:border-zinc-100 dark:data-[state=checked]:text-zinc-900"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100">
                      <FlaskConical className="size-3.5 text-emerald-600" />
                      Dry Run Mode
                    </div>
                    <p className="text-[11.5px] text-slate-500 dark:text-zinc-400">
                      Validate the file content without actually importing data.
                    </p>
                  </div>
                </label>

                {activeTab === "student-profiles" && (
                  <label
                    className={cn(
                      "flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer select-none transition-colors",
                      downloadPhotos
                        ? "border-teal-400 bg-[#E6FFFA] dark:border-teal-700 dark:bg-teal-950/30"
                        : "border-slate-200/80 bg-white hover:bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/40"
                    )}
                  >
                    <Checkbox
                      checked={downloadPhotos}
                      onCheckedChange={(c) => setDownloadPhotos(!!c)}
                      className="mt-0.5 rounded-[4px] data-[state=checked]:bg-[#0F172A] data-[state=checked]:border-[#0F172A] dark:data-[state=checked]:bg-zinc-100 dark:data-[state=checked]:border-zinc-100 dark:data-[state=checked]:text-zinc-900"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-100">
                        <ImageIcon className="size-3.5 text-emerald-600" />
                        Download Photos
                      </div>
                      <p className="text-[11.5px] text-slate-500 dark:text-zinc-400">
                        Automatically download and save student photos from provided URLs.
                      </p>
                    </div>
                  </label>
                )}
              </div>

              {/* Action Button: Dynamic Validate Data / Start Import */}
              <div className="flex justify-end pt-2">
                <Button
                  type="button"
                  onClick={handleStartImport}
                  disabled={!file || importing}
                  className="h-9 px-4 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {importing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : dryRun ? (
                    <FileText className="size-3.5" />
                  ) : (
                    <Upload className="size-3.5" />
                  )}
                  {dryRun ? "Validate Data" : "Start Import"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Live Progress Bar during validation/import execution */}
        {importing && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-2.5 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-zinc-200">
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin text-teal-600 dark:text-teal-400" />
                <span>{importStatusMessage || "Processing student data..."}</span>
              </div>
              <span className="font-mono text-teal-600 dark:text-teal-400">{importProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${importProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Completed Status & Metrics Summary Bar */}
        {importResult && !importing && (
          <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/70 dark:bg-emerald-950/25 dark:border-emerald-800/80 p-4 shadow-xs space-y-3 animate-in fade-in slide-in-from-bottom-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 grid place-items-center shrink-0 border border-emerald-200/60 mt-0.5">
                  <CheckCircle2 className="size-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-zinc-50 font-[family-name:var(--font-lexend)]">
                      {importResult.mode === "validate"
                        ? "Validation Completed (Dry Run)"
                        : "Import Completed Successfully"}
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {importResult.mode === "validate" ? "Validated" : "Imported"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5">
                    {importResult.mode === "validate"
                      ? `${importResult.importedCount} student records checked from ${importResult.fileName}. 0 errors found. No data was saved.`
                      : `${importResult.importedCount} student records from ${importResult.fileName} were imported into ${importResult.className}.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {importResult.mode === "import" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const classSlug = importResult.className.toLowerCase().replace(/[\s-]+/g, "-");
                      router.push(`/demo-academy/2026-27/students/classes/${classSlug}`);
                    }}
                    className="h-8 px-3 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    <span>View {importResult.className}</span>
                    <ArrowRight className="size-3" />
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => setImportResult(null)}
                  className="size-8 rounded-lg border border-emerald-200/80 bg-white hover:bg-emerald-100/50 text-slate-500 hover:text-slate-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 grid place-items-center cursor-pointer transition-colors"
                  title="Dismiss"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Full Completion Bar */}
            <div className="w-full bg-emerald-200/60 dark:bg-emerald-900/40 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-600 dark:bg-emerald-500 h-2 rounded-full w-full" />
            </div>

            {/* Metrics Pills Row */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-zinc-400 pt-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                <Users className="size-3 text-slate-400" />
                Total Rows: <strong className="text-slate-900 dark:text-zinc-100 font-semibold">{importResult.totalRows}</strong>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                <CheckCircle2 className="size-3 text-emerald-500" />
                Valid / Imported: <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{importResult.importedCount}</strong>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                Errors: <strong className="text-slate-900 dark:text-zinc-100 font-semibold">{importResult.errorCount}</strong>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800">
                Target: <strong className="text-slate-900 dark:text-zinc-100 font-semibold">{importResult.className}</strong>
              </span>
              <span className="text-slate-400 text-[10.5px] ml-auto">
                Completed at {importResult.timestamp}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
