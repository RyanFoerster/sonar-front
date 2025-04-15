import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SwPush, SwUpdate } from '@angular/service-worker';
import { FirebaseMessagingService } from './services/firebase-messaging.service';
import { AuthService } from './shared/services/auth.service';
import { NotificationService } from './services/notification.service';

import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { NotificationToastComponent } from './components/notification-toast/notification-toast.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    NotificationToastComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Sonar-front';
  isIndexRoute = false;
  maintenanceMode = environment.MAINTENANCE_MODE;

  private swPush = inject(SwPush);
  private firebaseMessagingService = inject(FirebaseMessagingService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private swUpdate = inject(SwUpdate);

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .subscribe((event: any) => {
        this.isIndexRoute = event.url === '/';
      });
  }

  ngOnInit(): void {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') {
          console.log('Nouvelle version prête à être activée.');
          this.swUpdate.activateUpdate().then(() => {
            console.log('Nouvelle version activée. Rechargement...');
            window.location.reload();
          });
        }
      });

      // Vérifier les mises à jour au démarrage
      this.swUpdate
        .checkForUpdate()
        .then((updateFound) => {
          if (updateFound) {
            console.log(
              'Mise à jour trouvée lors de la vérification initiale.'
            );
          } else {
            console.log(
              'Aucune mise à jour trouvée lors de la vérification initiale.'
            );
          }
        })
        .catch((err) => {
          console.error(
            'Erreur lors de la vérification des mises à jour:',
            err
          );
        });
    }

    // Vérifier si les notifications sont désactivées explicitement dans le localStorage
    const notificationsDisabled = this.areNotificationsDisabledInLocalStorage();

    // Ne pas initialiser les notifications si elles ont été explicitement désactivées
    if (notificationsDisabled) {
      // console.log(
      //   'Notifications explicitement désactivées dans localStorage, initialisation ignorée'
      // );
      return;
    }

    // Vérifier si les notifications sont déjà autorisées par le navigateur
    if (
      'Notification' in window &&
      Notification.permission === 'granted' &&
      this.authService.isAuthenticated()
    ) {
      this.initializeFirebaseMessaging();
    } else if (
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      // Si on n'a pas encore demandé la permission, écouter les événements d'authentification
      this.setupAuthListener();
    }
  }

  // Vérifie si les notifications ont été explicitement désactivées par l'utilisateur
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
          //   'Notifications explicitement désactivées selon préférences stockées'
          // );
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error(
        'Erreur lors de la vérification des préférences stockées:',
        error
      );
      return false;
    }
  }

  private setupAuthListener(): void {
    // S'abonner aux changements d'état d'authentification
    this.authService.getAuthState().subscribe((isAuthenticated: boolean) => {
      if (isAuthenticated) {
        // Initialiser la connexion WebSocket pour les notifications une seule fois
        console.log(
          'Authentification détectée, initialisation des services de notification'
        );

        // Vérifier que le WebSocket n'est pas déjà connecté avant d'initialiser
        if (!this.notificationService.isConnected()) {
          console.log('Initialisation du WebSocket pour les notifications');
          this.notificationService.initSocket();
        } else {
          console.log('WebSocket déjà connecté, initialisation ignorée');
        }

        // Vérifier si les notifications sont désactivées explicitement avant de continuer
        if (this.areNotificationsDisabledInLocalStorage()) {
          console.log(
            'Notifications push explicitement désactivées, demande de permission ignorée'
          );
          return;
        }

        // Si l'utilisateur est connecté et les notifications sont autorisées
        if ('Notification' in window && Notification.permission === 'granted') {
          console.log(
            'Permissions notifications déjà accordées, initialisation Firebase Messaging'
          );
          this.initializeFirebaseMessaging();
        } else if (
          'Notification' in window &&
          Notification.permission === 'default'
        ) {
          // Demander la permission avec un délai pour ne pas surcharger l'interface utilisateur
          console.log('Demande de permission pour les notifications...');
          this.promptNotificationPermission();
        }
      } else {
        // Si l'utilisateur est déconnecté, s'assurer que les services de notification sont déconnectés
        console.log(
          'Déconnexion détectée, nettoyage des services de notification'
        );
        this.notificationService.disconnectSocket();
        this.firebaseMessagingService.disconnectMessaging();
      }
    });
  }

  private promptNotificationPermission(): void {
    // Vérifier une dernière fois si les notifications sont désactivées
    if (this.areNotificationsDisabledInLocalStorage()) {
      // console.log(
      //   'Notifications explicitement désactivées, demande de permission annulée'
      // );
      return;
    }

    // Demander la permission avec un délai réduit pour une meilleure réactivité
    setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            this.initializeFirebaseMessaging();
          }
        });
      }
    }, 1000); // Délai réduit à 1 seconde pour une initialisation plus rapide
  }

  private initializeFirebaseMessaging(): void {
    // Vérifier une dernière fois si les notifications sont désactivées
    if (this.areNotificationsDisabledInLocalStorage()) {
      // console.log(
      //   'Notifications explicitement désactivées, initialisation Firebase annulée'
      // );
      return;
    }

    // Demander le token FCM et l'enregistrer
    this.firebaseMessagingService.requestPermission().subscribe((token) => {
      if (token) {
        // console.log('Token FCM automatiquement enregistré:', token);
      }
    });

    // S'abonner aux messages entrants
    this.firebaseMessagingService.receiveMessages().subscribe((message) => {
      if (message) {
        // console.log('Notification reçue en arrière-plan:', message);
      }
    });
  }
}
