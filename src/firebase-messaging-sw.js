// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js"
);

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyBw-pgJr1BrcQbAtTp3elhfLKGSh40sLls",
  authDomain: "sonarartists-1f217.firebaseapp.com",
  projectId: "sonarartists-1f217",
  storageBucket: "sonarartists-1f217.firebasestorage.app",
  messagingSenderId: "28307381554",
  appId: "1:28307381554:web:54c4952e1a14fe1330cb2b",
  measurementId: "G-T5PFYKFT9R",
  vapidKey:
    "BNfzljkrMF5htkXQvBqr7GSGCuAUvLOgL1J7nvP5oE7qQ0waz6OGpxkJqk1mqNZYI3nSyS7VOFM4p8Okbcot1ec",
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Message reçu en arrière-plan:",
    payload
  );

  // Customize notification here
  const notificationTitle = payload.notification.title || "Notification";
  const notificationOptions = {
    body: payload.notification.body || "",
    icon: "/assets/icons/icon-128x128.png",
    data: payload.data,
    badge: "/assets/icons/icon-96x96.png",
    actions: [
      {
        action: "open",
        title: "Voir",
      },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click event listener
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification cliquée:", event);

  event.notification.close();

  // Ouvrir l'URL cible de la notification si disponible
  if (event.notification.data && event.notification.data.url) {
    const urlToOpen = new URL(event.notification.data.url, self.location.origin)
      .href;

    // Utiliser clients.openWindow et attendre son résultat
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          // Vérifier si une fenêtre est déjà ouverte pour cette URL
          for (const client of clientList) {
            if (client.url === urlToOpen && "focus" in client) {
              return client.focus();
            }
          }

          // Ouvrir une nouvelle fenêtre si nécessaire
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});
