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
    console.log('Envoi de notification de test...');

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
      this.notificationForm.get('requireInteraction')?.value || true;
    const renotify = this.notificationForm.get('renotify')?.value || true;
    const silent = this.notificationForm.get('silent')?.value || false;
    const tag = this.notificationForm.get('tag')?.value || 'test-' + Date.now();

    const options: NotificationOptions = {
      body,
      icon,
      badge,
      requireInteraction,
      renotify,
      silent,
      tag,
      vibrate: [200, 100, 200], // Ajouter vibration pour capter l'attention
      timestamp: Date.now(),
      data: {
        url: window.location.href,
        id: Date.now().toString(),
      },
    };

    // On ajoute les actions toujours, elles seront ignorées si non supportées
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

    // Vérifier les permissions avant d'envoyer
    if (Notification.permission !== 'granted') {
      console.warn(
        'Permission de notification non accordée, demande en cours...'
      );
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          this.sendNotification(title, options);
        } else {
          console.error("Permission refusée par l'utilisateur");
          alert(
            'Les notifications ont été refusées par le navigateur. Veuillez les activer dans les paramètres.'
          );
        }
      });
    } else {
      this.sendNotification(title, options);
    }
  }

  private sendNotification(title: string, options: NotificationOptions) {
    console.log('Envoi de la notification avec options:', options);

    this.pushService
      .sendLocalTestNotification(title, options)
      .then(() => {
        console.log('Notification de test envoyée avec succès');
        // Tentative de notification de secours en cas de non-affichage
        setTimeout(() => {
          if (
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            try {
              // Copier les options et supprimer les propriétés non supportées
              const nativeOptions = { ...options };
              delete nativeOptions.actions;

              console.log('Tentative de notification de secours...');
              new Notification(title, nativeOptions);
            } catch (error) {
              console.error('Echec de la notification de secours:', error);
            }
          }
        }, 2000);
      })
      .catch((error) => {
        console.error(
          "Erreur lors de l'envoi de la notification de test",
          error
        );
        alert("Erreur lors de l'envoi de la notification: " + error.message);
      });
  }

  /**
   * S'abonne aux notifications push
   */
  subscribeToNotifications(): void {
    this.subscribingInProgress = true;
    this.subscriptionError = null;

    console.log("Début du processus d'abonnement aux notifications");

    // Vérifier si nous avons déjà un abonnement actif
    this.pushService
      .checkSubscriptionStatusAsync()
      .then((isSubscribed: boolean) => {
        if (isSubscribed) {
          console.log('Désabonnement nécessaire avant de se réabonner');
          // Désabonner d'abord pour éviter les problèmes de réabonnement
          return this.pushService
            .unsubscribeFromNotifications()
            .then(() => {
              console.log('Désabonnement réussi, pause avant réabonnement');
              // Attendre un court instant pour s'assurer que tout est bien nettoyé
              return new Promise<void>((resolve) => setTimeout(resolve, 1000));
            })
            .then(() => {
              console.log('Continuation avec la demande de permission');
              return this.requestNotificationPermission();
            });
        } else {
          // Directement demander la permission
          return this.requestNotificationPermission();
        }
      })
      .catch((error: Error) => {
        this.subscribingInProgress = false;
        this.subscriptionError = `Erreur lors de la préparation de l'abonnement: ${
          error.message || 'Erreur inconnue'
        }`;
        console.error("Erreur lors de la préparation de l'abonnement:", error);
      });
  }

  /**
   * Demande la permission pour les notifications
   */
  private requestNotificationPermission(): Promise<void> {
    console.log('Demande de permission pour les notifications');
    return Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log("Permission accordée, procédure d'abonnement");
        return this.proceedWithSubscription();
      } else {
        this.subscribingInProgress = false;
        this.notificationsBlocked = permission === 'denied';
        this.subscriptionError =
          "L'utilisateur a refusé la permission pour les notifications.";
        console.warn('Permission refusée:', permission);
        throw new Error('Permission refusée');
      }
    });
  }

  /**
   * Procède à l'abonnement après avoir obtenu la permission
   */
  private proceedWithSubscription(): Promise<void> {
    console.log("Démarrage de l'abonnement aux notifications");
    return new Promise<void>((resolve, reject) => {
      this.pushService.subscribeToNotifications().subscribe({
        next: (result) => {
          this.subscribingInProgress = false;
          console.log('Abonnement aux notifications réussi', result);
          resolve();
        },
        error: (error) => {
          this.subscribingInProgress = false;
          this.subscriptionError = `Erreur lors de l'abonnement: ${
            error.message || 'Erreur inconnue'
          }`;
          console.error("Erreur lors de l'abonnement aux notifications", error);
          reject(error);
        },
      });
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
