importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js"
);

// Replace these with your own Firebase config keys...
const firebaseConfig = {
  apiKey: "AIzaSyByn3uhfwro1haMd5ymAr2_isXtqEYTX-8",
  authDomain: "school-test-17e7b.firebaseapp.com",
  projectId: "school-test-17e7b",
  storageBucket: "school-test-17e7b.firebasestorage.app",
  messagingSenderId: "1050407754440",
  appId: "1:1050407754440:web:4bd6b12b2d94c4cd9f63fd"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  // If the payload has a notification object, the FCM SDK will show it automatically.
  // We do not need to show another one manually, otherwise there will be duplicate notifications.
  if (payload.notification) {
    console.log("[firebase-messaging-sw.js] Notification payload present, letting FCM SDK display it.");
    return;
  }

  // Extract link from multiple potential keys (for data-only messages)
  // NOTE: Avoid optional chaining (?.) — this service worker runs with Firebase SDK v8
  // via importScripts, which may not support modern JS syntax.
  var link = (payload.fcmOptions && payload.fcmOptions.link) || 
             (payload.data && payload.data.link) || 
             (payload.data && payload.data.url) || 
             (payload.data && payload.data.click_action) || 
             (payload.notification && payload.notification.click_action) || 
             (payload.notification && payload.notification.clickAction);

  // Fallback for attendance alerts
  if (!link && payload.data && payload.data.type === "attendance_alert") {
    var tenantSlug = (payload.data && payload.data.tenantSlug) || (payload.data && payload.data.tenantId);
    if (tenantSlug) {
      link = "/" + tenantSlug + "/attendance";
    } else {
      link = "/attendance";
    }
  }

  var notificationTitle = (payload.data && payload.data.title) ||
                          (payload.notification && payload.notification.title) ||
                          "New Notification";
  var notificationOptions = {
    body: (payload.data && payload.data.body) ||
          (payload.data && payload.data.message) ||
          (payload.notification && payload.notification.body) ||
          "",
    icon: "/logo.svg",
    data: { url: link },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);

});

self.addEventListener("notificationclick", function (event) {
  console.log("[firebase-messaging-sw.js] Notification click received.");

  event.notification.close();

  let url = event.notification.data?.url;
  if (!url) return;

  // Normalize the URL
  if (!/^https?:\/\//i.test(url)) {
    if (url.startsWith("/")) {
      url = self.location.origin + url;
    } else {
      url = self.location.protocol + "//" + url; // Dynamic protocol based on window location (e.g. http: on localhost)
    }
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        let matchingClient = null;
        
        try {
          const targetUrlObj = new URL(url);
          for (const client of clientList) {
            const clientUrlObj = new URL(client.url);
            if (clientUrlObj.origin === targetUrlObj.origin) {
              matchingClient = client;
              if (clientUrlObj.pathname === targetUrlObj.pathname) {
                break;
              }
            }
          }
        } catch (e) {
          console.error("URL parsing error during client matching:", e);
        }

        if (matchingClient) {
          if ("focus" in matchingClient) {
            matchingClient.focus();
          }
          if ("navigate" in matchingClient && matchingClient.url !== url) {
            return matchingClient.navigate(url);
          }
          return;
        }

        if (clients.openWindow) {
          console.log("OPENWINDOW ON CLIENT: ", url);
          return clients.openWindow(url);
        }
      })
  );
});

// Force the service worker to activate immediately and claim all client windows
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
