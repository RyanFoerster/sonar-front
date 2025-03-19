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

  private setupAuthListener(): void {
    // S'abonner aux changements d'état d'authentification
    this.authService.getAuthState().subscribe((isAuthenticated: boolean) => {
      if (isAuthenticated) {
        // Si l'utilisateur est connecté, lui demander la permission pour les notifications
        this.promptNotificationPermission();
      }
    });
  }

  private promptNotificationPermission(): void {
    // Demander la permission après un court délai pour éviter de perturber l'expérience utilisateur immédiatement
    setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            this.initializeFirebaseMessaging();
          }
        });
      }
    }, 5000); // 5 secondes de délai
  }

  private initializeFirebaseMessaging(): void {
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
