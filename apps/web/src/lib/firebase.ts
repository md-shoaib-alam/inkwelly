import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { env } from './env';

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Helper to get messaging only if supported
const getMessagingInstance = async () => {
  if (typeof window === 'undefined') return null;
  try {
    const supported = await isSupported();
    if (!supported) return null;
    return getMessaging(app);
  } catch (err) {
    return null;
  }
};

export const requestNotificationPermission = async () => {
  if (!env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
    console.warn("FCM VAPID Key is missing in env config");
    return null;
  }
  
  const messaging = await getMessagingInstance();
  if (!messaging) {
    return null;
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Register service worker explicitly to guarantee it exists, has root scope, and is controlled
      let swRegistration;
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        
        // Wait for the service worker to become active to prevent PushManager subscription failure
        if (swRegistration && !swRegistration.active) {
          await new Promise<void>((resolve) => {
            const worker = swRegistration.installing || swRegistration.waiting;
            if (worker) {
              const stateChangeHandler = () => {
                if (worker.state === 'activated') {
                  worker.removeEventListener('statechange', stateChangeHandler);
                  resolve();
                }
              };
              worker.addEventListener('statechange', stateChangeHandler);
            } else {
              resolve();
            }
          });
        }
      }

      // Get the FCM token
      const token = await getToken(messaging, { 
        vapidKey: env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: swRegistration
      });
      return token;
    } else {
      console.warn("Notification permission denied by user");
    }
  } catch (error: any) {
    if (error?.code === 'messaging/permission-blocked') {
      console.warn("Notifications are blocked by the browser settings.");
    } else if (error?.message?.includes('installations/request-failed')) {
      console.error("Firebase Installations API error. Please check Google Cloud Console.", error);
    } else {
      console.error("Detailed FCM Error:", error);
    }
  }
  return null;
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (typeof window === 'undefined') return () => {};
  let unsubscribe: (() => void) | undefined;
  
  isSupported().then((supported) => {
    if (supported) {
      try {
        const messaging = getMessaging(app);
        unsubscribe = onMessage(messaging, (payload) => {
          callback(payload);
        });
      } catch (err) {
        console.warn("Failed to get FCM messaging instance:", err);
      }
    }
  }).catch((err) => {
    console.warn("FCM messaging is not supported in this browser:", err);
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
};
