import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// console.log("Démarrage de l'application avec Service Worker...");

// Assurez-vous que le service worker est enregistré
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('ngsw-worker.js')
      .then((registration) => {
        // console.log(
        //   'Service Worker Angular enregistré avec succès:',
        //   registration
        // );

        // S'assurer que le service worker est activé
        if (registration.installing) {
          // console.log("Service Worker en cours d'installation");
          const sw = registration.installing || registration.waiting;
          if (sw) {
            sw.addEventListener('statechange', (e) => {
              if ((e.target as ServiceWorker).state === 'activated') {
                // console.log('Service Worker maintenant activé!');
                // Force le rechargement de la page pour s'assurer que le service worker contrôle la page
                // window.location.reload(); // <-- Commenté
              }
            });
          }
        } else if (registration.waiting) {
          // console.log('Service Worker en attente, activation forcée...');
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          // L'événement 'controllerchange' sera déclenché quand le SW prendra le contrôle
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            // console.log('Nouveau Service Worker a pris le contrôle');
            // window.location.reload(); // <-- Commenté
          });
        } else if (registration.active) {
          // console.log('Service Worker déjà actif');
        }
      })
      .catch((error) => {
        console.error(
          "Erreur lors de l'enregistrement du Service Worker Angular:",
          error
        );
      });
  });

  // Enregistrement du Service Worker Firebase Messaging
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('firebase-messaging-sw.js')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .then((registration) => {
        // console.log(
        //   'Service Worker Firebase Messaging enregistré avec succès:',
        //   registration
        // );
      })
      .catch((error) => {
        console.error(
          "Erreur lors de l'enregistrement du Service Worker Firebase Messaging:",
          error
        );
      });
  });
}

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
