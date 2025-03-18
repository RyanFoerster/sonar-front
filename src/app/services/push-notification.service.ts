import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import {
  catchError,
  Observable,
  of,
  tap,
  BehaviorSubject,
  switchMap,
  from,
} from 'rxjs';
import { environment } from '../../environments/environment';

interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  data?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private apiUrl = `${environment.API_URL}`;
  private _isSubscribed = new BehaviorSubject<boolean>(false);

  // Observable public pour suivre l'état d'abonnement
  public isSubscribed$ = this._isSubscribed.asObservable();

  constructor(private http: HttpClient, private swPush: SwPush) {
    // Vérifier l'état d'abonnement au démarrage
    this.checkSubscriptionStatus();

    this.swPush.notificationClicks.subscribe((event) => {
      console.log('Notification cliquée', event);

      // Redirection si une URL est spécifiée
      if (event.notification.data && event.notification.data.url) {
        window.open(event.notification.data.url, '_blank');
      }
    });

    // S'abonner aux événements de la push
    this.swPush.subscription.subscribe((sub) => {
      this._isSubscribed.next(!!sub);
    });

    // Si l'utilisateur a déjà la permission mais pas d'abonnement local
    if (this.hasNotificationPermission() && !this._isSubscribed.value) {
      this.checkServerSubscriptionStatus();
    }
  }

  /**
   * Vérifie si l'utilisateur est déjà abonné aux notifications
   */
  private checkSubscriptionStatus(): void {
    // Vérifier d'abord localement avec SwPush
    this.swPush.subscription.subscribe((subscription) => {
      if (subscription) {
        this._isSubscribed.next(true);
      } else {
        // Si aucun abonnement local, vérifier avec le backend
        this.checkServerSubscriptionStatus();
      }
    });
  }

  /**
   * Vérifie avec le serveur si l'utilisateur est déjà abonné
   */
  private checkServerSubscriptionStatus(): void {
    // Récupérer le token d'authentification
    const token = localStorage.getItem(environment.TOKEN_KEY);
    if (!token) {
      this._isSubscribed.next(false);
      return;
    }

    // Ajouter les headers d'authentification
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    this.http
      .get<{ isSubscribed: boolean }>(
        `${this.apiUrl}/push-notifications/subscription-status`,
        { headers }
      )
      .pipe(catchError(() => of({ isSubscribed: false })))
      .subscribe((response) => {
        this._isSubscribed.next(response.isSubscribed);
      });
  }

  /**
   * Récupère la clé publique VAPID depuis le serveur
   */
  getVapidPublicKey(): Observable<{ publicKey: string }> {
    return this.http
      .get<{ publicKey: string }>(
        `${this.apiUrl}/push-notifications/vapid-public-key`
      )
      .pipe(
        tap(() => {
          console.log('Clé VAPID récupérée');
        }),
        catchError((error) => {
          console.error(
            'Erreur lors de la récupération de la clé VAPID',
            error
          );
          return of({ publicKey: '' });
        })
      );
  }

  /**
   * Souscrit aux notifications push
   */
  subscribeToNotifications(): Observable<unknown> {
    console.log("Début du processus d'abonnement aux notifications...");

    // Vérifier d'abord si on est déjà abonné côté serveur
    const token = localStorage.getItem(environment.TOKEN_KEY);
    if (!token) {
      console.error("Aucun token d'authentification. Veuillez vous connecter.");
      return of(null);
    }

    console.log("Token d'authentification trouvé");

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    console.log("Vérification du statut d'abonnement sur le serveur...");

    return this.http
      .get<{ isSubscribed: boolean }>(
        `${this.apiUrl}/push-notifications/subscription-status`,
        { headers }
      )
      .pipe(
        catchError((error) => {
          console.error(
            "Erreur lors de la vérification du statut d'abonnement",
            error
          );
          return of({ isSubscribed: false });
        }),
        tap((response) => {
          console.log("Réponse du statut d'abonnement:", response);
          if (response.isSubscribed) {
            console.log('Utilisateur déjà abonné sur le serveur');
            this._isSubscribed.next(true);
          }
        }),
        // Si déjà abonné, on s'arrête là, sinon on continue
        switchMap((response) => {
          if (response.isSubscribed) {
            console.log('Utilisateur déjà abonné, retour');
            return of({ success: true, message: 'Déjà abonné' });
          }

          console.log(
            'Utilisateur non abonné, récupération de la clé VAPID...'
          );

          // Sinon, on procède à l'abonnement en obtenant la clé VAPID
          return this.getVapidPublicKey().pipe(
            switchMap((keyResponse) => {
              console.log('Clé VAPID reçue:', keyResponse);

              if (!keyResponse || !keyResponse.publicKey) {
                console.error('Clé publique VAPID non disponible');
                throw new Error('Clé publique VAPID non disponible');
              }

              const serverPublicKey =
                typeof keyResponse.publicKey === 'string'
                  ? keyResponse.publicKey.trim()
                  : String(keyResponse.publicKey);

              console.log("Clé utilisée pour l'abonnement:", serverPublicKey);

              // Cette partie est une Promise, on la convertit en Observable
              console.log("Demande d'abonnement au service SwPush...");

              return from(
                this.swPush
                  .requestSubscription({
                    serverPublicKey: serverPublicKey,
                  })
                  .then((subscription) => {
                    console.log(
                      'Abonnement aux notifications réussi',
                      subscription
                    );
                    this._isSubscribed.next(true);
                    return subscription;
                  })
                  .catch((err) => {
                    console.error('Erreur dans la promesse SwPush:', err);
                    throw err;
                  })
              ).pipe(
                // Enregistrer l'abonnement sur le serveur
                tap(() =>
                  console.log("Sauvegarde de l'abonnement sur le serveur...")
                ),
                switchMap((subscription) =>
                  this.saveSubscription(subscription)
                ),
                catchError((error) => {
                  console.error(
                    "Erreur lors de l'abonnement aux notifications",
                    error
                  );
                  return of({ success: false, error: error.message });
                })
              );
            }),
            catchError((error) => {
              console.error(
                'Erreur lors de la récupération de la clé VAPID',
                error
              );
              return of({ success: false, error: error.message });
            })
          );
        })
      );
  }

  /**
   * Désabonne l'utilisateur des notifications push
   */
  unsubscribeFromNotifications(): Promise<void> {
    console.log('Début du processus de désabonnement...');

    return new Promise<void>((resolve, reject) => {
      // D'abord vérifier si le service worker est enregistré
      if (!('serviceWorker' in navigator)) {
        console.error("Le service worker n'est pas supporté");
        reject(new Error("Le service worker n'est pas supporté"));
        return;
      }

      console.log("Vérification de l'abonnement actuel...");

      // Récupérer le token d'authentification
      const token = localStorage.getItem(environment.TOKEN_KEY);
      if (!token) {
        console.error("Aucun token d'authentification trouvé");
        reject(new Error('Vous devez être connecté pour vous désabonner'));
        return;
      }

      // Utiliser une approche différente pour obtenir l'abonnement actuel
      navigator.serviceWorker.ready
        .then((registration) => {
          console.log('Service Worker prêt', registration);
          return registration.pushManager.getSubscription();
        })
        .then((subscription) => {
          if (!subscription) {
            console.log(
              "Pas d'abonnement local trouvé, désactivation sur le serveur directement..."
            );

            // Même sans abonnement local, on doit désactiver côté serveur
            return this.forceServerUnsubscribe(token)
              .then(() => {
                console.log('Désactivation côté serveur réussie');
                this._isSubscribed.next(false);
                resolve();
              })
              .catch((error) => {
                console.error(
                  'Erreur lors de la désactivation côté serveur',
                  error
                );
                reject(error);
              });
          }

          console.log('Abonnement local trouvé', subscription.endpoint);

          // Récupérer l'endpoint pour le désabonnement côté serveur
          const endpoint = subscription.endpoint;

          // Désabonner localement
          return subscription.unsubscribe().then((success) => {
            console.log('Désabonnement local réussi:', success);
            this._isSubscribed.next(false);

            // Puis désabonner côté serveur
            console.log('Envoi de la requête de désabonnement au serveur...');

            // Appeler le backend pour désactiver l'abonnement
            this.http
              .delete(
                `${
                  this.apiUrl
                }/push-notifications/unsubscribe/${encodeURIComponent(
                  endpoint
                )}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              )
              .subscribe({
                next: (response) => {
                  console.log('Désabonnement du serveur réussi', response);
                  this._isSubscribed.next(false);
                  resolve();
                },
                error: (error) => {
                  console.error(
                    'Erreur lors du désabonnement côté serveur',
                    error
                  );
                  // On considère quand même comme réussi car l'abonnement local a été supprimé
                  this._isSubscribed.next(false);
                  resolve();
                },
              });
          });
        })
        .catch((error) => {
          console.error('Erreur lors du processus de désabonnement', error);
          reject(error);
        });
    });
  }

  /**
   * Enregistre l'abonnement sur le serveur
   */
  private saveSubscription(
    subscription: PushSubscription
  ): Observable<unknown> {
    // Récupérer le token d'authentification
    const token = localStorage.getItem(environment.TOKEN_KEY);

    if (!token) {
      console.error(
        "Aucun token d'authentification trouvé. L'utilisateur doit être connecté pour s'abonner aux notifications."
      );
      return of(null);
    }

    // Convertir l'abonnement en JSON pour accéder aux propriétés
    const subscriptionJSON = subscription.toJSON();

    // Préparer le payload dans le format attendu par le backend
    const subscriptionPayload = {
      subscription: {
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime,
        keys: {
          auth: subscriptionJSON.keys?.['auth'] || '',
          p256dh: subscriptionJSON.keys?.['p256dh'] || '',
        },
      },
    };

    // Ajouter les headers d'authentification
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    return this.http
      .post(
        `${this.apiUrl}/push-notifications/subscribe`,
        subscriptionPayload,
        { headers }
      )
      .pipe(
        tap((response) =>
          console.log('Abonnement enregistré sur le serveur', response)
        ),
        catchError((error) => {
          console.error(
            "Erreur lors de l'enregistrement de l'abonnement",
            error
          );
          return of(null);
        })
      );
  }

  /**
   * Vérifie si les notifications sont disponibles
   */
  arePushNotificationsSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Vérifie si l'utilisateur a déjà autorisé les notifications
   */
  hasNotificationPermission(): boolean {
    return Notification.permission === 'granted';
  }

  /**
   * Vérifie si l'utilisateur a bloqué les notifications
   */
  areNotificationsBlocked(): boolean {
    return Notification.permission === 'denied';
  }

  /**
   * Vérifie si l'utilisateur est actuellement abonné
   */
  isCurrentlySubscribed(): boolean {
    return this._isSubscribed.value;
  }

  /**
   * Envoie une notification à un utilisateur spécifique (admin seulement)
   */
  sendNotificationToUser(
    userId: number,
    notification: PushNotificationData
  ): Observable<unknown> {
    return this.http
      .post(
        `${this.apiUrl}/push-notifications/send-to-user/${userId}`,
        notification
      )
      .pipe(
        tap(() => console.log("Notification envoyée à l'utilisateur")),
        catchError((error) => {
          console.error("Erreur lors de l'envoi de la notification", error);
          return of(null);
        })
      );
  }

  /**
   * Envoie une notification à tous les utilisateurs (admin seulement)
   */
  sendNotificationToAll(
    notification: PushNotificationData
  ): Observable<unknown> {
    return this.http
      .post(`${this.apiUrl}/push-notifications/send-to-all`, notification)
      .pipe(
        tap(() => console.log('Notification envoyée à tous les utilisateurs')),
        catchError((error) => {
          console.error("Erreur lors de l'envoi de la notification", error);
          return of(null);
        })
      );
  }

  /**
   * Force la désactivation de l'abonnement côté serveur sans connaître l'endpoint
   */
  forceServerUnsubscribe(token: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.http
        .post(
          `${this.apiUrl}/push-notifications/force-unsubscribe`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .subscribe({
          next: () => {
            console.log('Désabonnement forcé réussi');
            this._isSubscribed.next(false);
            resolve();
          },
          error: (error) => {
            console.error('Erreur lors du désabonnement forcé', error);
            reject(error);
          },
        });
    });
  }

  /**
   * Envoie une notification locale de test
   * Utile pour tester si les notifications fonctionnent correctement
   */
  sendLocalTestNotification(
    title: string,
    options: any = {}
  ): Promise<boolean> {
    console.log('Envoi de notification de test local via service...');

    return new Promise((resolve, reject) => {
      if (!this.hasNotificationPermission()) {
        console.error('Permission de notification non accordée');
        reject(new Error('Permission de notification non accordée'));
        return;
      }

      if (!('serviceWorker' in navigator)) {
        console.error('Service Worker non supporté');
        reject(new Error('Service Worker non supporté'));
        return;
      }

      navigator.serviceWorker.ready
        .then((registration) => {
          console.log('Service Worker prêt pour notification:', registration);

          // Options par défaut pour la notification
          const defaultOptions: any = {
            body: 'Ceci est une notification de test via le service',
            icon: 'assets/icons/SONAR-FAVICON.webp',
            badge: 'assets/icons/SONAR-FAVICON.webp',
            vibrate: [200, 100, 200],
            timestamp: Date.now(),
            tag: 'test-' + Date.now(),
            requireInteraction: true,
            renotify: true,
            actions: [
              {
                action: 'open',
                title: 'Ouvrir',
              },
              {
                action: 'close',
                title: 'Fermer',
              },
            ],
            data: {
              url: window.location.href,
              id: Date.now().toString(),
            },
          };

          // Fusionner les options
          const mergedOptions = { ...defaultOptions, ...options };
          console.log('Options de notification:', mergedOptions);

          registration
            .showNotification(title, mergedOptions)
            .then(() => {
              console.log('Notification affichée avec succès');
              resolve(true);
            })
            .catch((error) => {
              console.error(
                "Erreur lors de l'affichage de la notification:",
                error
              );
              reject(error);
            });
        })
        .catch((error) => {
          console.error(
            'Erreur lors de la récupération du Service Worker:',
            error
          );
          reject(error);
        });
    });
  }
}
