import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

console.log("Démarrage de l'application avec Service Worker...");

// Assurez-vous que le service worker est enregistré
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('ngsw-worker.js')
      .then((registration) => {
        console.log('Service Worker enregistré avec succès:', registration);

        // Forcer l'activation du service worker si en attente
        if (registration.waiting) {
          console.log('Service Worker en attente, activation forcée...');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // S'assurer que le service worker est activé
        if (registration.installing) {
          console.log("Service Worker en cours d'installation");
          const sw = registration.installing || registration.waiting;
          if (sw) {
            sw.addEventListener('statechange', (e) => {
              if ((e.target as ServiceWorker).state === 'activated') {
                console.log('Service Worker maintenant activé!');
                // Force le rechargement de la page pour s'assurer que le service worker contrôle la page
                window.location.reload();
              }
            });
          }
        }

        // Configuration pour intercepter les messages et afficher des notifications
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('Message reçu du Service Worker:', event.data);

          if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
            console.log(
              "Demande d'affichage de notification reçue:",
              event.data
            );
            registration.showNotification(event.data.title, event.data.options);
          }
        });
      })
      .catch((error) => {
        console.error(
          "Erreur lors de l'enregistrement du Service Worker:",
          error
        );
      });
  });

  // Gestionnaire pour le changement de contrôleur du Service Worker
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Nouveau Service Worker a pris le contrôle');
  });
}

// Ajouter un gestionnaire global pour les notifications
if ('serviceWorker' in navigator) {
  // Gestionnaire pour les messages du service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('Message reçu du Service Worker (globalement):', event.data);

    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
      console.log(
        "Demande d'affichage de notification reçue (globalement):",
        event.data
      );

      // Si le service worker est activé, utiliser showNotification
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(event.data.title, event.data.options);
        });
      } else {
        // Fallback pour les navigateurs sans service worker controller
        if (Notification.permission === 'granted') {
          const notification = new Notification(
            event.data.title,
            event.data.options
          );

          // Gérer le clic sur la notification
          notification.onclick = function () {
            if (
              event.data.options &&
              event.data.options.data &&
              event.data.options.data.url
            ) {
              window.open(event.data.options.data.url, '_blank');
            }
            notification.close();
          };
        }
      }
    }
  });
}

// Gestionnaire pour les clics sur notification
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    console.log('Service worker prêt à gérer les notifications');

    // Vérifier si la fonction showNotification existe sur l'objet registration
    if (typeof registration.showNotification === 'function') {
      console.log('Notifications supportées par ce service worker');

      // Le gestionnaire 'self.addEventListener' ne peut être utilisé que dans un service worker
      // Nous utilisons donc uniquement le gestionnaire via navigator.serviceWorker

      // Gestionnaire de clics
      navigator.serviceWorker.addEventListener(
        'notificationclick',
        (event: Event) => {
          console.log('Notification cliquée:', event);

          // Vérifier et caster l'événement pour accéder aux propriétés
          if ('notification' in event) {
            const notificationEvent = event as unknown as {
              notification: {
                data?: { url?: string };
                close: () => void;
              };
              action?: string;
            };

            const notification = notificationEvent.notification;
            const action = notificationEvent.action;

            console.log('Action:', action);
            console.log('Notification:', notification);

            // Fermer la notification
            notification.close();

            // Gestion des actions
            if (
              (action === 'open' || !action) &&
              notification.data &&
              notification.data.url
            ) {
              console.log('Ouverture de URL:', notification.data.url);
              // Utiliser window.open car clients.openWindow n'est disponible que dans le context d'un service worker
              window.open(notification.data.url, '_blank');
            }
          }
        }
      );
    }
  });
}

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
