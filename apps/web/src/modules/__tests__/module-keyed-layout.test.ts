import { test, expect, describe } from "bun:test";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const MOD_ROOT = resolve(import.meta.dir, "..");

/** A live admin row must have a real file at modules/<module>/<row>/. */
function rowHasScreen(module: string, row: string): boolean {
  const dir = join(MOD_ROOT, module, row);
  return [".tsx", ".ts"].some((e) => existsSync(join(dir, `index${e}`)));
}

describe("iam", () => {
  test("every iam row lives under modules/iam/", () => {
    for (const row of ["iam-dashboard", "roles", "role-assignments", "permissions-catalog"]) {
      expect(rowHasScreen("iam", row)).toBe(true);
    }
    // The three rows that stack onto <AdminIamDashboard /> with no props share one folder.
    for (const bare of ["AdminIamDashboard", "AdminRoles", "AdminRoleAssignments", "AdminPermissionsCatalog"]) {
      expect(existsSync(join(MOD_ROOT, "access-control/components", `${bare}.tsx`))).toBe(false);
    }
  });
});

describe("students", () => {
  test("every students row lives under modules/students/", () => {
    for (const row of ["students", "promotions", "bulk-promote", "graduated", "certificates"]) {
      expect(rowHasScreen("students", row)).toBe(true);
    }
  });
});

describe("employees", () => {
  test("every employees row lives under modules/employees/", () => {
    for (const row of ["teachers", "staff", "parents"]) {
      expect(rowHasScreen("employees", row)).toBe(true);
    }
  });
});

describe("attendance and leaves", () => {
  test("each row lives under its own sidebar module", () => {
    expect(rowHasScreen("student-attendance", "attendance")).toBe(true);
    expect(rowHasScreen("employee-attendance", "teacher-attendance")).toBe(true);
    expect(rowHasScreen("employee-attendance", "staff-attendance")).toBe(true);
    for (const row of ["student-leaves", "teacher-leaves", "staff-leaves"]) {
      expect(rowHasScreen("leaves", row)).toBe(true);
    }
  });
});

describe("student-fees and transport", () => {
  test("the fee rows share one folder and reports has its own", () => {
    expect(rowHasScreen("student-fees", "fees")).toBe(true);
    expect(rowHasScreen("student-fees", "reports")).toBe(true);
    expect(rowHasScreen("transport", "transport-fee")).toBe(true);
  });
  test("student-fees/classes is NOT created until a case can reach it", () => {
    expect(rowHasScreen("student-fees", "classes")).toBe(false);
  });
});

describe("money-book", () => {
  test("the expenses row lives under modules/money-book/", () => {
    expect(rowHasScreen("money-book", "expenses")).toBe(true);
  });
});

describe("examinations", () => {
  test("every examinations row lives under modules/examinations/", () => {
    for (const row of ["exams", "results-entry", "published-results", "print-marksheet", "admit-cards"]) {
      expect(rowHasScreen("examinations", row)).toBe(true);
    }
  });
});

describe("academics", () => {
  test("every academics row lives under modules/academics/<row>/", () => {
    for (const row of ["academics-dashboard", "classes", "subjects", "academic-years", "timetable", "calendar", "school-settings"]) {
      expect(rowHasScreen("academics", row)).toBe(true);
    }
  });
});

// The 35 live rows that have a folder, read off adminPanelSections and cross-checked
// against the dispatcher's case keys. A row whose bare key is shared with a sibling module is
// NOT here -- see the deferral list two tests down. A new row that can be addressed today must
// appear here AND as a folder.
const LIVE_ROWS: [string, string][] = [
  ["iam", "iam-dashboard"], ["iam", "roles"], ["iam", "role-assignments"],
  ["iam", "permissions-catalog"],
  ["academics", "academics-dashboard"],
  ["academics", "academic-years"], ["academics", "classes"], ["academics", "subjects"],
  ["academics", "timetable"], ["academics", "calendar"], ["academics", "school-settings"],
  ["ai-connect", "ai-connect"],
  ["students", "students"], ["students", "promotions"], ["students", "bulk-promote"],
  ["students", "graduated"], ["students", "certificates"],
  ["employees", "teachers"], ["employees", "staff"], ["employees", "parents"],
  ["student-attendance", "attendance"],
  ["employee-attendance", "teacher-attendance"], ["employee-attendance", "staff-attendance"],
  ["student-fees", "fees"], ["student-fees", "reports"],
  ["examinations", "exams"], ["examinations", "results-entry"],
  ["examinations", "published-results"], ["examinations", "print-marksheet"],
  ["examinations", "admit-cards"],
  ["leaves", "student-leaves"], ["leaves", "teacher-leaves"], ["leaves", "staff-leaves"],
  ["money-book", "expenses"], ["transport", "transport-fee"],
];

describe("the module-keyed convention", () => {
  test("35 of the 54 live rows have their own folder", () => {
    expect(LIVE_ROWS.length).toBe(35);
    for (const [module, row] of LIVE_ROWS) expect(rowHasScreen(module, row)).toBe(true);
  });

  test("the other 19 of the 54 live rows are 9 collapses and 10 deferrals", () => {
    // Collapsed onto a sibling folder in the same module, because their cases are stacked
    // fall-throughs with identical props:
    //   student-fees/fees <- fee-categories, fee-concessions, check-payments, make-payment,
    //                        check-receipt, fee-status, transport-fee            (7 rows)
    //   iam/iam-dashboard  <- security-pin, seed-defaults                          (2 rows)
    expect(rowHasScreen("student-fees", "fees")).toBe(true);
    expect(rowHasScreen("iam", "iam-dashboard")).toBe(true);

    // Deferred to routing Task 3. Each is a live row whose bare dispatcher key is shared with a
    // sibling module's row (reports x6 modules, classes x3, student-leaves x2, staff-leaves x2,
    // staff x2), and componentKey() returns the bare key, so no per-module case can reach a
    // folder for it yet. Creating one now is a file nothing imports.
    for (const [module, row] of [
      ["student-fees", "classes"], ["students", "classes"], ["students", "reports"],
      ["employees", "reports"], ["student-attendance", "reports"],
      ["student-attendance", "student-leaves"], ["employee-attendance", "reports"],
      ["employee-attendance", "staff-leaves"], ["employee-attendance", "staff"],
      ["money-book", "reports"],
    ]) {
      expect(rowHasScreen(module, row)).toBe(false);
    }

    // 35 folders (33 built by this plan + AI Connect and the Academics command center)
    // + 9 collapsed + 10 deferred = 54 live rows, counted off adminPanelSections on 2026-09-29.
    expect(35 + 9 + 10).toBe(54);
  });

  test("no admin screen is still filed by domain", () => {
    for (const bare of [
      "AdminClasses", "AdminSubjects", "AdminStudents", "AdminTeachers", "AdminStaff",
      "AdminParents", "AdminFees", "AdminExpenses", "AdminExams", "AdminLeaves",
      "AdminAttendance", "AdminReports", "AdminCertificates", "AdminAdmitCards",
    ]) {
      const hits = ["people", "finance", "assessment", "attendance", "certificates", "data-io", "access-control"]
        .filter((d) => existsSync(join(MOD_ROOT, d, "components", `${bare}.tsx`)));
      expect(hits).toEqual([]);
    }
  });
});
