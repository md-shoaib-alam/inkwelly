import ExcelJS from "exceljs";
import type { EligibilityReportData } from "../pdf/eligibility-report-html";
import { getSchoolLogoBuffer } from "../assets/school-logo";

export async function generateEligibilityExcel(data: EligibilityReportData): Promise<Buffer> {
  const {
    school,
    sessionYear,
    className,
    asOnFormatted,
    threshold,
    workingDays,
    summary,
    records,
    generatedDateFormatted,
    generatedBy,
  } = data;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Inkwelly";
  workbook.lastModifiedBy = generatedBy;
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Eligibility Report", {
    views: [{ showGridLines: true }],
    pageSetup: {
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: records.length <= 35 ? 1 : 0,
      paperSize: 9,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.35,
        bottom: 0.35,
        header: 0.15,
        footer: 0.15,
      },
    },
  });

  // 1. Column Widths
  worksheet.columns = [
    { key: "num", width: 6 },
    { key: "admNo", width: 16 },
    { key: "roll", width: 8 },
    { key: "name", width: 26 },
    { key: "class", width: 16 },
    { key: "wd", width: 14 },
    { key: "present", width: 10 },
    { key: "absent", width: 10 },
    { key: "leave", width: 10 },
    { key: "late", width: 10 },
    { key: "halfDay", width: 10 },
    { key: "percentage", width: 16 },
    { key: "status", width: 18 },
  ];

  // Helper styles
  const thinGreenBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FF00875A" } },
    bottom: { style: "thin", color: { argb: "FF00875A" } },
    left: { style: "thin", color: { argb: "FF00875A" } },
    right: { style: "thin", color: { argb: "FF00875A" } },
  };

  const thinRedBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFDC2626" } },
    bottom: { style: "thin", color: { argb: "FFDC2626" } },
    left: { style: "thin", color: { argb: "FFDC2626" } },
    right: { style: "thin", color: { argb: "FFDC2626" } },
  };

  // School Logo in Cell A1 (columns A:B, rows 1:3)
  try {
    const logoBuffer = await getSchoolLogoBuffer(school.logo);
    if (logoBuffer && logoBuffer.length > 0) {
      const imageId = workbook.addImage({
        buffer: logoBuffer as any,
        extension: "png",
      });
      worksheet.addImage(imageId, {
        tl: { col: 0.15, row: 0.15 },
        ext: { width: 50, height: 50 },
      });
    }
  } catch (err) {
    console.warn("Failed to add school logo to eligibility Excel:", err);
  }

  // Row 1: School Name (Merged C1:L1)
  worksheet.mergeCells("C1:L1");
  const r1 = worksheet.getCell("C1");
  r1.value = school.name || "School";
  r1.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF0F172A" } };
  r1.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(1).height = 28;

  // Row 2: Subtitle (Merged C2:L2)
  worksheet.mergeCells("C2:L2");
  const r2 = worksheet.getCell("C2");
  r2.value = `BOARD ELIGIBILITY REPORT · ${threshold}% rule`;
  r2.font = { name: "Arial", size: 11, bold: true, color: { argb: "FF00875A" } };
  r2.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(2).height = 20;

  // Row 3: Meta line (Merged C3:L3)
  worksheet.mergeCells("C3:L3");
  const r3 = worksheet.getCell("C3");
  r3.value = `Session ${sessionYear} · ${className} · As on ${asOnFormatted} · Working days: ${workingDays}`;
  r3.font = { name: "Arial", size: 9.5, italic: true, color: { argb: "FF64748B" } };
  r3.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(3).height = 18;

  // Row 4: Summary boxes
  worksheet.getRow(4).height = 26;
  // Box 1: Total Students (B4:D4)
  worksheet.mergeCells("B4:D4");
  const b1 = worksheet.getCell("B4");
  b1.value = `TOTAL STUDENTS   ${summary.totalStudents}`;
  b1.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF0F172A" } };
  b1.alignment = { horizontal: "center", vertical: "middle" };
  b1.border = thinGreenBorder;

  // Box 2: Below Threshold (F4:H4)
  worksheet.mergeCells("F4:H4");
  const b2 = worksheet.getCell("F4");
  b2.value = `BELOW THRESHOLD   ${summary.belowThreshold}`;
  b2.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFDC2626" } };
  b2.alignment = { horizontal: "center", vertical: "middle" };
  b2.border = thinRedBorder;

  // Box 3: Average Attendance (J4:L4)
  worksheet.mergeCells("J4:L4");
  const b3 = worksheet.getCell("J4");
  b3.value = `AVERAGE ATTENDANCE   ${summary.averagePercentage}%`;
  b3.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF00875A" } };
  b3.alignment = { horizontal: "center", vertical: "middle" };
  b3.border = thinGreenBorder;

  // Row 5: Table Headers
  const headerRow = worksheet.getRow(5);
  headerRow.height = 24;
  const headers = [
    "#",
    "Adm. No.",
    "Roll",
    "Student Name",
    "Class",
    "Working Days",
    "Present",
    "Absent",
    "Leave",
    "Late",
    "½ Day",
    "Attendance %",
    "Status",
  ];

  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF00875A" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0FDF4" },
    };
    cell.border = {
      top: { style: "medium", color: { argb: "FF00875A" } },
      bottom: { style: "medium", color: { argb: "FF00875A" } },
    };
    cell.alignment = {
      horizontal: idx === 3 ? "left" : "center",
      vertical: "middle",
    };
  });

  // Data rows
  let currentRowIdx = 6;
  for (const r of records) {
    const row = worksheet.getRow(currentRowIdx);
    row.height = 20;

    const isBelow = r.status === "NOT ELIGIBLE";

    row.getCell(1).value = currentRowIdx - 5;
    row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    row.getCell(2).value = r.admissionNo;
    row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
    row.getCell(2).font = { name: "Courier New", size: 9.5 };

    row.getCell(3).value = r.roll ? Number(r.roll) || r.roll : "—";
    row.getCell(3).alignment = { horizontal: "center", vertical: "middle" };

    row.getCell(4).value = r.studentName;
    row.getCell(4).alignment = { horizontal: "left", vertical: "middle" };
    row.getCell(4).font = { name: "Arial", size: 10, bold: true, color: { argb: "FF0F172A" } };

    row.getCell(5).value = r.className;
    row.getCell(5).alignment = { horizontal: "center", vertical: "middle" };

    row.getCell(6).value = r.workingDays;
    row.getCell(6).alignment = { horizontal: "center", vertical: "middle" };

    row.getCell(7).value = r.present;
    row.getCell(7).alignment = { horizontal: "center", vertical: "middle" };

    row.getCell(8).value = r.absent;
    row.getCell(8).alignment = { horizontal: "center", vertical: "middle" };

    row.getCell(9).value = r.leave;
    row.getCell(9).alignment = { horizontal: "center", vertical: "middle" };

    row.getCell(10).value = r.late || 0;
    row.getCell(10).alignment = { horizontal: "center", vertical: "middle" };

    row.getCell(11).value = r.halfDay || 0;
    row.getCell(11).alignment = { horizontal: "center", vertical: "middle" };

    // Attendance %
    const pctCell = row.getCell(12);
    pctCell.value = `${r.percentage.toFixed(1)}%`;
    pctCell.alignment = { horizontal: "center", vertical: "middle" };
    pctCell.font = {
      name: "Arial",
      size: 10,
      bold: true,
      color: { argb: isBelow ? "FFDC2626" : "FF00875A" },
    };

    // Status
    const statusCell = row.getCell(13);
    statusCell.value = r.status;
    statusCell.alignment = { horizontal: "center", vertical: "middle" };
    statusCell.font = {
      name: "Arial",
      size: 9.5,
      bold: true,
      color: { argb: isBelow ? "FFDC2626" : "FF00875A" },
    };

    if (isBelow) {
      statusCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFEEAEA" },
      };
    }

    // Light bottom border for row
    for (let c = 1; c <= 13; c++) {
      const cell = row.getCell(c);
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFF1F5F9" } },
      };
    }

    currentRowIdx++;
  }

  // Total row
  const totalRow = worksheet.getRow(currentRowIdx);
  totalRow.height = 24;
  totalRow.getCell(4).value = "TOTAL";
  totalRow.getCell(4).font = { name: "Arial", size: 10, bold: true, color: { argb: "FF0F172A" } };
  totalRow.getCell(4).alignment = { horizontal: "right", vertical: "middle" };

  totalRow.getCell(6).value = workingDays;
  totalRow.getCell(6).font = { name: "Arial", size: 10, bold: true };
  totalRow.getCell(6).alignment = { horizontal: "center", vertical: "middle" };

  const totalPctCell = totalRow.getCell(12);
  totalPctCell.value = `${summary.averagePercentage}%`;
  totalPctCell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF00875A" } };
  totalPctCell.alignment = { horizontal: "center", vertical: "middle" };

  const totalStatusCell = totalRow.getCell(13);
  totalStatusCell.value = `${summary.belowThreshold} / ${summary.totalStudents}`;
  totalStatusCell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF0F172A" } };
  totalStatusCell.alignment = { horizontal: "center", vertical: "middle" };

  for (let c = 1; c <= 13; c++) {
    totalRow.getCell(c).border = {
      top: { style: "thin", color: { argb: "FF00875A" } },
      bottom: { style: "double", color: { argb: "FF00875A" } },
    };
  }

  const totalRowIdx = currentRowIdx;

  // Fill all bottom rows with solid white background and white borders like seamless paper (no grid lines)
  const bottomEndIdx = totalRowIdx + 9;
  for (let r = totalRowIdx + 1; r <= bottomEndIdx; r++) {
    const row = worksheet.getRow(r);
    row.height = 18;
    for (let c = 1; c <= 13; c++) {
      const cell = row.getCell(c);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
      // Keep TOTAL row's double bottom teal border intact by not applying top white border to the immediate next row
      cell.border = {
        top: r === totalRowIdx + 1 ? undefined : { style: "thin", color: { argb: "FFFFFFFF" } },
        bottom: { style: "thin", color: { argb: "FFFFFFFF" } },
        left: { style: "thin", color: { argb: "FFFFFFFF" } },
        right: { style: "thin", color: { argb: "FFFFFFFF" } },
      };
    }
  }

  // Row 1 below TOTAL: Blank spacer 1
  worksheet.mergeCells(`A${totalRowIdx + 1}:M${totalRowIdx + 1}`);

  // Row 2 below TOTAL: Blank spacer 2
  worksheet.mergeCells(`A${totalRowIdx + 2}:M${totalRowIdx + 2}`);

  // Row 3 below TOTAL: Blank spacer 3
  worksheet.mergeCells(`A${totalRowIdx + 3}:M${totalRowIdx + 3}`);

  // Row 4 below TOTAL: Signature Line Row (Row 35 in reference)
  const sigLineIdx = totalRowIdx + 4;
  const sigLineRow = worksheet.getRow(sigLineIdx);
  sigLineRow.height = 20;

  // Left space (Columns A to C)
  worksheet.mergeCells(`A${sigLineIdx}:C${sigLineIdx}`);

  // Class Teacher Signature Line (Columns D to E)
  worksheet.mergeCells(`D${sigLineIdx}:E${sigLineIdx}`);
  for (let c = 4; c <= 5; c++) {
    sigLineRow.getCell(c).border = {
      bottom: { style: "thin", color: { argb: "FF94A3B8" } },
      top: { style: "thin", color: { argb: "FFFFFFFF" } },
      left: { style: "thin", color: { argb: "FFFFFFFF" } },
      right: { style: "thin", color: { argb: "FFFFFFFF" } },
    };
  }

  // Middle space between Class Teacher and Principal (Columns F to I)
  worksheet.mergeCells(`F${sigLineIdx}:I${sigLineIdx}`);

  // Principal Signature Line (Columns J to L)
  worksheet.mergeCells(`J${sigLineIdx}:L${sigLineIdx}`);
  for (let c = 10; c <= 12; c++) {
    sigLineRow.getCell(c).border = {
      bottom: { style: "thin", color: { argb: "FF94A3B8" } },
      top: { style: "thin", color: { argb: "FFFFFFFF" } },
      left: { style: "thin", color: { argb: "FFFFFFFF" } },
      right: { style: "thin", color: { argb: "FFFFFFFF" } },
    };
  }

  // Row 5 below TOTAL: Signature Label Row (Row 36 in reference)
  const sigLabelIdx = totalRowIdx + 5;
  const sigLabelRow = worksheet.getRow(sigLabelIdx);
  sigLabelRow.height = 20;

  worksheet.mergeCells(`A${sigLabelIdx}:C${sigLabelIdx}`);

  worksheet.mergeCells(`D${sigLabelIdx}:E${sigLabelIdx}`);
  const ctCell = sigLabelRow.getCell(4);
  ctCell.value = "Class Teacher · Sign & Date";
  ctCell.font = { name: "Arial", size: 9.5, italic: true, color: { argb: "FF64748B" } };
  ctCell.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.mergeCells(`F${sigLabelIdx}:I${sigLabelIdx}`);

  worksheet.mergeCells(`J${sigLabelIdx}:L${sigLabelIdx}`);
  const prCell = sigLabelRow.getCell(10);
  prCell.value = "Principal · Sign & Date";
  prCell.font = { name: "Arial", size: 9.5, italic: true, color: { argb: "FF64748B" } };
  prCell.alignment = { horizontal: "center", vertical: "middle" };

  // Row 6 below TOTAL: 1 blank spacer row (Row 37 in reference)
  const blankRowIdx = totalRowIdx + 6;
  worksheet.getRow(blankRowIdx).height = 18;
  worksheet.mergeCells(`A${blankRowIdx}:M${blankRowIdx}`);

  // Row 7 below TOTAL: Footer Row 1: Generated On (Row 38 in reference, Left aligned)
  const footer1Idx = totalRowIdx + 7;
  const footer1Row = worksheet.getRow(footer1Idx);
  footer1Row.height = 18;

  worksheet.mergeCells(`A${footer1Idx}:G${footer1Idx}`);
  const f1Cell = footer1Row.getCell(1);
  f1Cell.value = `Generated on ${generatedDateFormatted} by ${generatedBy}`;
  f1Cell.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF64748B" } };
  f1Cell.alignment = { horizontal: "left", vertical: "middle" };

  worksheet.mergeCells(`H${footer1Idx}:M${footer1Idx}`);

  // Row 8 below TOTAL: Footer Row 2: Inkwelly Brand (Row 39 in reference, Right aligned)
  const footer2Idx = totalRowIdx + 8;
  const footer2Row = worksheet.getRow(footer2Idx);
  footer2Row.height = 18;

  worksheet.mergeCells(`A${footer2Idx}:G${footer2Idx}`);

  worksheet.mergeCells(`H${footer2Idx}:M${footer2Idx}`);
  const f2Cell = footer2Row.getCell(8);
  f2Cell.value = {
    richText: [
      {
        text: "Eligibility · generated by ",
        font: { name: "Arial", size: 9, italic: true, color: { argb: "FF64748B" } },
      },
      {
        text: "Inkwelly",
        font: { name: "Arial", size: 9, italic: true, bold: true, color: { argb: "FF00875A" } },
      },
      {
        text: " · School Management",
        font: { name: "Arial", size: 9, italic: true, color: { argb: "FF64748B" } },
      },
    ],
  };
  f2Cell.alignment = { horizontal: "right", vertical: "middle" };

  // Row 9 below TOTAL: Bottom padding spacer (Row 40 in reference)
  worksheet.mergeCells(`A${bottomEndIdx}:M${bottomEndIdx}`);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
