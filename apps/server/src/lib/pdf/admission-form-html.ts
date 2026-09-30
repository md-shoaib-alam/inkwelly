export interface AdmissionFormData {
  student: {
    name: string;
    avatar?: string | null;
    admissionNo?: string | null;
    studentId?: string | null;
    rollNumber?: string | null;
    className?: string | null;
    academicYear?: string | null;
    admissionDate?: string | null;
    status?: string | null;
  };
  summary?: any;
  family?: any;
  school?: {
    name?: string | null;
    logo?: string | null;
    address?: string | null;
  };
  timeFormatted: string;
}

export function buildAdmissionFormHtml(data: AdmissionFormData): string {
  const { student, summary, family, school, timeFormatted } = data;

  const p = summary?.personal || {};
  const c = summary?.contact || {};
  const idents = summary?.identifiers || {};

  const guardians: any[] = family?.guardians || [];
  const father = guardians.find((g: any) => g.relation?.toLowerCase() === 'father') || null;
  const mother = guardians.find((g: any) => g.relation?.toLowerCase() === 'mother') || null;

  const schoolName = school?.name || 'Delhi Public School Delhi';
  const schoolSub = school?.address || 'Madanpur';
  const schoolLogo = school?.logo || '';
  const sessionYear = student.academicYear || p.admissionDate?.slice(0, 4) || '—';

  const dash = (v?: string | null) => (v && String(v).trim() ? String(v).trim() : '—');

  const fmtDate = (d?: string | null) => {
    if (!d) return '—';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const fmtCurrency = (v?: string | null) => {
    if (!v) return '—';
    const n = parseFloat(String(v).replace(/[^\d.]/g, ''));
    if (isNaN(n)) return String(v);
    return `₹ ${n.toLocaleString('en-IN')}`;
  };

  const initials = (name?: string | null, fallback = '—') =>
    name
      ? name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
      : fallback;

  const fatherInitials = initials(father?.name, 'FA');
  const motherInitials = initials(mother?.name, 'MO');

  const BAND_BG = '#8b9eb5';
  const OUTER = '1.5px solid #1e293b';
  const INNER = '1px solid #c8d3dc';
  const LBL_BG = '#f0f3f6';
  const LBL_CLR = '#334155';

  const lblStyle = `font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; background: ${LBL_BG}; padding: 5px 8px; border-right: ${INNER}; color: ${LBL_CLR}; white-space: nowrap; vertical-align: middle;`;
  const valStyle = `font-size: 9pt; padding: 5px 8px; color: #0f172a; vertical-align: middle;`;

  const secBand = (text: string) => `
    <div style="background: ${BAND_BG}; color: #ffffff; text-align: center; font-size: 9pt; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase; padding: 5px 0; border-bottom: ${OUTER};">
      ${text}
    </div>
  `;

  const parentTable = (person: any, role: string) => `
    <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
      <tbody>
        <tr style="border-bottom: ${INNER};">
          <td style="${lblStyle} width: 18%;">${role}</td>
          <td colspan="3" style="font-weight: 700; font-size: 9.5pt; padding: 4px 8px; color: #0f172a; vertical-align: middle;">
            ${dash(person?.name)}
          </td>
        </tr>
        <tr style="border-bottom: ${INNER};">
          <td style="${lblStyle} width: 18%;">OCCUPATION</td>
          <td style="${valStyle} width: 42%; border-right: ${INNER};">${dash(person?.occupation)}</td>
          <td style="${lblStyle} width: 16%;">EDUCATION</td>
          <td style="${valStyle} width: 24%;">${dash(person?.education)}</td>
        </tr>
        <tr style="border-bottom: ${INNER};">
          <td style="${lblStyle}">ANNUAL INCOME</td>
          <td style="${valStyle} border-right: ${INNER};">${fmtCurrency(person?.annualIncome)}</td>
          <td style="${lblStyle}">STAFF AT SCHOOL</td>
          <td style="${valStyle}">No</td>
        </tr>
        <tr style="border-bottom: ${INNER};">
          <td style="${lblStyle}">MOBILE</td>
          <td style="${valStyle} border-right: ${INNER};">${dash(person?.mobile)}</td>
          <td style="${lblStyle}">ALT. MOBILE</td>
          <td style="${valStyle}">—</td>
        </tr>
        <tr style="border-bottom: ${INNER};">
          <td style="${lblStyle}">EMAIL</td>
          <td style="${valStyle} border-right: ${INNER};">${dash(person?.email)}</td>
          <td style="${lblStyle}">WORK PHONE</td>
          <td style="${valStyle}">—</td>
        </tr>
        <tr>
          <td style="${lblStyle}">WORK ADDRESS</td>
          <td colspan="3" style="${valStyle}">${dash(person?.workAddress)}</td>
        </tr>
      </tbody>
    </table>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admission-Form-${student.admissionNo || student.studentId || 'student'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.35;
      color: #0f172a;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    td {
      vertical-align: middle;
    }
  </style>
</head>
<body>
  <div style="border: ${OUTER}; background: #ffffff; width: 100%; box-sizing: border-box;">

    <!-- ═══ School Header ═══ -->
    <div style="display: flex; align-items: center; padding: 12px 18px; border-bottom: ${OUTER}; position: relative;">
      <div style="width: 58px; height: 58px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
        ${
          schoolLogo
            ? `<img src="${schoolLogo}" alt="Logo" style="max-width: 54px; max-height: 54px; object-fit: contain;" />`
            : `<div style="width: 50px; height: 50px; border: 1.5px dashed #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8pt; color: #94a3b8;">Logo</div>`
        }
      </div>
      <div style="flex: 1; text-align: center; padding-right: 58px;">
        <h1 style="margin: 0; font-size: 17pt; font-weight: 800; color: #0f172a; letter-spacing: -0.2px;">${schoolName}</h1>
        <p style="margin: 3px 0 0 0; font-size: 9pt; color: #475569; font-weight: 500;">${schoolSub}</p>
      </div>
    </div>

    <!-- ═══ ADMISSION FORM Banner ═══ -->
    ${secBand('ADMISSION FORM')}

    <!-- ═══ Top Section: Key Identifiers + Student Photo ═══ -->
    <div style="display: flex; border-bottom: ${OUTER};">
      <div style="flex: 1;">
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            <tr style="border-bottom: ${INNER};">
              <td style="${lblStyle} width: 20%;">ADMISSION NO.</td>
              <td style="${valStyle} width: 30%; font-weight: 700; border-right: ${INNER};">${dash(student.admissionNo || idents.admissionNo)}</td>
              <td style="${lblStyle} width: 18%;">STUDENT ID</td>
              <td style="${valStyle} width: 32%; font-weight: 700;">${dash(student.studentId || idents.studentId)}</td>
            </tr>
            <tr style="border-bottom: ${INNER};">
              <td style="${lblStyle}">ADMISSION DATE</td>
              <td style="${valStyle} border-right: ${INNER};">${fmtDate(student.admissionDate || p.admissionDate)}</td>
              <td style="${lblStyle}">SESSION</td>
              <td style="${valStyle}">${dash(sessionYear)}</td>
            </tr>
            <tr style="border-bottom: ${INNER};">
              <td style="${lblStyle}">CLASS &amp; SECTION</td>
              <td style="${valStyle} border-right: ${INNER};">${dash(student.className)}</td>
              <td style="${lblStyle}">ROLL NO.</td>
              <td style="${valStyle}">${dash(student.rollNumber)}</td>
            </tr>
            <tr>
              <td style="${lblStyle}">REGISTRATION NO.</td>
              <td style="${valStyle} border-right: ${INNER};">${dash(idents.registrationNo)}</td>
              <td style="${lblStyle}">STATUS</td>
              <td style="${valStyle}">${student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : 'Active'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="width: 110px; border-left: ${INNER}; background: #f8fafc; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 4px;">
        ${
          student.avatar
            ? `<img src="${student.avatar}" alt="Photo" style="width: 98px; height: 114px; object-fit: cover; display: block;" />`
            : `<div style="font-size: 8pt; font-weight: 600; color: #94a3b8; text-align: center; text-transform: uppercase; letter-spacing: 1px;">PHOTO</div>`
        }
      </div>
    </div>

    <!-- ═══ STUDENT DETAILS ═══ -->
    ${secBand('STUDENT DETAILS')}

    <table style="width: 100%; border-collapse: collapse; border-bottom: ${OUTER};">
      <tbody>
        <tr style="border-bottom: ${INNER};">
          <td style="${lblStyle} width: 17%;">FULL NAME</td>
          <td colspan="3" style="font-weight: 700; font-size: 9.5pt; padding: 5px 8px; color: #0f172a;">${dash(student.name)}</td>
        </tr>
        <tr style="border-bottom: ${INNER};">
          <td style="${lblStyle} width: 17%;">FATHER'S NAME</td>
          <td style="${valStyle} width: 33%; border-right: ${INNER};">${dash(father?.name)}</td>
          <td style="${lblStyle} width: 17%;">MOTHER'S NAME</td>
          <td style="${valStyle} width: 33%;">${dash(mother?.name)}</td>
        </tr>
        <tr style="border-bottom: ${INNER};">
          <td style="${lblStyle}">DATE OF BIRTH</td>
          <td style="${valStyle} border-right: ${INNER};">${fmtDate(p.dateOfBirth)}</td>
          <td style="${lblStyle}">GENDER</td>
          <td style="${valStyle}">${p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : '—'}</td>
        </tr>
        <tr style="border-bottom: ${INNER};">
          <td style="${lblStyle}">BLOOD GROUP</td>
          <td style="${valStyle} border-right: ${INNER};">${dash(p.bloodGroup)}</td>
          <td style="${lblStyle}">RELIGION</td>
          <td style="${valStyle}">${dash(p.religion)}</td>
        </tr>
        <tr style="border-bottom: ${INNER};">
          <td style="${lblStyle}">CATEGORY</td>
          <td style="${valStyle} border-right: ${INNER};">${p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : 'General'}</td>
          <td style="${lblStyle}">NATIONALITY</td>
          <td style="${valStyle}">${dash(p.nationality) === '—' ? 'Indian' : dash(p.nationality)}</td>
        </tr>
        <tr style="border-bottom: ${INNER};">
          <td style="${lblStyle}">MOTHER TONGUE</td>
          <td style="${valStyle} border-right: ${INNER};">${dash(p.motherTongue)}</td>
          <td style="${lblStyle}">GUARDIANSHIP</td>
          <td style="${valStyle}">—</td>
        </tr>
        <tr style="border-bottom: ${INNER};">
          <td style="${lblStyle}">AADHAAR NO.</td>
          <td style="${valStyle} border-right: ${INNER};">${dash(idents.aadhaarNo)}</td>
          <td style="${lblStyle}">APAAR / ABC ID</td>
          <td style="${valStyle}">${[idents.apaarId, idents.abcId].filter(Boolean).join(' / ') || '—'}</td>
        </tr>
        <tr style="border-bottom: ${INNER};">
          <td style="${lblStyle}">PEN</td>
          <td style="${valStyle} border-right: ${INNER};">${dash(idents.peNumber)}</td>
          <td style="${lblStyle}">SPECIAL CATEGORY</td>
          <td style="${valStyle}">${summary?.compliance?.isRte ? 'RTE' : '—'}</td>
        </tr>
        <tr>
          <td style="${lblStyle}">MOBILE</td>
          <td style="${valStyle} border-right: ${INNER};">${dash(c.mobile)}</td>
          <td style="${lblStyle}">EMAIL</td>
          <td style="${valStyle}">${dash(c.email)}</td>
        </tr>
      </tbody>
    </table>

    <!-- ═══ PARENT / GUARDIAN DETAILS ═══ -->
    ${secBand('PARENT / GUARDIAN DETAILS')}

    <!-- Father block -->
    <div style="display: flex; border-bottom: ${INNER};">
      <div style="width: 70px; background: #e8edf2; display: flex; align-items: center; justify-content: center; font-size: 13pt; font-weight: 800; color: #475569; letter-spacing: 1px; border-right: ${INNER}; flex-shrink: 0;">
        ${fatherInitials}
      </div>
      <div style="flex: 1;">
        ${parentTable(father, 'FATHER')}
      </div>
    </div>

    <!-- Mother block -->
    <div style="display: flex; border-bottom: ${OUTER};">
      <div style="width: 70px; background: #e8edf2; display: flex; align-items: center; justify-content: center; font-size: 13pt; font-weight: 800; color: #475569; letter-spacing: 1px; border-right: ${INNER}; flex-shrink: 0;">
        ${motherInitials}
      </div>
      <div style="flex: 1;">
        ${parentTable(mother, 'MOTHER')}
      </div>
    </div>

    <!-- ═══ ADDRESS ═══ -->
    ${secBand('ADDRESS')}

    <table style="width: 100%; border-collapse: collapse; border-bottom: ${OUTER};">
      <tbody>
        <tr>
          <td style="${lblStyle} width: 11%;">ADDRESS</td>
          <td style="${valStyle}">${dash(c.address)}</td>
        </tr>
      </tbody>
    </table>

    <!-- ═══ DOCUMENTS CHECKLIST ═══ -->
    ${secBand('DOCUMENTS CHECKLIST')}

    <div style="padding: 6px 12px; font-size: 9pt; display: flex; align-items: center; border-bottom: ${OUTER};">
      <span style="display: inline-block; width: 11px; height: 11px; border: 1.5px solid #64748b; border-radius: 2px; margin-right: 7px; flex-shrink: 0;"></span>
      <span style="font-weight: 600; color: #0f172a;">Aadhaar Card*</span>
      <span style="font-size: 8pt; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-left: 6px;">${idents.aadhaarNo ? 'VERIFIED' : 'NOT UPLOADED'}</span>
    </div>

    <!-- ═══ DECLARATION ═══ -->
    ${secBand('DECLARATION')}

    <div style="padding: 8px 12px; font-size: 8.5pt; line-height: 1.45; color: #334155; border-bottom: ${OUTER}; background: #ffffff;">
      I / We hereby declare that the information furnished above is true and correct to the best of my knowledge and belief. I / We have read and agree to abide by the rules and regulations of the school, and understand that any false statement may lead to cancellation of admission.
    </div>

    <!-- ═══ Signatures Row ═══ -->
    <div style="display: flex; border-bottom: ${OUTER}; min-height: 60px;">
      <div style="flex: 1; border-right: ${INNER}; text-align: center; display: flex; flex-direction: column; justify-content: flex-end; padding: 28px 8px 8px 8px;">
        <div style="font-size: 9pt; font-weight: 700; color: #0f172a;">Father / Guardian</div>
        <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">Signature &amp; Date</div>
      </div>
      <div style="flex: 1; border-right: ${INNER}; text-align: center; display: flex; flex-direction: column; justify-content: flex-end; padding: 28px 8px 8px 8px;">
        <div style="font-size: 9pt; font-weight: 700; color: #0f172a;">Mother</div>
        <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">Signature &amp; Date</div>
      </div>
      <div style="flex: 1.4; border-right: ${INNER}; text-align: center; display: flex; flex-direction: column; justify-content: flex-end; padding: 28px 8px 8px 8px;">
        <div style="font-size: 9pt; font-weight: 700; color: #0f172a;">Principal / Authorised Signatory</div>
        <div style="font-size: 7.5pt; color: #64748b; margin-top: 2px;">For ${schoolName}</div>
      </div>
      <div style="width: 86px; display: flex; align-items: center; justify-content: center; padding: 6px;">
        <div style="width: 48px; height: 48px; border-radius: 50%; border: 1.5px dashed #94a3b8; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 7pt; color: #64748b; text-align: center; line-height: 1.2;">
          <span>School</span>
          <span>Seal</span>
        </div>
      </div>
    </div>

    <!-- ═══ Footer ═══ -->
    <div style="display: flex; justify-content: space-between; padding: 4px 10px; font-size: 7.5pt; color: #64748b; background: #f8fafc;">
      <span>This is a system-generated admission record.</span>
      <span>Generated on ${timeFormatted}</span>
    </div>

  </div>
</body>
</html>`;
}
