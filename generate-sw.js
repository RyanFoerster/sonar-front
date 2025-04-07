const fs = require("fs");
const path = require("path");

// Définir NODE_ENV manuellement s'il n'est pas défini
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

console.log(`Environnement: ${process.env.NODE_ENV}`);

// Charger les variables d'environnement depuis le fichier .env
require("dotenv").config({
  path: path.resolve(__dirname, ".env"),
});

// Vérifier que les variables sont chargées
console.log("Variables Firebase chargées:");
console.log(`API Key: ${process.env.FIREBASE_API_KEY ? "OK" : "MANQUANT"}`);
console.log(
  `Auth Domain: ${process.env.FIREBASE_AUTH_DOMAIN ? "OK" : "MANQUANT"}`
);
console.log(
  `Project ID: ${process.env.FIREBASE_PROJECT_ID ? "OK" : "MANQUANT"}`
);

// Template pour le service worker
const swTemplate = `
// Give the service worker access to Firebase Messaging.
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

console.log("[firebase-messaging-sw.js] Service Worker en démarrage...");

const userAgent = self.navigator?.userAgent || "";
const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
  userAgent.toLowerCase()
);
console.log(\`[firebase-messaging-sw.js] Appareil mobile détecté: \${isMobileDevice}\`);

// Configuration Firebase injectée depuis les variables d'environnement
firebase.initializeApp({
  apiKey: "${process.env.FIREBASE_API_KEY}",
  authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
  projectId: "${process.env.FIREBASE_PROJECT_ID}",
  storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${process.env.FIREBASE_APP_ID}",
  measurementId: "${process.env.FIREBASE_MEASUREMENT_ID}",
  vapidKey: "${process.env.FIREBASE_VAPID_KEY}"
});

console.log("[firebase-messaging-sw.js] Firebase initialisé dans le SW");

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();
console.log("[firebase-messaging-sw.js] Instance Firebase Messaging créée");

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Message reçu en arrière-plan:", payload);

  // Customize notification here
  const notificationTitle = payload.notification.title || "Notification";
  const notificationOptions = {
    body: payload.notification.body || "",
    icon: "/icons/icon-192x192.png",
    data: payload.data,
    badge: "/icons/icon-96x96.png",
    vibrate: [200, 100, 200], // Vibration pour les appareils mobiles
    actions: [{ action: "open", title: "Voir" }],
    requireInteraction: true,
    renotify: true,
    tag: "sonar-notification",
    silent: false,
  };

  console.log("[firebase-messaging-sw.js] Affichage de notification:", {
    title: notificationTitle,
    ...notificationOptions,
  });

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click event listener
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification cliquée:", event);
  event.notification.close();

  // Ouvrir l'URL cible de la notification si disponible
  if (event.notification.data && event.notification.data.url) {
    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    console.log("[firebase-messaging-sw.js] Ouverture URL:", urlToOpen);

    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url === urlToOpen && "focus" in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Événement d'installation du service worker
self.addEventListener("install", (event) => {
  console.log("[firebase-messaging-sw.js] Service Worker installé");
  // Forcer l'activation immédiate
  self.skipWaiting();
});

// Événement d'activation du service worker
self.addEventListener("activate", (event) => {
  console.log("[firebase-messaging-sw.js] Service Worker activé");
  // Réclamer tous les clients immédiatement
  event.waitUntil(clients.claim());
  
  // Nettoyer les anciens caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('ngsw:')) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Gestion des mises à jour
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
`;

// Assurez-vous que le dossier dist existe
const srcPath = path.join(__dirname, "src");
if (!fs.existsSync(srcPath)) {
  fs.mkdirSync(srcPath, { recursive: true });
}

// Créer le fichier
fs.writeFileSync(path.join(srcPath, "firebase-messaging-sw.js"), swTemplate);
console.log("Service Worker Firebase généré avec succès dans src/ !");
