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
  private isMobileDevice = false;
  private isInitializingToken = false;

  constructor(private http: HttpClient) {
    // console.log('FirebaseMessagingService: Initialisation du service');

    // Détecter si l'utilisateur est sur un appareil mobile
    this.isMobileDevice = this.detectMobileDevice();
    // console.log(
    //   `FirebaseMessagingService: Appareil mobile détecté: ${this.isMobileDevice}`
    // );

    // console.log(
    //   'FirebaseMessagingService: Config Firebase:',
    //   JSON.stringify({
    //     apiKey: environment.firebase?.apiKey,
    //     projectId: environment.firebase?.projectId,
    //     messagingSenderId: environment.firebase?.messagingSenderId,
    //     appId: environment.firebase?.appId,
    //     vapidKeyConfigured: !!environment.firebase?.vapidKey,
    //   })
    // );

    this.initializeFirebaseApp();
  }

  /**
   * Détecte si l'appareil est un mobile
   */
  private detectMobileDevice(): boolean {
    const userAgent =
      navigator.userAgent ||
      navigator.vendor ||
      (window as unknown as { opera: string }).opera;

    // Détection par user agent
    const mobileRegex =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const isMobileByUA = mobileRegex.test(userAgent.toLowerCase());

    // Vérification alternative par taille d'écran
    const isMobileByScreen = window.innerWidth <= 768;

    // console.log('Détection mobile par User Agent:', isMobileByUA);
    // console.log("Détection mobile par taille d'écran:", isMobileByScreen);

    return isMobileByUA || isMobileByScreen;
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
      // console.log(
      //   'FirebaseMessagingService: App Firebase initialisée avec succès'
      // );

      try {
        this.messaging = getMessaging(app);
        // console.log(
        //   'FirebaseMessagingService: Messaging Firebase initialisé avec succès'
        // );
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
    // Éviter les demandes multiples simultanées
    if (this.isInitializingToken) {
      return this.fcmTokenSubject.asObservable();
    }

    this.isInitializingToken = true;

    // Vérifier si les notifications sont explicitement désactivées dans localStorage
    const notificationsDisabled = this.areNotificationsDisabledInLocalStorage();
    if (notificationsDisabled) {
      this.fcmTokenSubject.next(null);
      this.isInitializingToken = false;
      return this.fcmTokenSubject.asObservable();
    }

    if (!this.messaging) {
      console.error('Firebase messaging non initialisé');
      this.fcmTokenSubject.next(null);
      this.isInitializingToken = false;
      return this.fcmTokenSubject.asObservable();
    }

    // Si un token existe déjà dans le sujet, ne pas en demander un nouveau
    const currentToken = this.fcmTokenSubject.getValue();
    if (currentToken) {
      this.isInitializingToken = false;
      return this.fcmTokenSubject.asObservable();
    }

    // Traitement spécial pour les appareils mobiles
    if (this.isMobileDevice) {
      // console.log(
      //   'FirebaseMessagingService: Traitement spécial pour appareil mobile'
      // );

      // Sur mobile, il faut parfois forcer l'affichage du dialogue de permission
      if (Notification.permission !== 'granted') {
        // console.log(
        //   'FirebaseMessagingService: Forçage du dialogue de permission sur mobile'
        // );

        // Sur iOS particulièrement, il faut une interaction utilisateur
        const forceMobilePermissionRequest = () => {
          Notification.requestPermission()
            .then((permission) => {
              // console.log(
              //   'FirebaseMessagingService: Réponse permission mobile:',
              //   permission
              // );
              if (permission === 'granted') {
                this.getToken();
              } else {
                // console.log(
                //   'FirebaseMessagingService: Permission refusée sur mobile'
                // );
                this.fcmTokenSubject.next(null);
              }
            })
            .catch((error) => {
              console.error(
                'FirebaseMessagingService: Erreur permission mobile:',
                error
              );
              this.fcmTokenSubject.next(null);
            });
        };

        // Appeler directement puisque cette méthode est déjà appelée par un clic
        forceMobilePermissionRequest();
      } else {
        // Permission déjà accordée
        this.getToken();
      }
    } else {
      // Comportement normal pour desktop
      if (Notification.permission === 'granted') {
        // Permission déjà accordée, récupérer directement le token
        // console.log(
        //   'FirebaseMessagingService: Permission déjà accordée, récupération du token'
        // );
        this.getToken();
      } else if (Notification.permission === 'default') {
        // Demander la permission
        // console.log(
        //   'FirebaseMessagingService: Demande de permission au navigateur'
        // );
        Notification.requestPermission()
          .then((permission) => {
            // console.log(
            //   'FirebaseMessagingService: Réponse permission:',
            //   permission
            // );
            if (permission === 'granted') {
              this.getToken();
            } else {
              // console.log(
              //   'FirebaseMessagingService: Permission de notification refusée'
              // );
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
        // console.log(
        //   'FirebaseMessagingService: Permission de notification déjà refusée'
        // );
        this.fcmTokenSubject.next(null);
      }
    }

    return this.fcmTokenSubject.asObservable();
  }

  /**
   * Récupère le token FCM après permission
   */
  private getToken(): void {
    if (!this.messaging) {
      console.error('Firebase messaging non initialisé pour getToken');
      this.fcmTokenSubject.next(null);
      this.isInitializingToken = false;
      return;
    }

    // console.log(
    //   'FirebaseMessagingService: Tentative de récupération du token avec vapidKey',
    //   environment.firebase?.vapidKey ? 'configurée' : 'MANQUANTE'
    // );

    // Obtenir d'abord l'enregistrement du service worker
    if ('serviceWorker' in navigator && this.messaging) {
      const messaging = this.messaging;
      navigator.serviceWorker.ready
        .then((registration) => {
          // console.log(
          //   'FirebaseMessagingService: Service Worker prêt:',
          //   registration
          // );

          // Options avec le service worker actif
          const tokenOptions = {
            vapidKey: environment.firebase?.vapidKey,
            serviceWorkerRegistration: registration,
          };

          return getToken(messaging, tokenOptions);
        })
        .then((token) => {
          if (token) {
            // console.log(
            //   'FirebaseMessagingService: Token FCM récupéré avec succès'
            // );
            // console.log('FirebaseMessagingService: Token = ', token);
            this.fcmTokenSubject.next(token);
            this.saveTokenToServer(token);
          } else {
            // console.log(
            //   'FirebaseMessagingService: Aucun token de registration disponible'
            // );
            this.fcmTokenSubject.next(null);
          }
          this.isInitializingToken = false;
        })
        .catch((error) => {
          console.error(
            'FirebaseMessagingService: Erreur lors de la récupération du token:',
            error
          );
          this.fcmTokenSubject.next(null);
          this.isInitializingToken = false;
        });
    } else {
      console.error(
        'FirebaseMessagingService: Service Worker non supporté par ce navigateur'
      );
      this.fcmTokenSubject.next(null);
      this.isInitializingToken = false;
    }
  }

  /**
   * Vérifie si les notifications ont été explicitement désactivées dans localStorage
   */
  private areNotificationsDisabledInLocalStorage(): boolean {
    try {
      const NOTIFICATION_PREF_KEY = 'notification_preferences';
      const storedPrefs = localStorage.getItem(NOTIFICATION_PREF_KEY);

      if (storedPrefs) {
        const prefs = JSON.parse(storedPrefs);

        // Si l'utilisateur a explicitement désactivé les notifications
        if (
          Object.prototype.hasOwnProperty.call(prefs, 'isSubscribed') &&
          prefs.isSubscribed === false
        ) {
          // console.log(
          //   'FirebaseMessagingService: Notifications explicitement désactivées selon préférences stockées'
          // );
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error(
        'FirebaseMessagingService: Erreur lors de la vérification des préférences stockées:',
        error
      );
      return false;
    }
  }

  /**
   * Enregistre le token FCM sur le serveur
   * @param token Le token FCM à sauvegarder
   */
  private saveTokenToServer(token: string): void {
    // Vérifie si les notifications sont désactivées avant d'enregistrer sur le serveur
    if (this.areNotificationsDisabledInLocalStorage()) {
      // console.log(
      //   'FirebaseMessagingService: Notifications désactivées, token non enregistré sur le serveur'
      // );
      return;
    }

    // Adapter à votre API
    this.http
      .post(`${environment.API_URL}/notifications/register-device`, { token })
      .subscribe({
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
        // console.log('Message reçu au premier plan:', payload);
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
          // console.log(
          //   'Utilisation de ServiceWorkerRegistration.showNotification'
          // );
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
          // console.log(
          //   "Fallback vers l'API Notification standard (sans actions)"
          // );
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
  async clearToken(): Promise<boolean> {
    // console.log('FirebaseMessagingService: Effacement du token FCM actuel');

    if (!this.messaging) {
      console.error(
        'FirebaseMessagingService: Firebase messaging non initialisé pour clearToken'
      );
      return Promise.resolve(false);
    }

    // Réinitialiser le subject
    this.fcmTokenSubject.next(null);

    // Si nous avons un messaging, on peut utiliser deleteToken
    try {
      await deleteToken(this.messaging);
      // console.log('FirebaseMessagingService: Token FCM supprimé avec succès');
      return true;
    } catch (error) {
      console.error(
        'FirebaseMessagingService: Erreur lors de la suppression du token:',
        error
      );
      return true;
    }
  }

  /**
   * Déconnecte et réinitialise Firebase Messaging
   */
  disconnectMessaging(): void {
    // Effacer le token et réinitialiser les états
    if (this.messaging) {
      this.clearToken().catch((error) => {
        console.error(
          'Erreur lors de la déconnexion de Firebase Messaging:',
          error
        );
      });
    }

    // Réinitialiser les sujets
    this.fcmTokenSubject.next(null);
    this.notificationSubject.next(null);
  }
}
