import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SwPush } from '@angular/service-worker';
import { FirebaseMessagingService } from './services/firebase-messaging.service';
import { AuthService } from './shared/services/auth.service';

import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
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

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .subscribe((event: any) => {
        this.isIndexRoute = event.url === '/';
      });
  }

  ngOnInit(): void {
    // Vérifier si les notifications sont désactivées explicitement dans le localStorage
    const notificationsDisabled = this.areNotificationsDisabledInLocalStorage();

    // Ne pas initialiser les notifications si elles ont été explicitement désactivées
    if (notificationsDisabled) {
      console.log(
        'Notifications explicitement désactivées dans localStorage, initialisation ignorée'
      );
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
          console.log(
            'Notifications explicitement désactivées selon préférences stockées'
          );
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
        // Vérifier si les notifications sont désactivées explicitement avant de continuer
        if (this.areNotificationsDisabledInLocalStorage()) {
          console.log(
            'Notifications explicitement désactivées, demande de permission ignorée'
          );
          return;
        }

        // Si l'utilisateur est connecté, lui demander la permission pour les notifications
        // Initialiser immédiatement pour que ça fonctionne dès la connexion
        if ('Notification' in window && Notification.permission === 'granted') {
          this.initializeFirebaseMessaging();
        } else {
          this.promptNotificationPermission();
        }
      }
    });
  }

  private promptNotificationPermission(): void {
    // Vérifier une dernière fois si les notifications sont désactivées
    if (this.areNotificationsDisabledInLocalStorage()) {
      console.log(
        'Notifications explicitement désactivées, demande de permission annulée'
      );
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
      console.log(
        'Notifications explicitement désactivées, initialisation Firebase annulée'
      );
      return;
    }

    // Demander le token FCM et l'enregistrer
    this.firebaseMessagingService.requestPermission().subscribe((token) => {
      if (token) {
        console.log('Token FCM automatiquement enregistré:', token);
      }
    });

    // S'abonner aux messages entrants
    this.firebaseMessagingService.receiveMessages().subscribe((message) => {
      if (message) {
        console.log('Notification reçue en arrière-plan:', message);
      }
    });
  }
}
