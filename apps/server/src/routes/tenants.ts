import { Elysia } from "elysia";
import { db } from "../lib/db";
import * as schema from "../db/schema";
import { eq, and, desc, inArray, sql, count, sum, isNull, isNotNull, lte } from 'drizzle-orm';
import { requireAuth, requireSuperAdmin } from "../lib/auth";
import { requirePlatformPermission } from "../lib/permissions";
import { posthog, captureError } from "../lib/monitoring/posthog";
import { uploadFile } from "../lib/s3";
import { dataCache } from "../lib/cache";
import crypto from "crypto";
import { razorpay } from "../lib/razorpay";
import { SCHOOL_PLAN_CATALOG, type SchoolPlanTier } from "../lib/plans";
import { createAuditLog } from "../lib/audit-helper";
import { formatDate } from "../lib/date-utils";
import { lookup } from "dns/promises";
import net from "net";

// Returns true when an IP belongs to a private/loopback/link-local/reserved
// range. Unknown formats fail closed (treated as private).
function isPrivateIp(ip: string): boolean {
  // Normalize IPv4-mapped IPv6 (::ffff:a.b.c.d) to its IPv4 form.
  const candidate = ip.toLowerCase().startsWith("::ffff:") ? ip.slice(7) : ip;

  if (net.isIPv4(candidate)) {
    const [a = 0, b = 0] = candidate.split(".").map(Number);
    return (
      a === 0 ||                                  // 0.0.0.0/8
      a === 10 ||                                 // 10.0.0.0/8
      a === 127 ||                                // 127.0.0.0/8 loopback
      (a === 169 && b === 254) ||                 // 169.254.0.0/16 link-local
      (a === 172 && b >= 16 && b <= 31) ||        // 172.16.0.0/12
      (a === 192 && b === 168) ||                 // 192.168.0.0/16
      (a === 100 && b >= 64 && b <= 127)          // 100.64.0.0/10 CGNAT
    );
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    return (
      lower === "::1" ||                          // loopback
      lower === "::" ||                           // unspecified
      lower.startsWith("fe80") ||                 // link-local
      lower.startsWith("fc") || lower.startsWith("fd") // unique-local fc00::/7
    );
  }

  return true; // Unknown format -> reject.
}

// Resolves a hostname and returns its addresses only if every single one is a
// public address. Rejecting when any record is private defeats multi-record
// DNS tricks. Returns null if the name cannot be resolved.
async function resolvePublicIps(hostname: string): Promise<string[] | null> {
  try {
    const records = await lookup(hostname, { all: true });
    if (!records.length) return null;
    const addresses = records.map((r) => r.address);
    if (addresses.some((addr) => isPrivateIp(addr))) return null;
    return addresses;
  } catch {
    return null;
  }
}

export const tenantsRoutes = new Elysia({ prefix: "/tenants" })
  .get("/resolve/:slug", async ({ params, set }) => {
    try {
      const cacheKey = `tenant_resolve:${params.slug.toLowerCase()}`;
      const cached = await dataCache.get(cacheKey);
      if (cached) return cached;

      const tenant = await db.query.tenants.findFirst({
        where: sql`lower(${schema.tenants.slug}) = lower(${params.slug})`,
        columns: { id: true, name: true, slug: true, logo: true, endDate: true, status: true, plan: true }
      });
      if (!tenant) {
        set.status = 404;
        return { error: "School not found" };
      }
      
      // Cache resolved tenant data for 24 hours (86400000 ms)
      await dataCache.set(cacheKey, tenant, 86400000);
      return tenant;
    } catch (error) {
      captureError(error, { method: "GET", path: "/tenants/resolve/:slug" });
      set.status = 500;
      return { error: "Resolution failed" };
    }
  })
  .get("/logo-proxy", async ({ query, set }) => {
    const MAX_LOGO_BYTES = 5 * 1024 * 1024; // hard response cap
    const MAX_CACHE_BYTES = 1024 * 1024;    // only cache small images in Redis

    try {
      const url = query.url;
      if (!url) {
        set.status = 400;
        return { error: "URL is required" };
      }

      // Security: validate URL to prevent SSRF
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        set.status = 400;
        return { error: "Invalid URL" };
      }
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        set.status = 400;
        return { error: "Invalid protocol" };
      }

      // Resolve the hostname and require every resolved address to be public.
      // This blocks loopback/private ranges, IPv6, IP literals and multi-record
      // DNS tricks that a simple prefix list misses.
      const isAllowedHost = async (host: string): Promise<boolean> => {
        const hostname = host.replace(/^\[|\]$/g, "");
        if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
          return false;
        }
        return (await resolvePublicIps(hostname)) !== null;
      };

      if (!(await isAllowedHost(parsedUrl.hostname))) {
        set.status = 403;
        return { error: "Restricted domain" };
      }

      // Check Cache first
      const cacheKey = `logo_proxy:${crypto.createHash('md5').update(url).digest('hex')}`;
      const cachedImage = await dataCache.get<{ base64: string; contentType: string }>(cacheKey);
      
      if (cachedImage) {
        set.headers["content-type"] = cachedImage.contentType;
        set.headers["cache-control"] = "public, max-age=31536000";
        return Buffer.from(cachedImage.base64, 'base64');
      }

      // Fetch with redirect safety: each hop is re-validated against the same
      // rules, so a public URL cannot redirect to an internal address.
      let response: Response | undefined;
      let currentUrl = url;
      for (let hop = 0; hop <= 3; hop++) {
        const res = await fetch(currentUrl, {
          signal: AbortSignal.timeout(5000),
          redirect: "manual",
        });

        if (res.status >= 300 && res.status < 400) {
          const location = res.headers.get("location");
          if (!location || hop === 3) {
            set.status = 404;
            return { error: "Failed to fetch image" };
          }
          let next: URL;
          try {
            next = new URL(location, currentUrl);
          } catch {
            set.status = 404;
            return { error: "Failed to fetch image" };
          }
          if (!['http:', 'https:'].includes(next.protocol) || !(await isAllowedHost(next.hostname))) {
            set.status = 403;
            return { error: "Restricted domain" };
          }
          currentUrl = next.toString();
          continue;
        }

        response = res;
        break;
      }

      if (!response || !response.ok) {
        set.status = 404;
        return { error: "Failed to fetch image" };
      }

      // Only proxy actual images
      const rawType = ((response.headers.get("content-type") || "").split(";")[0] ?? "").trim().toLowerCase();
      if (rawType && !rawType.startsWith("image/")) {
        set.status = 403;
        return { error: "URL does not point to an image" };
      }
      const contentType = rawType || "image/png";

      const declaredLength = Number(response.headers.get("content-length") || 0);
      if (declaredLength > MAX_LOGO_BYTES) {
        set.status = 413;
        return { error: "Image too large" };
      }

      // Stream the body with a hard cap instead of buffering blindly
      const chunks: Uint8Array[] = [];
      let size = 0;
      const reader = response.body?.getReader();
      if (!reader) {
        set.status = 404;
        return { error: "Failed to fetch image" };
      }
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        size += value.byteLength;
        if (size > MAX_LOGO_BYTES) {
          await reader.cancel();
          set.status = 413;
          return { error: "Image too large" };
        }
        chunks.push(value);
      }
      const buffer = Buffer.concat(chunks);

      // Cache image for 24 hours (86400000 ms) — skip caching large payloads
      if (buffer.byteLength <= MAX_CACHE_BYTES) {
        await dataCache.set(cacheKey, {
          base64: buffer.toString('base64'),
          contentType
        }, 86400000);
      }

      set.headers["content-type"] = contentType;
      set.headers["cache-control"] = "public, max-age=31536000";
      return new Response(buffer);
    } catch (error) {
      set.status = 500;
      return { error: "Failed to proxy image" };
    }
  })
  .use(requireAuth)
  .post("/create-subscription-order", async ({ body, user, set }) => {
    try {
      const { planId } = body as { planId: string };
      const plan = planId && planId in SCHOOL_PLAN_CATALOG ? SCHOOL_PLAN_CATALOG[planId as SchoolPlanTier] : undefined;

      if (!plan) {
        set.status = 400;
        return { error: "Invalid plan selected" };
      }

      const options = {
        amount: plan.price * 100, // Razorpay expects paise
        currency: "INR",
        receipt: `receipt_school_${user.tenantId}_${Date.now()}`,
        notes: { planId, tenantId: user.tenantId },
      };

      const order = await razorpay.orders.create(options);
      return { 
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      };
    } catch (error) {
      captureError(error, { method: "POST", path: "/tenants/create-subscription-order" });
      set.status = 500;
      return { error: "Failed to create payment order" };
    }
  })
  .post("/verify-subscription-payment", async ({ body, user, request, set }) => {
    try {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature
      } = body as any;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        set.status = 400;
        return { error: "Missing payment details" };
      }

      const generated_signature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (generated_signature !== razorpay_signature) {
        set.status = 400;
        return { error: "Invalid payment signature" };
      }

      // Trust only server-side data: plan and tenant were stored in the order
      // notes when we created it, and the amount must match the catalog price.
      let order: any;
      try {
        order = await razorpay.orders.fetch(razorpay_order_id);
      } catch (fetchErr) {
        captureError(fetchErr, { method: "POST", path: "/tenants/verify-subscription-payment" });
        set.status = 400;
        return { error: "Unable to verify payment order" };
      }

      const planId = order?.notes?.planId as string | undefined;
      const orderTenantId = order?.notes?.tenantId as string | undefined;
      const plan = planId && planId in SCHOOL_PLAN_CATALOG ? SCHOOL_PLAN_CATALOG[planId as SchoolPlanTier] : undefined;

      if (!plan || orderTenantId !== user.tenantId || order.amount !== plan.price * 100) {
        set.status = 400;
        return { error: "Payment order does not match a valid plan" };
      }

      // Payment verified! Now update the tenant using catalog limits
      const [tenant] = await db.update(schema.tenants).set({
        plan: planId,
        maxStudents: plan.limits.students,
        maxTeachers: plan.limits.teachers,
        maxParents: plan.limits.parents,
        maxClasses: plan.limits.classes,
        // Update end date to 1 month from now (simplified)
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }).where(eq(schema.tenants.id, user.tenantId!)).returning();

      if (tenant) {
        await dataCache.deleteMatch(`tenant_resolve:*`);
      }

      await createAuditLog({
        action: "PAYMENT_SUCCESS_UPGRADE",
        resource: "tenant",
        tenantId: user.tenantId,
        userId: user.id,
        details: { planId, paymentId: razorpay_payment_id },
        userRole: user.role,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });

      return { success: true, tenant };
    } catch (error) {
      captureError(error, { method: "POST", path: "/tenants/verify-subscription-payment" });
      set.status = 500;
      return { error: "Payment verification failed" };
    }
  })
  .use(requireSuperAdmin)
  // School management as one module: GET views, POST creates, PUT edits, DELETE
  // removes. `/restore` counts as re-admitting a school, so it asks for create.
  .use(requirePlatformPermission('tenants'))
  .get("/", async ({ query, set }) => {
    try {
      const page = parseInt(query.page || "1");
      const limit = parseInt(query.limit || "20");
      const offset = (page - 1) * limit;

      const conditions = [];
      
      if (query.status === "deleted") {
        conditions.push(isNotNull(schema.tenants.deletedAt));
      } else {
        conditions.push(isNull(schema.tenants.deletedAt));
        if (query.status && query.status !== "all") {
          conditions.push(eq(schema.tenants.status, query.status as string));
        }
      }

      if (query.plan && query.plan !== "all") conditions.push(eq(schema.tenants.plan, query.plan as string));
      if (query.search) {
        conditions.push(sql`${schema.tenants.name} ILIKE ${`%${query.search}%`}`);
      }

      const tenantsList = await db.query.tenants.findMany({
        where: and(...conditions),
        orderBy: [desc(schema.tenants.createdAt)],
        limit,
        offset,
        with: {
          users: { columns: { id: true } },
          classes: { columns: { id: true } },
          notices: { columns: { id: true } },
          events: { columns: { id: true } },
          subscriptions: { columns: { id: true } },
        }
      });

      const baseConditions = [];
      if (query.status === "deleted") {
        baseConditions.push(isNotNull(schema.tenants.deletedAt));
      } else {
        baseConditions.push(isNull(schema.tenants.deletedAt));
      }

      const [totalResult, statsResult] = await Promise.all([
        db.select({ count: count() }).from(schema.tenants).where(and(...conditions)),
        db.select({
          status: schema.tenants.status,
          count: count()
        })
        .from(schema.tenants)
        .where(and(...baseConditions))
        .groupBy(schema.tenants.status)
      ]);

      const total = totalResult[0]?.count || 0;
      
      const stats = {
        total: 0,
        active: 0,
        trial: 0,
        suspended: 0
      };

      statsResult.forEach(r => {
        const c = Number(r.count);
        stats.total += c;
        if (r.status === 'active') stats.active = c;
        else if (r.status === 'trial') stats.trial = c;
        else if (r.status === 'suspended') stats.suspended = c;
      });

      const tenantIds = tenantsList.map((t) => t.id);

      // Step 2: Efficient Aggregated Statistics (N + 1 fix)
      let enrichedTenants: any[] = [];
      if (tenantIds.length > 0) {
        const [userRoleCounts, activeSubStats] = await Promise.all([
          db.select({
            tenantId: schema.users.tenantId,
            role: schema.users.role,
            count: count(schema.users.id)
          })
          .from(schema.users)
          .where(inArray(schema.users.tenantId, tenantIds))
          .groupBy(schema.users.tenantId, schema.users.role),
          db.select({
            tenantId: schema.subscriptions.tenantId,
            count: count(schema.subscriptions.id),
            totalAmount: sum(schema.subscriptions.amount)
          })
          .from(schema.subscriptions)
          .where(and(inArray(schema.subscriptions.tenantId, tenantIds), eq(schema.subscriptions.status, "active")))
          .groupBy(schema.subscriptions.tenantId),
        ]);

        enrichedTenants = tenantsList.map((tenant) => {
          const tId = tenant.id;
          const tRoleCounts = userRoleCounts.filter((c: any) => c.tenantId === tId);
          const tActiveStats = activeSubStats.find((c: any) => c.tenantId === tId);

          return {
            ...tenant,
            _count: {
              users: tenant.users.length,
              classes: tenant.classes.length,
              notices: tenant.notices.length,
              events: tenant.events.length,
              subscriptions: tenant.subscriptions.length,
            },
            studentCount: Number(tRoleCounts.find((c: any) => c.role === "student")?.count || 0),
            teacherCount: Number(tRoleCounts.find((c: any) => c.role === "teacher")?.count || 0),
            parentCount: Number(tRoleCounts.find((c: any) => c.role === "parent")?.count || 0),
            adminCount: Number(tRoleCounts.find((c: any) => c.role === "admin")?.count || 0),
            activeSubscriptions: Number(tActiveStats?.count || 0),
            totalRevenue: Number(tActiveStats?.totalAmount || 0),
          };
        });
      }

      return { 
        tenants: enrichedTenants,
        total: Number(total),
        stats,
        page,
        totalPages: Math.ceil(Number(total) / limit)
      };
    } catch (error) {
      captureError(error, { method: "GET", path: "/tenants" });
      set.status = 500;
      return { error: "Failed to fetch tenants" };
    }
  })
  .post("/", async ({ body, user, request, set }) => {
    try {
      const b = body as any;
      const { logoFile } = b;


      const existing = await db.query.tenants.findFirst({ where: eq(schema.tenants.slug, b.slug) });
      if (existing) {
        set.status = 400;
        return { error: "Slug already exists" };
      }

      let logoUrl = null;
      if (logoFile) {
        if (logoFile.size > 5 * 1024 * 1024) {
          set.status = 400;
          return { error: "Logo file size must be less than 5MB" };
        }
        try {
          logoUrl = await uploadFile(logoFile, "logos");
        } catch (uploadErr) {

        }
      }

      const [tenant] = await db.insert(schema.tenants).values({
        name: b.name,
        slug: b.slug,
        logo: logoUrl,
        email: b.email || null,
        phone: b.phone || null,
        address: b.address || null,
        website: b.website || null,
        plan: b.plan || "basic",
        maxStudents: b.maxStudents ? parseInt(b.maxStudents) : undefined,
        maxTeachers: b.maxTeachers ? parseInt(b.maxTeachers) : undefined,
        maxParents: b.maxParents ? parseInt(b.maxParents) : undefined,
        maxClasses: b.maxClasses ? parseInt(b.maxClasses) : undefined,
        settings: JSON.stringify({ enableGradeSelection: false }),
        status: b.status || "active",
        startDate: b.startDate || formatDate(),
        endDate: b.endDate || null,
        updatedAt: new Date(),
      }).returning();

      if (tenant) {
        // Automatically create template fee categories for the new school
        await db.insert(schema.feeCategories).values([
          {
            tenantId: tenant.id,
            name: "Tuition Fee",
            code: "TUITION",
            description: "Monthly school tuition fees",
            frequency: "monthly",
            status: "active"
          },
          {
            tenantId: tenant.id,
            name: "Admission Fee",
            code: "ADMISSION",
            description: "One-time admission charge for new students",
            frequency: "one_time",
            status: "active"
          },
          {
            tenantId: tenant.id,
            name: "Exam Fee",
            code: "EXAM",
            description: "Quarterly examination and assessment charges",
            frequency: "quarterly",
            status: "active"
          },
          {
            tenantId: tenant.id,
            name: "Activity Fee",
            code: "ACTIVITY",
            description: "Monthly extracurricular activities fee",
            frequency: "monthly",
            status: "active"
          },
          {
            tenantId: tenant.id,
            name: "Lab Fee",
            code: "LAB",
            description: "Monthly computer and science lab maintenance charge",
            frequency: "monthly",
            status: "active"
          }
        ]);

        posthog.capture({
          distinctId: 'super_admin',
          event: 'tenant_created',
          properties: {
            tenantId: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            plan: tenant.plan
          }
        });

        await createAuditLog({
          action: "CREATE_TENANT",
          resource: "tenant",
          tenantId: tenant.id,
          userId: user?.id || null,
          details: {
            tenantId: tenant.id,
            name: b.name,
            plan: b.plan,
          },
          userRole: user?.role,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
      }
      set.status = 201;
      return { tenant };
    } catch (error) {
      captureError(error, { method: "POST", path: "/tenants" });
      set.status = 500;
      return { error: "Failed to create tenant" };
    }
  })
  .put("/", async ({ body, user, request, set }) => {
    try {
      const b = body as any;
      const { id, logoFile, ...rawData } = b;


      let logoUrl = rawData.logo;
      if (logoFile) {
        if (logoFile.size > 5 * 1024 * 1024) {
          set.status = 400;
          return { error: "Logo file size must be less than 5MB" };
        }
        try {
          logoUrl = await uploadFile(logoFile, "logos");
        } catch (uploadErr) {

        }
      }

      const allowedFields = [
        "name", "email", "phone", "address", "website", "plan", "status",
        "maxStudents", "maxTeachers", "maxParents", "maxClasses", "startDate", "endDate",
      ];
      const updateData: Record<string, unknown> = {
        logo: logoUrl
      };
      for (const key of allowedFields) {
        if (rawData[key] !== undefined) {
          if (["maxStudents", "maxTeachers", "maxParents", "maxClasses"].includes(key)) {
            updateData[key] = parseInt(rawData[key]) || 0;
          } else {
            updateData[key] = rawData[key];
          }
        }
      }

      const [tenant] = await db.update(schema.tenants).set(updateData).where(eq(schema.tenants.id, id)).returning();

      if (tenant) {
        await dataCache.deleteMatch(`tenant_resolve:*`);
      }

      await createAuditLog({
        action: "UPDATE_TENANT",
        resource: "tenant",
        tenantId: id,
        userId: user?.id || null,
        details: { tenantId: id, changes: Object.keys(updateData) },
        userRole: user?.role,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
      return { tenant };
    } catch (error) {
      captureError(error, { method: "PUT", path: "/tenants" });
      set.status = 500;
      return { error: "Failed to update tenant" };
    }
  })
  .delete("/", async ({ query, user, request, set }) => {
    try {
      const id = query.id as string;
      if (!id) {
        set.status = 400;
        return { error: "Tenant ID required" };
      }

      await createAuditLog({
        action: "SOFT_DELETE_TENANT",
        resource: "tenant",
        tenantId: id,
        userId: user?.id || null,
        details: { tenantId: id, retention: "28d" },
        userRole: user?.role,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });

      // Instead of hard deletion, update status and set deletedAt timestamp
      await db.update(schema.tenants).set({
        status: 'deleted',
        deletedAt: new Date(),
        updatedAt: new Date()
      }).where(eq(schema.tenants.id, id));

      return { success: true, message: "School moved to deleted bin (28 days grace period)" };
    } catch (error) {
      captureError(error, { method: "DELETE", path: "/tenants" });
      set.status = 500;
      return { error: "Failed to soft delete tenant" };
    }
  })
  .post("/restore", async ({ body, user, request, set }) => {
    try {
      const { id } = body as { id: string };
      if (!id) {
        set.status = 400;
        return { error: "Tenant ID required" };
      }

      const [tenant] = await db.update(schema.tenants).set({
        status: 'active',
        deletedAt: null,
        updatedAt: new Date()
      }).where(eq(schema.tenants.id, id)).returning();

      if (!tenant) {
        set.status = 404;
        return { error: "Tenant not found" };
      }

      await createAuditLog({
        action: "RESTORE_TENANT",
        resource: "tenant",
        tenantId: id,
        userId: user?.id || null,
        details: { tenantId: id },
        userRole: user?.role,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });

      return { success: true, tenant };
    } catch (error) {
      captureError(error, { method: "POST", path: "/tenants/restore" });
      set.status = 500;
      return { error: "Failed to restore tenant" };
    }
  })
  .delete("/permanent", async ({ query, user, request, set }) => {
    try {
      const id = query.id as string;
      if (!id) {
        set.status = 400;
        return { error: "Tenant ID required" };
      }

      // Security check - ensure this only works for Super Admin (enforced by middleware above, but good to have)
      
      await createAuditLog({
        action: "PERMANENT_DELETE_TENANT",
        resource: "tenant",
        tenantId: id,
        userId: user?.id || null,
        details: { tenantId: id, note: "Hard Wipe" },
        userRole: user?.role,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });

      await db.transaction(async (tx) => {
        const tenantUsers = await tx.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.tenantId, id));
        const userIds = tenantUsers.map(u => u.id);

        const tenantStudents = await tx.select({ id: schema.students.id }).from(schema.students).where(inArray(schema.students.userId, userIds.length > 0 ? userIds : ['none']));
        const studentIds = tenantStudents.map(s => s.id);

        const tenantTeachers = await tx.select({ id: schema.teachers.id }).from(schema.teachers).where(inArray(schema.teachers.userId, userIds.length > 0 ? userIds : ['none']));
        const teacherIds = tenantTeachers.map(t => t.id);

        const tenantParents = await tx.select({ id: schema.parents.id }).from(schema.parents).where(inArray(schema.parents.userId, userIds.length > 0 ? userIds : ['none']));
        const parentIds = tenantParents.map(p => p.id);

        const tenantClasses = await tx.select({ id: schema.classes.id }).from(schema.classes).where(eq(schema.classes.tenantId, id));
        const classIds = tenantClasses.map(c => c.id);

        if (studentIds.length > 0) {
          await tx.delete(schema.submissions).where(inArray(schema.submissions.studentId, studentIds));
          await tx.delete(schema.grades).where(inArray(schema.grades.studentId, studentIds));
          await tx.delete(schema.attendance).where(inArray(schema.attendance.studentId, studentIds));
          await tx.delete(schema.fees).where(inArray(schema.fees.studentId, studentIds));
          await tx.delete(schema.students).where(inArray(schema.students.id, studentIds));
        }

        if (classIds.length > 0) {
          await tx.delete(schema.assignments).where(inArray(schema.assignments.classId, classIds));
          await tx.delete(schema.timetables).where(inArray(schema.timetables.classId, classIds));
          await tx.delete(schema.classes).where(inArray(schema.classes.id, classIds));
        }

        if (teacherIds.length > 0) {
          await tx.delete(schema.classTeachers).where(inArray(schema.classTeachers.teacherId, teacherIds));
          await tx.delete(schema.subjects).where(inArray(schema.subjects.teacherId, teacherIds));
          await tx.delete(schema.teachers).where(inArray(schema.teachers.id, teacherIds));
        }

        if (parentIds.length > 0) {
          await tx.delete(schema.subscriptions).where(inArray(schema.subscriptions.parentId, parentIds));
          await tx.delete(schema.parents).where(inArray(schema.parents.id, parentIds));
        }

        // Cleanup remaining tenant-linked data
        await tx.delete(schema.ticketMessages).where(sql`${schema.ticketMessages.ticketId} IN (SELECT id FROM ${schema.tickets} WHERE ${schema.tickets.tenantId} = ${id})`);
        await tx.delete(schema.tickets).where(eq(schema.tickets.tenantId, id));
        await tx.delete(schema.events).where(eq(schema.events.tenantId, id));
        await tx.delete(schema.notices).where(eq(schema.notices.tenantId, id));
        await tx.delete(schema.customRoles).where(eq(schema.customRoles.tenantId, id));
        await tx.delete(schema.auditLogs).where(eq(schema.auditLogs.tenantId, id));
        await tx.delete(schema.users).where(eq(schema.users.tenantId, id));
        await tx.delete(schema.tenants).where(eq(schema.tenants.id, id));
      });

      return { success: true, message: "School permanently removed" };
    } catch (error) {
      captureError(error, { method: "DELETE", path: "/tenants/permanent" });
      set.status = 500;
      return { error: "Failed to permanently delete tenant" };
    }
  })
  .post("/run-cleanup", async ({ set }) => {
    try {
      // Find all tenants deleted more than 28 days ago
      const cutOffDate = new Date();
      cutOffDate.setDate(cutOffDate.getDate() - 28);

      const expiredTenants = await db.select({ id: schema.tenants.id })
        .from(schema.tenants)
        .where(and(isNotNull(schema.tenants.deletedAt), lte(schema.tenants.deletedAt, cutOffDate)));

      let deletedCount = 0;
      for (const tenant of expiredTenants) {
        const id = tenant.id;
        // Execute sequential hard wipes for each expired tenant
        await db.transaction(async (tx) => {
          const tenantUsers = await tx.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.tenantId, id));
          const userIds = tenantUsers.map(u => u.id);
          const tenantStudents = await tx.select({ id: schema.students.id }).from(schema.students).where(inArray(schema.students.userId, userIds.length > 0 ? userIds : ['none']));
          const studentIds = tenantStudents.map(s => s.id);
          const tenantTeachers = await tx.select({ id: schema.teachers.id }).from(schema.teachers).where(inArray(schema.teachers.userId, userIds.length > 0 ? userIds : ['none']));
          const teacherIds = tenantTeachers.map(t => t.id);
          const tenantParents = await tx.select({ id: schema.parents.id }).from(schema.parents).where(inArray(schema.parents.userId, userIds.length > 0 ? userIds : ['none']));
          const parentIds = tenantParents.map(p => p.id);
          const tenantClasses = await tx.select({ id: schema.classes.id }).from(schema.classes).where(eq(schema.classes.tenantId, id));
          const classIds = tenantClasses.map(c => c.id);

          if (studentIds.length > 0) {
            await tx.delete(schema.submissions).where(inArray(schema.submissions.studentId, studentIds));
            await tx.delete(schema.grades).where(inArray(schema.grades.studentId, studentIds));
            await tx.delete(schema.attendance).where(inArray(schema.attendance.studentId, studentIds));
            await tx.delete(schema.fees).where(inArray(schema.fees.studentId, studentIds));
            await tx.delete(schema.students).where(inArray(schema.students.id, studentIds));
          }
          if (classIds.length > 0) {
            await tx.delete(schema.assignments).where(inArray(schema.assignments.classId, classIds));
            await tx.delete(schema.timetables).where(inArray(schema.timetables.classId, classIds));
            await tx.delete(schema.classes).where(inArray(schema.classes.id, classIds));
          }
          if (teacherIds.length > 0) {
            await tx.delete(schema.classTeachers).where(inArray(schema.classTeachers.teacherId, teacherIds));
            await tx.delete(schema.subjects).where(inArray(schema.subjects.teacherId, teacherIds));
            await tx.delete(schema.teachers).where(inArray(schema.teachers.id, teacherIds));
          }
          if (parentIds.length > 0) {
            await tx.delete(schema.subscriptions).where(inArray(schema.subscriptions.parentId, parentIds));
            await tx.delete(schema.parents).where(inArray(schema.parents.id, parentIds));
          }
          await tx.delete(schema.ticketMessages).where(sql`${schema.ticketMessages.ticketId} IN (SELECT id FROM ${schema.tickets} WHERE ${schema.tickets.tenantId} = ${id})`);
          await tx.delete(schema.tickets).where(eq(schema.tickets.tenantId, id));
          await tx.delete(schema.events).where(eq(schema.events.tenantId, id));
          await tx.delete(schema.notices).where(eq(schema.notices.tenantId, id));
          await tx.delete(schema.customRoles).where(eq(schema.customRoles.tenantId, id));
          await tx.delete(schema.auditLogs).where(eq(schema.auditLogs.tenantId, id));
          await tx.delete(schema.users).where(eq(schema.users.tenantId, id));
          await tx.delete(schema.tenants).where(eq(schema.tenants.id, id));
        });
        deletedCount++;
      }

      return { success: true, purgedCount: deletedCount };
    } catch (error) {
      captureError(error, { method: "POST", path: "/tenants/run-cleanup" });
      set.status = 500;
      return { error: "Cleanup failure" };
    }
  });

