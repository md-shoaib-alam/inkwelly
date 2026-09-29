import { db } from '../../lib/db'
import * as schema from '../../db/schema'
import { eq, and, desc, count, sql, sum, ilike, inArray } from 'drizzle-orm'
import { checkAuth, paginate, requireModule, tenantFromArg } from '../../graphql/resolvers/helpers'

export const financeQueries = {
  expenseCategories: async (_: unknown, args: { tenantId?: string }, context: any) => {
    const { user } = await requireModule(context, 'expenses', 'view');
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');

    return db.query.expenseCategories.findMany({
      where: eq(schema.expenseCategories.tenantId, tenantId),
      orderBy: [schema.expenseCategories.name]
    });
  },

  expenses: async (_: unknown, args: { categoryId?: string; status?: string; page?: number; limit?: number; tenantId?: string }, context: any) => {
    const { user } = await requireModule(context, 'expenses', 'view');
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');

    const conditions = [eq(schema.expenses.tenantId, tenantId)];
    if (args.categoryId) conditions.push(eq(schema.expenses.categoryId, args.categoryId));
    if (args.status) conditions.push(eq(schema.expenses.status, args.status as any));

    return paginate(schema.expenses, db.query.expenses, {
      where: and(...conditions),
      page: args.page,
      limit: args.limit,
      with: { category: true },
      orderBy: [desc(schema.expenses.date)]
    });
  },

  expenseStats: async (_: unknown, args: { tenantId?: string }, context: any) => {
    const { user } = await requireModule(context, 'expenses', 'view');
    const tenantId = await tenantFromArg(user, args.tenantId);
    if (!tenantId) throw new Error('Tenant context required');

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const [totalRes, thisMonthRes, prevMonthRes, categoryWiseRes] = await Promise.all([
      db.select({ total: sum(schema.expenses.amount) })
        .from(schema.expenses)
        .where(and(eq(schema.expenses.tenantId, tenantId), eq(schema.expenses.status, 'paid'))),
      db.select({ total: sum(schema.expenses.amount) })
        .from(schema.expenses)
        .where(and(
          eq(schema.expenses.tenantId, tenantId), 
          eq(schema.expenses.status, 'paid'),
          ilike(schema.expenses.date, `${currentMonth}%`)
        )),
      db.select({ total: sum(schema.expenses.amount) })
        .from(schema.expenses)
        .where(and(
          eq(schema.expenses.tenantId, tenantId), 
          eq(schema.expenses.status, 'paid'),
          ilike(schema.expenses.date, `${prevMonth}%`)
        )),
      db.select({ categoryId: schema.expenses.categoryId, amount: sum(schema.expenses.amount) })
        .from(schema.expenses)
        .where(and(eq(schema.expenses.tenantId, tenantId), eq(schema.expenses.status, 'paid')))
        .groupBy(schema.expenses.categoryId)
    ]);

    const catIds = categoryWiseRes.map(c => c.categoryId);
    const categories = catIds.length > 0 
      ? await db.query.expenseCategories.findMany({ where: inArray(schema.expenseCategories.id, catIds) })
      : [];

    return {
      totalExpenses: Number(totalRes[0]?.total || 0),
      thisMonthExpenses: Number(thisMonthRes[0]?.total || 0),
      prevMonthExpenses: Number(prevMonthRes[0]?.total || 0),
      categoryWiseExpenses: categoryWiseRes.map((c: any) => ({
        categoryId: c.categoryId,
        categoryName: categories.find((cat: any) => cat.id === c.categoryId)?.name || 'Unknown',
        amount: Number(c.amount || 0)
      }))
    };
  }
};

export const financeMutations = {
  createExpenseCategory: async (_: unknown, { input }: { input: any }, context: any) => {
    const { tenantId } = await requireModule(context, 'expenses', 'create');
    if (!tenantId) throw new Error('Tenant required');

    const [category] = await db.insert(schema.expenseCategories).values({ ...input, tenantId }).returning();
    return category;
  },

  createExpense: async (_: unknown, { input }: { input: any }, context: any) => {
    const { tenantId } = await requireModule(context, 'expenses', 'create');
    if (!tenantId) throw new Error('Tenant required');

    const [expense] = await db.insert(schema.expenses).values({ ...input, tenantId }).returning();
    return db.query.expenses.findFirst({
      where: eq(schema.expenses.id, expense!.id),
      with: { category: true }
    });
  },

  updateExpense: async (_: unknown, { id, input }: { id: string, input: any }, context: any) => {
    const { tenantId } = await requireModule(context, 'expenses', 'edit');
    const existing = await db.query.expenses.findFirst({ where: and(eq(schema.expenses.id, id), eq(schema.expenses.tenantId, tenantId)) });
    if (!existing) throw new Error('Expense not found');

    await db.update(schema.expenses).set(input).where(eq(schema.expenses.id, id));
    return db.query.expenses.findFirst({
      where: eq(schema.expenses.id, id),
      with: { category: true }
    });
  },

  deleteExpense: async (_: unknown, { id }: { id: string }, context: any) => {
    const { tenantId } = await requireModule(context, 'expenses', 'delete');
    const res = await db.delete(schema.expenses).where(and(eq(schema.expenses.id, id), eq(schema.expenses.tenantId, tenantId))).returning();
    if (res.length === 0) throw new Error('Expense not found');
    return true;
  }
};

