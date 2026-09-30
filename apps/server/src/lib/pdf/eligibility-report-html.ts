export interface EligibilityReportData {
  school: {
    name: string;
    logo?: string;
  };
  sessionYear: string;
  className: string;
  asOnFormatted: string;
  threshold: number;
  workingDays: number;
  summary: {
    totalStudents: number;
    belowThreshold: number;
    averagePercentage: number;
  };
  records: Array<{
    roll: string;
    admissionNo: string;
    studentName: string;
    className: string;
    workingDays: number;
    present: number;
    absent: number;
    leave: number;
    late?: number;
    halfDay?: number;
    percentage: number;
    status: "ELIGIBLE" | "NOT ELIGIBLE";
  }>;
  generatedDateFormatted: string;
  generatedBy: string;
}

export function buildEligibilityReportHtml(data: EligibilityReportData): string {
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

  const schoolName = school.name || "School";

  const rowsHtml = records
    .map((r, idx) => {
      const isBelow = r.status === "NOT ELIGIBLE";
      const statusPill = isBelow
        ? `<span class="pill not-eligible">NOT ELIGIBLE</span>`
        : `<span class="pill eligible">ELIGIBLE</span>`;
      const pctColor = isBelow ? "#DC2626" : "#00875A";

      return `
        <tr>
          <td class="text-center text-muted">${idx + 1}</td>
          <td class="font-mono text-dark">${r.admissionNo}</td>
          <td class="text-center text-muted">${r.roll || "—"}</td>
          <td class="font-semibold text-dark">${r.studentName}</td>
          <td class="text-dark">${r.className}</td>
          <td class="text-center text-dark">${r.workingDays}</td>
          <td class="text-center text-dark">${r.present}</td>
          <td class="text-center text-dark">${r.absent}</td>
          <td class="text-center text-dark">${r.leave}</td>
          <td class="text-center font-bold" style="color: ${pctColor};">${r.percentage.toFixed(1)}%</td>
          <td class="text-center">${statusPill}</td>
        </tr>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Board Eligibility Report</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 12mm 10mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      -webkit-font-smoothing: antialiased;
      font-size: 11px;
    }

    /* Header Section */
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .school-logo {
      width: 44px;
      height: 44px;
      object-fit: contain;
    }
    .logo-shield {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      color: #00875A;
      overflow: hidden;
      border-radius: 8px;
    }
    .logo-shield img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .school-title {
      font-size: 18px;
      font-weight: 700;
      color: #0F172A;
      line-height: 1.2;
    }
    .school-subtitle {
      font-size: 10px;
      color: #64748B;
      margin-top: 3px;
    }

    .header-pills {
      display: flex;
      gap: 8px;
    }
    .pill-card {
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 4px 10px;
      background: #ffffff;
      min-width: 75px;
      text-align: left;
    }
    .pill-card-label {
      font-size: 8px;
      font-weight: 700;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .pill-card-val {
      font-size: 10px;
      font-weight: 600;
      color: #0F172A;
      margin-top: 1px;
    }

    /* Banner Divider */
    .banner-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 10px 0 14px 0;
    }
    .banner-line {
      flex: 1;
      height: 1.5px;
      background: #00875A;
    }
    .banner-text {
      color: #00875A;
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 1.2px;
      text-transform: uppercase;
    }
    .banner-sub {
      color: #64748B;
      font-weight: 500;
      font-size: 9px;
      letter-spacing: 0.5px;
      margin-left: 6px;
    }

    /* Stat Cards */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .stat-card {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 8px 12px;
      background: #ffffff;
    }
    .stat-label {
      font-size: 8.5px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-val {
      font-size: 20px;
      font-weight: 700;
      color: #0F172A;
      margin-top: 2px;
      line-height: 1.1;
    }
    .stat-val.red {
      color: #DC2626;
    }
    .stat-val.teal {
      color: #00875A;
    }

    /* Table */
    table.report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
    }
    thead tr th {
      border-top: 2px solid #00875A;
      border-bottom: 1px solid #CBD5E1;
      color: #00875A;
      font-weight: 700;
      font-size: 9.5px;
      padding: 6px 4px;
      background: #ffffff;
      text-transform: capitalize;
    }
    tbody tr td {
      border-bottom: 1px solid #F1F5F9;
      padding: 5px 4px;
      color: #334155;
      vertical-align: middle;
    }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .text-muted { color: #64748B; }
    .text-dark { color: #0F172A; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }

    /* Status Pills */
    .pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .pill.not-eligible {
      background: #FEEAEA;
      color: #DC2626;
    }
    .pill.eligible {
      background: #D4F7E7;
      color: #00875A;
    }

    /* Signatures & Footer */
    .signature-section {
      margin-top: 36px;
      display: flex;
      justify-content: space-between;
      padding: 0 40px;
      page-break-inside: avoid;
    }
    .sig-box {
      width: 200px;
      text-align: center;
    }
    .sig-line {
      border-top: 1px solid #94A3B8;
      margin-bottom: 6px;
    }
    .sig-label {
      font-size: 9.5px;
      font-style: italic;
      color: #475569;
    }

    .report-footer {
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #64748B;
      page-break-inside: avoid;
    }
    .powered-by strong {
      color: #00875A;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <!-- Page Header -->
  <div class="header-top">
    <div class="header-left">
      <div class="logo-shield">
        ${school.logo ? `<img src="${school.logo}" alt="Logo" />` : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`}
      </div>
      <div>
        <div class="school-title">${schoolName}</div>
        <div class="school-subtitle">Student Attendance &middot; ${threshold}% Board Rule</div>
      </div>
    </div>
    <div class="header-pills">
      <div class="pill-card">
        <div class="pill-card-label">Session</div>
        <div class="pill-card-val">${sessionYear}</div>
      </div>
      <div class="pill-card">
        <div class="pill-card-label">Class</div>
        <div class="pill-card-val">${className}</div>
      </div>
      <div class="pill-card">
        <div class="pill-card-label">As On</div>
        <div class="pill-card-val">${asOnFormatted}</div>
      </div>
    </div>
  </div>

  <!-- Green Banner Divider -->
  <div class="banner-divider">
    <div class="banner-line"></div>
    <div class="banner-text">&mdash; BOARD ELIGIBILITY REPORT <span class="banner-sub">${threshold}% RULE</span> &mdash;</div>
    <div class="banner-line"></div>
  </div>

  <!-- 4 Stat Summary Cards -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Total Students</div>
      <div class="stat-val">${summary.totalStudents}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Below Threshold</div>
      <div class="stat-val red">${summary.belowThreshold}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Average %</div>
      <div class="stat-val teal">${summary.averagePercentage}%</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Working Days</div>
      <div class="stat-val">${workingDays}</div>
    </div>
  </div>

  <!-- Data Table -->
  <table class="report-table">
    <thead>
      <tr>
        <th class="text-center" style="width: 28px;">#</th>
        <th class="text-left" style="width: 80px;">Adm. No.</th>
        <th class="text-center" style="width: 36px;">Roll</th>
        <th class="text-left">Student Name</th>
        <th class="text-left" style="width: 90px;">Class</th>
        <th class="text-center" style="width: 38px;">WD</th>
        <th class="text-center" style="width: 48px;">Present</th>
        <th class="text-center" style="width: 46px;">Absent</th>
        <th class="text-center" style="width: 46px;">Leave</th>
        <th class="text-center" style="width: 80px;">Attendance %</th>
        <th class="text-center" style="width: 95px;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <!-- Signatures -->
  <div class="signature-section">
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">Class Teacher &middot; Sign &amp; Date</div>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <div class="sig-label">Principal &middot; Sign &amp; Date</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="report-footer">
    <div>Generated on ${generatedDateFormatted} by ${generatedBy}</div>
    <div class="powered-by">Powered by <strong>INKWELLY</strong> &middot; School Management</div>
  </div>
</body>
</html>`;
}
