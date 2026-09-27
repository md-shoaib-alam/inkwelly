import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { env } from "./env";
import { db } from "./db";
import * as schema from "../db/schema";
import { inArray } from "drizzle-orm";

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
  console.log("🔥 Firebase Admin initialized successfully via Env Vars");
}

export const getMessagingInstance = () => {
  if (getApps().length === 0) return null;
  return getMessaging();
};

/**
 * Premium Push Method: Queues a notification with support for instant or delayed delivery.
 */
export const queuePushNotification = async (
  options: {
    tokens: string[];
    title: string;
    body: string;
    data?: any;
    imageUrl?: string;
    delay?: number; // ms to wait before sending
    priority?: number; // 1 (highest) to MAX
  }
) => {
  const { pushQueue } = await import("./queue");
  const jobKey = `push_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  return await pushQueue.add(
    jobKey,
    {
      tokens: options.tokens,
      title: options.title,
      body: options.body,
      data: options.data,
      imageUrl: options.imageUrl,
    },
    {
      jobId: jobKey,
      delay: options.delay || 0,
      priority: options.priority || 2, // Default to medium priority
      removeOnComplete: true,
    }
  );
};

// FCM requires ALL data payload values to be strings.
// Non-string values (numbers, booleans, objects) cause the entire FCM call to silently fail.
const stringifyData = (obj: Record<string, any>): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      result[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
    }
  }
  return result;
};

export const sendPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data?: any,
  imageUrl?: string
) => {
  if (tokens.length === 0) return { successCount: 0, failureCount: 0, responses: [] };

  const safeData = data ? stringifyData(data) : {};

  const message: any = {
    notification: {
      title,
      body,
      ...(imageUrl ? { imageUrl } : {}),
    },
    data: safeData,
    tokens,
    android: {
      priority: 'high',
      notification: {
        channelId: 'default',
        ...(imageUrl ? { imageUrl } : {}),
      },
    },
    apns: {
      payload: {
        aps: {
          'content-available': 1,
          'mutable-content': 1,
          sound: 'default',
        },
      },
      ...(imageUrl ? {
        fcmOptions: {
          imageUrl: imageUrl,
        },
      } : {}),
    },
  };

  message.webpush = {
    notification: {
      icon: "/logo.svg",
      ...(imageUrl ? { image: imageUrl } : {}),
    },
    ...(safeData.link ? { fcmOptions: { link: safeData.link } } : {}),
  };

  try {
    const response = await getMessaging().sendEachForMulticast(message);
    console.log(`Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`);

    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const error = resp.error;
          const code = error?.code;
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token"
          ) {
            const token = tokens[idx];
            if (token) failedTokens.push(token);
          }
        }
      });

      if (failedTokens.length > 0) {
        console.log(`Pruning ${failedTokens.length} failed/unregistered tokens.`);
        try {
          await db
            .delete(schema.notificationTokens)
            .where(inArray(schema.notificationTokens.token, failedTokens));
        } catch (dbError) {
          console.error("Error deleting stale tokens from DB:", dbError);
        }
      }
    }

    return response;
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw error;
  }
};

export const getFCMStatus = () => {
  const initialized = getApps().length > 0;
  return {
    status: initialized ? "connected" : "disconnected",
    initialized,
    mode: "environment_variables"
  };
};
