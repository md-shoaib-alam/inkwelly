import type { MonthlyRegisterReportData } from '../excel/monthly-register-excel';

export function buildMonthlyRegisterHtml(data: MonthlyRegisterReportData): string {
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

  const schoolName = school.name || 'School';

  // Build Day thead columns
  let dayNamesThHtml = '';
  let dayNumbersThHtml = '';
  for (let d = 1; d <= daysInMonth; d++) {
    const isSun = isSunday[d - 1];
    const sunClass = isSun ? 'is-sunday' : '';
    dayNamesThHtml += `<th class="th-day-name ${sunClass}">${dayNames[d - 1]}</th>`;
    dayNumbersThHtml += `<th class="th-day-num ${sunClass}">${d}</th>`;
  }

  // Build Student Rows HTML
  const rowsHtml = rows
    .map((r, idx) => {
      let daysTdsHtml = '';
      for (let d = 1; d <= daysInMonth; d++) {
        const isSun = isSunday[d - 1];
        const val = r.days[d] || '—';
        const sunClass = isSun ? 'is-sunday' : '';
        let valClass = 'val-unmarked';
        if (val === 'P') valClass = 'val-present';
        else if (val === 'A') valClass = 'val-absent';
        else if (val === 'L') valClass = 'val-late';
        else if (val === 'H') valClass = 'val-half';
        else if (val === 'LV') valClass = 'val-leave';
        else if (val === '•') valClass = 'val-sunday';

        daysTdsHtml += `<td class="td-day ${sunClass} ${valClass}">${val}</td>`;
      }

      const pctColor = r.percentage >= 75 ? 'color: #00875A;' : 'color: #DC2626;';

      return `<tr>
        <td class="text-center font-mono text-muted">${idx + 1}</td>
        <td class="text-center font-mono text-muted">${r.rollNumber || '-'}</td>
        <td class="text-center font-mono text-muted text-nowrap">${r.admissionNo}</td>
        <td class="text-left font-semibold text-dark text-nowrap">${r.studentName}</td>
        ${daysTdsHtml}
        <td class="text-center font-mono">${r.workingDays}</td>
        <td class="text-center font-mono">${r.presentCount}</td>
        <td class="text-center font-mono ${r.absentCount > 0 ? 'text-red font-semibold' : ''}">${r.absentCount}</td>
        <td class="text-center font-mono font-bold" style="${pctColor}">${r.percentage.toFixed(1)}%</td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Monthly Attendance Register - ${className} - ${monthFormatted}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 8mm 6mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0F172A;
      background: #ffffff;
      font-size: 8.5px;
      line-height: 1.25;
      padding: 0;
    }

    /* Page Header */
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-shield {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      color: #00875A;
      flex-shrink: 0;
      overflow: hidden;
    }
    .logo-shield img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .school-title {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
      letter-spacing: -0.2px;
    }
    .school-subtitle {
      font-size: 9.5px;
      color: #64748B;
      margin-top: 1px;
    }
    .header-pills {
      display: flex;
      gap: 8px;
    }
    .pill-card {
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      padding: 4px 10px;
      text-align: center;
      background: #ffffff;
      min-width: 75px;
    }
    .pill-card-label {
      font-size: 7.5px;
      font-weight: 700;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .pill-card-val {
      font-size: 9.5px;
      font-weight: 600;
      color: #0F172A;
      margin-top: 1px;
    }

    /* Banner Divider */
    .banner-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 8px 0 10px 0;
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

    /* Stat Cards */
    .stats-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 8px;
    }
    .stat-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 4px 10px;
      background: #ffffff;
    }
    .stat-label {
      font-size: 8px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .stat-val {
      font-size: 13px;
      font-weight: 700;
      color: #0F172A;
    }
    .stat-val.green { color: #00875A; }
    .stat-val.red { color: #DC2626; }

    /* Legend */
    .legend-bar {
      margin-bottom: 8px;
      font-size: 7.5px;
      color: #64748B;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .legend-key {
      font-weight: 700;
    }

    /* Table */
    table.report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8px;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
    }
    thead tr th {
      color: #00875A;
      font-weight: 700;
      padding: 3px 2px;
      background: #ffffff;
      border-left: 1px solid #E2E8F0;
      border-right: 1px solid #E2E8F0;
    }
    thead tr:first-child th {
      border-top: 2px solid #00875A;
    }
    thead tr:last-child th {
      border-bottom: 2px solid #00875A;
    }

    .th-day-name {
      font-size: 7px;
      color: #64748B;
      text-align: center;
      font-weight: 700;
    }
    .th-day-num {
      font-size: 8px;
      color: #0F172A;
      text-align: center;
      font-weight: 700;
    }
    .is-sunday {
      background: #F8FAFC !important;
      color: #94A3B8 !important;
    }

    tbody tr td {
      border-bottom: 1px solid #F1F5F9;
      border-left: 1px solid #F1F5F9;
      border-right: 1px solid #F1F5F9;
      padding: 3px 2px;
      color: #334155;
      vertical-align: middle;
    }

    .td-day {
      text-align: center;
      font-size: 7.5px;
      font-weight: 700;
    }
    .val-present { color: #00875A; }
    .val-absent { color: #DC2626; }
    .val-late { color: #D97706; }
    .val-half { color: #2563EB; }
    .val-leave { color: #7C3AED; }
    .val-sunday { color: #94A3B8; }
    .val-unmarked { color: #CBD5E1; }

    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .text-muted { color: #64748B; }
    .text-dark { color: #0F172A; }
    .text-red { color: #DC2626; }
    .text-nowrap { white-space: nowrap; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }

    /* Signatures & Footer */
    .signature-section {
      margin-top: 26px;
      display: flex;
      justify-content: space-between;
      padding: 0 40px;
      page-break-inside: avoid;
    }
    .sig-box {
      width: 220px;
      text-align: center;
    }
    .sig-line {
      border-top: 1px solid #94A3B8;
      margin-bottom: 4px;
    }
    .sig-label {
      font-size: 8.5px;
      font-style: italic;
      color: #475569;
    }

    .report-footer {
      margin-top: 16px;
      padding-top: 6px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8px;
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
        ${school.logo ? `<img src="${school.logo}" alt="Logo" />` : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`}
      </div>
      <div>
        <div class="school-title">${schoolName}</div>
        <div class="school-subtitle">Student Attendance Register</div>
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
        <div class="pill-card-label">Month</div>
        <div class="pill-card-val">${monthFormatted}</div>
      </div>
    </div>
  </div>

  <!-- Banner Divider -->
  <div class="banner-divider">
    <div class="banner-line"></div>
    <div class="banner-text">&mdash; MONTHLY ATTENDANCE REGISTER &nbsp;${monthFormatted.toUpperCase()} &mdash;</div>
    <div class="banner-line"></div>
  </div>

  <!-- Stats Row -->
  <div class="stats-row">
    <div class="stat-badge">
      <span class="stat-label">Working Days</span>
      <span class="stat-val green">${stats.workingDays}</span>
    </div>
    <div class="stat-badge">
      <span class="stat-label">Holidays</span>
      <span class="stat-val red">${stats.holidays}</span>
    </div>
    <div class="stat-badge">
      <span class="stat-label">Students</span>
      <span class="stat-val">${stats.totalStudents}</span>
    </div>
  </div>

  <!-- Legend -->
  <div class="legend-bar">
    <span class="legend-item"><span class="legend-key" style="color:#00875A;">P</span> Present</span>
    <span class="legend-item"><span class="legend-key" style="color:#DC2626;">A</span> Absent</span>
    <span class="legend-item"><span class="legend-key" style="color:#D97706;">L</span> Late</span>
    <span class="legend-item"><span class="legend-key" style="color:#2563EB;">H</span> Half-Day</span>
    <span class="legend-item"><span class="legend-key" style="color:#7C3AED;">LV</span> Leave</span>
    <span class="legend-item"><span class="legend-key" style="color:#64748B;">H</span> Holiday</span>
    <span class="legend-item"><span class="legend-key" style="color:#94A3B8;">&bull;</span> Week-Off</span>
    <span class="legend-item"><span class="legend-key" style="color:#94A3B8;">&middot;</span> Out of Session</span>
    <span class="legend-item"><span class="legend-key" style="color:#CBD5E1;">&mdash;</span> Unmarked</span>
  </div>

  <!-- Matrix Table -->
  <table class="report-table">
    <thead>
      <tr>
        <th rowspan="2" style="width: 18px;" class="text-center">#</th>
        <th rowspan="2" style="width: 24px;" class="text-center">Roll</th>
        <th rowspan="2" style="width: 60px;" class="text-center">Adm. No.</th>
        <th rowspan="2" style="width: 110px;" class="text-left">Student Name</th>
        ${dayNamesThHtml}
        <th rowspan="2" style="width: 22px;" class="text-center">WD</th>
        <th rowspan="2" style="width: 20px;" class="text-center">P</th>
        <th rowspan="2" style="width: 20px;" class="text-center" style="color:#DC2626;">A</th>
        <th rowspan="2" style="width: 32px;" class="text-center">%</th>
      </tr>
      <tr>
        ${dayNumbersThHtml}
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
