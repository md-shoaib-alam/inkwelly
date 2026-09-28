import { Elysia, t } from 'elysia';
import { requireAuth } from '../../lib/auth';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../lib/logger';
import { db } from '../../lib/db';
import { users } from '../../db/schema';
import { eq, or } from 'drizzle-orm';

import { loginRoute } from './login';
import { refreshRoute } from './refresh';
import { logoutRoute } from './logout';
import { meRoute } from './me';
import { profileRoute } from './profile';
import { passwordRoute } from './password';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .derive(({ request }) => {
    const reqId = uuidv4();
    const reqLogger = logger.child({ reqId });
    return { reqId, log: reqLogger };
  })
  // Public routes
  .use(loginRoute)
  .use(refreshRoute)
  .post('/reset-password', async ({ body, set }) => {
    try {
      const { email, phone } = body;
      const target = email || phone;
      if (!target) {
        set.status = 400;
        return { error: 'Email or phone number is required' };
      }
      const user = await db.query.users.findFirst({
        where: or(
          eq(users.email, target),
          eq(users.phone, target)
        )
      });
      if (!user) {
        set.status = 404;
        return { error: 'User with this email or phone number does not exist' };
      }
      return { success: true, message: 'Password reset link/code has been sent.' };
    } catch (err) {
      set.status = 500;
      return { error: 'Failed to request password reset' };
    }
  }, {
    body: t.Object({
      email: t.Optional(t.String()),
      phone: t.Optional(t.String()),
    }),
  })

  .use(logoutRoute)
  
  // Protected routes
  .use(requireAuth)
  .use(meRoute)
  .use(profileRoute)
  .use(passwordRoute);
export default authRoutes;
