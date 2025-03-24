import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  catchError,
  Observable,
  of,
  tap,
  BehaviorSubject,
  from,
  map,
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
  private readonly NOTIFICATION_PREF_KEY = 'notification_preferences';

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
      // Enregistrer l'état dans localStorage
      this.saveNotificationPreference(!!sub);
    });

    // Si l'utilisateur a déjà la permission mais pas d'abonnement local
    if (this.hasNotificationPermission() && !this._isSubscribed.value) {
      this.checkServerSubscriptionStatus();
    }

    // Charger les préférences depuis localStorage
    this.loadNotificationPreferences();
  }

  /**
   * Enregistre les préférences de notification dans localStorage
   */
  private saveNotificationPreference(isSubscribed: boolean): void {
    try {
      const preferences = {
        isSubscribed: isSubscribed,
        permission: Notification.permission,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(
        this.NOTIFICATION_PREF_KEY,
        JSON.stringify(preferences)
      );
      console.log('Préférences de notification enregistrées:', preferences);
    } catch (error) {
      console.error(
        "Erreur lors de l'enregistrement des préférences de notification:",
        error
      );
    }
  }

  /**
   * Charge les préférences de notification depuis localStorage
   */
  private loadNotificationPreferences(): void {
    try {
      const storedPrefs = localStorage.getItem(this.NOTIFICATION_PREF_KEY);
      if (storedPrefs) {
        const prefs = JSON.parse(storedPrefs);
        console.log('Préférences de notification chargées:', prefs);

        // Si l'utilisateur avait explicitement désactivé les notifications, respecter ce choix
        // même si la permission est toujours "granted"
        if (Object.prototype.hasOwnProperty.call(prefs, 'isSubscribed')) {
          if (prefs.isSubscribed === false) {
            // L'utilisateur a explicitement désactivé les notifications
            console.log(
              "Notifications explicitement désactivées par l'utilisateur, état maintenu"
            );
            this._isSubscribed.next(false);
            return;
          } else if (
            prefs.isSubscribed &&
            Notification.permission === 'granted'
          ) {
            // L'utilisateur était abonné et la permission est toujours valide
            console.log("Restauration de l'état abonné depuis les préférences");
            this._isSubscribed.next(true);
            return;
          }
        }

        // Si la permission a changé, mettre à jour les préférences
        if (Notification.permission !== prefs.permission) {
          console.log(
            'Permission changée de',
            prefs.permission,
            'à',
            Notification.permission
          );
          this.saveNotificationPreference(
            Notification.permission === 'granted'
          );
          this._isSubscribed.next(Notification.permission === 'granted');
        }
      }
    } catch (error) {
      console.error(
        'Erreur lors du chargement des préférences de notification:',
        error
      );
    }
  }

  /**
   * Vérifie l'état d'abonnement actuel aux notifications
   */
  private checkSubscriptionStatus(): void {
    // Forcer la vérification des abonnements au service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        console.log(`${registrations.length} service worker(s) enregistré(s)`);
        for (const registration of registrations) {
          console.log('Service worker scope:', registration.scope);
        }
      });
    }

    // Récupérer l'ID utilisateur et le token pour vérifier côté serveur
    const token = localStorage.getItem(environment.TOKEN_KEY);
    let userId: number | null = null;
    try {
      const userData = localStorage.getItem(environment.USER_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        userId = user.id;
      }
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des données utilisateur:',
        error
      );
    }

    // Vérifier d'abord dans le localStorage
    try {
      const storedPrefs = localStorage.getItem(this.NOTIFICATION_PREF_KEY);
      if (storedPrefs) {
        const prefs = JSON.parse(storedPrefs);
        console.log('Vérification des préférences stockées:', prefs);

        // Si l'utilisateur avait explicitement désactivé les notifications, respecter ce choix
        if (
          Object.prototype.hasOwnProperty.call(prefs, 'isSubscribed') &&
          prefs.isSubscribed === false
        ) {
          console.log(
            'Désactivation explicite des notifications détectée, état maintenu'
          );
          this._isSubscribed.next(false);

          // Si nous avons un userId et un token, confirmer aussi côté serveur
          if (userId && token) {
            const headers = new HttpHeaders().set(
              'Authorization',
              `Bearer ${token}`
            );
            this.http
              .post(
                `${this.apiUrl}/notifications/force-unsubscribe/${userId}`,
                {},
                { headers }
              )
              .subscribe({
                next: () => console.log('État désactivé confirmé côté serveur'),
                error: (err) =>
                  console.error('Erreur confirmation côté serveur:', err),
              });
          }
          return;
        }

        // Vérifier si la permission du navigateur correspond à celle stockée
        const currentPermission = Notification.permission;

        // Si l'utilisateur a un userId et un token, vérifier l'état réel côté serveur
        if (userId && token && currentPermission === 'granted') {
          const headers = new HttpHeaders().set(
            'Authorization',
            `Bearer ${token}`
          );
          this.http
            .get<{ isSubscribed: boolean }>(
              `${this.apiUrl}/notifications/subscription-status/${userId}`,
              { headers }
            )
            .subscribe({
              next: (response) => {
                // Synchroniser l'état local avec l'état serveur
                this._isSubscribed.next(response.isSubscribed);
                this.saveNotificationPreference(response.isSubscribed);
                console.log(
                  "État d'abonnement synchronisé avec le serveur:",
                  response.isSubscribed
                );
              },
              error: (err) => {
                console.error(
                  'Erreur lors de la vérification côté serveur:',
                  err
                );
                // En cas d'erreur, utiliser l'état stocké localement comme fallback
                if (prefs.isSubscribed && currentPermission === 'granted') {
                  this._isSubscribed.next(true);
                  console.log(
                    "État d'abonnement restauré depuis localStorage: abonné"
                  );
                } else {
                  this._isSubscribed.next(false);
                  this.saveNotificationPreference(false);
                }
              },
            });
          return;
        } else if (prefs.isSubscribed && currentPermission === 'granted') {
          this._isSubscribed.next(true);
          console.log("État d'abonnement restauré depuis localStorage: abonné");
          return;
        } else if (currentPermission !== prefs.permission) {
          // La permission a changé depuis la dernière visite
          console.log(
            'La permission de notification a changé depuis la dernière visite',
            'de',
            prefs.permission,
            'à',
            currentPermission
          );
          this.saveNotificationPreference(currentPermission === 'granted');
        }
      }
    } catch (error) {
      console.error(
        'Erreur lors de la vérification des préférences stockées:',
        error
      );
    }

    // Si aucune préférence n'est stockée ou si la permission a changé
    // et que l'utilisateur n'a pas explicitement désactivé les notifications
    if (Notification.permission === 'granted') {
      // L'utilisateur a déjà accordé la permission
      // Mais nous ne l'activons pas automatiquement sans action explicite de l'utilisateur
      this.swPush.subscription.subscribe((subscription) => {
        // Mettre à jour l'état en fonction de l'abonnement existant
        const isActive = !!subscription;
        this._isSubscribed.next(isActive);
        this.saveNotificationPreference(isActive);
        console.log('État déterminé par abonnement existant:', isActive);
      });
    } else {
      // L'utilisateur n'a pas encore accordé la permission
      this._isSubscribed.next(false);
      this.saveNotificationPreference(false);
    }
  }

  /**
   * Vérifie l'état d'abonnement sur le serveur
   */
  private checkServerSubscriptionStatus(): void {
    // Récupérer l'ID utilisateur et le token
    const token = localStorage.getItem(environment.TOKEN_KEY);
    let userId: number | null = null;

    try {
      const userData = localStorage.getItem(environment.USER_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        userId = user.id;
      }
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des données utilisateur:',
        error
      );
    }

    // Si nous avons un ID utilisateur et un token, vérifier l'état côté serveur
    if (userId && token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http
        .get<{ isSubscribed: boolean }>(
          `${this.apiUrl}/notifications/subscription-status/${userId}`,
          { headers }
        )
        .subscribe({
          next: (response) => {
            // Mettre à jour l'état local pour correspondre à l'état du serveur
            this._isSubscribed.next(response.isSubscribed);
            this.saveNotificationPreference(response.isSubscribed);
            console.log(
              "État d'abonnement vérifié côté serveur:",
              response.isSubscribed
            );
          },
          error: (err) => {
            console.error('Erreur lors de la vérification côté serveur:', err);
            // En cas d'erreur, on ne change pas l'état actuel
          },
        });
    } else {
      console.log(
        "Impossible de vérifier l'état sur le serveur, informations d'authentification manquantes"
      );
    }
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

    // Nettoyer tout abonnement existant pour éviter les conflits
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          if (subscription) {
            console.log('Ancienne souscription détectée, nettoyage...');
            subscription.unsubscribe().then((success) => {
              console.log(
                'Nettoyage de la souscription:',
                success ? 'réussi' : 'échoué'
              );
            });
          }
        });
      });
    }

    // Vérifier si on est sur mobile pour adapter le comportement
    const isMobile = this.detectMobileDevice();
    console.log(
      `subscribeToNotifications: appareil mobile détecté = ${isMobile}`
    );

    // Récupérer l'ID utilisateur et le token d'authentification
    const token = localStorage.getItem(environment.TOKEN_KEY);
    let userId: number | null = null;
    try {
      const userData = localStorage.getItem(environment.USER_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        userId = user.id;
        console.log(`ID utilisateur récupéré: ${userId}`);
      }
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des données utilisateur:',
        error
      );
    }

    // Version locale sans appel backend
    if ('Notification' in window) {
      return from(Notification.requestPermission()).pipe(
        map((permission) => {
          console.log('Permission de notification:', permission);
          if (permission === 'granted') {
            // Mise à jour de l'état local et notification de succès
            this._isSubscribed.next(true);
            // Enregistrer la préférence dans localStorage
            this.saveNotificationPreference(true);

            // Si nous avons un userId et un token, réactiver les notifications côté serveur
            if (userId && token) {
              console.log(
                `Réactivation des notifications pour l'utilisateur ${userId}`
              );

              // Générer un identifiant de préférence spécial (pas un vrai token FCM)
              const deviceIdentifier = `web_pref_active_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 15)}`;
              console.log(
                'Identifiant de préférence généré:',
                deviceIdentifier
              );

              const headers = new HttpHeaders().set(
                'Authorization',
                `Bearer ${token}`
              );

              // Appeler l'endpoint force-subscribe
              this.http
                .post(
                  `${this.apiUrl}/notifications/force-subscribe/${userId}`,
                  { token: deviceIdentifier },
                  { headers }
                )
                .subscribe({
                  next: (response) => {
                    console.log(
                      'Notifications réactivées avec succès sur le serveur:',
                      response
                    );

                    // Afficher une notification de confirmation
                    this.sendLocalTestNotification('Notifications activées', {
                      body: 'Vous recevrez désormais des notifications de SonarArtists',
                      requireInteraction: false,
                    }).catch((err) =>
                      console.error('Erreur notification test:', err)
                    );
                  },
                  error: (error) => {
                    console.error(
                      'Erreur lors de la réactivation des notifications sur le serveur:',
                      error
                    );
                  },
                });
            }

            return { success: true };
          } else {
            this._isSubscribed.next(false);
            // Enregistrer la préférence dans localStorage
            this.saveNotificationPreference(false);
            return {
              success: false,
              error:
                permission === 'denied'
                  ? "Notifications refusées par l'utilisateur"
                  : 'Permission de notification non accordée',
            };
          }
        }),
        catchError((error) => {
          console.error('Erreur lors de la demande de permission', error);
          this._isSubscribed.next(false);
          // Enregistrer l'échec dans localStorage
          this.saveNotificationPreference(false);
          return of({ success: false, error: error.message });
        })
      );
    } else {
      console.warn('Notifications non supportées par ce navigateur');
      this._isSubscribed.next(false);
      // Enregistrer l'état non supporté dans localStorage
      this.saveNotificationPreference(false);
      return of({ success: false, error: 'Notifications non supportées' });
    }
  }

  /**
   * Désactive les notifications
   */
  unsubscribeFromNotifications(): Promise<void> {
    console.log('Méthode disableNotifications appelée');

    // Version locale sans appel backend
    this._isSubscribed.next(false);
    // Enregistrer la préférence dans localStorage
    this.saveNotificationPreference(false);

    // Récupérer le token d'authentification pour la désactivation côté serveur
    const token = localStorage.getItem(environment.TOKEN_KEY);

    // Récupérer l'ID de l'utilisateur depuis le token ou le localStorage
    let userId: number | null = null;
    try {
      const userData = localStorage.getItem(environment.USER_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        userId = user.id;
        console.log(`ID utilisateur récupéré: ${userId}`);
      } else {
        console.log('Aucune donnée utilisateur trouvée dans localStorage');
      }
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des données utilisateur:',
        error
      );
    }

    // Tentative de désabonnement du service worker si possible
    return navigator.serviceWorker.ready
      .then((registration) => {
        return registration.pushManager.getSubscription();
      })
      .then((subscription) => {
        if (subscription) {
          console.log('Désabonnement de la souscription push existante');
          return subscription.unsubscribe();
        }
        return true;
      })
      .then(() => {
        console.log('Désabonnement local réussi');

        // Désabonnement sur le serveur
        if (token) {
          console.log('Tentative de désabonnement côté serveur');

          // Si nous avons un userId, utiliser l'endpoint userId spécifique
          if (userId) {
            console.log(`Désabonnement forcé pour l'utilisateur ${userId}`);
            const headers = new HttpHeaders().set(
              'Authorization',
              `Bearer ${token}`
            );

            return new Promise<void>((resolve) => {
              this.http
                .post(
                  `${this.apiUrl}/notifications/force-unsubscribe/${userId}`,
                  {},
                  { headers }
                )
                .subscribe({
                  next: () => {
                    console.log(
                      `Désabonnement forcé réussi pour l'utilisateur ${userId}`
                    );
                    resolve();
                  },
                  error: (error) => {
                    console.error(
                      `Erreur lors du désabonnement forcé pour l'utilisateur ${userId}`,
                      error
                    );
                    // Continuer malgré l'erreur
                    resolve();
                  },
                });
            });
          } else {
            // Méthode alternative générique
            return this.forceServerUnsubscribe(token)
              .then(() => {
                console.log('Désabonnement serveur réussi');
                return;
              })
              .catch((error) => {
                console.error('Erreur lors du désabonnement serveur', error);
                // Continuer malgré l'erreur serveur
                return;
              });
          }
        }
        return Promise.resolve();
      })
      .then(() => {
        console.log('Désabonnement complet réussi');
        // Force le rechargement du service worker pour éviter les problèmes de persistance d'état
        if ('serviceWorker' in navigator) {
          console.log('Tentative de réinitialisation du service worker');
          return navigator.serviceWorker
            .getRegistrations()
            .then((registrations) => {
              const updatePromises = registrations.map((registration) => {
                return registration.update();
              });
              return Promise.all(updatePromises);
            })
            .then(() => {
              console.log('Mise à jour des service workers terminée');
              return;
            });
        }
        return Promise.resolve();
      })
      .catch((error) => {
        console.error('Erreur lors du désabonnement', error);
        return Promise.reject(error);
      })
      .finally(() => {
        // Assure que l'état est bien désactivé quoi qu'il arrive
        this._isSubscribed.next(false);
        this.saveNotificationPreference(false);
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
   * Vérifie si les notifications sont supportées par le navigateur
   */
  areNotificationsSupported(): boolean {
    return 'Notification' in window;
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
   * Vérifie d'abord le localStorage, puis l'état actuel
   */
  isCurrentlySubscribed(): boolean {
    // Pour éviter les redondances en cas d'appels multiples rapprochés
    const localValue = this._isSubscribed.value;

    // Si une vérification est en cours ou a été faite récemment, on utilise la valeur en mémoire
    if (localValue !== undefined) {
      // Lancer une vérification en arrière-plan pour une synchronisation future
      this.refreshSubscriptionStatus();
      return localValue;
    }

    try {
      const storedPrefs = localStorage.getItem(this.NOTIFICATION_PREF_KEY);
      if (storedPrefs) {
        const prefs = JSON.parse(storedPrefs);

        // Si l'utilisateur a explicitement désactivé les notifications
        if (
          Object.prototype.hasOwnProperty.call(prefs, 'isSubscribed') &&
          prefs.isSubscribed === false
        ) {
          console.log(
            'Notifications explicitement désactivées selon préférences stockées'
          );
          return false;
        }

        // Vérifier si les préférences stockées correspondent à l'état actuel de la permission
        if (prefs.isSubscribed && Notification.permission === 'granted') {
          // Lancer une vérification en arrière-plan pour une synchronisation future
          this.refreshSubscriptionStatus();
          return true;
        }
      }
    } catch (error) {
      console.error(
        'Erreur lors de la vérification des préférences stockées:',
        error
      );
    }

    // Si aucune préférence n'est stockée ou en cas d'erreur, utiliser l'état actuel
    // et déclencher une vérification en arrière-plan
    this.refreshSubscriptionStatus();
    return this._isSubscribed.value;
  }

  /**
   * Rafraîchit l'état d'abonnement côté serveur sans bloquer l'UI
   * Cette méthode est appelée en arrière-plan par isCurrentlySubscribed
   */
  private refreshSubscriptionStatus(): void {
    // Récupérer l'ID utilisateur et le token
    const token = localStorage.getItem(environment.TOKEN_KEY);
    let userId: number | null = null;

    try {
      const userData = localStorage.getItem(environment.USER_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        userId = user.id;
      }
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des données utilisateur:',
        error
      );
    }

    // Si nous avons un ID utilisateur et un token, vérifier l'état côté serveur
    if (userId && token && Notification.permission === 'granted') {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http
        .get<{ isSubscribed: boolean }>(
          `${this.apiUrl}/notifications/subscription-status/${userId}`,
          { headers }
        )
        .subscribe({
          next: (response) => {
            // Si l'état du serveur est différent de notre état local, mettre à jour
            if (response.isSubscribed !== this._isSubscribed.value) {
              console.log(
                "État d'abonnement mis à jour depuis le serveur:",
                response.isSubscribed
              );
              this._isSubscribed.next(response.isSubscribed);
              this.saveNotificationPreference(response.isSubscribed);
            }
          },
          error: (err) => {
            console.error(
              'Erreur lors de la vérification en arrière-plan:',
              err
            );
          },
        });
    }
  }

  /**
   * Réinitialise complètement l'état des notifications
   * Utile en cas de problème avec l'état persistant des notifications
   */
  resetNotificationState(): Promise<void> {
    console.log("Réinitialisation complète de l'état des notifications");

    // Supprimer les préférences stockées
    localStorage.removeItem(this.NOTIFICATION_PREF_KEY);

    // Réinitialiser l'état interne
    this._isSubscribed.next(false);

    // Désabonner du service worker si possible
    if ('serviceWorker' in navigator) {
      return new Promise<void>((resolve, reject) => {
        navigator.serviceWorker.ready
          .then((registration) => {
            return registration.pushManager.getSubscription();
          })
          .then((subscription) => {
            if (subscription) {
              console.log('Suppression de la souscription push');
              return subscription.unsubscribe();
            }
            return true;
          })
          .then(() => {
            console.log('Réinitialisation terminée');
            // Mettre à jour tous les service workers
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker
                .getRegistrations()
                .then((registrations) => {
                  console.log(
                    `Mise à jour de ${registrations.length} service workers`
                  );

                  // Créer des promesses pour chaque mise à jour
                  const promises = registrations.map((registration) => {
                    console.log(
                      `Mise à jour du service worker: ${registration.scope}`
                    );
                    return registration.update();
                  });

                  // Attendre que toutes les mises à jour soient terminées
                  Promise.all(promises)
                    .then(() => {
                      console.log(
                        'Toutes les mises à jour des service workers sont terminées'
                      );
                      resolve();
                    })
                    .catch((error) => {
                      console.warn(
                        'Certaines mises à jour de service workers ont échoué',
                        error
                      );
                      // On résout quand même car ce n'est pas critique
                      resolve();
                    });
                });
            } else {
              resolve();
            }
          })
          .catch((error) => {
            console.error('Erreur lors de la réinitialisation', error);
            reject(error);
          });
      });
    }

    return Promise.resolve();
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
    options: Partial<NotificationOptions> = {}
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

  /**
   * Vérifie et affiche l'état actuel du service worker et des notifications
   * Utile pour le débogage des problèmes de notifications
   */
  async checkServiceWorkerAndNotificationStatus(): Promise<unknown> {
    console.group('État complet du Service Worker et des notifications');

    // 1. Préférences stockées
    try {
      const storedPrefs = localStorage.getItem(this.NOTIFICATION_PREF_KEY);
      if (storedPrefs) {
        const prefs = JSON.parse(storedPrefs);
        console.log('1. Préférences stockées:', prefs);
      } else {
        console.log('1. Aucune préférence de notification stockée');
      }
    } catch (error) {
      console.error('1. Erreur lors de la lecture des préférences:', error);
    }

    // 2. État des permissions
    console.log(
      '2. Permission actuelle du navigateur:',
      Notification.permission
    );

    // 3. État de la variable interne
    console.log('3. État interne _isSubscribed:', this._isSubscribed.value);

    // 4. Service workers enregistrés
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(
          `4. Service workers enregistrés (${registrations.length}):`
        );
        for (const registration of registrations) {
          console.log('   - Scope:', registration.scope);
          console.log('   - État:', registration.active ? 'actif' : 'inactif');
          console.log(
            '   - Mise à jour en attente:',
            registration.waiting ? 'oui' : 'non'
          );
        }

        // 5. Abonnements push actifs
        const promises = registrations.map(async (registration) => {
          const subscription = await registration.pushManager.getSubscription();
          return { scope: registration.scope, subscription };
        });

        const subscriptions = await Promise.all(promises);
        console.log(
          '5. Abonnements push:',
          subscriptions.filter((s) => s.subscription).length
        );
        subscriptions.forEach((s) => {
          if (s.subscription) {
            console.log(`   - Scope: ${s.scope}`);
            console.log(`   - Endpoint: ${s.subscription.endpoint}`);
          }
        });
      } catch (error) {
        console.error(
          'Erreur lors de la vérification des service workers:',
          error
        );
      }
    } else {
      console.log('4 & 5. Service Worker non supporté par ce navigateur');
    }

    console.groupEnd();

    // Retourner un résumé de l'état
    return {
      browserPermission: Notification.permission,
      isSubscribedInternal: this._isSubscribed.value,
      hasStoredPreferences: !!localStorage.getItem(this.NOTIFICATION_PREF_KEY),
      browserSupportsNotifications: this.areNotificationsSupported(),
      browserSupportsServiceWorker: 'serviceWorker' in navigator,
    };
  }

  /**
   * Détecte si l'appareil est un mobile
   */
  private detectMobileDevice(): boolean {
    // Utilisation de window.navigator avec opérateur de chaînage optionnel
    const userAgent =
      navigator.userAgent ||
      navigator.vendor ||
      (window as unknown as { opera?: string }).opera ||
      '';

    // Détection par user agent
    const mobileRegex =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const isMobileByUA = mobileRegex.test(userAgent.toLowerCase());

    // Vérification alternative par taille d'écran
    const isMobileByScreen = window.innerWidth <= 768;

    console.log(
      'Push Notification Service - Détection mobile par User Agent:',
      isMobileByUA
    );
    console.log(
      "Push Notification Service - Détection mobile par taille d'écran:",
      isMobileByScreen
    );

    return isMobileByUA || isMobileByScreen;
  }
}
