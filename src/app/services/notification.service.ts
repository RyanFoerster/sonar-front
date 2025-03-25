import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { io, Socket } from 'socket.io-client';

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface NotificationResponse {
  items: Notification[];
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiUrl = `${environment.API_URL}/notifications`;
  private socket: Socket | null = null;
  private userId: number | null = null;
  private isSocketInitializing = false;
  private isSocketConnected = false;

  // Sujets observables pour les notifications
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private notificationSoundSubject = new BehaviorSubject<boolean>(true);
  public notificationSound$ = this.notificationSoundSubject.asObservable();

  private newNotificationSubject = new Subject<Notification>();
  public newNotification$ = this.newNotificationSubject.asObservable();

  private socketStateSubject = new BehaviorSubject<boolean>(false);
  public socketState$ = this.socketStateSubject.asObservable();

  // Audio pour les notifications
  private notificationSound: HTMLAudioElement | null = null;

  constructor(private http: HttpClient) {
    // Charger le son de notification
    this.initNotificationSound();

    // Charger les préférences de son des notifications
    this.loadSoundPreference();

    // Récupérer l'ID utilisateur du localStorage
    this.loadUserData();

    // Initialiser le socket si l'utilisateur est connecté
    if (this.userId) {
      this.initSocket();
    }
  }

  /**
   * Initialise le son de notification
   */
  private initNotificationSound(): void {
    try {
      // Essayer d'abord avec un son local
      this.notificationSound = new Audio('/assets/sounds/notification.mp3');

      // En cas d'erreur, utiliser un son par défaut en ligne
      this.notificationSound.onerror = () => {
        console.warn(
          "Son de notification local non trouvé, utilisation d'une alternative en ligne"
        );
        this.notificationSound = new Audio(
          'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-alert-232.mp3'
        );
        this.notificationSound.volume = 0.5;
      };

      this.notificationSound.volume = 0.5; // Volume à 50%
    } catch (error) {
      console.error(
        "Erreur lors de l'initialisation du son de notification",
        error
      );
    }
  }

  /**
   * Charge les préférences de son des notifications
   */
  private loadSoundPreference(): void {
    const soundEnabled = localStorage.getItem('notification_sound');
    if (soundEnabled !== null) {
      this.notificationSoundSubject.next(soundEnabled === 'true');
    }
  }

  /**
   * Active ou désactive le son des notifications
   */
  public toggleNotificationSound(enabled: boolean): void {
    this.notificationSoundSubject.next(enabled);
    localStorage.setItem('notification_sound', enabled.toString());
  }

  /**
   * Charge les données utilisateur depuis le localStorage
   */
  public loadUserData(): void {
    try {
      const userData = localStorage.getItem(environment.USER_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        this.userId = user.id;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur', error);
    }
  }

  /**
   * Initialise la connexion WebSocket
   */
  initSocket(): void {
    // Éviter les initialisations multiples simultanées
    if (this.isSocketInitializing || this.isSocketConnected) {
      console.log(
        "Socket déjà en cours d'initialisation ou connecté, initialisation ignorée"
      );
      return;
    }

    this.isSocketInitializing = true;

    // Mettre à jour l'ID utilisateur depuis le localStorage
    this.loadUserData();

    if (!this.userId) {
      this.isSocketInitializing = false;
      console.log(
        'Aucun utilisateur connecté, initialisation du socket annulée'
      );
      return;
    }

    // Fermer toute connexion existante pour éviter les doublons
    if (this.socket) {
      console.log('Fermeture de la connexion WebSocket existante');
      this.socket.disconnect();
      this.socket = null;
      this.socketStateSubject.next(false);
      this.isSocketConnected = false;
    }

    console.log('Initialisation de la connexion WebSocket...');
    this.socket = io(environment.API_URL, {
      transports: ['websocket'],
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // Éviter les connexions multiples
      multiplex: false,
    });

    // Logs de débogage
    this.socket.on('connect', () => {
      console.log('WebSocket connecté avec ID:', this.socket?.id);
      this.isSocketConnected = true;
      this.socketStateSubject.next(true);

      // Joindre la room spécifique à l'utilisateur après un court délai
      // pour s'assurer que la connexion est bien établie
      setTimeout(() => {
        if (this.socket?.connected) {
          console.log(`Tentative de rejoindre la room user-${this.userId}`);
          this.socket?.emit('join', `user-${this.userId}`);
        }
        this.isSocketInitializing = false;
      }, 500);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket déconnecté');
      this.isSocketConnected = false;
      this.socketStateSubject.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erreur de connexion WebSocket:', error);
      this.isSocketInitializing = false;
      this.isSocketConnected = false;
      this.socketStateSubject.next(false);
    });

    // Écouter les nouvelles notifications
    this.socket.on('notification_created', (notification: Notification) => {
      console.log('Notification reçue:', notification);
      this.handleNewNotification(notification);
    });

    // Écouter les mises à jour de notifications
    this.socket.on('notification_updated', (notification: Notification) => {
      this.handleUpdatedNotification(notification);
    });

    // Écouter les suppressions de notifications
    this.socket.on('notification_deleted', (data: { id: number }) => {
      this.handleDeletedNotification(data.id);
    });
  }

  /**
   * Gère la réception d'une nouvelle notification
   */
  private handleNewNotification(notification: Notification): void {
    // Mettre à jour la liste des notifications
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...currentNotifications]);

    // Mettre à jour le compteur de notifications non lues
    if (!notification.isRead) {
      this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    }

    // Émettre l'événement de nouvelle notification pour le toast
    this.newNotificationSubject.next(notification);

    // Jouer le son si activé
    this.playNotificationSound();
  }

  /**
   * Gère la mise à jour d'une notification
   */
  private handleUpdatedNotification(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;
    const index = currentNotifications.findIndex(
      (n) => n.id === notification.id
    );

    if (index !== -1) {
      // Si la notification est passée de non lue à lue, mettre à jour le compteur
      if (!currentNotifications[index].isRead && notification.isRead) {
        this.unreadCountSubject.next(
          Math.max(0, this.unreadCountSubject.value - 1)
        );
      } else if (currentNotifications[index].isRead && !notification.isRead) {
        this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
      }

      // Mettre à jour la notification dans la liste
      const updatedNotifications = [...currentNotifications];
      updatedNotifications[index] = notification;
      this.notificationsSubject.next(updatedNotifications);
    }
  }

  /**
   * Gère la suppression d'une notification
   */
  private handleDeletedNotification(id: number): void {
    const currentNotifications = this.notificationsSubject.value;
    const notification = currentNotifications.find((n) => n.id === id);

    // Mettre à jour le compteur si la notification supprimée était non lue
    if (notification && !notification.isRead) {
      this.unreadCountSubject.next(
        Math.max(0, this.unreadCountSubject.value - 1)
      );
    }

    // Filtrer la notification supprimée
    this.notificationsSubject.next(
      currentNotifications.filter((n) => n.id !== id)
    );
  }

  /**
   * Joue le son de notification si activé
   */
  private playNotificationSound(): void {
    if (this.notificationSoundSubject.value && this.notificationSound) {
      // Réinitialiser le son s'il est déjà en cours de lecture
      this.notificationSound.pause();
      this.notificationSound.currentTime = 0;

      // Jouer le son
      this.notificationSound.play().catch((err) => {
        console.warn('Impossible de jouer le son de notification', err);
      });
    }
  }

  /**
   * Récupère les notifications d'un utilisateur avec pagination
   */
  getNotifications(page = 1, limit = 10): Observable<NotificationResponse> {
    if (!this.userId) {
      throw new Error('Utilisateur non connecté');
    }

    return this.http
      .get<NotificationResponse>(
        `${this.apiUrl}/${this.userId}?page=${page}&limit=${limit}`
      )
      .pipe(
        tap((response) => {
          // Mise à jour de l'état local uniquement à la première page
          if (page === 1) {
            this.notificationsSubject.next(response.items);
          } else {
            // Ajouter les nouvelles notifications à la liste existante pour le scroll infini
            const currentNotifications = this.notificationsSubject.value;
            this.notificationsSubject.next([
              ...currentNotifications,
              ...response.items,
            ]);
          }
        })
      );
  }

  /**
   * Récupère le nombre de notifications non lues
   */
  getUnreadCount(): Observable<number> {
    if (!this.userId) {
      throw new Error('Utilisateur non connecté');
    }

    return this.http
      .get<number>(`${this.apiUrl}/${this.userId}/unread-count`)
      .pipe(
        tap((count) => {
          this.unreadCountSubject.next(count);
        })
      );
  }

  /**
   * Marque une notification comme lue
   */
  markAsRead(id: number, isRead = true): Observable<Notification> {
    return this.http
      .patch<Notification>(`${this.apiUrl}/${id}/read`, { isRead })
      .pipe(
        tap((notification) => {
          this.handleUpdatedNotification(notification);
        })
      );
  }

  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead(): Observable<void> {
    if (!this.userId) {
      throw new Error('Utilisateur non connecté');
    }

    const requests: Observable<Notification>[] = [];
    const unreadNotifications = this.notificationsSubject.value.filter(
      (n) => !n.isRead
    );

    // Créer des requêtes pour marquer chaque notification comme lue
    for (const notification of unreadNotifications) {
      requests.push(this.markAsRead(notification.id));
    }

    // Si aucune notification non lue, renvoyer un Observable complété
    if (requests.length === 0) {
      return new Observable((observer) => {
        observer.next();
        observer.complete();
      });
    }

    // Exécuter toutes les requêtes en parallèle
    return new Observable((observer) => {
      Promise.all(requests.map((req) => req.toPromise()))
        .then(() => {
          // Mettre à jour toutes les notifications comme lues
          const notifications = this.notificationsSubject.value.map((n) => ({
            ...n,
            isRead: true,
          }));
          this.notificationsSubject.next(notifications);

          // Réinitialiser le compteur de notifications non lues
          this.unreadCountSubject.next(0);

          observer.next();
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  /**
   * Supprime une notification
   */
  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.handleDeletedNotification(id);
      })
    );
  }

  /**
   * Filtre les notifications par statut (lues, non lues, toutes)
   */
  filterNotifications(filter: 'all' | 'read' | 'unread'): void {
    this.getNotifications().subscribe(() => {
      const allNotifications = this.notificationsSubject.value;

      switch (filter) {
        case 'read':
          this.notificationsSubject.next(
            allNotifications.filter((n) => n.isRead)
          );
          break;
        case 'unread':
          this.notificationsSubject.next(
            allNotifications.filter((n) => !n.isRead)
          );
          break;
        case 'all':
        default:
          // Déjà toutes les notifications, ne rien faire
          break;
      }
    });
  }

  /**
   * Crée et envoie une notification toast temporaire
   * N'est pas stockée en base de données, uniquement affichée en toast
   */
  showToast(
    type: string,
    title: string,
    message: string,
    data?: Record<string, unknown>
  ): void {
    const temporaryNotification: Notification = {
      id: -Date.now(), // ID négatif pour indiquer une notification temporaire
      userId: this.userId || 0,
      type,
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
      data,
    };

    // Émettre l'événement de nouvelle notification pour le toast
    this.newNotificationSubject.next(temporaryNotification);

    // Jouer le son si activé
    this.playNotificationSound();
  }

  /**
   * Vérifie si le socket est actuellement connecté
   */
  isConnected(): boolean {
    return this.isSocketConnected;
  }

  /**
   * Déconnecte le socket WebSocket
   */
  disconnectSocket(): void {
    if (!this.socket) {
      return;
    }

    console.log('Déconnexion du WebSocket...');

    // Si le socket est dans une room utilisateur, quitter cette room
    if (this.userId && this.socket.connected) {
      console.log(`Tentative de quitter la room user-${this.userId}`);
      this.socket.emit('leave', `user-${this.userId}`);
    }

    // Petit délai pour s'assurer que le message 'leave' est envoyé avant déconnexion
    setTimeout(() => {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
        console.log('WebSocket déconnecté avec succès');
      }

      // Réinitialiser les états
      this.userId = null;
      this.notificationsSubject.next([]);
      this.unreadCountSubject.next(0);
      this.isSocketConnected = false;
      this.isSocketInitializing = false;
      this.socketStateSubject.next(false);
    }, 300);
  }
}
