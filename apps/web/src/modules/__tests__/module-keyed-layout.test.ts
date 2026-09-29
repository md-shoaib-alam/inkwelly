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
