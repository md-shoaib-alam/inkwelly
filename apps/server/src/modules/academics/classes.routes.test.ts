import { afterAll, beforeAll, expect, test } from "bun:test";
import { SignJWT } from "jose";
import { and, eq } from "drizzle-orm";
import { db } from "../../lib/db";
import * as schema from "../../db/schema";
import { classesRoutes } from "./classes.routes";

/**
 * The name is derived and the slug is derived from the name, so a PUT that only
 * moves the capacity must not touch either — otherwise editing a number rewrites
 * the URL that `/students/classes/<slug>` and every bookmark depend on.
 *
 * Sections Z and Z2 no school uses, so these rows can never reach a screen, and
 * they are deleted by exact id afterwards.
 */
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const createdIds: string[] = [];
let admin: { token: string; tenantId: string };

async function call(method: "POST" | "PUT", body: Record<string, unknown>) {
  return classesRoutes.handle(
    new Request("http://localhost/classes", {
      method,
      headers: { authorization: `Bearer ${admin.token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

/** Reads the row the route wrote, and registers it for `afterAll` cleanup. */
async function readClass(id: string) {
  createdIds.push(id);
  const row = await db.query.classes.findFirst({ where: eq(schema.classes.id, id) });
  if (!row) throw new Error(`class ${id} vanished between write and read`);
  return row;
}

beforeAll(async () => {
  const user = await db.query.users.findFirst({
    where: and(eq(schema.users.role, "admin"), eq(schema.users.isActive, true)),
  });
  if (!user?.tenantId) throw new Error("this database needs an active admin user with a tenant");
  // authPlugin refuses a token issued before the row's own updatedAt.
  const iat = Math.floor(user.updatedAt.getTime() / 1000) + 5;
  const token = await new SignJWT({
    id: user.id, email: user.email, role: user.role, tenantId: user.tenantId,
    typ: "access", jti: `class-write-${Date.now()}`,
  }).setProtectedHeader({ alg: "HS256" }).setIssuedAt(iat).setExpirationTime("5m").sign(secret);
  admin = { token, tenantId: user.tenantId };
});

afterAll(async () => {
  for (const id of createdIds) {
    await db.delete(schema.classes).where(eq(schema.classes.id, id));
  }
});

test("a capacity-only edit keeps the stored name and slug", async () => {
  const res = await call("POST", { classLevel: "91", section: "Z", capacity: 30 });
  expect(res.status).toBe(200);
  // POST answers `{ id, name }` and PUT answers `{ success: true }` — nothing else,
  // so every assertion reads the row back from the database.
  const created = await readClass(((await res.json()) as { id: string }).id);
  expect(created.name).toBe("Class 91");
  expect(created.slug).toBe("class-91-z");

  // Move the URL off the derivation on purpose. This is the shape real rows are in:
  // the POST this server used to answer accepted a client-supplied slug, and the CSV
  // importer writes no slug at all. Re-deriving a slug that already matches the
  // convention is a no-op, so without this line the capacity edit below would pass
  // whether or not the route guards the rewrite.
  await db.update(schema.classes).set({ slug: "blue-91" }).where(eq(schema.classes.id, created.id));

  const put = await call("PUT", { id: created.id, capacity: 44 });
  expect(put.status).toBe(200);
  const after = await readClass(created.id);
  expect(after.capacity).toBe(44);
  expect(after.name).toBe("Class 91");
  expect(after.slug).toBe("blue-91");
});

test("changing the level moves the name and the slug with it", async () => {
  const res = await call("POST", { classLevel: "92", section: "Z" });
  const created = await readClass(((await res.json()) as { id: string }).id);

  await call("PUT", { id: created.id, classLevel: "93" });
  const after = await readClass(created.id);
  expect(after.name).toBe("Class 93");
  expect(after.classLevel).toBe("93");
  expect(after.slug).not.toBe(created.slug);
});

test("a client that still sends a name gets the derived one", async () => {
  const res = await call("POST", { classLevel: "94", section: "Z", name: "Blue House 94", slug: "blue-94" });
  expect(res.status).toBe(200);
  const created = await readClass(((await res.json()) as { id: string }).id);
  expect(created.name).toBe("Class 94");
  expect(created.slug).toBe("class-94-z");
});

test("the same level and section twice is refused by the derived name", async () => {
  const first = await call("POST", { classLevel: "95", section: "Z" });
  expect(first.status).toBe(200);
  // The winner of the race is the row that must be cleaned up; the refused second
  // POST stores nothing, so it contributes no id.
  await readClass(((await first.json()) as { id: string }).id);

  const second = await call("POST", { classLevel: "95", section: "Z" });
  expect(second.status).toBe(400);
  expect(((await second.json()) as { error: string }).error).toContain("Class 95 - Z");
});
