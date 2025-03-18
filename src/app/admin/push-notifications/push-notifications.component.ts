import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { PushNotificationService } from '../../services/push-notification.service';

@Component({
  selector: 'app-push-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HlmButtonDirective],
  templateUrl: './push-notifications.component.html',
  styleUrl: './push-notifications.component.css',
})
export class PushNotificationsComponent {
  private pushService: PushNotificationService = inject(
    PushNotificationService
  );
  private fb: FormBuilder = inject(FormBuilder);

  protected notificationForm: FormGroup;
  protected sendingNotification = false;
  protected notificationSent = false;
  protected errorMessage: string | null = null;

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
    });
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
        // Réinitialiser le formulaire
        this.notificationForm.reset({
          icon: 'assets/icons/SONAR-FAVICON.webp',
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

  sendTestNotification() {
    if (this.notificationForm.invalid) {
      return;
    }

    this.sendingNotification = true;
    this.notificationSent = false;
    this.errorMessage = null;

    const { title, body } = this.notificationForm.value;
    const options = {
      body,
      icon: this.notificationForm.value.icon,
      data: {
        url: this.notificationForm.value.url,
      },
    };

    this.pushService
      .sendLocalTestNotification(title, options)
      .then(() => {
        this.sendingNotification = false;
        this.notificationSent = true;
      })
      .catch((error) => {
        this.sendingNotification = false;
        this.errorMessage = `Erreur lors de l'envoi de la notification de test: ${
          error.message || 'Erreur inconnue'
        }`;
        console.error(
          "Erreur lors de l'envoi de la notification de test",
          error
        );
      });
  }
}
