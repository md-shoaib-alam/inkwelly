import React, { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-context';
import { api } from '@/lib/api';
import type { NotificationPayload } from '@/types/index';

// Configure how to handle notifications when the app is in foreground
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const useLastNotificationResponse = Platform.OS === 'web'
  ? () => null
  : Notifications.useLastNotificationResponse;

const SAVE_NOTIFICATION_TOKEN = `
  mutation SaveNotificationToken($token: String!, $platform: String) {
    saveNotificationToken(token: $token, platform: $platform) {
      id
      token
      platform
    }
  }
`;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const tokenRef = useRef<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    const registerForPushNotifications = async () => {
      try {
        if (Platform.OS === 'web') {
          console.log('Skipping push notification registration on Web platform');
          return;
        }

        if (!Device.isDevice) {
          console.log('Must use physical device for Push Notifications');
          return;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.warn('Failed to get push token for push notification!');
          return;
        }

        // Configure Android channel
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }

        // Get the native device push token (FCM token on Android, APNs on iOS)
        const deviceToken = (await Notifications.getDevicePushTokenAsync()).data;
        
        if (deviceToken && tokenRef.current !== deviceToken) {
          tokenRef.current = deviceToken;
          console.log('FCM/Device Push Token Generated:', deviceToken);

          // Save token to backend via GraphQL
          await api.post('/graphql', {
            query: SAVE_NOTIFICATION_TOKEN,
            variables: {
              token: deviceToken,
              platform: Platform.OS,
            },
          });
          console.log('Notification token successfully registered with server');
        }
      } catch (error) {
        console.error('Error registering for push notifications:', error);
      }
    };

    // Register after 3 seconds to avoid interrupting initial boot
    const timer = setTimeout(registerForPushNotifications, 3000);
    return () => clearTimeout(timer);
  }, [userId]);

  const lastNotificationResponse = useLastNotificationResponse();

  const handleNotificationTap = useCallback((data: NotificationPayload) => {
    if (!data) return;
    
    // Map the notification payload type/URL to the respective parent screen in the app
    let targetRoute: string | null = null;
    const type = data.type as string | undefined;
    const link = data.link as string | undefined;

    if (type === 'attendance_alert' || link?.endsWith('/attendance')) {
      targetRoute = '/(parent)/(tabs)/attendance';
    } else if (type === 'fee_due' || link?.endsWith('/fees')) {
      targetRoute = '/(parent)/(tabs)/fees';
    } else if (type === 'subscription_alert' || link?.endsWith('/subscription')) {
      targetRoute = '/(parent)/subscription';
    } else if (type === 'leave_status' || type === 'new_leave_request' || link?.endsWith('/leaves')) {
      if (user?.role === 'parent' || user?.role === 'student') {
        targetRoute = '/(student)/(tabs)/my-leaves';
      } else if (user?.role === 'teacher') {
        targetRoute = '/(teacher)/(tabs)/my-leaves';
      } else if (user?.role === 'admin' || user?.role === 'staff') {
        targetRoute = '/(staff)/(tabs)/leaves'; // Fallback staff/admin leaves tab
      }
    }

    if (targetRoute) {
      console.log(`Routing user to notification target screen: ${targetRoute}`);
      try {
        // Use a short delay to ensure the Router and Tab Navigation are fully mounted
        setTimeout(() => {
          router.push(targetRoute as any);
        }, 500);
      } catch (err) {
        console.error('Failed to navigate to target route:', err);
      }
    }
  }, [router, user?.role]);

  // 1. Listen for notification taps on Cold Starts (app was closed/killed)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (
      lastNotificationResponse &&
      lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      console.log('App launched/opened via notification tap (Cold Start):', lastNotificationResponse);
      const data = lastNotificationResponse.notification.request.content.data;
      handleNotificationTap(data as any);
    }
  }, [lastNotificationResponse, handleNotificationTap]);

  // 2. Listen for notifications and taps when App is running (in Foreground or Background)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Listen for notifications received in foreground
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received in foreground:', notification);
    });

    // Listen for notification responses (user tapping on a notification when app is in bg)
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response received (Warm Start):', response);
      const data = response.notification.request.content.data;
      handleNotificationTap(data as any);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [handleNotificationTap]);

  return <>{children}</>;
}

