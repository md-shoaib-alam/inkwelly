import { Elysia } from 'elysia';
import { db } from '../lib/db';
import * as schema from '../db/schema';
import { eq, and, desc, or, ilike, count, sum, sql } from 'drizzle-orm';
import { requireAuth } from '../lib/auth';
import { platformMay, type PermissionAction } from '../lib/permissions';
import { posthog, captureError } from '../lib/monitoring/posthog';
import { dataCache } from '../lib/cache';
import { formatDate } from '../lib/date-utils';
import Razorpay from 'razorpay';
import { razorpay } from '../lib/razorpay';
import crypto from 'crypto';
import { notificationQueue } from '../lib/queue';

const RAZORPAY_PARENT_PLANS: Record<string, string> = {
  'standard-monthly': 'plan_SkGLeWxFTrmLGJ', // Ã¢â€šÂ¹11
  'premium-monthly': 'plan_SkGM65vbuOAHAN',  // Ã¢â€šÂ¹29 
};

export const SCHOOL_PLANS = [
  {
    id: "basic",
    name: "Starter Plan",
    description: "â‚¹3/student/mo (min â‚¹499/mo). Ideal for small preschools and private tutoring centers.",
    price: 499,
    limits: {
      students: 100,
      teachers: 20,
      parents: 100,
      classes: 10,
    },
    features: [
      "Student & Staff Attendance",
      "Basic Fee Management",
      "Digital Notice Board",
      "Mobile App Access",
      "Standard Support",
    ],
  },
  {
    id: "standard",
    name: "Growth Plan",
    description: "â‚¹3/student/mo (min â‚¹1,499/mo). Perfect for established schools looking to digitize operations.",
    price: 1499,
    limits: {
      students: 500,
      teachers: 50,
      parents: 500,
      classes: 30,
    },
    features: [
      "Everything in Starter",
      "Advanced Exam Reports",
      "Online Fee Collection",
      "Library Management",
      "Priority Email Support",
      "Custom ID Cards",
    ],
  },
  {
    id: "premium",
    name: "Institution Plan",
    description: "â‚¹2/student/mo (min â‚¹3,999/mo). The complete solution for large-scale educational institutions.",
    price: 3999,
    limits: {
      students: 2000,
      teachers: 150,
      parents: 2000,
      classes: 100,
    },
    features: [
      "Everything in Growth",
      "AI Performance Insights",
      "Transport Tracking",
      "Inventory Management",
      "Account Manager",
      "White-label Branding",
    ],
  },
];

export const PARENT_PLANS = [
  {
    id: "basic",
    name: "Basic",
    description: "Essential access to track your child's progress",
    color: "blue",
    pricing: {
      monthly: { price: 0, discountType: "none" },
      quarterly: { price: 0, discountType: "none" },
      yearly: { price: 0, discountType: "none" },
    },
    features: [
      { text: "View child's grades & reports", included: true },
      { text: "Basic attendance overview", included: true },
      { text: "View school notices", included: true },
      { text: "Fee payment status", included: true },
    ],
  },
  {
    id: "standard",
    name: "Standard",
    description: "Complete visibility into your child's academics",
    badge: "Most Popular",
    badgeColor: "bg-amber-500",
    popular: true,
    color: "amber",
    pricing: {
      monthly: { price: 19, originalPrice: 29, discountType: "percentage" },
      quarterly: { price: 49, originalPrice: 79, discountType: "percentage" },
      yearly: { price: 149, originalPrice: 249, discountType: "percentage" },
    },
    features: [
      { text: "Detailed attendance with trends", included: true },
      { text: "Online fee payment", included: true },
      { text: "Detailed performance analytics", included: true },
      { text: "Real-time notifications", included: true },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "The ultimate parental engagement experience",
    badge: "Best Value",
    badgeColor: "bg-emerald-500",
    color: "emerald",
    pricing: {
      monthly: { price: 49, originalPrice: 79, discountType: "percentage" },
      quarterly: { price: 129, originalPrice: 199, discountType: "percentage" },
      yearly: { price: 399, originalPrice: 599, discountType: "percentage" },
    },
    features: [
      { text: "AI-powered performance analytics", included: true },
      { text: "Instant push notifications", included: true },
      { text: "Direct parent-teacher chat", included: true },
      { text: "Monthly progress reports (PDF + email)", included: true },
    ],
  },
];

// --- HELPER FUNCTIONS ---

async function getParentSubscriptions(parentId: string) {
  const parent = await db.query.parents.findFirst({
    where: eq(schema.parents.id, parentId),
    with: { user: { columns: { name: true, email: true, phone: true, avatar: true } } }
  });
  const subscriptions = await db.query.subscriptions.findMany({
    where: eq(schema.subscriptions.parentId, parentId),
    orderBy: [desc(schema.subscriptions.createdAt)]
  });
  const activeSubscription = subscriptions.find(s => s.status === 'active') || null;
  return { parent, activeSubscription, subscriptions };
}

async function getAdminSubscriptions(query: any, tenantId?: string | null) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const offset = (page - 1) * limit;
  const status = query.status as string | undefined;

  const conditions: any[] = [];
  if (status && status !== 'all') conditions.push(eq(schema.subscriptions.status, status));
  // A school admin sees their own school only; only a platform admin sees all.
  if (tenantId) conditions.push(eq(schema.subscriptions.tenantId, tenantId));

  const [subs, totalResult, stats] = await Promise.all([
    db.query.subscriptions.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(schema.subscriptions.createdAt)],
      limit,
      offset,
      with: {
        parent: {
          with: { user: { columns: { name: true, email: true, phone: true } } }
        }
      }
    }),
    db.select({ count: count() }).from(schema.subscriptions)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
    db.select({
      total: count(),
      totalRevenue: sum(schema.subscriptions.amount),
    }).from(schema.subscriptions).where(eq(schema.subscriptions.status, 'active'))
  ]);

  return {
    subscriptions: subs,
    total: totalResult[0]?.count ?? 0,
    page,
    limit,
    stats: stats[0]
  };
}

async function verifySubscription(body: any, user: any) {
  const { 
    razorpay_payment_id, 
    razorpay_subscription_id, 
    razorpay_signature,
    parentId,
    planId,
    planName,
    amount,
    period
  } = body as any;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(razorpay_payment_id + '|' + razorpay_subscription_id)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return { error: 'Invalid subscription signature', status: 400 };
  }

  let finalParentId = parentId;
  const tenantId = user.tenantId;

  if (parentId.startsWith('unlinked-')) {
    const userId = parentId.replace('unlinked-', '');
    const [newParent] = await db.insert(schema.parents).values({ userId, occupation: '' })
      .onConflictDoUpdate({ target: schema.parents.userId, set: { updatedAt: new Date() } })
      .returning();
    if (!newParent) throw new Error('Failed to create parent');
    finalParentId = newParent.id;
  }

  await db.update(schema.subscriptions).set({ status: 'cancelled' }).where(and(eq(schema.subscriptions.parentId, finalParentId), eq(schema.subscriptions.status, 'active')));

  const startDate = new Date();
  const endDate = new Date();
  if (period === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
  else if (period === 'quarterly') endDate.setMonth(endDate.getMonth() + 3);
  else endDate.setFullYear(endDate.getFullYear() + 1);

  const [sub] = await db.insert(schema.subscriptions).values({
    tenantId: tenantId || 'master',
    parentId: finalParentId,
    planId,
    planName,
    amount: Number(amount),
    period,
    status: 'active',
    paymentMethod: 'razorpay',
    transactionId: razorpay_subscription_id,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    autoRenew: true
  }).returning();

  if (!sub) throw new Error('Failed to create subscription');

  await notificationQueue.add(
    'subscription-alert',
    {
      parentId: finalParentId,
      planName,
      status: 'active',
      amount: sub.amount,
      endDate: sub.endDate ? sub.endDate.substring(0, 10) : '',
      tenantId: tenantId || 'master'
    },
    { jobId: `sub-verify-${sub.id}-${Date.now()}` }
  ).catch(e => console.error('[QUEUE_ERROR] Failed to queue sub verified alert:', e));

  return { success: true, subscription: sub };
}

async function cancelSubscription(body: any) {
  const { subscriptionId, immediate } = body as { subscriptionId: string, immediate?: boolean };

  if (!subscriptionId) {
    return { error: 'subscriptionId is required', status: 400 };
  }

  // Reject non-boolean values for immediate at the request boundary
  if (immediate !== undefined && typeof immediate !== 'boolean') {
    return { error: 'Invalid value for immediate: must be a boolean', status: 400 };
  }

  const isImmediate = immediate === true;
  
  const subRecord = await db.query.subscriptions.findFirst({
    where: or(
      eq(schema.subscriptions.id, subscriptionId),
      eq(schema.subscriptions.transactionId, subscriptionId)
    )
  });

  if (!subRecord) {
    return { error: 'Subscription record not found locally', status: 404 };
  }

  let razorpayResult = null;
  const rzpSubId = subRecord.transactionId;

  if (rzpSubId && rzpSubId.startsWith('sub_')) {
    try {
      razorpayResult = await razorpay.subscriptions.cancel(rzpSubId, !isImmediate);
    } catch (rzpErr: any) {
      console.error('[RAZORPAY_CANCEL_ERROR]', rzpErr?.message);
    }
  }

  const today = new Date().toISOString().substring(0, 10);
  const isExpired = subRecord.endDate && subRecord.endDate < today;
  const [updatedSub] = await db.update(schema.subscriptions)
    .set({ 
      status: isImmediate ? 'cancelled' : (isExpired ? 'expired' : 'active'), 
      autoRenew: false 
    })
    .where(eq(schema.subscriptions.id, subRecord.id))
    .returning();

  if (updatedSub) {
    // When not immediate, DB status stays 'active' with autoRenew=false (end-of-period cancellation).
    // Pass the actual user intent to the notification worker so it sends the correct message.
    const notifyStatus = isImmediate ? 'cancelled' : (updatedSub.status === 'active' ? 'pending_cancellation' : updatedSub.status);

    await notificationQueue.add(
      'subscription-alert',
      {
        parentId: updatedSub.parentId,
        planName: updatedSub.planName,
        status: notifyStatus,
        amount: updatedSub.amount,
        endDate: updatedSub.endDate ? updatedSub.endDate.substring(0, 10) : '',
        tenantId: updatedSub.tenantId
      },
      { jobId: `sub-cancel-${updatedSub.id}-${Date.now()}` }
    ).catch(e => console.error('[QUEUE_ERROR] Failed to queue sub cancel alert:', e));


    await dataCache.deleteMatch([
      `*subs*${updatedSub.parentId}*`,
      `*parents*${updatedSub.tenantId}*`,
      `*dashboard*${updatedSub.tenantId}*`
    ]);
  }

  return { success: true, subscription: updatedSub, razorpay: razorpayResult };
}

async function handleWebhookSubscriptionCharged(payload: any) {
  await db.update(schema.subscriptions).set({ 
    status: 'active',
    endDate: new Date(payload.end_at * 1000).toISOString()
  }).where(eq(schema.subscriptions.transactionId, payload.id));
}

async function handleWebhookSubscriptionCancelled(payload: any) {
  const currentEndMs = payload.current_end ? payload.current_end * 1000 : 0;
  const now = Date.now();
  if (currentEndMs > now) {
    await db.update(schema.subscriptions).set({ 
      status: 'active', 
      autoRenew: false,
      endDate: new Date(currentEndMs).toISOString().substring(0, 10)
    }).where(eq(schema.subscriptions.transactionId, payload.id));
  } else {
    await db.update(schema.subscriptions).set({ status: 'cancelled', autoRenew: false }).where(eq(schema.subscriptions.transactionId, payload.id));
  }
}

async function handleWebhookSubscriptionHalted(payload: any) {
  await db.update(schema.subscriptions).set({ status: 'expired' }).where(eq(schema.subscriptions.transactionId, payload.id));
}

async function processWebhookEvent(event: any) {
  switch (event.event) {
    case 'subscription.charged':
      await handleWebhookSubscriptionCharged(event.payload.subscription.entity);
      break;
    case 'subscription.cancelled':
      await handleWebhookSubscriptionCancelled(event.payload.subscription.entity);
      break;
    case 'subscription.halted':
      await handleWebhookSubscriptionHalted(event.payload.subscription.entity);
      break;
  }
}

async function handleActionPurchase(b: any) {
  const { parentId, planId, planName, amount, period, paymentMethod, startDate, endDate, autoRenew, addons, transactionId, status } = b;
  if (!parentId || !planId) {
    return { error: 'parentId and planId are required', status: 400 };
  }

  await db.update(schema.subscriptions).set({ status: 'cancelled' })
    .where(and(eq(schema.subscriptions.parentId, parentId), eq(schema.subscriptions.status, 'active')));

  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : new Date();
  if (!endDate) {
    if (period === 'monthly') end.setMonth(end.getMonth() + 1);
    else if (period === 'quarterly') end.setMonth(end.getMonth() + 3);
    else end.setFullYear(end.getFullYear() + 1);
  }

  const txnId = transactionId || `TXN-ADMIN-${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const parent = await db.query.parents.findFirst({ where: eq(schema.parents.id, parentId), with: { user: { columns: { tenantId: true } } } });
  const tenantId = parent?.user?.tenantId || 'master';

  const [sub] = await db.insert(schema.subscriptions).values({
    parentId, planId, planName, tenantId,
    amount: Number(amount) || 0,
    period: period || 'monthly',
    status: status || 'active',
    paymentMethod: paymentMethod || 'admin',
    transactionId: txnId,
    startDate: start.toISOString().substring(0, 10),
    endDate: end.toISOString().substring(0, 10),
    autoRenew: autoRenew ?? true,
    addons: addons ? JSON.stringify(addons) : undefined
  }).returning();

  if (!sub) throw new Error('Failed to create subscription');
  await dataCache.deleteMatch([`*subs*`, `*parents*${tenantId}*`, `*dashboard*${tenantId}*`]);
  return { success: true, subscription: sub };
}

async function handleActionCancel(b: any) {
  const { subscriptionId } = b;
  if (!subscriptionId) {
    return { error: 'subscriptionId is required', status: 400 };
  }
  const existing = await db.query.subscriptions.findFirst({ where: eq(schema.subscriptions.id, subscriptionId) });
  if (!existing) {
    return { error: 'Subscription not found', status: 404 };
  }
  const [updated] = await db.update(schema.subscriptions).set({ status: 'cancelled', autoRenew: false })
    .where(eq(schema.subscriptions.id, subscriptionId)).returning();
  await dataCache.deleteMatch([`*subs*`, `*parents*${existing.tenantId}*`, `*dashboard*${existing.tenantId}*`]);
  return { success: true, subscription: updated };
}

async function handleActionResume(b: any) {
  const { subscriptionId } = b;
  if (!subscriptionId) {
    return { error: 'subscriptionId is required', status: 400 };
  }
  const subRecord = await db.query.subscriptions.findFirst({ where: eq(schema.subscriptions.id, subscriptionId) });
  if (!subRecord) {
    return { error: 'Subscription not found', status: 404 };
  }

  const [subscription] = await db.update(schema.subscriptions)
    .set({ status: 'active', autoRenew: true })
    .where(eq(schema.subscriptions.id, subscriptionId))
    .returning();
  if (!subscription) throw new Error('Failed to update subscription');

  const rzpSubId = subRecord.transactionId;
  if (rzpSubId && rzpSubId.startsWith('sub_')) {
    try {
      await razorpay.subscriptions.resume(rzpSubId, { resume_at: 'now' });
    } catch (e) {
      console.error('[RAZORPAY_RESUME_ERROR]', e);
    }
  }

  await dataCache.deleteMatch([`*subs*${subscription.parentId}*`, `*parents*${subscription.tenantId}*`, `*dashboard*${subscription.tenantId}*`]);
  return { success: true, subscription };
}

async function handleActionAddAddon(b: any) {
  const { parentId: pid, addonName, addonPrice } = b;
  const active = await db.query.subscriptions.findFirst({ where: and(eq(schema.subscriptions.parentId, pid), eq(schema.subscriptions.status, 'active')) });
  if (!active) {
    return { error: 'No active subscription', status: 400 };
  }

  const currentAddons: string[] = JSON.parse(active.addons || '[]');
  if (!currentAddons.includes(addonName)) currentAddons.push(addonName);

  const [updated] = await db.update(schema.subscriptions).set({ addons: JSON.stringify(currentAddons), amount: active.amount + addonPrice }).where(eq(schema.subscriptions.id, active.id)).returning();
  if (!updated) throw new Error('Failed to update subscription');
  await dataCache.deleteMatch([`*subs*`, `*parents*${updated.tenantId}*`, `*dashboard*${updated.tenantId}*`]);
  return { success: true, subscription: updated };
}

async function handleActionAdminUpdate(b: any) {
  const { subscriptionId } = b;
  if (!subscriptionId) {
    return { error: 'subscriptionId is required', status: 400 };
  }
  const existing = await db.query.subscriptions.findFirst({ where: eq(schema.subscriptions.id, subscriptionId) });
  if (!existing) {
    return { error: 'Subscription not found', status: 404 };
  }

  const isPlanChange = 
    (b.planId !== undefined && b.planId !== existing.planId) ||
    (b.period !== undefined && b.period !== existing.period) ||
    (b.amount !== undefined && Number(b.amount) !== existing.amount);

  if (isPlanChange) {
    await db.update(schema.subscriptions).set({ status: 'cancelled' }).where(eq(schema.subscriptions.id, subscriptionId));

    const startDate = new Date();
    const endDate = b.endDate ? new Date(b.endDate) : new Date();
    if (!b.endDate) {
      const period = b.period || existing.period;
      if (period === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
      else if (period === 'quarterly') endDate.setMonth(endDate.getMonth() + 3);
      else endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const prefix = existing.transactionId?.startsWith('sub_') ? 'TXN-RAZORPAY-' : 'TXN-ADMIN-';
    const transactionId = `${prefix}${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const [newSubscription] = await db.insert(schema.subscriptions).values({
      parentId: existing.parentId, tenantId: existing.tenantId,
      planId: b.planId ?? existing.planId,
      planName: b.planName ?? existing.planName,
      amount: b.amount !== undefined ? Number(b.amount) : existing.amount,
      period: b.period ?? existing.period,
      status: b.status ?? 'active',
      paymentMethod: b.paymentMethod ?? existing.paymentMethod,
      transactionId,
      startDate: startDate.toISOString().substring(0, 10),
      endDate: endDate.toISOString().substring(0, 10),
      autoRenew: b.autoRenew ?? existing.autoRenew,
      addons: b.addons !== undefined ? JSON.stringify(b.addons) : existing.addons,
    }).returning();

    if (!newSubscription) throw new Error('Failed to create new subscription record');
    await dataCache.deleteMatch([`*subs*`, `*parents*${existing.tenantId}*`, `*dashboard*${existing.tenantId}*`]);
    return { success: true, subscription: newSubscription };
  } else {
    const updateData: Record<string, unknown> = {};
    if (b.planId !== undefined) updateData.planId = b.planId;
    if (b.planName !== undefined) updateData.planName = b.planName;
    if (b.amount !== undefined) updateData.amount = Number(b.amount);
    if (b.period !== undefined) updateData.period = b.period;
    if (b.autoRenew !== undefined) updateData.autoRenew = b.autoRenew;
    if (b.paymentMethod !== undefined) updateData.paymentMethod = b.paymentMethod;
    if (b.status !== undefined) updateData.status = b.status;
    if (b.addons !== undefined) updateData.addons = JSON.stringify(b.addons);
    if (b.endDate !== undefined) updateData.endDate = b.endDate;

    const [updated] = await db.update(schema.subscriptions).set(updateData).where(eq(schema.subscriptions.id, subscriptionId)).returning();
    if (!updated) throw new Error('Failed to update subscription');
    await dataCache.deleteMatch([`*subs*`, `*parents*${updated.tenantId}*`, `*dashboard*${updated.tenantId}*`]);
    return { success: true, subscription: updated };
  }
}

async function handleActionAdminActivate(b: any) {
  const updateData: Record<string, unknown> = { status: 'active', autoRenew: true };
  if (b.newEndDate) updateData.endDate = b.newEndDate;
  const [activated] = await db.update(schema.subscriptions).set(updateData).where(eq(schema.subscriptions.id, b.subscriptionId)).returning();
  if (!activated) throw new Error('Failed to activate subscription');
  await dataCache.deleteMatch([`*subs*`, `*parents*${activated.tenantId}*`, `*dashboard*${activated.tenantId}*`]);
  return { success: true, subscription: activated };
}

async function handleActionAdminExtend(b: any) {
  const { subscriptionId } = b;
  const existing = await db.query.subscriptions.findFirst({ where: eq(schema.subscriptions.id, subscriptionId) });
  if (!existing) {
    return { error: 'Subscription not found', status: 404 };
  }
  const baseDate = existing.endDate ? new Date(existing.endDate) : new Date();
  baseDate.setDate(baseDate.getDate() + b.days);
  const [extended] = await db.update(schema.subscriptions).set({ endDate: formatDate(baseDate) }).where(eq(schema.subscriptions.id, b.subscriptionId)).returning();
  if (!extended) throw new Error('Failed to extend subscription');
  await dataCache.deleteMatch([`*subs*`, `*parents*${extended.tenantId}*`, `*dashboard*${extended.tenantId}*`]);
  return { success: true, subscription: extended };
}

// --- ROUTES ---

/**
 * Parent subscriptions are billing records. A school admin works their own
 * school's; a platform admin needs the matching `billing` grant, since these
 * endpoints carry no tenant of their own to scope by.
 */
async function platformBillingMay(user: any, action: PermissionAction) {
  return user.role !== 'super_admin' || await platformMay(user, 'billing', action);
}

export const subscriptionsRoutes = new Elysia({ prefix: '/subscriptions' })
  .use(requireAuth)
  .get('/plans', () => {
    return {
      schoolPlans: SCHOOL_PLANS,
      parentPlans: PARENT_PLANS,
    };
  })
  .get('/', async ({ query, user, set }: any) => {
    try {
      let parentId = query.parentId as string | undefined;
      const view = query.view;

      // 🚀 AUTO-DETECT PARENT
      if (!parentId && user.role === 'parent') {
        const parentRecord = await db.query.parents.findFirst({ where: eq(schema.parents.userId, user.id) });
        if (parentRecord) {
          parentId = parentRecord.id;
        } else {
          return { parent: null, activeSubscription: null, subscriptions: [] };
        }
      }

      const isAdminView = user.role === 'admin' || user.role === 'super_admin';

      if (parentId) {
        // A parent may read only their own record; a school admin only within their tenant.
        const parentRecord = await db.query.parents.findFirst({
          where: eq(schema.parents.id, parentId),
          columns: { userId: true },
          with: { user: { columns: { tenantId: true } } }
        });
        const isOwner = parentRecord?.userId === user.id;
        const isInTenant = isAdminView && user.role === 'admin' && parentRecord?.user?.tenantId === user.tenantId;
        const isPlatformBilling = user.role === 'super_admin' && await platformMay(user, 'billing', 'view');
        if (!parentRecord || (!isOwner && !isInTenant && !isPlatformBilling)) {
          set.status = 403;
          return { error: 'Access denied to this parent' };
        }
        return await getParentSubscriptions(parentId);
      }

      if (view === 'admin') {
        if (!isAdminView) {
          set.status = 403;
          return { error: 'Admin access required' };
        }
        if (!(await platformBillingMay(user, 'view'))) {
          set.status = 403;
          return { error: 'Access denied: view permission for billing is required' };
        }
        return await getAdminSubscriptions(query, user.role === 'super_admin' ? null : user.tenantId);
      }

      set.status = 400;
      return { error: 'Missing parentId or view parameter' };
    } catch (error) {
      captureError(error, { method: 'GET', path: '/subscriptions' });
      set.status = 500;
      return { error: 'Failed to load subscription' };
    }
  })
  .post('/razorpay/create-subscription', async ({ body, user, set }: any) => {
    try {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        set.status = 500;
        return { error: 'Razorpay API keys are not configured in .env' };
      }

      let { planId, period, parentId } = body as { planId: string, period: string, parentId: string };
      
      const lookupKey = `${planId}-${period}`;
      const rzpPlanId = RAZORPAY_PARENT_PLANS[lookupKey];

      if (!rzpPlanId) {
        set.status = 400;
        return { error: `Razorpay Plan ID not configured for ${planId}-${period}` };
      }

      // 🛡️ Resolve parentId if it's unlinked
      if (parentId.startsWith('unlinked-')) {
        const userId = parentId.replace('unlinked-', '');
        const [newParent] = await db.insert(schema.parents).values({ userId, occupation: '' })
          .onConflictDoUpdate({ target: schema.parents.userId, set: { updatedAt: new Date() } })
          .returning();
        if (!newParent) throw new Error('Failed to create parent');
        parentId = newParent.id;
      }

      const payload: any = {
        plan_id: rzpPlanId,
        customer_notify: 1,
        total_count: 12,
        notes: { parentId, planId, userId: user.id }
      };

      const subscription = await (razorpay.subscriptions.create(payload) as any);

      return { 
        subscriptionId: subscription.id,
        keyId: process.env.RAZORPAY_KEY_ID
      };
    } catch (error: any) {
      captureError(error, { method: 'POST', path: '/subscriptions/razorpay/create-subscription' });
      set.status = 500;
      return { error: error.error?.description || 'Failed to create subscription' };
    }
  })
  .post('/razorpay/verify-subscription', async ({ body, user, set }: any) => {
    try {
      const res = await verifySubscription(body, user);
      if ('error' in res && res.status) {
        set.status = res.status;
        return { error: res.error };
      }
      return res;
    } catch (error) {
      captureError(error, { method: 'POST', path: '/subscriptions/razorpay/verify-subscription' });
      set.status = 500;
      return { error: 'Subscription verification failed' };
    }
  })
  .post('/razorpay/cancel-subscription', async ({ body, set }: any) => {
    try {
      const res = await cancelSubscription(body);
      if ('error' in res && res.status) {
        set.status = res.status;
        return { error: res.error };
      }
      return res;
    } catch (error: any) {
      captureError(error, { method: 'POST', path: '/subscriptions/razorpay/cancel-subscription' });
      // `.error.description` is the Razorpay gateway's own message, which the
      // parent screen toasts; a bare `.message` here would be a DB throw.
      set.status = 500;
      return { error: error.error?.description || 'Failed to cancel subscription' };
    }
  })
  .post('/razorpay/update-subscription', async ({ body, set }: any) => {
    try {
      const { subscriptionId, newPlanId, newPeriod } = body as any;
      if (!subscriptionId || !newPlanId) {
        set.status = 400;
        return { error: 'subscriptionId and newPlanId are required' };
      }
      const lookupKey = `${newPlanId}-${newPeriod || 'monthly'}`;
      const rzpPlanId = RAZORPAY_PARENT_PLANS[lookupKey];
      if (!rzpPlanId) {
        set.status = 400;
        return { error: `Razorpay Plan ID not configured for ${lookupKey}` };
      }
      const updated = await (razorpay.subscriptions.update(subscriptionId, { plan_id: rzpPlanId }) as any);
      return { success: true, subscription: updated };
    } catch (error: any) {
      captureError(error, { method: 'POST', path: '/subscriptions/razorpay/update-subscription' });
      set.status = 500;
      return { error: error.error?.description || 'Failed to update subscription' };
    }
  })
  .post('/razorpay/webhook', async ({ body, request, set }: any) => {
    try {
      const signature = request.headers.get('x-razorpay-signature');
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

      if (!signature || !secret) {
        set.status = 400;
        return { error: 'Webhook signature or secret missing' };
      }

      const isValid = Razorpay.validateWebhookSignature(
        JSON.stringify(body),
        signature,
        secret
      );

      if (!isValid) {
        set.status = 400;
        return { error: 'Invalid webhook signature' };
      }

      await processWebhookEvent(body);

      return { received: true };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/subscriptions/razorpay/webhook' });
      set.status = 500;
      return { error: 'Webhook processing failed' };
    }
  })
  .post('/', async ({ body, user, set }: any) => {
    try {
      const b = body as any;
      const { action } = b;

      // admin-* actions mutate billing for a tenant without any Razorpay mandate,
      // so they must not be reachable with a parent/student token.
      if (typeof action === 'string' && action.startsWith('admin-')
        && user.role !== 'admin' && user.role !== 'super_admin') {
        set.status = 403;
        return { error: 'Admin access required' };
      }

      // `admin-*` mutates a school's billing, so a platform admin needs the
      // `billing` grant for it. A school admin stays inside their own tenant.
      if (typeof action === 'string' && action.startsWith('admin-') && user.role === 'super_admin') {
        const wanted: PermissionAction = action === 'admin-create' ? 'create' : 'edit';
        if (!(await platformMay(user, 'billing', wanted))) {
          set.status = 403;
          return { error: `Access denied: ${wanted} permission for billing is required` };
        }
      }

      let res: any;
      if (action === 'purchase' || action === 'admin-create') {
        res = await handleActionPurchase(b);
      } else if (action === 'cancel') {
        res = await handleActionCancel(b);
      } else if (action === 'resume') {
        res = await handleActionResume(b);
      } else if (action === 'add-addon') {
        res = await handleActionAddAddon(b);
      } else if (action === 'admin-update') {
        res = await handleActionAdminUpdate(b);
      } else if (action === 'admin-activate') {
        res = await handleActionAdminActivate(b);
      } else if (action === 'admin-extend') {
        res = await handleActionAdminExtend(b);
      } else {
        set.status = 400;
        return { error: 'Invalid action' };
      }

      if (res && 'error' in res && res.status) {
        set.status = res.status;
        return { error: res.error };
      }
      return res;
    } catch (error: any) {
      captureError(error, { method: 'POST', path: '/subscriptions' });
      set.status = 500;
      // Actionable billing failures come back as `{ error, status }` from the
      // handlers above and are forwarded verbatim; this catch only sees
      // unexpected Razorpay/DB throws.
      return { error: 'Failed to process subscription change' };
    }
  })
  .delete('/', async ({ query, user, set }: any) => {
    try {
      const id = query.id as string;
      if (!id) { set.status = 400; return { error: 'ID required' }; }
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        set.status = 403;
        return { error: 'Admin access required' };
      }
      if (!(await platformBillingMay(user, 'delete'))) {
        set.status = 403;
        return { error: 'Access denied: delete permission for billing is required' };
      }
      const existing = await db.query.subscriptions.findFirst({
        where: eq(schema.subscriptions.id, id),
        columns: { id: true, tenantId: true }
      });
      if (!existing) { set.status = 404; return { error: 'Subscription not found' }; }
      if (user.role !== 'super_admin' && existing.tenantId !== user.tenantId) {
        set.status = 403;
        return { error: 'Access denied to this subscription' };
      }
      await db.delete(schema.subscriptions).where(eq(schema.subscriptions.id, id));
      return { success: true };
    } catch (error) {
      captureError(error, { method: 'DELETE', path: '/subscriptions' });
      set.status = 500;
      return { error: 'Failed to delete subscription' };
    }
  });
