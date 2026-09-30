import { afterAll, beforeAll, expect, test } from "bun:test";
import { SignJWT } from "jose";
import { and, eq } from "drizzle-orm";
import { db } from "../../lib/db";
import * as schema from "../../db/schema";
import { attendanceSettingsRoutes } from "./attendanceSettings.routes";

/**
 * The nav keeps the attendance settings screen out of staff, so the route is the only
 * thing standing between a staff account and a rewrite of when the whole school counts a
 * student late. A shared `requireAdmin` plugin mounted with `.use()` enforces nothing —
 * these pins send the refused request rather than trusting the mount.
 */
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

interface Caller {
  token: string;
  tenantId: string;
}

const cache: Partial<Record<"admin" | "staff", Caller>> = {};

async function callerFor(role: "admin" | "staff"): Promise<Caller> {
  const cached = cache[role];
  if (cached) return cached;
  const user = await db.query.users.findFirst({
    where: and(eq(schema.users.role, role), eq(schema.users.isActive, true)),
    columns: { id: true, email: true, role: true, tenantId: true, updatedAt: true },
  });
  if (!user?.tenantId) throw new Error(`no active ${role} user with a tenant in this database`);
  // authPlugin refuses a token issued before the row's own updatedAt.
  const iat = Math.floor(user.updatedAt.getTime() / 1000) + 5;
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    typ: "access",
    jti: `attendance-settings-${role}-${Date.now()}`,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(iat)
    .setExpirationTime("5m")
    .sign(secret);
  const caller = { token, tenantId: user.tenantId };
  cache[role] = caller;
  return caller;
}

function put(caller: Caller, body: unknown) {
  return attendanceSettingsRoutes.handle(
    new Request("http://localhost/attendance-settings", {
      method: "PUT",
      headers: { authorization: `Bearer ${caller.token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

function get(caller: Caller) {
  return attendanceSettingsRoutes.handle(
    new Request("http://localhost/attendance-settings", {
      headers: { authorization: `Bearer ${caller.token}` },
    }),
  );
}

let admin: Caller;
let rowBefore: { cutoffTime: string; targetRate: number } | undefined;

// The writers below aim at whichever tenant the local admin belongs to, so the row is put
// back exactly as it was found — a green run must not leave the dev database configured.
beforeAll(async () => {
  admin = await callerFor("admin");
  rowBefore = await db.query.attendanceSettings.findFirst({
    where: eq(schema.attendanceSettings.tenantId, admin.tenantId),
    columns: { cutoffTime: true, targetRate: true },
  });
});

afterAll(async () => {
  if (rowBefore) {
    await db
      .update(schema.attendanceSettings)
      .set(rowBefore)
      .where(eq(schema.attendanceSettings.tenantId, admin.tenantId));
  } else {
    await db.delete(schema.attendanceSettings).where(eq(schema.attendanceSettings.tenantId, admin.tenantId));
  }
});

test("a staff token is refused on both directions", async () => {
  const staff = await callerFor("staff");
  expect((await get(staff)).status).toBe(403);
  expect((await put(staff, { cutoffTime: "08:15", targetRate: 88 })).status).toBe(403);
});

test("a tokenless write is refused", async () => {
  const response = await attendanceSettingsRoutes.handle(
    new Request("http://localhost/attendance-settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: "{}",
    }),
  );
  expect([401, 403]).toContain(response.status);
});

test("an admin read and write round-trip", async () => {
  expect((await get(admin)).status).toBe(200);
  const response = await put(admin, { cutoffTime: "08:15", targetRate: 88 });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ cutoffTime: "08:15", targetRate: 88 });

  const saved = await db.query.attendanceSettings.findFirst({
    where: eq(schema.attendanceSettings.tenantId, admin.tenantId),
  });
  expect(saved?.cutoffTime).toBe("08:15");
  expect(saved?.targetRate).toBe(88);
});

test("an unpadded clock time is stored padded", async () => {
  expect(await (await put(admin, { cutoffTime: "9:05", targetRate: 92 })).json()).toEqual({
    cutoffTime: "09:05",
    targetRate: 92,
  });
});

// Each of these is a plausible typo in a text input that the screen would otherwise save.
test("a cutoff that is not a clock time is refused", async () => {
  for (const cutoffTime of ["09:00:00", "9pm", "25:00", "09:75", "", "0900"]) {
    const response = await put(admin, { cutoffTime, targetRate: 92 });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toContain("Cutoff time");
  }
});

test("a target rate outside a percentage is refused", async () => {
  for (const targetRate of [101, -1, 92.5, "high"]) {
    const response = await put(admin, { cutoffTime: "09:00", targetRate });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error?: string };
    expect(body.error).toContain("Target attendance rate");
  }
});
