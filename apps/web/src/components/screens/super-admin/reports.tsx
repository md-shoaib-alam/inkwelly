"use client";

import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { useTenants, useUsers } from "@/lib/graphql/hooks";

// Subcomponents and types
import { ReportType, ExportFormat, ColumnDefinition } from "./reports/types";
import { CustomReportBuilder } from "./reports/CustomReportBuilder";
import { LiveReportPreview } from "./reports/LiveReportPreview";
import { StandardReports } from "./reports/StandardReports";

export function SuperAdminReports() {
  const [reportType, setReportType] = useState<ReportType>("schools");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");

  // Columns per report type
  const columnsConfig: Record<ReportType, ColumnDefinition[]> = {
    schools: [
      { id: "name", label: "School Name" },
      { id: "principal", label: "Principal" },
      { id: "plan", label: "Subscription Plan" },
      { id: "studentsCount", label: "Students Count" },
      { id: "teachersCount", label: "Teachers Count" },
      { id: "status", label: "Status" },
      { id: "email", label: "Contact Email" },
      { id: "phone", label: "Contact Phone" },
      { id: "establishedDate", label: "Established Date" },
    ],
    students: [
      { id: "name", label: "Student Name" },
      { id: "email", label: "Email" },
      { id: "phone", label: "Phone" },
      { id: "rollNumber", label: "Roll Number" },
      { id: "class", label: "School / Class" },
      { id: "gender", label: "Gender" },
      { id: "status", label: "Status" },
      { id: "admissionDate", label: "Admission Date" },
    ],
    parents: [
      { id: "name", label: "Parent Name" },
      { id: "email", label: "Email" },
      { id: "phone", label: "Phone" },
      { id: "occupation", label: "Occupation" },
      { id: "status", label: "Status" },
      { id: "childrenCount", label: "Children Count" },
    ],
    users: [
      { id: "name", label: "Name" },
      { id: "email", label: "Email" },
      { id: "role", label: "Role" },
      { id: "phone", label: "Phone" },
      { id: "status", label: "Status" },
      { id: "joinedDate", label: "Joined Date" },
    ]
  };

  // Default selected columns
  const [selectedColumns, setSelectedColumns] = useState<Record<ReportType, string[]>>({
    schools: ["name", "principal", "plan", "studentsCount", "teachersCount", "status", "email"],
    students: ["name", "email", "phone", "rollNumber", "class", "status"],
    parents: ["name", "email", "phone", "occupation", "status"],
    users: ["name", "email", "role", "phone", "status", "joinedDate"]
  });

  // --- Real Backend Data Fetching ---
  const { data: tenantsData, isLoading: loadingSchools } = useTenants({ limit: 100 });
  const { data: studentsData, isLoading: loadingStudents } = useUsers({ role: "student", limit: 100 });
  const { data: parentsData, isLoading: loadingParents } = useUsers({ role: "parent", limit: 100 });
  const { data: usersData, isLoading: loadingUsers } = useUsers({ limit: 100 });

  const isDataLoading = loadingSchools || loadingStudents || loadingParents || loadingUsers;

  // Mock fallbacks in case the system is running with zero records in development
  const mockSchools = useMemo(() => [
    { name: "Greenwood High", principal: "Dr. Sarah Johnson", plan: "Premium", studentsCount: 850, teachersCount: 65, status: "Active", email: "admin@greenwood.edu", phone: "+15550192", establishedDate: "2022-05-15" },
    { name: "Riverside Academy", principal: "Mr. Michael Chen", plan: "Premium", studentsCount: 620, teachersCount: 48, status: "Active", email: "contact@riverside.edu", phone: "+15550143", establishedDate: "2021-08-10" },
    { name: "Maple Leaf Elementary", principal: "Mrs. Emily Williams", plan: "Starter", studentsCount: 420, teachersCount: 32, status: "Active", email: "info@mapleleaf.edu", phone: "+15550188", establishedDate: "2023-01-20" },
    { name: "Summit Learning", principal: "Dr. Robert Martin", plan: "Premium", studentsCount: 980, teachersCount: 78, status: "Active", email: "info@summitlearning.edu", phone: "+15550129", establishedDate: "2020-11-05" },
    { name: "Lakeside Middle", principal: "Ms. Jennifer Brown", plan: "Starter", studentsCount: 540, teachersCount: 42, status: "Inactive", email: "contact@lakeside.edu", phone: "+15550174", establishedDate: "2022-09-01" },
    { name: "Horizon School", principal: "Mrs. Lisa Davis", plan: "Standard", studentsCount: 710, teachersCount: 55, status: "Trial", email: "principal@horizon.edu", phone: "+15550162", establishedDate: "2024-02-18" },
  ], []);

  const mockStudents = useMemo(() => [
    { name: "John Doe", email: "john.doe@gmail.com", phone: "+15551001", rollNumber: "S1001", class: "Class 10-A", gender: "Male", status: "Active", admissionDate: "2023-09-01" },
    { name: "Jane Smith", email: "jane.smith@gmail.com", phone: "+15551002", rollNumber: "S1002", class: "Class 9-B", gender: "Female", status: "Active", admissionDate: "2023-09-01" },
    { name: "Alex Jones", email: "alex.jones@gmail.com", phone: "+15551003", rollNumber: "S1003", class: "Class 11-A", gender: "Male", status: "Inactive", admissionDate: "2022-09-01" },
  ], []);

  const mockParents = useMemo(() => [
    { name: "Robert Doe", email: "robert.doe@gmail.com", phone: "+15552001", occupation: "Engineer", status: "Active", childrenCount: 1 },
    { name: "Mary Smith", email: "mary.smith@gmail.com", phone: "+15552002", occupation: "Doctor", status: "Active", childrenCount: 2 },
  ], []);

  const mockUsers = useMemo(() => [
    { name: "Shoaib Alam", email: "shoaibalamcse0786@gmail.com", role: "Super Admin", phone: "+15550001", status: "Active", joinedDate: "2025-01-01" },
    { name: "Admin User", email: "admin@greenwood.edu", role: "Admin", phone: "+15550192", status: "Active", joinedDate: "2022-05-15" },
    { name: "Teacher Jane", email: "jane.t@riverside.edu", role: "Teacher", phone: "+15553001", status: "Active", joinedDate: "2021-08-10" },
  ], []);

  // --- Real-time Mapped Datasets ---
  const activeDataset = useMemo(() => {
    switch (reportType) {
      case "schools": {
        const live = (tenantsData?.tenants ?? []).map((t: any) => ({
          name: t.name,
          principal: "Principal " + t.name.split(" ")[0],
          plan: t.plan,
          studentsCount: t.studentCount ?? 0,
          teachersCount: t.teacherCount ?? 0,
          status: t.status === "active" ? "Active" : t.status === "suspended" ? "Suspended" : t.status === "trial" ? "Trial" : "Expired",
          email: t.email || "N/A",
          phone: t.phone || "N/A",
          establishedDate: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : "N/A"
        }));
        return live.length > 0 ? live : mockSchools;
      }
      case "students": {
        const live = (studentsData?.users ?? []).map((u: any) => ({
          name: u.name,
          email: u.email,
          phone: u.phone || "N/A",
          rollNumber: "S" + u.id.slice(0, 4).toUpperCase(),
          class: u.tenant?.name || "Unassigned",
          gender: "Male",
          status: u.isActive ? "Active" : "Inactive",
          admissionDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : "N/A"
        }));
        return live.length > 0 ? live : mockStudents;
      }
      case "parents": {
        const live = (parentsData?.users ?? []).map((u: any) => ({
          name: u.name,
          email: u.email,
          phone: u.phone || "N/A",
          occupation: "Self-Employed",
          status: u.isActive ? "Active" : "Inactive",
          childrenCount: 1
        }));
        return live.length > 0 ? live : mockParents;
      }
      case "users": {
        const live = (usersData?.users ?? []).map((u: any) => ({
          name: u.name,
          email: u.email,
          role: u.role.toUpperCase(),
          phone: u.phone || "N/A",
          status: u.isActive ? "Active" : "Inactive",
          joinedDate: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : "N/A"
        }));
        return live.length > 0 ? live : mockUsers;
      }
    }
  }, [reportType, tenantsData, studentsData, parentsData, usersData, mockSchools, mockStudents, mockParents, mockUsers]);

  const filteredData = useMemo(() => {
    if (statusFilter === "all") return activeDataset;
    return activeDataset.filter(row => row.status.toLowerCase() === statusFilter.toLowerCase());
  }, [activeDataset, statusFilter]);

  const handleToggleColumn = (colId: string) => {
    setSelectedColumns(prev => {
      const currentList = prev[reportType];
      const updatedList = currentList.includes(colId)
        ? currentList.filter(id => id !== colId)
        : [...currentList, colId];
      return { ...prev, [reportType]: updatedList };
    });
  };

  const handleToggleAllColumns = () => {
    const allCols = columnsConfig[reportType].map(c => c.id);
    const currentlySelected = selectedColumns[reportType];

    setSelectedColumns(prev => ({
      ...prev,
      [reportType]: currentlySelected.length === allCols.length ? [] : allCols
    }));
  };

  // Client-side CSV/Excel spreadsheet exporter
  const handleExport = () => {
    const data = filteredData;
    const cols = selectedColumns[reportType];
    const colLabels = columnsConfig[reportType].filter(c => cols.includes(c.id)).map(c => c.label);

    if (cols.length === 0) {
      toast.error("Please select at least one field to export!");
      return;
    }

    if (data.length === 0) {
      toast.error("No records match the current filters.");
      return;
    }

    const csvRows = [
      colLabels.join(","),
      ...data.map(row => 
        cols.map(colId => {
          const value = (row as any)[colId] ?? "";
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(",")
      )
    ];

    const blob = new Blob([csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `platform_${reportType}_report.${exportFormat === "excel" ? "xlsx" : exportFormat}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${reportType.toUpperCase()} report exported successfully!`);
  };

  const downloadStandardReport = (name: string, format: string, records: any[]) => {
    if (records.length === 0) return;
    
    const headers = Object.keys(records[0]);
    const csvRows = [
      headers.join(","),
      ...records.map(row => 
        headers.map(header => `"${String(row[header]).replace(/"/g, '""')}"`).join(",")
      )
    ];

    const blob = new Blob([csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${name.toLowerCase().replace(/ /g, "_")}.${format}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Standard Report "${name}" downloaded!`);
  };

  const currentColumns = columnsConfig[reportType];
  const activeSelectedColumns = selectedColumns[reportType];

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col gap-1.5 text-left">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
          Reports & Exports
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Generate system-wide metrics and build highly customized operational reports
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Custom Report Builder & Live Preview */}
        <div className="xl:col-span-2 space-y-6">
          <CustomReportBuilder
            reportType={reportType}
            setReportType={setReportType}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            exportFormat={exportFormat}
            setExportFormat={setExportFormat}
            columns={currentColumns}
            selectedColumns={activeSelectedColumns}
            onToggleColumn={handleToggleColumn}
            onToggleAllColumns={handleToggleAllColumns}
            onExport={handleExport}
          />

          <LiveReportPreview
            columns={currentColumns}
            selectedColumns={activeSelectedColumns}
            data={filteredData}
            isLoading={isDataLoading}
          />
        </div>

        {/* RIGHT COLUMN: Standard Quick-access Reports */}
        <div>
          <StandardReports
            onDownloadReport={downloadStandardReport}
            mockSchools={mockSchools}
            mockStudents={mockStudents}
            mockUsers={mockUsers}
          />
        </div>

      </div>
    </div>
  );
}
