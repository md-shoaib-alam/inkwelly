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
