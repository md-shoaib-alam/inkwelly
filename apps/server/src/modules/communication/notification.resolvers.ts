import { db } from "../../lib/db";
import * as schema from "../../db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { pushQueue } from "../../lib/queue";
import { sendPushNotification } from "../../lib/firebase-admin";
import { requirePlatformModule } from "../../graphql/resolvers/helpers";

export const notificationResolvers = {
  Query: {
    platformNotices: async (_: any, { limit }: any, context: any) => {
      await requirePlatformModule(context, 'notices', 'view')
      return await db.query.platformNotices.findMany({
        orderBy: [desc(schema.platformNotices.createdAt)],
        limit: limit || 10,
      });
    },
    activePlatformNotice: async (_: any, __: any, context: any) => {
      const userRole = context.user?.role;
      const notices = await db.query.platformNotices.findMany({
        where: eq(schema.platformNotices.isActive, true),
        orderBy: [desc(schema.platformNotices.createdAt)],
        limit: 5 // Check recent active ones
      });

      return notices.find((n: any) => {
        if (n.target === 'everyone') return true;
        if (!userRole) return false;
        if (n.target === 'all_schools' && (userRole === 'admin' || userRole === 'staff')) return true;
        if (n.target === 'all_parents' && userRole === 'parent') return true;
        if (n.target === 'all_super_admins' && userRole === 'super_admin') return true;
        return false;
      });
    },
  },
  Mutation: {
    saveNotificationToken: async (_: any, { token, platform }: any, context: any) => {
      if (!context.user?.id) {
        throw new Error("Unauthorized");
      }

      const [updated] = await db.insert(schema.notificationTokens).values({
        token,
        userId: context.user.id,
        platform: platform || "web",
        lastUsed: new Date()
      })
      .onConflictDoUpdate({
        target: [schema.notificationTokens.token],
        set: {
          userId: context.user.id,
          platform: platform || "web",
          lastUsed: new Date()
        }
      }).returning();

      return updated;
    },

    sendGlobalPush: async (_: any, { title, body, target, schoolId, link, imageUrl }: any, context: any) => {
      await requirePlatformModule(context, 'notices', 'create')

      const conditions = [eq(schema.users.isActive, true)];

      if (target === "all_schools") {
        conditions.push(eq(schema.users.role, "admin"));
      } else if (target === "specific_school" && schoolId) {
        conditions.push(eq(schema.users.tenantId, schoolId));
        conditions.push(eq(schema.users.role, "admin"));
      } else if (target === "all_parents") {
        conditions.push(eq(schema.users.role, "parent"));
      } else if (target === "school_parents" && schoolId) {
        conditions.push(eq(schema.users.tenantId, schoolId));
        conditions.push(eq(schema.users.role, "parent"));
      } else if (target === "all_super_admins") {
        conditions.push(eq(schema.users.role, "super_admin"));
      }

      const tokens = await db.select({ token: schema.notificationTokens.token })
        .from(schema.notificationTokens)
        .where(inArray(
          schema.notificationTokens.userId,
          db.select({ id: schema.users.id }).from(schema.users).where(and(...conditions))
        ));

      const allTokens = tokens.map((t: any) => t.token);

      if (allTokens.length === 0) {
        return { success: true, message: "No active device tokens found." };
      }

      // Use BullMQ to handle background delivery
      const BATCH_SIZE = 500;
      for (let i = 0; i < allTokens.length; i += BATCH_SIZE) {
        const batch = allTokens.slice(i, i + BATCH_SIZE);
        await pushQueue.add(`global-push-${target}-${i}`, {
          tokens: batch,
          title,
          body,
          data: link ? { link } : undefined,
          imageUrl
        });
      }

      return { success: true, message: `Notification queued for ${allTokens.length} devices.` };
    },

    sendDirectPush: async (_: any, { token, title, body, link, imageUrl }: any, context: any) => {
      await requirePlatformModule(context, 'notices', 'create')

      try {
        const data = link ? { link } : {};
        const response = await sendPushNotification([token], title, body, data, imageUrl);
        if (response.failureCount > 0) {
          return {
            success: false,
            message: `Failed to deliver notification. Check if the token is valid.`
          };
        }
        return {
          success: true,
          message: "Notification sent successfully via server!"
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Failed to send notification"
        };
      }
    },

    sendGlobalNotice: async (_: any, { title, body, target, schoolId }: any, context: any) => {
      await requirePlatformModule(context, 'notices', 'create')

      // 1. Save to PlatformNotice table (Persistent)
      await db.insert(schema.platformNotices).values({
        title,
        content: body,
        target,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { success: true, message: `Notice published successfully.` };
    },
    deletePlatformNotice: async (_: any, { id }: any, context: any) => {
      await requirePlatformModule(context, 'notices', 'delete')

      await db.delete(schema.platformNotices).where(eq(schema.platformNotices.id, id));
      return { success: true, message: `Notice deleted successfully.` };
    },
  },
};

