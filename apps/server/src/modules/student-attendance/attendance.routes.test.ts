import { afterAll, beforeAll, expect, test } from "bun:test";
import { SignJWT } from "jose";
import { and, eq } from "drizzle-orm";
import { db } from "../../lib/db";
import * as schema from "../../db/schema";
import { attendanceRoutes } from "./attendance.routes";

/**
 * `Attendance.status` is a plain text column with no check constraint, and the dashboard, the
 * eligibility list and the monthly register each count it by name. A value outside the five is
 * therefore stored happily and then dropped by every one of those counters, which reads on
 * screen as a child who was neither present nor absent. These pins send the refused write and
 * check the stored spelling of the accepted one.
 *
 * A date no session covers is used throughout, so the rows these writers create can never
 * reach a screen or a report and are deleted by exact key afterwards.
 */
const SENTINEL_DATE = "1999-12-31";
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

let admin: { token: string; tenantId: string };
let classId = "";
let studentId = "";

async function mark(status: unknown) {
  return attendanceRoutes.handle(
    new Request("http://localhost/attendance", {
      method: "POST",
      headers: { authorization: `Bearer ${admin.token}`, "content-type": "application/json" },
      body: JSON.stringify({
        classId,
        date: SENTINEL_DATE,
        records: [{ studentId, status }],
      }),
    }),
  );
}

async function storedStatus(): Promise<string | undefined> {
  const row = await db.query.attendance.findFirst({
    where: and(
      eq(schema.attendance.classId, classId),
      eq(schema.attendance.studentId, studentId),
      eq(schema.attendance.date, SENTINEL_DATE),
    ),
    columns: { status: true },
  });
  return row?.status;
}

beforeAll(async () => {
  const user = await db.query.users.findFirst({
    where: and(eq(schema.users.role, "admin"), eq(schema.users.isActive, true)),
    columns: { id: true, email: true, role: true, tenantId: true, updatedAt: true },
  });
  if (!user?.tenantId) throw new Error("no active admin user with a tenant in this database");
  // authPlugin refuses a token issued before the row's own updatedAt.
  const iat = Math.floor(user.updatedAt.getTime() / 1000) + 5;
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    typ: "access",
    jti: `attendance-write-${Date.now()}`,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(iat)
    .setExpirationTime("5m")
    .sign(secret);
  admin = { token, tenantId: user.tenantId };

  const cls = await db.query.classes.findFirst({
    where: eq(schema.classes.tenantId, admin.tenantId),
    columns: { id: true },
  });
  const student = await db.query.students.findFirst({
    where: and(eq(schema.students.classId, cls!.id), eq(schema.students.status, "active")),
    columns: { id: true },
  });
  if (!cls || !student) throw new Error("the admin's tenant needs a class with an active student");
  classId = cls.id;
  studentId = student.id;
});

afterAll(async () => {
  if (classId && studentId) {
    await db
      .delete(schema.attendance)
      .where(
        and(
          eq(schema.attendance.classId, classId),
          eq(schema.attendance.studentId, studentId),
          eq(schema.attendance.date, SENTINEL_DATE),
        ),
      );
  }
});

test("a status outside the five is refused and nothing is stored", async () => {
  for (const status of ["banana", "", "presently", null]) {
    const response = await mark(status);
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toContain("Unknown attendance status");
  }
  expect(await storedStatus()).toBeUndefined();
});

test("a status a sheet imports is stored in the spelling the counters read", async () => {
  const response = await mark("Half Day");
  expect(response.status).toBe(200);
  expect(await storedStatus()).toBe("halfDay");
});
