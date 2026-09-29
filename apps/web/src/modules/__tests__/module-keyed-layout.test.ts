import { test, expect, describe } from "bun:test";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { adminPanelSections } from "@/components/layout/sidebar/module-nav-config";

const MOD_ROOT = resolve(import.meta.dir, "..");

/** A live admin row must have a real file at modules/<module>/<row>/. */
function rowHasScreen(module: string, row: string): boolean {
  const dir = join(MOD_ROOT, module, row);
  return [".tsx", ".ts"].some((e) => existsSync(join(dir, `index${e}`)));
}

/**
 * Every row the admin panels list today, counted off the config rather than remembered by
 * hand: a row is addressable exactly when it is not `disabled`. Adding a live row to a panel
 * moves these numbers without any edit here, which is the point.
 */
const LIVE_ROWS_PANES: [string, string][] = Object.entries(adminPanelSections).flatMap(
  ([module, sections]) =>
    sections.flatMap((s) => s.items).filter((i) => !i.disabled).map((i) => [module, i.key] as [string, string]),
);
const FOLDERED = LIVE_ROWS_PANES.filter(([m, r]) => rowHasScreen(m, r)).map(([m, r]) => `${m}/${r}`).sort();
const UNFOLDERED = LIVE_ROWS_PANES.filter(([m, r]) => !rowHasScreen(m, r)).map(([m, r]) => `${m}/${r}`).sort();

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
    for (const row of ["students", "promotion", "graduated", "classes", "students-dashboard", "class-change", "student-trash", "admissions", "bulk-update", "settings"]) {
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
  // One sanctioned exception to "folder is named after the row": the admin panel row
  // is now `session` (`/academics/session`) while the folder stays `academic-years`,
  // because both dispatcher cases mount the same screen and the folder has another
  // task's uncommitted work in it. Moving it renames the folder AND deletes the
  // `case 'academic-years'` fallback the staff accordion and the year gate still use.
  test("every academics row lives under modules/academics/<row>/", () => {
    for (const row of ["academics-dashboard", "classes", "subjects", "academic-years", "timetable", "school-settings"]) {
      expect(rowHasScreen("academics", row)).toBe(true);
    }
  });
});

describe("events", () => {
  // The mirror image of the exception above. `calendar` left the Academics panel when
  // Events became a rail module, but its screen stayed at modules/academics/calendar/.
  // Moving the folder means editing the dispatcher's import line, which the off-session
  // task already has open. The row is live either way -- `case 'calendar'` mounts it --
  // so this records where the file really is instead of asserting a tidy lie.
  test("its one live row is still filed under academics", () => {
    expect(rowHasScreen("academics", "calendar")).toBe(true);
    expect(rowHasScreen("events", "calendar")).toBe(false);
  });
});

// The screens that have a folder, cross-checked against the dispatcher's case keys. A row whose
// bare key is shared with a sibling module is NOT here -- see the roster in the count test below.
// A new row that can be addressed today must appear here AND as a folder.
const LIVE_ROWS: [string, string][] = [
  ["iam", "iam-dashboard"], ["iam", "roles"], ["iam", "role-assignments"],
  ["iam", "permissions-catalog"],
  ["academics", "academics-dashboard"],
  ["academics", "academic-years"], ["academics", "classes"], ["academics", "subjects"],
  ["academics", "timetable"], ["academics", "school-settings"],
  ["ai-connect", "ai-connect"],
  ["students", "students"], ["students", "promotion"],
  ["students", "graduated"], ["students", "classes"],
  // bulk-promote left the roster on 2026-09-30: the Promotion screen absorbed its function.
  ["students", "students-dashboard"], ["students", "class-change"], ["students", "student-trash"],
  ["students", "admissions"], ["students", "bulk-update"], ["students", "settings"],
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
  test("37 of the 58 live rows have their own folder", () => {
    expect(LIVE_ROWS_PANES.length).toBe(58);
    expect(FOLDERED.length).toBe(37);
    for (const [module, row] of LIVE_ROWS) expect(rowHasScreen(module, row)).toBe(true);
    // LIVE_ROWS is the foldered set plus the two folders named after a retired key:
    // students/students (the bare root's alias, next to the panel row's own `list`) and
    // academics/academic-years (the legacy alias, next to the row's own `session`).
    const listed = LIVE_ROWS.map(([m, r]) => `${m}/${r}`).sort();
    expect(listed.filter((k) => !FOLDERED.includes(k))).toEqual([
      "academics/academic-years", "students/students",
    ]);
    expect(FOLDERED.filter((k) => !listed.includes(k))).toEqual([]);
  });

  test("the other 21 of the 58 live rows share a folder or await routing Task 3", () => {
    const EXPECTED_UNFOLDERED = [
      // Collapsed onto a sibling folder in the same module, because their cases are stacked
      // fall-throughs with identical props (9): fee-categories, fee-concessions,
      // check-payments, make-payment, check-receipt, fee-status and transport-fee all render
      // student-fees/fees; security-pin and seed-defaults both render iam/iam-dashboard.
      "iam/security-pin", "iam/seed-defaults",
      "student-fees/check-payments", "student-fees/check-receipt", "student-fees/fee-categories",
      "student-fees/fee-concessions", "student-fees/fee-status", "student-fees/make-payment",
      "student-fees/transport-fee",
      // Reached through an override rather than a name match, so the folder keeps its own name:
      // students/list is the class roster and academics/session the academic-years screen.
      "academics/session", "students/list",
      // Deferred to routing Task 3. Each is a live row whose bare dispatcher key is shared with a
      // sibling module's row (reports x6 modules, classes x2, student-leaves x2, staff-leaves x2,
      // staff x2), and componentKey() returns the bare key, so no per-module case can reach a
      // folder for it yet. Creating one now is a file nothing imports. `students/classes` left
      // this list with the class roster: it is the one row with an entry in COMPONENT_OVERRIDES,
      // so its case key is its own rather than the shared `classes`.
      "employee-attendance/reports", "employee-attendance/staff", "employee-attendance/staff-leaves",
      "employees/reports", "money-book/reports", "student-attendance/reports",
      "student-attendance/student-leaves", "student-fees/classes", "students/reports",
      // The row that moved panels but not folders: calendar left Academics when Events became a
      // rail module, while its screen stayed at modules/academics/calendar/.
      "events/calendar",
    ];
    expect(UNFOLDERED).toEqual([...EXPECTED_UNFOLDERED].sort());

    // 37 folders + 9 collapses + 2 override-named + 9 deferrals + 1 moved panel = 58 live rows.
    expect(37 + 9 + 2 + 9 + 1).toBe(UNFOLDERED.length + FOLDERED.length);
  });

  test("no admin screen is still filed by domain", () => {
    for (const bare of [
      "AdminClasses", "AdminSubjects", "AdminStudents", "AdminTeachers", "AdminStaff",
      "AdminParents", "AdminFees", "AdminExpenses", "AdminExams", "AdminLeaves",
      "AdminAttendance", "AdminReports", "AdminAdmitCards",
    ]) {
      const hits = ["people", "finance", "assessment", "attendance", "certificates", "data-io", "access-control"]
        .filter((d) => existsSync(join(MOD_ROOT, d, "components", `${bare}.tsx`)));
      expect(hits).toEqual([]);
    }
  });
});
