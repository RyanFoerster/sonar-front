import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseMessagingService } from '../../services/firebase-messaging.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface NotificationResponse {
  success: boolean;
  message?: string;
  results?: {
    success: boolean;
    messageId?: string;
    error?: string;
  }[];
}

@Component({
  selector: 'app-notification-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-manager.component.html',
  styleUrls: ['./notification-manager.component.css'],
})
export class NotificationManagerComponent implements OnInit {
  fcmToken: string | null = null;
  isSubscribed = false;
  showToken = false;
  testResult: { success: boolean; message: string } | null = null;

  constructor(
    private fcmService: FirebaseMessagingService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements du token FCM
    this.fcmService.fcmToken.subscribe((token) => {
      this.fcmToken = token;
      this.isSubscribed = !!token;
      console.log('Token FCM obtenu:', token);
    });

    // S'abonner aux notifications entrantes
    this.fcmService.receiveMessages().subscribe((message) => {
      if (message) {
        console.log('Notification reçue:', message);
      }
    });
  }

  requestPermission(): void {
    this.fcmService.requestPermission();
  }

  toggleShowToken(): void {
    this.showToken = !this.showToken;
  }

  copyTokenToClipboard(): void {
    if (this.fcmToken) {
      navigator.clipboard
        .writeText(this.fcmToken)
        .then(() => {
          console.log('Token copié dans le presse-papiers');
          this.testResult = {
            success: true,
            message: 'Token copié dans le presse-papiers',
          };
          setTimeout(() => (this.testResult = null), 3000);
        })
        .catch((err) => {
          console.error('Erreur lors de la copie du token:', err);
          this.testResult = {
            success: false,
            message: 'Erreur lors de la copie: ' + err.message,
          };
        });
    }
  }

  regenerateToken(): void {
    // Force le token à null d'abord
    this.fcmService.clearToken();

    // Attendez un peu avant de demander un nouveau token
    setTimeout(() => {
      this.testResult = {
        success: true,
        message: "Demande d'un nouveau token...",
      };
      this.fcmService.requestPermission().subscribe(
        (token) => {
          if (token) {
            this.testResult = {
              success: true,
              message: 'Nouveau token généré avec succès!',
            };
            setTimeout(() => (this.testResult = null), 3000);
          } else {
            this.testResult = {
              success: false,
              message: 'Échec de génération du nouveau token',
            };
          }
        },
        (error) => {
          this.testResult = { success: false, message: 'Erreur: ' + error };
        }
      );
    }, 1000);
  }

  testNotification(): void {
    if (!this.fcmToken) {
      this.testResult = {
        success: false,
        message: 'Aucun token FCM disponible',
      };
      return;
    }

    this.testResult = { success: true, message: 'Envoi en cours...' };

    // Utiliser l'API backend pour envoyer une notification de test
    const token = localStorage.getItem(environment.TOKEN_KEY);

    if (!token) {
      this.testResult = { success: false, message: 'Vous devez être connecté' };
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http
      .post<NotificationResponse>(
        `${environment.API_URL}/notifications/test-notification`,
        {
          title: 'Test de notification',
          body: "Ceci est un test de notification depuis l'application",
          data: { url: '/notifications' },
        },
        { headers }
      )
      .subscribe({
        next: (response) => {
          console.log('Notification test envoyée:', response);
          this.testResult = {
            success: true,
            message: 'Notification envoyée avec succès!',
          };
          setTimeout(() => (this.testResult = null), 3000);
        },
        error: (error) => {
          console.error(
            "Erreur lors de l'envoi de la notification test:",
            error
          );
          this.testResult = {
            success: false,
            message: `Erreur: ${error.status} ${
              error.statusText || error.message || 'Inconnue'
            }`,
          };
        },
      });
  }
}
