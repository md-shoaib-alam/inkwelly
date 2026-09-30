import ExcelJS from "exceljs";
import { getSchoolLogoBuffer } from "../assets/school-logo";

export interface MonthlyRegisterStudentRow {
  id: string;
  rollNumber: string;
  admissionNo: string;
  studentName: string;
  days: Record<number, string>;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  halfDayCount: number;
  workingDays: number;
  percentage: number;
}

export interface MonthlyRegisterReportData {
  school: {
    name: string;
    logo?: string | null;
  };
  sessionYear: string;
  className: string;
  month: string;
  monthFormatted: string;
  daysInMonth: number;
  dayNames: string[];
  isSunday: boolean[];
  stats: {
    workingDays: number;
    holidays: number;
    totalStudents: number;
  };
  rows: MonthlyRegisterStudentRow[];
  generatedDateFormatted: string;
  generatedBy: string;
}

export async function generateMonthlyRegisterExcel(
  data: MonthlyRegisterReportData
): Promise<Buffer> {
  const {
    school,
    sessionYear,
    className,
    monthFormatted,
    daysInMonth,
    dayNames,
    isSunday,
    stats,
    rows,
    generatedDateFormatted,
    generatedBy,
  } = data;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Inkwelly School Management";
  workbook.lastModifiedBy = generatedBy;
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Monthly Register", {
    views: [{ showGridLines: true }],
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      paperSize: 9,
      margins: {
        left: 0.2,
        right: 0.2,
        top: 0.3,
        bottom: 0.3,
        header: 0.1,
        footer: 0.1,
      },
    },
  });

  const totalCols = 7 + daysInMonth;

  // 1. Column Widths
  const cols: Partial<ExcelJS.Column>[] = [
    { key: "roll", width: 8 },
    { key: "admNo", width: 16 },
    { key: "name", width: 26 },
  ];

  for (let d = 1; d <= daysInMonth; d++) {
    cols.push({ key: `d${d}`, width: 4.8 });
  }

  cols.push(
    { key: "wd", width: 8 },
    { key: "p", width: 8 },
    { key: "a", width: 8 },
    { key: "pct", width: 10 }
  );

  worksheet.columns = cols;

  const lastColLetter = worksheet.getColumn(totalCols).letter;

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
    console.warn("Failed to add school logo to monthly register Excel:", err);
  }

  // Row 1: School Name
  const r1 = worksheet.getRow(1);
  r1.height = 26;
  worksheet.mergeCells(`C1:${lastColLetter}1`);
  const c1 = worksheet.getCell("C1");
  c1.value = school.name;
  c1.font = { name: "Arial", size: 15, bold: true, color: { argb: "FF0F172A" } };
  c1.alignment = { horizontal: "center", vertical: "middle" };

  // Row 2: Subtitle
  const r2 = worksheet.getRow(2);
  r2.height = 20;
  worksheet.mergeCells(`C2:${lastColLetter}2`);
  const c2 = worksheet.getCell("C2");
  c2.value = "MONTHLY ATTENDANCE REGISTER";
  c2.font = { name: "Arial", size: 10.5, bold: true, color: { argb: "FF00875A" } };
  c2.alignment = { horizontal: "center", vertical: "middle" };

  // Row 3: Meta line (Session, Class, Month)
  const r3 = worksheet.getRow(3);
  r3.height = 18;
  worksheet.mergeCells(`C3:${lastColLetter}3`);
  const c3 = worksheet.getCell("C3");
  c3.value = `Session ${sessionYear}  ·  Class ${className}  ·  ${monthFormatted}`;
  c3.font = { name: "Arial", size: 9.5, italic: true, color: { argb: "FF64748B" } };
  c3.alignment = { horizontal: "center", vertical: "middle" };

  // Bottom teal border for Row 3
  for (let c = 1; c <= totalCols; c++) {
    r3.getCell(c).border = {
      bottom: { style: "medium", color: { argb: "FF00875A" } },
    };
  }

  // Row 4: Stat Boxes
  const r4 = worksheet.getRow(4);
  r4.height = 24;

  // Box 1: WORKING DAYS (Cols C to G)
  worksheet.mergeCells("C4:G4");
  const b1 = worksheet.getCell("C4");
  b1.value = `WORKING DAYS   ${stats.workingDays}`;
  b1.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FF00875A" } };
  b1.alignment = { horizontal: "center", vertical: "middle" };

  // Box 2: HOLIDAYS (Cols N to R)
  worksheet.mergeCells("N4:R4");
  const b2 = worksheet.getCell("N4");
  b2.value = `HOLIDAYS   ${stats.holidays}`;
  b2.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FFDC2626" } };
  b2.alignment = { horizontal: "center", vertical: "middle" };

  // Box 3: STUDENTS (Cols Y to AC)
  worksheet.mergeCells("Y4:AC4");
  const b3 = worksheet.getCell("Y4");
  b3.value = `STUDENTS   ${stats.totalStudents}`;
  b3.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FF0F172A" } };
  b3.alignment = { horizontal: "center", vertical: "middle" };

  // Row 5: Legend
  const r5 = worksheet.getRow(5);
  r5.height = 18;
  worksheet.mergeCells(`A5:${lastColLetter}5`);
  const c5 = worksheet.getCell("A5");
  c5.value =
    "P=Present   A=Absent   L=Late   H=Half-Day   LV=Leave   H=Holiday   •=Week-Off   ·=Out of Session   —=Unmarked";
  c5.font = { name: "Arial", size: 8.5, italic: true, color: { argb: "FF64748B" } };
  c5.alignment = { horizontal: "center", vertical: "middle" };

  for (let c = 1; c <= totalCols; c++) {
    r5.getCell(c).border = {
      top: { style: "thin", color: { argb: "FFE2E8F0" } },
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
  }

  // Row 6 & 7: Headers
  const r6 = worksheet.getRow(6);
  const r7 = worksheet.getRow(7);
  r6.height = 18;
  r7.height = 20;

  // Fixed student column headers (A, B, C)
  worksheet.mergeCells("A6:A7");
  worksheet.getCell("A6").value = "Roll";
  worksheet.getCell("A6").alignment = { horizontal: "center", vertical: "middle" };

  worksheet.mergeCells("B6:B7");
  worksheet.getCell("B6").value = "Adm. No.";
  worksheet.getCell("B6").alignment = { horizontal: "center", vertical: "middle" };

  worksheet.mergeCells("C6:C7");
  worksheet.getCell("C6").value = "Student Name";
  worksheet.getCell("C6").alignment = { horizontal: "left", vertical: "middle" };

  for (const colLetter of ["A", "B", "C"]) {
    const cell = worksheet.getCell(`${colLetter}6`);
    cell.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FF00875A" } };
  }

  // Day Headers
  for (let d = 1; d <= daysInMonth; d++) {
    const colIdx = 3 + d;
    const cName = r6.getCell(colIdx);
    const cNum = r7.getCell(colIdx);

    const isSun = isSunday[d - 1];
    cName.value = dayNames[d - 1];
    cName.font = {
      name: "Arial",
      size: 8,
      bold: true,
      color: { argb: isSun ? "FF94A3B8" : "FF64748B" },
    };
    cName.alignment = { horizontal: "center", vertical: "middle" };

    cNum.value = d;
    cNum.font = {
      name: "Arial",
      size: 9,
      bold: true,
      color: { argb: isSun ? "FF94A3B8" : "FF0F172A" },
    };
    cNum.alignment = { horizontal: "center", vertical: "middle" };

    if (isSun) {
      cName.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8FAFC" },
      };
      cNum.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8FAFC" },
      };
    }
  }

  // Summary Column Headers
  const wdCol = 4 + daysInMonth;
  const pCol = 5 + daysInMonth;
  const aCol = 6 + daysInMonth;
  const pctCol = 7 + daysInMonth;

  worksheet.mergeCells(`${worksheet.getColumn(wdCol).letter}6:${worksheet.getColumn(wdCol).letter}7`);
  worksheet.getCell(6, wdCol).value = "WD";
  worksheet.getCell(6, wdCol).font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FF00875A" } };
  worksheet.getCell(6, wdCol).alignment = { horizontal: "center", vertical: "middle" };

  worksheet.mergeCells(`${worksheet.getColumn(pCol).letter}6:${worksheet.getColumn(pCol).letter}7`);
  worksheet.getCell(6, pCol).value = "P";
  worksheet.getCell(6, pCol).font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FF00875A" } };
  worksheet.getCell(6, pCol).alignment = { horizontal: "center", vertical: "middle" };

  worksheet.mergeCells(`${worksheet.getColumn(aCol).letter}6:${worksheet.getColumn(aCol).letter}7`);
  worksheet.getCell(6, aCol).value = "A";
  worksheet.getCell(6, aCol).font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FFDC2626" } };
  worksheet.getCell(6, aCol).alignment = { horizontal: "center", vertical: "middle" };

  worksheet.mergeCells(`${worksheet.getColumn(pctCol).letter}6:${worksheet.getColumn(pctCol).letter}7`);
  worksheet.getCell(6, pctCol).value = "%";
  worksheet.getCell(6, pctCol).font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FF00875A" } };
  worksheet.getCell(6, pctCol).alignment = { horizontal: "center", vertical: "middle" };

  // Apply borders & background to header rows 6 and 7
  for (let c = 1; c <= totalCols; c++) {
    r6.getCell(c).border = {
      top: { style: "medium", color: { argb: "FF00875A" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
    r7.getCell(c).border = {
      bottom: { style: "medium", color: { argb: "FF00875A" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
  }

  // Data rows
  let currentRowIdx = 8;
  for (const r of rows) {
    const row = worksheet.getRow(currentRowIdx);
    row.height = 20;

    // Roll
    row.getCell(1).value = r.rollNumber ? Number(r.rollNumber) || r.rollNumber : "-";
    row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    // Adm No
    row.getCell(2).value = r.admissionNo;
    row.getCell(2).font = { name: "Courier New", size: 9 };
    row.getCell(2).alignment = { horizontal: "center", vertical: "middle" };

    // Student Name
    row.getCell(3).value = r.studentName;
    row.getCell(3).font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FF0F172A" } };
    row.getCell(3).alignment = { horizontal: "left", vertical: "middle" };

    // Day attendance
    for (let d = 1; d <= daysInMonth; d++) {
      const colIdx = 3 + d;
      const cell = row.getCell(colIdx);
      const val = r.days[d] || "—";
      cell.value = val;
      cell.alignment = { horizontal: "center", vertical: "middle" };

      const isSun = isSunday[d - 1];
      if (isSun) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
      }

      if (val === "P") {
        cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF00875A" } };
      } else if (val === "A") {
        cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFDC2626" } };
      } else if (val === "L") {
        cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFD97706" } };
      } else if (val === "H") {
        cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF2563EB" } };
      } else if (val === "LV") {
        cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF7C3AED" } };
      } else if (val === "•") {
        cell.font = { name: "Arial", size: 9, color: { argb: "FF94A3B8" } };
      } else {
        cell.font = { name: "Arial", size: 9, color: { argb: "FFCBD5E1" } };
      }
    }

    // Summary columns
    row.getCell(wdCol).value = r.workingDays;
    row.getCell(wdCol).alignment = { horizontal: "center", vertical: "middle" };

    row.getCell(pCol).value = r.presentCount;
    row.getCell(pCol).alignment = { horizontal: "center", vertical: "middle" };

    row.getCell(aCol).value = r.absentCount;
    row.getCell(aCol).alignment = { horizontal: "center", vertical: "middle" };
    if (r.absentCount > 0) {
      row.getCell(aCol).font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FFDC2626" } };
    }

    const pctCell = row.getCell(pctCol);
    pctCell.value = `${r.percentage.toFixed(1)}%`;
    pctCell.alignment = { horizontal: "center", vertical: "middle" };
    pctCell.font = {
      name: "Arial",
      size: 9.5,
      bold: true,
      color: { argb: r.percentage >= 75 ? "FF00875A" : "FFDC2626" },
    };

    // Cell borders
    for (let c = 1; c <= totalCols; c++) {
      row.getCell(c).border = {
        bottom: { style: "thin", color: { argb: "FFF1F5F9" } },
        left: { style: "thin", color: { argb: "FFF1F5F9" } },
        right: { style: "thin", color: { argb: "FFF1F5F9" } },
      };
    }

    currentRowIdx++;
  }

  // Teal line on bottom of the table
  const lastTableIdx = currentRowIdx - 1;
  const lastTableRow = worksheet.getRow(lastTableIdx);
  for (let c = 1; c <= totalCols; c++) {
    lastTableRow.getCell(c).border = {
      ...lastTableRow.getCell(c).border,
      bottom: { style: "medium", color: { argb: "FF00875A" } },
    };
  }

  // Fill all bottom rows with solid white background and white borders like seamless paper (no row/col grid lines)
  const bottomEndIdx = currentRowIdx + 6;
  for (let r = currentRowIdx; r <= bottomEndIdx; r++) {
    const row = worksheet.getRow(r);
    row.height = 18;
    for (let c = 1; c <= totalCols; c++) {
      const cell = row.getCell(c);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
      // Keep table's bottom medium teal border intact by not applying top white border to the immediate next row
      cell.border = {
        top: r === currentRowIdx ? undefined : { style: "thin", color: { argb: "FFFFFFFF" } },
        bottom: { style: "thin", color: { argb: "FFFFFFFF" } },
        left: { style: "thin", color: { argb: "FFFFFFFF" } },
        right: { style: "thin", color: { argb: "FFFFFFFF" } },
      };
    }
  }

  // Row 1 below table: Blank spacer 1 (Row currentRowIdx)
  worksheet.mergeCells(`A${currentRowIdx}:${lastColLetter}${currentRowIdx}`);

  // Row 2 below table: Blank spacer 2 (Row currentRowIdx + 1)
  const spacer2Idx = currentRowIdx + 1;
  worksheet.mergeCells(`A${spacer2Idx}:${lastColLetter}${spacer2Idx}`);

  // Row 3 below table: Signature Line Row (Row currentRowIdx + 2)
  const sigLineIdx = currentRowIdx + 2;
  const sigLineRow = worksheet.getRow(sigLineIdx);
  sigLineRow.height = 20;

  // Left space (Cols A to B)
  worksheet.mergeCells(`A${sigLineIdx}:B${sigLineIdx}`);

  // Class Teacher Signature Line (Cols C to G)
  worksheet.mergeCells(`C${sigLineIdx}:G${sigLineIdx}`);
  for (let c = 3; c <= 7; c++) {
    sigLineRow.getCell(c).border = {
      bottom: { style: "thin", color: { argb: "FF94A3B8" } },
      top: { style: "thin", color: { argb: "FFFFFFFF" } },
      left: { style: "thin", color: { argb: "FFFFFFFF" } },
      right: { style: "thin", color: { argb: "FFFFFFFF" } },
    };
  }

  // Middle space between Class Teacher and Principal
  const prStartCol = Math.max(8, totalCols - 9);
  const prEndCol = Math.max(prStartCol + 5, totalCols - 4);
  const midEndCol = prStartCol - 1;
  const midEndLetter = worksheet.getColumn(midEndCol).letter;
  if (midEndCol >= 8) {
    worksheet.mergeCells(`H${sigLineIdx}:${midEndLetter}${sigLineIdx}`);
  }

  // Principal Signature Line
  const prStartLetter = worksheet.getColumn(prStartCol).letter;
  const prEndLetter = worksheet.getColumn(prEndCol).letter;
  worksheet.mergeCells(`${prStartLetter}${sigLineIdx}:${prEndLetter}${sigLineIdx}`);
  for (let c = prStartCol; c <= prEndCol; c++) {
    sigLineRow.getCell(c).border = {
      bottom: { style: "thin", color: { argb: "FF94A3B8" } },
      top: { style: "thin", color: { argb: "FFFFFFFF" } },
      left: { style: "thin", color: { argb: "FFFFFFFF" } },
      right: { style: "thin", color: { argb: "FFFFFFFF" } },
    };
  }

  // Right space after Principal
  if (prEndCol < totalCols) {
    const rightStartLetter = worksheet.getColumn(prEndCol + 1).letter;
    worksheet.mergeCells(`${rightStartLetter}${sigLineIdx}:${lastColLetter}${sigLineIdx}`);
  }

  // Row 4 below table: Signature Label Row (Row currentRowIdx + 3)
  const sigLabelIdx = currentRowIdx + 3;
  const sigLabelRow = worksheet.getRow(sigLabelIdx);
  sigLabelRow.height = 20;

  worksheet.mergeCells(`A${sigLabelIdx}:B${sigLabelIdx}`);

  worksheet.mergeCells(`C${sigLabelIdx}:G${sigLabelIdx}`);
  const ctCell = sigLabelRow.getCell(3);
  ctCell.value = "Class Teacher · Sign & Date";
  ctCell.font = { name: "Arial", size: 9.5, italic: true, color: { argb: "FF64748B" } };
  ctCell.alignment = { horizontal: "center", vertical: "middle" };

  if (midEndCol >= 8) {
    worksheet.mergeCells(`H${sigLabelIdx}:${midEndLetter}${sigLabelIdx}`);
  }

  worksheet.mergeCells(`${prStartLetter}${sigLabelIdx}:${prEndLetter}${sigLabelIdx}`);
  const prCell = sigLabelRow.getCell(prStartCol);
  prCell.value = "Principal · Sign & Date";
  prCell.font = { name: "Arial", size: 9.5, italic: true, color: { argb: "FF64748B" } };
  prCell.alignment = { horizontal: "center", vertical: "middle" };

  if (prEndCol < totalCols) {
    const rightStartLetter = worksheet.getColumn(prEndCol + 1).letter;
    worksheet.mergeCells(`${rightStartLetter}${sigLabelIdx}:${lastColLetter}${sigLabelIdx}`);
  }

  // Row 5 below table: Blank spacer 3 (Row currentRowIdx + 4)
  const blankIdx = currentRowIdx + 4;
  worksheet.mergeCells(`A${blankIdx}:${lastColLetter}${blankIdx}`);

  // Row 6 below table: Footer Row (Row currentRowIdx + 5)
  const footerIdx = currentRowIdx + 5;
  const footerRow = worksheet.getRow(footerIdx);
  footerRow.height = 20;

  const leftFooterEndCol = Math.min(15, Math.floor(totalCols / 2));
  const leftFooterEndLetter = worksheet.getColumn(leftFooterEndCol).letter;
  const rightFooterStartCol = leftFooterEndCol + 1;
  const rightFooterStartLetter = worksheet.getColumn(rightFooterStartCol).letter;

  worksheet.mergeCells(`A${footerIdx}:${leftFooterEndLetter}${footerIdx}`);
  const f1Cell = footerRow.getCell(1);
  f1Cell.value = `Generated on ${generatedDateFormatted} by ${generatedBy}`;
  f1Cell.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF64748B" } };
  f1Cell.alignment = { horizontal: "left", vertical: "middle" };

  worksheet.mergeCells(`${rightFooterStartLetter}${footerIdx}:${lastColLetter}${footerIdx}`);
  const f2Cell = footerRow.getCell(rightFooterStartCol);
  f2Cell.value = {
    richText: [
      {
        text: "Monthly Register · generated by ",
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

  // Row 7 below table: Bottom padding spacer (Row currentRowIdx + 6)
  const bottomPadIdx = currentRowIdx + 6;
  worksheet.mergeCells(`A${bottomPadIdx}:${lastColLetter}${bottomPadIdx}`);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
