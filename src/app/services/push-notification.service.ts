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

// Ajout d'une interface pour les options de notification
interface NotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  vibrate?: number[];
  timestamp?: number;
  tag?: string;
  requireInteraction?: boolean;
  renotify?: boolean;
  actions?: { action: string; title: string }[];
  data?: {
    url?: string;
    id?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
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

      // Nettoyer d'abord l'état côté serveur
      this.forceServerUnsubscribe(token)
        .then(() => {
          console.log('Désactivation côté serveur réussie');

          // Ensuite nettoyer les abonnements locaux
          return this.cleanupLocalSubscriptions();
        })
        .then(() => {
          this._isSubscribed.next(false);
          console.log('Désabonnement complet réussi');
          resolve();
        })
        .catch((error) => {
          console.error('Erreur lors du désabonnement', error);
          reject(error);
        });
    });
  }

  /**
   * Nettoie tous les abonnements locaux
   */
  private cleanupLocalSubscriptions(): Promise<void> {
    return new Promise<void>((resolve) => {
      // Vérifier si le service worker est disponible
      if (!('serviceWorker' in navigator)) {
        resolve();
        return;
      }

      // Récupérer tous les Service Workers enregistrés
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          // Si aucun SW enregistré, rien à faire
          if (registrations.length === 0) {
            console.log('Aucun Service Worker enregistré');
            return;
          }

          // Récupérer tous les abonnements push et les désabonner
          const unsubPromises = registrations.map((registration) => {
            return registration.pushManager
              .getSubscription()
              .then((subscription) => {
                if (subscription) {
                  console.log(
                    "Suppression de l'abonnement local:",
                    subscription.endpoint
                  );
                  return subscription.unsubscribe();
                }
                return true;
              });
          });

          // Exécuter toutes les promesses et ignorer les résultats
          return Promise.all(unsubPromises).then(() => {
            console.log('Tous les abonnements locaux ont été nettoyés');
          });
        })
        .then(() => {
          // Réinitialiser également l'abonnement SwPush si disponible
          if (this.swPush) {
            return this.swPush
              .unsubscribe()
              .catch((err) => {
                // Ignorer les erreurs ici, car l'abonnement peut déjà être désactivé
                console.log(
                  'SwPush unsubscribe a échoué (peut-être déjà désabonné):',
                  err
                );
              })
              .then(() => {
                console.log('Nettoyage SwPush terminé');
              });
          }
          return Promise.resolve(); // Ajout d'un retour pour le cas où this.swPush n'existe pas
        })
        .then(() => {
          // Finaliser le processus
          resolve();
        })
        .catch((error) => {
          console.error(
            'Erreur lors du nettoyage des abonnements locaux:',
            error
          );
          // On résout quand même car ce n'est pas critique
          resolve();
        });
    });
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
            console.log('Désabonnement forcé côté serveur réussi');
            this._isSubscribed.next(false);
            resolve();
          },
          error: (error) => {
            console.error(
              'Erreur lors du désabonnement forcé côté serveur',
              error
            );
            reject(error);
          },
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
   * Renvoie une valeur synchrone
   */
  isCurrentlySubscribed(): boolean {
    return this._isSubscribed.value;
  }

  /**
   * Vérifie si l'utilisateur est actuellement abonné
   * Renvoie une Promise pour utilisation asynchrone
   */
  checkSubscriptionStatusAsync(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      // Vérifier d'abord localement avec SwPush
      this.swPush.subscription.subscribe((subscription) => {
        if (subscription) {
          this._isSubscribed.next(true);
          resolve(true);
        } else {
          // Récupérer le token d'authentification
          const token = localStorage.getItem(environment.TOKEN_KEY);
          if (!token) {
            this._isSubscribed.next(false);
            resolve(false);
            return;
          }

          // Ajouter les headers d'authentification
          const headers = {
            Authorization: `Bearer ${token}`,
          };

          // Vérifier avec le backend
          this.http
            .get<{ isSubscribed: boolean }>(
              `${this.apiUrl}/push-notifications/subscription-status`,
              { headers }
            )
            .pipe(catchError(() => of({ isSubscribed: false })))
            .subscribe((response) => {
              this._isSubscribed.next(response.isSubscribed);
              resolve(response.isSubscribed);
            });
        }
      });
    });
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
   * Envoie une notification locale de test via le service worker
   * Utile pour tester si les notifications fonctionnent correctement
   */
  sendLocalTestNotification(
    title: string,
    options: Partial<NotificationOptions> = {}
  ): Promise<boolean> {
    console.log('Envoi de notification de test local via service...', {
      title,
      options,
    });

    // Options par défaut pour la notification
    const defaultOptions: NotificationOptions = {
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
      silent: false, // S'assurer que la notification n'est pas silencieuse
    };

    // Fusionner les options
    const mergedOptions = { ...defaultOptions, ...options };
    console.log('Options de notification:', mergedOptions);

    return new Promise<boolean>((resolve, reject) => {
      if (!this.hasNotificationPermission()) {
        console.log('Permission non accordée, demande en cours...');

        return Notification.requestPermission()
          .then((permission) => {
            if (permission === 'granted') {
              return this.sendLocalTestNotification(title, options);
            } else {
              throw new Error(
                "Permission de notification refusée par l'utilisateur"
              );
            }
          })
          .then(resolve)
          .catch(reject);
      }

      // Vérifier si le service worker est supporté
      if (!('serviceWorker' in navigator)) {
        console.error('Service Worker non supporté');
        return this.fallbackNotification(title, mergedOptions)
          .then(resolve)
          .catch(reject);
      }

      // Essayer d'afficher la notification via le service worker
      return navigator.serviceWorker.ready
        .then((registration) => {
          console.log('Service Worker prêt pour notification:', registration);

          // Tentative directe avec showNotification (méthode la plus fiable)
          return registration
            .showNotification(title, mergedOptions)
            .then(() => {
              console.log(
                'Notification affichée avec succès via showNotification'
              );
              return true;
            })
            .catch((error) => {
              console.error('Erreur avec showNotification:', error);
              return this.fallbackNotification(title, mergedOptions);
            });
        })
        .then(resolve)
        .catch((error) => {
          console.error('Erreur avec le service worker:', error);
          return this.fallbackNotification(title, mergedOptions)
            .then(resolve)
            .catch(reject);
        });
    });
  }

  /**
   * Méthode de secours pour afficher une notification
   * Quand le service worker n'est pas disponible ou échoue
   */
  private fallbackNotification(
    title: string,
    options: NotificationOptions
  ): Promise<boolean> {
    console.log('Tentative de notification par méthode alternative');

    return new Promise<boolean>((resolve, reject) => {
      try {
        // Supprimer les propriétés non supportées par l'API Notification native
        const nativeOptions = { ...options };
        delete nativeOptions.actions; // Non supporté par l'API native

        // Créer la notification directement via l'API Notification
        const notification = new Notification(title, nativeOptions);

        // Gérer le clic sur la notification
        notification.onclick = () => {
          console.log('Notification cliquée (méthode alternative)');

          // Redirection si une URL est spécifiée
          if (nativeOptions.data && nativeOptions.data.url) {
            window.open(nativeOptions.data.url, '_blank');
          }
          notification.close();
        };

        console.log('Notification affichée avec succès (méthode alternative)');
        resolve(true);
      } catch (error) {
        console.error(
          "Erreur lors de l'affichage de la notification (méthode alternative):",
          error
        );
        reject(error);
      }
    });
  }
}
