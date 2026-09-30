/**
 * Generates a native vector PDF for the admission form using @react-pdf/renderer.
 *
 * NO image conversion — this is a real PDF with:
 *   • Selectable text
 *   • Exact colours (no JPEG shift)
 *   • Crisp vector borders at any zoom level
 *   • Proper A4 page size
 *
 * Filename: Admission-Form-<AdmissionNo>.pdf
 */
import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  pdf,
  Font,
} from "@react-pdf/renderer";

/* ── Register fonts so text renders correctly ─────────────────────── */
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc-.ttf", fontWeight: 700 },
  ],
});

/* ── Design tokens ────────────────────────────────────────────────── */
const BAND    = "#8b9eb5";
const WHITE   = "#ffffff";
const DARK    = "#1e293b";
const LBL_BG  = "#f0f3f6";
const LBL_CLR = "#334155";
const BODY_CLR = "#0f172a";
const INNER   = "#c8d3dc";
const MUTED   = "#64748b";
const BADGE_BG = "#e8edf2";

const styles = StyleSheet.create({
  page: {
    backgroundColor: WHITE,
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: BODY_CLR,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  outer: {
    border: `1.5 solid ${DARK}`,
    flex: 1,
  },

  /* Section band */
  band: {
    backgroundColor: BAND,
    paddingVertical: 4,
    alignItems: "center",
    borderBottom: `1.5 solid ${DARK}`,
  },
  bandText: {
    color: WHITE,
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  /* Generic row */
  row: {
    flexDirection: "row",
    borderBottom: `1 solid ${INNER}`,
  },
  rowNoBorder: {
    flexDirection: "row",
  },

  /* Label cell */
  lbl: {
    backgroundColor: LBL_BG,
    color: LBL_CLR,
    fontSize: 6.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRight: `1 solid ${INNER}`,
    justifyContent: "center",
  },
  lblText: {
    fontSize: 6.5,
    fontWeight: 700,
    color: LBL_CLR,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  /* Value cell */
  val: {
    paddingHorizontal: 5,
    paddingVertical: 4,
    justifyContent: "center",
  },
  valText: {
    fontSize: 7.5,
    color: BODY_CLR,
  },
  valTextBold: {
    fontSize: 8,
    fontWeight: 700,
    color: BODY_CLR,
  },
});

/* ── Helpers ──────────────────────────────────────────────────────── */
const dash = (v?: string | null) =>
  v && String(v).trim() ? String(v).trim() : "—";

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return d; }
};

const fmtCurrency = (v?: string | null) => {
  if (!v) return "—";
  const n = parseFloat(String(v).replace(/[^\d.]/g, ""));
  if (isNaN(n)) return String(v);
  return `\u20b9 ${n.toLocaleString("en-IN")}`;
};

const initials = (name?: string | null, fallback = "—") =>
  name
    ? name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : fallback;

/* ── Sub-components ──────────────────────────────────────────────── */

/** A coloured section header band */
const Band = ({ label }: { label: string }) => (
  <View style={styles.band}>
    <Text style={styles.bandText}>{label}</Text>
  </View>
);

/** One label+value pair in a 2-col layout */
const Cell = ({
  label,
  value,
  labelW = "20%",
  valueW = "30%",
  bold = false,
  rightBorder = true,
}: {
  label: string;
  value: string;
  labelW?: string | number;
  valueW?: string | number;
  bold?: boolean;
  rightBorder?: boolean;
}) => (
  <>
    <View style={[styles.lbl, { width: labelW as any }]}>
      <Text style={styles.lblText}>{label}</Text>
    </View>
    <View style={[
      styles.val,
      { width: valueW as any },
      rightBorder ? { borderRight: `1 solid ${INNER}` } : {},
    ]}>
      <Text style={bold ? styles.valTextBold : styles.valText}>{value}</Text>
    </View>
  </>
);

/** Standard 4-column info row */
const InfoRow = ({
  lbl1, val1, lbl2, val2,
  lbl1W = "18%", val1W = "32%", lbl2W = "18%", val2W = "32%",
  bold1 = false, bold2 = false,
  last = false,
}: {
  lbl1: string; val1: string;
  lbl2: string; val2: string;
  lbl1W?: string; val1W?: string;
  lbl2W?: string; val2W?: string;
  bold1?: boolean; bold2?: boolean;
  last?: boolean;
}) => (
  <View style={last ? styles.rowNoBorder : styles.row}>
    <Cell label={lbl1} value={val1} labelW={lbl1W} valueW={val1W} bold={bold1} />
    <Cell label={lbl2} value={val2} labelW={lbl2W} valueW={val2W} bold={bold2} rightBorder={false} />
  </View>
);

/** Parent block (father or mother) */
const ParentBlock = ({
  person,
  role,
  last = false,
}: {
  person: any;
  role: string;
  last?: boolean;
}) => {
  const init = initials(person?.name, role === "FATHER" ? "FA" : "MO");
  return (
    <View style={[
      { flexDirection: "row" },
      last
        ? { borderBottom: `1.5 solid ${DARK}` }
        : { borderBottom: `1 solid ${INNER}` },
    ]}>
      {/* Initials badge */}
      <View style={{
        width: 46,
        backgroundColor: BADGE_BG,
        alignItems: "center",
        justifyContent: "center",
        borderRight: `1 solid ${INNER}`,
        flexShrink: 0,
      }}>
        <Text style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: 1 }}>
          {init}
        </Text>
      </View>
      {/* Table */}
      <View style={{ flex: 1 }}>
        {/* Name row */}
        <View style={[styles.row, { alignItems: "center" }]}>
          <View style={[styles.lbl, { width: "18%" }]}>
            <Text style={styles.lblText}>{role}</Text>
          </View>
          <View style={[styles.val, { flex: 1 }]}>
            <Text style={[styles.valTextBold, { fontSize: 8.5 }]}>{dash(person?.name)}</Text>
          </View>
        </View>
        <InfoRow
          lbl1="OCCUPATION" val1={dash(person?.occupation)}
          lbl2="EDUCATION"  val2={dash(person?.education)}
          lbl1W="18%" val1W="42%" lbl2W="16%" val2W="24%"
        />
        <InfoRow
          lbl1="ANNUAL INCOME" val1={fmtCurrency(person?.annualIncome)}
          lbl2="STAFF AT SCHOOL" val2="No"
          lbl1W="18%" val1W="42%" lbl2W="16%" val2W="24%"
        />
        <InfoRow
          lbl1="MOBILE"     val1={dash(person?.mobile)}
          lbl2="ALT. MOBILE" val2="—"
          lbl1W="18%" val1W="42%" lbl2W="16%" val2W="24%"
        />
        <InfoRow
          lbl1="EMAIL"      val1={dash(person?.email)}
          lbl2="WORK PHONE" val2="—"
          lbl1W="18%" val1W="42%" lbl2W="16%" val2W="24%"
        />
        {/* Work address — full width */}
        <View style={styles.rowNoBorder}>
          <View style={[styles.lbl, { width: "18%" }]}>
            <Text style={styles.lblText}>WORK ADDRESS</Text>
          </View>
          <View style={[styles.val, { flex: 1 }]}>
            <Text style={styles.valText}>{dash(person?.workAddress)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

/* ── Main Document component ─────────────────────────────────────── */
const AdmissionFormDoc = ({
  student,
  summary,
  family,
  school,
  timeFormatted,
}: {
  student: any;
  summary: any;
  family: any;
  school: any;
  timeFormatted: string;
}) => {
  const p      = summary?.personal    || {};
  const c      = summary?.contact     || {};
  const idents = summary?.identifiers || {};

  const guardians: any[] = family?.guardians || [];
  const father = guardians.find((g: any) => g.relation?.toLowerCase() === "father") || null;
  const mother = guardians.find((g: any) => g.relation?.toLowerCase() === "mother") || null;

  const schoolName  = school?.name    || "Demo Academy";
  const schoolSub   = school?.address || "Madanpur";
  const schoolLogo  = school?.logo;
  const sessionYear = student.academicYear || "—";

  const statusText = student.status
    ? student.status.charAt(0).toUpperCase() + student.status.slice(1)
    : "Active";

  const genderText = p.gender
    ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1)
    : "—";

  const categoryText = p.category
    ? p.category.charAt(0).toUpperCase() + p.category.slice(1)
    : "General";

  const nationalityText = dash(p.nationality) === "—" ? "Indian" : dash(p.nationality);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.outer}>

          {/* ── SCHOOL HEADER ── */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 10,
            borderBottom: `1.5 solid ${DARK}`,
          }}>
            {schoolLogo ? (
              <Image
                src={schoolLogo}
                style={{ width: 42, height: 42, objectFit: "contain", marginRight: 0 }}
              />
            ) : (
              <View style={{ width: 42, height: 42 }} />
            )}
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: 700, color: DARK, letterSpacing: -0.2 }}>
                {schoolName}
              </Text>
              <Text style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>{schoolSub}</Text>
            </View>
          </View>

          {/* ── ADMISSION FORM BAND ── */}
          <Band label="ADMISSION FORM" />

          {/* ── TOP IDENTIFIERS + PHOTO ── */}
          <View style={{
            flexDirection: "row",
            borderBottom: `1.5 solid ${DARK}`,
          }}>
            <View style={{ flex: 1 }}>
              <InfoRow
                lbl1="ADMISSION NO." val1={dash(student.admissionNo || idents.admissionNo)}
                lbl2="STUDENT ID"    val2={dash(student.studentId  || idents.studentId)}
                lbl1W="22%" val1W="28%" lbl2W="16%" val2W="34%"
                bold1 bold2
              />
              <InfoRow
                lbl1="ADMISSION DATE" val1={fmtDate(student.admissionDate || p.admissionDate)}
                lbl2="SESSION"        val2={dash(sessionYear)}
                lbl1W="22%" val1W="28%" lbl2W="16%" val2W="34%"
              />
              <InfoRow
                lbl1="CLASS & SECTION" val1={dash(student.className)}
                lbl2="ROLL NO."        val2={dash(student.rollNumber)}
                lbl1W="22%" val1W="28%" lbl2W="16%" val2W="34%"
              />
              <InfoRow
                lbl1="REGISTRATION NO." val1={dash(idents.registrationNo)}
                lbl2="STATUS"           val2={statusText}
                lbl1W="22%" val1W="28%" lbl2W="16%" val2W="34%"
                last
              />
            </View>
            {/* Photo box */}
            <View style={{
              width: 72,
              borderLeft: `1 solid ${INNER}`,
              backgroundColor: "#f8fafc",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              {student.avatar ? (
                <Image
                  src={student.avatar}
                  style={{ width: 68, height: 80, objectFit: "cover" }}
                />
              ) : (
                <Text style={{ fontSize: 6.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>
                  PHOTO
                </Text>
              )}
            </View>
          </View>

          {/* ── STUDENT DETAILS ── */}
          <Band label="STUDENT DETAILS" />

          {/* Full name row */}
          <View style={styles.row}>
            <View style={[styles.lbl, { width: "16%" }]}>
              <Text style={styles.lblText}>FULL NAME</Text>
            </View>
            <View style={[styles.val, { flex: 1 }]}>
              <Text style={styles.valTextBold}>{dash(student.name)}</Text>
            </View>
          </View>

          <InfoRow
            lbl1="FATHER'S NAME" val1={dash(father?.name)}
            lbl2="MOTHER'S NAME" val2={dash(mother?.name)}
            lbl1W="16%" val1W="34%" lbl2W="16%" val2W="34%"
          />
          <InfoRow
            lbl1="DATE OF BIRTH" val1={fmtDate(p.dateOfBirth)}
            lbl2="GENDER"        val2={genderText}
            lbl1W="16%" val1W="34%" lbl2W="16%" val2W="34%"
          />
          <InfoRow
            lbl1="BLOOD GROUP" val1={dash(p.bloodGroup)}
            lbl2="RELIGION"    val2={dash(p.religion)}
            lbl1W="16%" val1W="34%" lbl2W="16%" val2W="34%"
          />
          <InfoRow
            lbl1="CATEGORY"    val1={categoryText}
            lbl2="NATIONALITY" val2={nationalityText}
            lbl1W="16%" val1W="34%" lbl2W="16%" val2W="34%"
          />
          <InfoRow
            lbl1="MOTHER TONGUE" val1={dash(p.motherTongue)}
            lbl2="GUARDIANSHIP"  val2="—"
            lbl1W="16%" val1W="34%" lbl2W="16%" val2W="34%"
          />
          <InfoRow
            lbl1="AADHAAR NO."   val1={dash(idents.aadhaarNo)}
            lbl2="APAAR / ABC ID" val2={[idents.apaarId, idents.abcId].filter(Boolean).join(" / ") || "—"}
            lbl1W="16%" val1W="34%" lbl2W="16%" val2W="34%"
          />
          <InfoRow
            lbl1="PEN"             val1={dash(idents.peNumber)}
            lbl2="SPECIAL CATEGORY" val2={summary?.compliance?.isRte ? "RTE" : "—"}
            lbl1W="16%" val1W="34%" lbl2W="16%" val2W="34%"
          />
          <View style={[styles.rowNoBorder, { borderBottom: `1.5 solid ${DARK}` }]}>
            <Cell label="MOBILE" value={dash(c.mobile)} labelW="16%" valueW="34%" />
            <Cell label="EMAIL"  value={dash(c.email)}  labelW="16%" valueW="34%" rightBorder={false} />
          </View>

          {/* ── PARENT / GUARDIAN DETAILS ── */}
          <Band label="PARENT / GUARDIAN DETAILS" />
          <ParentBlock person={father} role="FATHER" />
          <ParentBlock person={mother} role="MOTHER" last />

          {/* ── ADDRESS ── */}
          <Band label="ADDRESS" />
          <View style={[styles.rowNoBorder, { borderBottom: `1.5 solid ${DARK}` }]}>
            <View style={[styles.lbl, { width: "10%" }]}>
              <Text style={styles.lblText}>ADDRESS</Text>
            </View>
            <View style={[styles.val, { flex: 1 }]}>
              <Text style={styles.valText}>{dash(c.address)}</Text>
            </View>
          </View>

          {/* ── DOCUMENTS CHECKLIST ── */}
          <Band label="DOCUMENTS CHECKLIST" />
          <View style={[{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 8,
            paddingVertical: 5,
            borderBottom: `1.5 solid ${DARK}`,
          }]}>
            <View style={{
              width: 8,
              height: 8,
              border: `1 solid ${MUTED}`,
              borderRadius: 1,
              marginRight: 5,
            }} />
            <Text style={{ fontSize: 7.5, fontWeight: 700, color: BODY_CLR }}>Adhaar Card* </Text>
            <Text style={{ fontSize: 6.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
              {idents.aadhaarNo ? "VERIFIED" : "NOT UPLOADED"}
            </Text>
          </View>

          {/* ── DECLARATION ── */}
          <Band label="DECLARATION" />
          <View style={{
            paddingHorizontal: 10,
            paddingVertical: 7,
            borderBottom: `1.5 solid ${DARK}`,
          }}>
            <Text style={{ fontSize: 7, lineHeight: 1.5, color: "#334155" }}>
              I / We hereby declare that the information furnished above is true and correct to the best of
              my knowledge and belief. I / We have read and agree to abide by the rules and regulations of
              the school, and understand that any false statement may lead to cancellation of admission.
            </Text>
          </View>

          {/* ── SIGNATURES ── */}
          <View style={{
            flexDirection: "row",
            borderBottom: `1.5 solid ${DARK}`,
            minHeight: 52,
          }}>
            {[
              { label: "Father / Guardian", sub: "Signature & Date", flex: 1 },
              { label: "Mother",            sub: "Signature & Date", flex: 1 },
              { label: "Principal / Authorised Signatory", sub: `For ${schoolName}`, flex: 1.4 },
            ].map((sig, i, arr) => (
              <View key={sig.label} style={{
                flex: sig.flex,
                alignItems: "center",
                justifyContent: "flex-end",
                paddingBottom: 7,
                borderRight: i < arr.length - 1 ? `1 solid ${INNER}` : undefined,
              }}>
                <Text style={{ fontSize: 7.5, fontWeight: 700, color: BODY_CLR }}>{sig.label}</Text>
                <Text style={{ fontSize: 6.5, color: MUTED, marginTop: 1 }}>{sig.sub}</Text>
              </View>
            ))}
            {/* School Seal circle */}
            <View style={{
              width: 58,
              alignItems: "center",
              justifyContent: "center",
              borderLeft: `1 solid ${INNER}`,
            }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                border: `1 dashed ${MUTED}`,
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Text style={{ fontSize: 5.5, color: MUTED, textAlign: "center", lineHeight: 1.3 }}>
                  School{"\n"}Seal
                </Text>
              </View>
            </View>
          </View>

          {/* ── FOOTER ── */}
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: "#f8fafc",
          }}>
            <Text style={{ fontSize: 6.5, color: MUTED }}>
              This is a system-generated admission record.
            </Text>
            <Text style={{ fontSize: 6.5, color: MUTED }}>
              Generated on {timeFormatted}
            </Text>
          </View>

        </View>
      </Page>
    </Document>
  );
};

async function urlToBase64(url?: string | null): Promise<string | undefined> {
  if (!url || typeof window === "undefined") return undefined;
  if (url.startsWith("data:")) return url;
  try {
    const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    const res = await fetch(fullUrl);
    if (!res.ok) return undefined;
    const buf = await res.arrayBuffer();
    const mime = res.headers.get("content-type") || "image/png";
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    return `data:${mime};base64,${b64}`;
  } catch {
    return undefined;
  }
}

/* ── Public export ───────────────────────────────────────────────── */
export async function downloadAdmissionFormPDF({
  student,
  summary,
  family,
  school,
}: {
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
}) {
  const nowTime = new Date();
  const timeFormatted =
    nowTime.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    " at " +
    nowTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

  // Resolve best IDs (checking both student header and summary identifiers)
  const resolvedAdmissionNo =
    student.admissionNo?.trim() ||
    summary?.identifiers?.admissionNo?.trim() ||
    null;

  const resolvedStudentId =
    student.studentId?.trim() ||
    summary?.identifiers?.studentId?.trim() ||
    null;

  const resolvedRollNo =
    student.rollNumber?.trim() ||
    null;

  // Convert images to base64 so @react-pdf/renderer renders them reliably
  const [logoBase64, avatarBase64] = await Promise.all([
    urlToBase64(school?.logo),
    urlToBase64(student?.avatar),
  ]);

  const updatedStudent = {
    ...student,
    admissionNo: resolvedAdmissionNo,
    studentId: resolvedStudentId,
    avatar: avatarBase64 || student.avatar,
  };

  const updatedSchool = {
    ...school,
    logo: logoBase64 || school?.logo,
  };

  /* Generate the PDF blob directly — no DOM, no canvas, no image conversion */
  const element = React.createElement(AdmissionFormDoc, {
    student: updatedStudent,
    summary,
    family,
    school: updatedSchool,
    timeFormatted,
  }) as React.ReactElement<any>;

  const blob = await pdf(element).toBlob();

  /* Filename Priority: Admission Number -> Student ID -> Roll Number -> "Record" */
  const rawId = resolvedAdmissionNo || resolvedStudentId || resolvedRollNo || "Record";
  const sanitizedId = decodeURIComponent(rawId)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[/\\?%*:|"<>]/g, "");

  const filename = `Admission-Form-${sanitizedId}.pdf`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Release memory
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
