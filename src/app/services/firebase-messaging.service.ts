import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  getMessaging,
  getToken,
  onMessage,
  Messaging,
  deleteToken,
} from 'firebase/messaging';
import { initializeApp } from 'firebase/app';
import { HttpClient } from '@angular/common/http';

interface NotificationPayload {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: Record<string, string>;
}

@Injectable({
  providedIn: 'root',
})
export class FirebaseMessagingService {
  private messaging: Messaging | null = null;
  private fcmTokenSubject = new BehaviorSubject<string | null>(null);
  private notificationSubject = new BehaviorSubject<NotificationPayload | null>(
    null
  );

  constructor(private http: HttpClient) {
    console.log('FirebaseMessagingService: Initialisation du service');
    console.log(
      'FirebaseMessagingService: Config Firebase:',
      JSON.stringify({
        apiKey: environment.firebase?.apiKey,
        projectId: environment.firebase?.projectId,
        messagingSenderId: environment.firebase?.messagingSenderId,
        appId: environment.firebase?.appId,
        vapidKeyConfigured: !!environment.firebase?.vapidKey,
      })
    );

    this.initializeFirebaseApp();
  }

  /**
   * Initialise l'application Firebase
   */
  private initializeFirebaseApp(): void {
    try {
      if (!environment.firebase) {
        console.error(
          'FirebaseMessagingService: Configuration Firebase non trouvée dans environment'
        );
        return;
      }

      const app = initializeApp(environment.firebase);
      console.log(
        'FirebaseMessagingService: App Firebase initialisée avec succès'
      );

      try {
        this.messaging = getMessaging(app);
        console.log(
          'FirebaseMessagingService: Messaging Firebase initialisé avec succès'
        );
      } catch (error) {
        console.error(
          "FirebaseMessagingService: Erreur lors de l'initialisation de Firebase Messaging:",
          error
        );
      }
    } catch (error) {
      console.error(
        "FirebaseMessagingService: Erreur lors de l'initialisation de Firebase App:",
        error
      );
    }
  }

  /**
   * Demande la permission de notifications et récupère le token FCM
   * @returns Observable avec le token ou null si refusé
   */
  requestPermission(): Observable<string | null> {
    console.log(
      'FirebaseMessagingService: Demande de permission pour les notifications...'
    );

    if (!this.messaging) {
      console.error(
        'FirebaseMessagingService: Firebase messaging non initialisé'
      );
      this.fcmTokenSubject.next(null);
      return this.fcmTokenSubject.asObservable();
    }

    if (Notification.permission === 'granted') {
      // Permission déjà accordée, récupérer directement le token
      console.log(
        'FirebaseMessagingService: Permission déjà accordée, récupération du token'
      );
      this.getToken();
    } else if (Notification.permission === 'default') {
      // Demander la permission
      console.log(
        'FirebaseMessagingService: Demande de permission au navigateur'
      );
      Notification.requestPermission()
        .then((permission) => {
          console.log(
            'FirebaseMessagingService: Réponse permission:',
            permission
          );
          if (permission === 'granted') {
            this.getToken();
          } else {
            console.log(
              'FirebaseMessagingService: Permission de notification refusée'
            );
            this.fcmTokenSubject.next(null);
          }
        })
        .catch((error) => {
          console.error(
            'FirebaseMessagingService: Erreur lors de la demande de permission:',
            error
          );
          this.fcmTokenSubject.next(null);
        });
    } else {
      // Permission déjà refusée
      console.log(
        'FirebaseMessagingService: Permission de notification déjà refusée'
      );
      this.fcmTokenSubject.next(null);
    }

    return this.fcmTokenSubject.asObservable();
  }

  /**
   * Récupère le token FCM après permission
   */
  private getToken(): void {
    if (!this.messaging) {
      console.error(
        'FirebaseMessagingService: Firebase messaging non initialisé pour getToken'
      );
      this.fcmTokenSubject.next(null);
      return;
    }

    console.log(
      'FirebaseMessagingService: Tentative de récupération du token avec vapidKey',
      environment.firebase?.vapidKey ? 'configurée' : 'MANQUANTE'
    );

    getToken(this.messaging, { vapidKey: environment.firebase?.vapidKey })
      .then((token) => {
        if (token) {
          console.log(
            'FirebaseMessagingService: Token FCM récupéré avec succès'
          );
          console.log('FirebaseMessagingService: Token = ', token);
          this.fcmTokenSubject.next(token);
          this.saveTokenToServer(token);
        } else {
          console.log(
            'FirebaseMessagingService: Aucun token de registration disponible'
          );
          this.fcmTokenSubject.next(null);
        }
      })
      .catch((error) => {
        console.error(
          'FirebaseMessagingService: Erreur lors de la récupération du token:',
          error
        );
        this.fcmTokenSubject.next(null);
      });
  }

  /**
   * Enregistre le token FCM sur le serveur
   * @param token Le token FCM à sauvegarder
   */
  private saveTokenToServer(token: string): void {
    // Adapter à votre API
    this.http
      .post(`${environment.API_URL}/notifications/register-device`, { token })
      .subscribe({
        next: (response) =>
          console.log('Token enregistré sur le serveur:', response),
        error: (error) =>
          console.error("Erreur lors de l'enregistrement du token:", error),
      });
  }

  /**
   * Écoute les messages entrants (notifications au premier plan)
   * @returns Observable avec les données de notification
   */
  receiveMessages(): Observable<NotificationPayload | null> {
    if (this.messaging) {
      onMessage(this.messaging, (payload: NotificationPayload) => {
        console.log('Message reçu au premier plan:', payload);
        this.showNotification(payload);
        this.notificationSubject.next(payload);
      });
    }

    return this.notificationSubject.asObservable();
  }

  /**
   * Affiche une notification native si au premier plan
   * @param payload Les données de la notification
   */
  private showNotification(payload: NotificationPayload): void {
    const notificationTitle = payload.notification?.title || 'Notification';
    const notificationOptions: NotificationOptions = {
      body: payload.notification?.body || '',
      icon: '/assets/icons/icon-128x128.png',
      data: payload.data,
      badge: '/assets/icons/icon-96x96.png',
    };

    // Vérifier si les notifications sont supportées et permises
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        // Essayer d'abord d'utiliser le service worker si disponible
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          console.log(
            'Utilisation de ServiceWorkerRegistration.showNotification'
          );
          navigator.serviceWorker.ready.then((registration) => {
            // Avec le service worker, on peut utiliser les actions
            // Le type NotificationOptions de typescript ne contient pas actions, mais il est supporté
            // par les navigateurs via ServiceWorkerRegistration
            registration.showNotification(notificationTitle, {
              ...notificationOptions,
              actions: [
                {
                  action: 'open',
                  title: 'Voir',
                },
              ],
            } as NotificationOptions);
          });
        } else {
          // Fallback vers l'API Notification standard (sans actions)
          console.log(
            "Fallback vers l'API Notification standard (sans actions)"
          );
          const notification = new Notification(
            notificationTitle,
            notificationOptions
          );

          notification.onclick = () => {
            // Rediriger l'utilisateur vers l'URL spécifiée si disponible
            if (payload.data && payload.data['url']) {
              window.open(payload.data['url'], '_blank');
            }
            notification.close();
          };
        }
      } catch (error) {
        console.error("Erreur lors de l'affichage de la notification:", error);
      }
    }
  }

  /**
   * Obtient le token FCM actuel
   * @returns Observable avec le token FCM
   */
  get fcmToken(): Observable<string | null> {
    return this.fcmTokenSubject.asObservable();
  }

  /**
   * Désabonne un appareil des notifications
   * @param token Le token FCM à désabonner
   */
  unregisterDevice(token: string): Observable<unknown> {
    return this.http.post(
      `${environment.API_URL}/notifications/unregister-device`,
      { token }
    );
  }

  /**
   * Efface le token FCM actuel et force une réinitialisation
   * @returns Promise qui se résout lorsque le token est effacé
   */
  clearToken(): Promise<boolean> {
    console.log('FirebaseMessagingService: Effacement du token FCM actuel');

    if (!this.messaging) {
      console.error(
        'FirebaseMessagingService: Firebase messaging non initialisé pour clearToken'
      );
      return Promise.resolve(false);
    }

    // Réinitialiser le subject
    this.fcmTokenSubject.next(null);

    // Si nous avons un messaging, on peut utiliser deleteToken
    return deleteToken(this.messaging)
      .then(() => {
        console.log('FirebaseMessagingService: Token FCM supprimé avec succès');
        return true;
      })
      .catch((error) => {
        console.error(
          'FirebaseMessagingService: Erreur lors de la suppression du token:',
          error
        );
        // Même en cas d'erreur, on considère l'opération comme réussie
        // car le token peut déjà être absent
        return true;
      });
  }
}
