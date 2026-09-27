"use client";

import { useEffect, useRef } from "react";
import { requestNotificationPermission, onForegroundMessage } from "@/lib/firebase";
import { useAppStore } from "@/store/use-app-store";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { useGraphQLMutation, SAVE_NOTIFICATION_TOKEN } from "@/lib/graphql/hooks";
import { NOTIFICATIONS_REFRESH_EVENT } from "@/components/layout/notification-bell";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAppStore();
  const currentUserId = currentUser?.id;
  const tokenRef = useRef<string | null>(null);
  const { mutate: saveToken } = useGraphQLMutation(SAVE_NOTIFICATION_TOKEN);

  useEffect(() => {
    // We only ask for permission if the user is logged in
    if (currentUserId) {
      const initNotifications = async () => {
        try {
          const fcmToken = await requestNotificationPermission();
          if (fcmToken) {
            tokenRef.current = fcmToken;
            console.log("FCM Token Generated:", fcmToken);
            
            // Save token to backend
            try {
              await saveToken({ 
                token: fcmToken, 
                platform: "web" 
              });
            } catch (saveErr) {
              console.warn("Could not register FCM notification token with backend:", saveErr);
            }
          }
        } catch (err) {
          console.error("Failed to initialize notifications", err);
        }
      };

      // Delay slightly to not interrupt the initial page load
      const timer = setTimeout(initNotifications, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentUserId, saveToken]);

  useEffect(() => {
    // Listen for messages while the app is open (foreground)
    const unsubscribe = onForegroundMessage((payload) => {
      console.log("New foreground message received:", payload);
      
      const title = payload.notification?.title || payload.data?.title || "New Notification";
      const body = payload.notification?.body || payload.data?.body || "You have a new message";

      // Push is the real-time channel — tell the bell to refresh now instead
      // of waiting for its next poll.
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));

      // Show Toast inside the App
      toast.success(title, {
        description: body,
        icon: <Bell className="size-5 text-violet-500" />,
        duration: 10000
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
