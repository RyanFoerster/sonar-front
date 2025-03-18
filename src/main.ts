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
}

// Ajouter un gestionnaire d'événements pour afficher les notifications
// même quand aucun onglet n'est ouvert
if ('serviceWorker' in navigator) {
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
      }
    }
  });
}

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
