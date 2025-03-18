import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { PushNotificationService } from '../../services/push-notification.service';
import { Observable } from 'rxjs';

// Définition de l'interface pour les options de notification
interface NotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  vibrate?: number[];
  timestamp?: number;
  tag?: string;
  requireInteraction?: boolean;
  renotify?: boolean;
  silent?: boolean;
  actions?: { action: string; title: string }[];
  data?: {
    url?: string;
    id?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

@Component({
  selector: 'app-push-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HlmButtonDirective],
  templateUrl: './push-notifications.component.html',
  styleUrl: './push-notifications.component.css',
})
export class PushNotificationsComponent implements OnInit {
  private pushService: PushNotificationService = inject(
    PushNotificationService
  );
  private fb: FormBuilder = inject(FormBuilder);

  protected notificationForm: FormGroup;
  protected sendingNotification = false;
  protected notificationSent = false;
  protected errorMessage: string | null = null;

  // États des notifications
  protected isSubscribed$: Observable<boolean>;
  protected notificationsSupported = false;
  protected notificationsBlocked = false;
  protected subscribingInProgress = false;
  protected subscriptionError: string | null = null;

  constructor() {
    this.notificationForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(50)]],
      body: ['', [Validators.required, Validators.maxLength(200)]],
      url: [
        '',
        Validators.pattern(
          /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
        ),
      ],
      icon: ['assets/icons/SONAR-FAVICON.webp'], // Icône par défaut
      badge: ['assets/icons/SONAR-FAVICON.webp'], // Badge par défaut
      requireInteraction: [true], // Garder la notification visible jusqu'à interaction
      renotify: [false], // Ne pas notifier à nouveau si même tag
      silent: [false], // Avec son par défaut
      tag: ['sonar-notification'], // Tag pour regrouper les notifications
    });

    // Obtenir l'observable pour l'état d'abonnement
    this.isSubscribed$ = this.pushService.isSubscribed$;
  }

  ngOnInit(): void {
    // Vérifier si les notifications sont supportées
    this.notificationsSupported =
      this.pushService.arePushNotificationsSupported();

    // Vérifier si les notifications sont bloquées
    this.notificationsBlocked = this.pushService.areNotificationsBlocked();
  }

  sendToAll() {
    if (this.notificationForm.invalid) {
      return;
    }

    this.sendingNotification = true;
    this.notificationSent = false;
    this.errorMessage = null;

    const notificationData = this.notificationForm.value;

    this.pushService.sendNotificationToAll(notificationData).subscribe({
      next: () => {
        this.sendingNotification = false;
        this.notificationSent = true;
        // Réinitialiser certains champs du formulaire
        this.notificationForm.patchValue({
          title: '',
          body: '',
          url: '',
        });
      },
      error: (error) => {
        this.sendingNotification = false;
        this.errorMessage = `Erreur lors de l'envoi de la notification: ${
          error.message || 'Erreur inconnue'
        }`;
        console.error("Erreur lors de l'envoi de la notification", error);
      },
    });
  }

  /**
   * Envoie une notification de test locale
   */
  sendTestNotification() {
    if (this.notificationForm.invalid) {
      return;
    }

    const title =
      this.notificationForm.get('title')?.value || 'Notification de test';
    const body =
      this.notificationForm.get('body')?.value ||
      'Ceci est une notification de test';
    const icon = 'assets/icons/SONAR-FAVICON.webp';
    const badge =
      this.notificationForm.get('badge')?.value ||
      'assets/icons/SONAR-FAVICON.webp';
    const requireInteraction =
      this.notificationForm.get('requireInteraction')?.value || false;
    const renotify = this.notificationForm.get('renotify')?.value || false;
    const silent = this.notificationForm.get('silent')?.value || false;
    const tag = this.notificationForm.get('tag')?.value || 'test';

    const options: NotificationOptions = {
      body,
      icon,
      badge,
      requireInteraction,
      renotify,
      silent,
      tag,
      data: {
        url: window.location.href,
      },
    };

    // On ajoute les actions seulement pour le service worker (seront ignorées en mode dev)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      options.actions = [
        {
          action: 'open',
          title: 'Ouvrir',
        },
        {
          action: 'close',
          title: 'Fermer',
        },
      ];
    }

    this.pushService
      .sendLocalTestNotification(title, options)
      .then(() => {
        console.log('Notification de test envoyée avec succès');
      })
      .catch((error) => {
        console.error(
          "Erreur lors de l'envoi de la notification de test",
          error
        );
      });
  }

  /**
   * S'abonne aux notifications push
   */
  subscribeToNotifications(): void {
    this.subscribingInProgress = true;
    this.subscriptionError = null;

    // Vérifier si la permission est déjà accordée
    if (Notification.permission === 'granted') {
      this.proceedWithSubscription();
    } else {
      // Demander la permission (cette étape est nécessaire avant d'utiliser swPush)
      Notification.requestPermission()
        .then((permission) => {
          if (permission === 'granted') {
            this.proceedWithSubscription();
          } else {
            this.subscribingInProgress = false;
            this.notificationsBlocked = permission === 'denied';
            this.subscriptionError =
              "L'utilisateur a refusé la permission pour les notifications.";
          }
        })
        .catch((error) => {
          this.subscribingInProgress = false;
          this.subscriptionError = `Erreur lors de la demande de permission: ${error.message}`;
          console.error('Erreur lors de la demande de permission', error);
        });
    }
  }

  /**
   * Procède à l'abonnement après avoir obtenu la permission
   */
  private proceedWithSubscription(): void {
    this.pushService.subscribeToNotifications().subscribe({
      next: (result) => {
        this.subscribingInProgress = false;
        // La mise à jour de isSubscribed est gérée par le service à travers l'observable
        console.log('Abonnement aux notifications réussi', result);
      },
      error: (error) => {
        this.subscribingInProgress = false;
        this.subscriptionError = `Erreur lors de l'abonnement: ${
          error.message || 'Erreur inconnue'
        }`;
        console.error("Erreur lors de l'abonnement aux notifications", error);
      },
    });
  }

  /**
   * Se désabonne des notifications push
   */
  unsubscribeFromNotifications(): void {
    this.subscribingInProgress = true;
    this.subscriptionError = null;

    this.pushService
      .unsubscribeFromNotifications()
      .then(() => {
        this.subscribingInProgress = false;
        // La mise à jour de isSubscribed est gérée par le service
      })
      .catch((error) => {
        this.subscribingInProgress = false;
        this.subscriptionError = `Erreur lors du désabonnement: ${
          error.message || 'Erreur inconnue'
        }`;
        console.error('Erreur lors du désabonnement', error);
      });
  }

  /**
   * Demande la permission pour les notifications (pour les cas où les notifications sont en état "default")
   */
  requestPermission(): void {
    Notification.requestPermission()
      .then((permission) => {
        this.notificationsBlocked = permission === 'denied';
        if (permission === 'granted') {
          // Si la permission est accordée, on peut s'abonner
          this.subscribeToNotifications();
        }
      })
      .catch((error) => {
        console.error('Erreur lors de la demande de permission', error);
      });
  }
}
