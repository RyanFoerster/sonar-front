import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PushNotificationService } from '../../services/push-notification.service';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-notification-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-test.component.html',
  styleUrl: './notification-test.component.css',
})
export class NotificationTestComponent implements OnInit, OnDestroy {
  notificationStatus = 'Vérification des capacités de notification...';
  isNotificationSupported = false;
  isSubscribed = false;
  private subscription = new Subscription();

  constructor(public pushNotificationService: PushNotificationService) {}

  ngOnInit() {
    // Vérifier l'état du service worker
    this.checkServiceWorkerStatus();

    // Vérifier si les notifications sont supportées
    this.isNotificationSupported =
      this.pushNotificationService.arePushNotificationsSupported();

    if (!this.isNotificationSupported) {
      this.notificationStatus =
        'Les notifications push ne sont pas supportées par ce navigateur';
      return;
    }

    // Vérifier si l'utilisateur est déjà abonné
    this.pushNotificationService.isSubscribed$.subscribe((isSubscribed) => {
      this.isSubscribed = isSubscribed;
      if (isSubscribed) {
        this.notificationStatus = 'Vous êtes abonné aux notifications push';
      } else if (this.pushNotificationService.areNotificationsBlocked()) {
        this.notificationStatus =
          'Les notifications sont bloquées pour ce site. Veuillez modifier les paramètres de votre navigateur.';
      } else if (this.pushNotificationService.hasNotificationPermission()) {
        this.notificationStatus =
          "Les notifications sont autorisées mais vous n'êtes pas abonné";
      } else {
        this.notificationStatus =
          'Cliquez sur le bouton pour vous abonner aux notifications';
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  subscribeToNotifications(): void {
    // Vérifier si l'utilisateur est authentifié
    const token = localStorage.getItem(environment.TOKEN_KEY);
    if (!token) {
      this.notificationStatus =
        'Vous devez être connecté pour vous abonner aux notifications';
      return;
    }

    this.notificationStatus = "Tentative d'abonnement aux notifications...";

    // Vérifier d'abord la permission
    if (Notification.permission === 'default') {
      console.log('Demande de permission de notification...');
      Notification.requestPermission().then((permission) => {
        console.log('Permission de notification:', permission);
        if (permission === 'granted') {
          this.proceedWithSubscription();
        } else if (permission === 'denied') {
          this.notificationStatus =
            'Les notifications sont bloquées pour ce site. Veuillez modifier les paramètres de votre navigateur.';
        }
      });
    } else if (Notification.permission === 'granted') {
      this.proceedWithSubscription();
    }
  }

  private proceedWithSubscription(): void {
    console.log("Début de l'abonnement aux notifications...");
    this.pushNotificationService.subscribeToNotifications().subscribe({
      next: (response) => {
        console.log("Réponse de l'abonnement aux notifications:", response);
        this.notificationStatus = 'Abonné aux notifications avec succès';
        this.isSubscribed = true;
      },
      error: (error) => {
        console.error("Échec de l'abonnement aux notifications", error);
        this.notificationStatus = `Échec de l'abonnement aux notifications: ${
          error.message || 'Erreur inconnue'
        }`;
      },
      complete: () => {
        console.log("Observable d'abonnement complété");
      },
    });
  }

  unsubscribeFromNotifications(): void {
    console.log('Tentative de désabonnement...');
    this.notificationStatus = 'Tentative de désabonnement...';

    this.pushNotificationService
      .unsubscribeFromNotifications()
      .then(() => {
        console.log('Désabonnement réussi dans le composant');
        this.notificationStatus = 'Désabonné des notifications avec succès';
        this.isSubscribed = false;

        // Forcer une vérification de l'état après désabonnement
        setTimeout(() => {
          console.log("Vérification de l'état après désabonnement");
          // Rafraîchir le composant
          this.ngOnInit();
        }, 1000);
      })
      .catch((error) => {
        console.error('Échec du désabonnement dans le composant', error);
        this.notificationStatus = `Échec du désabonnement: ${
          error.message || 'Erreur inconnue'
        }`;
      });
  }

  sendTestNotification(): void {
    console.log("Tentative d'envoi de notification de test...");
    console.log(
      'Permission de notification actuelle:',
      Notification.permission
    );

    if (Notification.permission === 'granted') {
      console.log('Permission accordée, création de la notification...');

      try {
        // Utiliser une icône en base64 pour éviter les problèmes de chargement
        const iconBase64 =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVEiJtZZPbBtFFMZ/M7ubXdtdb1xSFyeilBapySVU8h8OoFaooFSqiihIVIpQBKci6KEg9Q6H9kovIHoCIVQJJCKE1ENFjnAgcaSGC6rEnxBwA04Tx43t2FnvDAfjkNibxgHxnWb2e/u992bee7tCa00YFsffekFY+nUzFtjW0LrvjRXrCDIAaPLlW0nHL0SsZtVoaF98mLrx3pdhOqLtYPHChahZcYYO7KvPFxvRl5XPp1sN3adWiD1ZAqD6XYK1b/dvE5IWryTt2udLFedwc1+9kLp+vbbpoDh+6TklxBeAi9TL0taeWpdmZzQDry0AcO+jQ12RyohqqoYoo8RDwJrU+qXkjWtfi8Xxt58BdQuwQs9qC/afLwCw8tnQbqYAPsgxE1S6F3EAIXux2oQFKm0ihMsOF71dHYx+f3NND68ghCu1YIoePPQN1pGRABkJ6Bus96CutRZMydTl+TvuiRW1m3n0eDl0vRPcEysqdXn+jsQPsrHMquGeXEaY4Yk4wxWcY5V/9scqOMOVUFthatyTy8QyqwZ+kDURKoMWxNKr2EeqVKcTNOajqKoBgOE28U4tdQl5p5bwCw7BWquaZSzAPlwjlithJtp3pTImSqQRrb2Z8PHGigD4RZuNX6JYj6wj7O4TFLbCO/Mn/m8R+h6rYSUb3ekokRY6f/YukArN979jcW+V/S8g0eT/N3VN3kTqWbQ428m9/8k0P/1aIhF36PccEl6EhOcAUCrXKZXXWS3XKd2vc/TRBG9O5ELC17MmWubD2nKhUKZa26Ba2+D3P+4/MNCFwg59oWVeYhkzgN/JDR8deKBoD7Y+ljEjGZ0sosXVTvbc6RHirr2reNy1OXd6pJsQ+gqjk8VWFYmHrwBzW/n+uMPFiRwHB2I7ih8ciHFxIkd/3Omk5tCDV1t+2nNu5sxxpDFNx+huNhVT3/zMDz8usXC3ddaHBj1GHj/As08fwTS7Kt1HBTmyN29vdwAw+/wbwLVOJ3uAD1wi/dUH7Qei66PfyuRj4Ik9is+hglfbkbfR3cnZm7chlUWLdwmprtCohX4HUtlOcQjLYCu+fzGJH2QRKvP3UNz8bWk1qMxjGTOMThZ3kvgLI5AzFfo379UAAAAASUVORK5CYII=';

        const options = {
          body: 'Ceci est une notification de test locale',
          icon: iconBase64,
          requireInteraction: true,
          silent: false,
          data: {
            url: window.location.href,
            testData: 'Données de test',
          },
        };

        console.log('Options de notification native:', options);
        const notification = new Notification(
          'Test de notification native',
          options
        );

        notification.onshow = () => {
          console.log('Notification native affichée');
        };

        notification.onclick = () => {
          console.log('Notification native cliquée');
          notification.close();
        };

        notification.onerror = (err) => {
          console.error('Erreur de notification native:', err);
        };

        console.log('Notification native créée avec succès');
        this.notificationStatus = 'Notification de test envoyée avec succès';
      } catch (error: unknown) {
        console.error(
          'Erreur lors de la création de la notification native:',
          error
        );
        this.notificationStatus = `Erreur: ${
          error instanceof Error ? error.message : 'Erreur inconnue'
        }`;
      }
    } else {
      console.warn(
        'Permission de notification non accordée:',
        Notification.permission
      );
      this.notificationStatus =
        "Impossible d'envoyer une notification de test: permission non accordée";
    }
  }

  private sendServiceWorkerNotification(): void {
    console.log("Tentative d'envoi via service worker...");

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      console.log(
        'Service worker contrôleur trouvé:',
        navigator.serviceWorker.controller
      );

      // Envoyer un message au service worker pour afficher une notification
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: 'Notification via Service Worker',
        options: {
          body: 'Cette notification est envoyée via le Service Worker',
          icon: 'assets/icons/SONAR-FAVICON.webp',
          badge: 'assets/icons/SONAR-FAVICON.webp',
          vibrate: [200, 100, 200],
          tag: 'sw-notification',
          renotify: true,
          requireInteraction: true,
        },
      });
    } else {
      console.warn('Aucun service worker contrôleur trouvé');
    }
  }

  resetNotificationState(): void {
    this.notificationStatus = "Réinitialisation de l'état des notifications...";

    if (!('serviceWorker' in navigator)) {
      this.notificationStatus =
        'Service Worker non supporté, impossible de réinitialiser';
      return;
    }

    // Récupérer tous les service workers
    navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      // Désinscrire tous les service workers
      for (const registration of registrations) {
        try {
          console.log('Désactivation du service worker:', registration);

          // Désactiver tous les abonnements push
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            console.log("Désactivation de l'abonnement:", subscription);
            await subscription.unsubscribe();
          }

          // Désinscrire le service worker
          await registration.unregister();
          console.log('Service worker désinscrit avec succès');
        } catch (e) {
          console.error(
            'Erreur lors de la désactivation du service worker:',
            e
          );
        }
      }

      // Supprimer le token
      const token = localStorage.getItem(environment.TOKEN_KEY);
      if (token) {
        // Désactiver l'abonnement côté serveur
        this.pushNotificationService
          .forceServerUnsubscribe(token)
          .then(() => {
            console.log('Abonnement serveur désactivé avec succès');
            this.notificationStatus =
              'État des notifications réinitialisé avec succès. Rechargez la page.';

            // Rafraîchir la page après 2 secondes
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          })
          .catch((err) => {
            console.error('Erreur lors de la désactivation côté serveur:', err);
            this.notificationStatus =
              'Erreur lors de la réinitialisation. Essayez de recharger la page.';
          });
      } else {
        this.notificationStatus =
          'État des notifications réinitialisé localement. Rechargez la page.';

        // Rafraîchir la page après 2 secondes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    });
  }

  private checkServiceWorkerStatus(): void {
    if ('serviceWorker' in navigator) {
      console.log('Service Worker est supporté');

      navigator.serviceWorker.getRegistrations().then((registrations) => {
        console.log('Service Workers enregistrés:', registrations);

        if (registrations.length === 0) {
          console.warn("Aucun Service Worker n'est enregistré!");
        } else {
          // Vérifier si notre service worker est enregistré
          const hasSWRegistration = registrations.some((reg) =>
            reg.scope.includes(window.location.origin)
          );

          if (!hasSWRegistration) {
            console.warn(
              "Le Service Worker du site n'est pas correctement enregistré"
            );
          } else {
            console.log('Le Service Worker est correctement enregistré');

            // Vérifier si le service worker est activé
            navigator.serviceWorker.ready
              .then((registration) => {
                console.log('Service Worker prêt:', registration);
              })
              .catch((err) => {
                console.error(
                  'Erreur lors de la vérification du Service Worker:',
                  err
                );
              });
          }
        }
      });
    } else {
      console.error("Service Worker n'est pas supporté");
    }
  }
}
