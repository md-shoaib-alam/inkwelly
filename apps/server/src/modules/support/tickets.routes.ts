import { Elysia } from 'elysia';
import { db } from '../../lib/db';
import * as schema from '../../db/schema';
import { eq, and, desc, or, inArray, sql } from 'drizzle-orm';
import { requireAuth } from '../../lib/auth';
import { platformMay } from '../../lib/permissions';
import { posthog, captureError } from '../../lib/monitoring/posthog';

const VALID_STATUSES = ['open', 'in_progress', 'on_hold', 'resolved', 'closed'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_CATEGORIES = ['general', 'billing', 'technical', 'academics', 'feature_request', 'complaint', 'other'];

/**
 * A platform admin's reach over tickets is the `support` grant: a root admin
 * holds it, a scoped one only works the queue they were given. Every other role
 * stays inside their own tickets.
 */
async function mayActOnTickets(user: any, action: 'view' | 'create' | 'edit' | 'delete') {
  return user?.role === 'super_admin' && (await platformMay(user, 'support', action));
}

export const ticketsRoutes = new Elysia({ prefix: '/tickets' })
  .use(requireAuth)
  // GET /tickets
  .get('/', async ({ query, set, tenantId, user }) => {
    try {
      const conditions = [];
      const seesAllTenants = await mayActOnTickets(user, 'view');

      if (tenantId) {
        conditions.push(eq(schema.tickets.tenantId, tenantId));
      }

      // Only a super_admin holding the `support` grant sees beyond their own
      // tickets; every other role (admin, teacher, student, parent, staff) is
      // limited to the ones they opened.
      if (!seesAllTenants) {
        conditions.push(eq(schema.tickets.createdBy, user?.id || ''));
      }

      if (query.status === 'my_open') {
        if (!query.createdBy) { set.status = 400; return { error: 'createdBy is required when filtering by my_open status' }; }
        conditions.push(eq(schema.tickets.createdBy, query.createdBy as string));
        conditions.push(inArray(schema.tickets.status, ['open', 'in_progress']));
      } else if (query.status && VALID_STATUSES.includes(query.status as string)) {
        conditions.push(eq(schema.tickets.status, query.status as string));
      } else if (query.status && query.status !== 'my_open') {
        set.status = 400;
        return { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` };
      }

      if (query.createdBy && query.status !== 'my_open' && user?.role === 'super_admin') conditions.push(eq(schema.tickets.createdBy, query.createdBy as string));
      if (query.assignedTo && user?.role === 'super_admin') conditions.push(eq(schema.tickets.assignedTo, query.assignedTo as string));

      if (query.priority) {
        if (!VALID_PRIORITIES.includes(query.priority as string)) { set.status = 400; return { error: `Invalid priority` }; }
        conditions.push(eq(schema.tickets.priority, query.priority as string));
      }
      if (query.category) {
        if (!VALID_CATEGORIES.includes(query.category as string)) { set.status = 400; return { error: `Invalid category` }; }
        conditions.push(eq(schema.tickets.category, query.category as string));
      }

      const ticketsList = await db.query.tickets.findMany({
        where: and(...conditions),
        with: {
          creator: { columns: { id: true, name: true, role: true, avatar: true } },
          assignee: { columns: { id: true, name: true, role: true, avatar: true } },
          messages: { columns: { id: true } },
        },
        orderBy: [desc(schema.tickets.createdAt)],
      });

      return ticketsList.map(t => ({
        ...t,
        _count: { messages: t.messages.length },
        messages: undefined
      }));
    } catch (error) {
      captureError(error, { method: 'GET', path: '/tickets', tenantId });
      set.status = 500;
      return { error: 'Failed to fetch tickets' };
    }
  })
  // POST /tickets — create
  .post('/', async ({ body, set, tenantId, user }) => {
    try {
      const b = body as any;
      if (!b.title || typeof b.title !== 'string' || b.title.trim().length === 0) { set.status = 400; return { error: 'Title is required' }; }
      if (!b.description || typeof b.description !== 'string' || b.description.trim().length === 0) { set.status = 400; return { error: 'Description is required' }; }

      // Force the creator to be the authenticated user to prevent impersonation.
      const creatorId = user!.id;

      if (b.priority && !VALID_PRIORITIES.includes(b.priority)) { set.status = 400; return { error: `Invalid priority` }; }
      if (b.category && !VALID_CATEGORIES.includes(b.category)) { set.status = 400; return { error: `Invalid category` }; }

      const [ticket] = await db.insert(schema.tickets).values({ 
        title: b.title.trim(), 
        description: b.description.trim(), 
        priority: b.priority || 'medium', 
        category: b.category || 'general', 
        status: 'open', 
        createdBy: creatorId, 
        tenantId: tenantId || null 
      }).returning();

      if (!ticket) throw new Error('Failed to create ticket');

      const fullTicket = await db.query.tickets.findFirst({
        where: eq(schema.tickets.id, ticket.id),
        with: {
          creator: { columns: { id: true, name: true, role: true, avatar: true } },
          assignee: { columns: { id: true, name: true, role: true, avatar: true } },
          messages: { columns: { id: true } },
        }
      });

      set.status = 201;

      posthog.capture({
        distinctId: tenantId || 'system',
        event: 'ticket_created',
        properties: {
          tenantId,
          ticketId: ticket.id,
          title: ticket.title,
          category: ticket.category,
          priority: ticket.priority
        }
      });

      return {
        ...fullTicket,
        _count: { messages: fullTicket?.messages.length || 0 },
        messages: undefined
      };
    } catch (error) {
      captureError(error, { method: 'POST', path: '/tickets', tenantId });
      set.status = 500;
      return { error: 'Failed to create ticket' };
    }
  })
  // GET /tickets/:id
  .get('/:id', async ({ params, set, user }) => {
    try {
      const { id } = params;
      const ticket = await db.query.tickets.findFirst({
        where: eq(schema.tickets.id, id),
        with: {
          creator: { columns: { id: true, name: true, role: true, avatar: true } },
          assignee: { columns: { id: true, name: true, role: true, avatar: true } },
          messages: { 
            with: { author: { columns: { id: true, name: true, role: true, avatar: true } } }, 
            orderBy: [desc(schema.ticketMessages.createdAt)] 
          },
        },
      });

      if (!ticket) { set.status = 404; return { error: 'Ticket not found' }; }
      
      // Only a supported-grant super admin or the ticket creator can view it
      if (!(await mayActOnTickets(user, 'view')) && ticket.createdBy !== user?.id) {
        set.status = 403;
        return { error: 'You do not have permission to view this ticket' };
      }
      
      return ticket;
    } catch (error) {
      captureError(error, { method: 'GET', path: '/tickets/:id' });
      set.status = 500;
      return { error: 'Failed to fetch ticket' };
    }
  })
  // PUT /tickets/:id
  .put('/:id', async ({ params, body, set, user }) => {
    try {
      const { id } = params;
      const b = body as any;

      const existingTicket = await db.query.tickets.findFirst({ where: eq(schema.tickets.id, id), columns: { id: true, createdBy: true } });
      if (!existingTicket) { set.status = 404; return { error: 'Ticket not found' }; }

      // Only a support-granted super admin or the ticket creator may update it.
      const isSupport = await mayActOnTickets(user, 'edit');
      const isCreator = existingTicket.createdBy === user?.id;
      if (!isSupport && !isCreator) {
        set.status = 403;
        return { error: 'You do not have permission to update this ticket' };
      }

      const updateData: any = {};
      if (b.status !== undefined) {
        if (!VALID_STATUSES.includes(b.status)) { set.status = 400; return { error: `Invalid status` }; }
        updateData.status = b.status;
      }
      if (b.priority !== undefined) {
        if (!VALID_PRIORITIES.includes(b.priority)) { set.status = 400; return { error: `Invalid priority` }; }
        updateData.priority = b.priority;
      }
      // Ownership is already enforced above (super admin or creator), so the
      // caller may also (re)assign their ticket. The assignee must exist.
      if (b.assignedTo !== undefined) {
        if (b.assignedTo !== null && typeof b.assignedTo === 'string') {
          const assignee = await db.query.users.findFirst({ where: eq(schema.users.id, b.assignedTo), columns: { id: true } });
          if (!assignee) { set.status = 404; return { error: 'Assignee user not found' }; }
          updateData.assignedTo = b.assignedTo;
        } else if (b.assignedTo === null) {
          updateData.assignedTo = null;
        }
      }

      if (Object.keys(updateData).length === 0) {
        set.status = 400;
        return { error: 'No valid fields to update.' };
      }

      await db.update(schema.tickets).set(updateData).where(eq(schema.tickets.id, id));

      const updatedTicket = await db.query.tickets.findFirst({
        where: eq(schema.tickets.id, id),
        with: {
          creator: { columns: { id: true, name: true, role: true, avatar: true } },
          assignee: { columns: { id: true, name: true, role: true, avatar: true } },
          messages: { columns: { id: true } },
        }
      });

      return {
        ...updatedTicket,
        _count: { messages: updatedTicket?.messages.length || 0 },
        messages: undefined
      };
    } catch (error) {
      captureError(error, { method: 'PUT', path: '/tickets/:id' });
      set.status = 500;
      return { error: 'Failed to update ticket' };
    }
  })
  // DELETE /tickets/:id
  .delete('/:id', async ({ params, set, user }) => {
    try {
      const { id } = params;
      const existingTicket = await db.query.tickets.findFirst({ where: eq(schema.tickets.id, id), columns: { id: true, createdBy: true } });
      if (!existingTicket) { set.status = 404; return { error: 'Ticket not found' }; }

      // Only a support-granted super admin or the ticket creator may delete it.
      const isSupport = await mayActOnTickets(user, 'delete');
      const isCreator = existingTicket.createdBy === user?.id;
      if (!isSupport && !isCreator) {
        set.status = 403;
        return { error: 'You do not have permission to delete this ticket' };
      }

      await db.delete(schema.tickets).where(eq(schema.tickets.id, id));
      return { success: true, message: 'Ticket deleted successfully' };
    } catch (error) {
      captureError(error, { method: 'DELETE', path: '/tickets/:id' });
      set.status = 500;
      return { error: 'Failed to delete ticket' };
    }
  })
  // POST /tickets/:id/messages
  .post('/:id/messages', async ({ params, body, set, user }) => {
    try {
      const { id: ticketId } = params;
      const b = body as any;

      if (!b.message || typeof b.message !== 'string' || b.message.trim().length === 0) { set.status = 400; return { error: 'Message is required' }; }

      const ticket = await db.query.tickets.findFirst({ where: eq(schema.tickets.id, ticketId), columns: { id: true, createdBy: true } });
      if (!ticket) { set.status = 404; return { error: 'Ticket not found' }; }

      // Only a support-granted super admin or the ticket creator may post, and
      // the author is always the authenticated user (prevents impersonation).
      const isSupport = await mayActOnTickets(user, 'create');
      const isCreator = ticket.createdBy === user?.id;
      if (!isSupport && !isCreator) {
        set.status = 403;
        return { error: 'You do not have permission to reply to this ticket' };
      }
      const authorId = user!.id;

      const ticketMessage = await db.transaction(async (tx) => {
        const [msg] = await tx.insert(schema.ticketMessages).values({ 
          ticketId, 
          userId: authorId, 
          message: b.message.trim() 
        }).returning();

        if (!msg) throw new Error('Failed to add message');

        await tx.update(schema.tickets).set({ updatedAt: new Date() }).where(eq(schema.tickets.id, ticketId));

        return await tx.query.ticketMessages.findFirst({
          where: eq(schema.ticketMessages.id, msg.id),
          with: { author: { columns: { id: true, name: true, role: true, avatar: true } } }
        });
      });

      set.status = 201;
      return ticketMessage;
    } catch (error) {
      captureError(error, { method: 'POST', path: '/tickets/:id/messages' });
      set.status = 500;
      return { error: 'Failed to add message' };
    }
  });

