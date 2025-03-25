import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Notification,
  NotificationService,
} from '../../services/notification.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { provideIcons } from '@spartan-ng/ui-icon-helm';
import {
  lucideCheck,
  lucideX,
  lucideBellRing,
  lucideAlertCircle,
  lucideMessageSquare,
  lucideCreditCard,
} from '@ng-icons/lucide';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule, HlmIconComponent],
  providers: [
    provideIcons({
      lucideCheck,
      lucideX,
      lucideBellRing,
      lucideAlertCircle,
      lucideMessageSquare,
      lucideCreditCard,
    }),
  ],
  template: `
    <div class="toast-container" [class.hide-all]="toasts.length === 0">
      <div
        *ngFor="let toast of toasts"
        [@toastAnimation]="toast.visible ? 'show' : 'hide'"
        class="toast"
        [ngClass]="getToastClass(toast.notification)"
      >
        <div class="toast-header">
          <hlm-icon
            [name]="getIconForType(toast.notification.type)"
            size="18"
          ></hlm-icon>
          <span class="toast-title">{{ toast.notification.title }}</span>
          <button class="toast-close" (click)="dismissToast(toast.id)">
            <hlm-icon name="lucideX" size="14"></hlm-icon>
          </button>
        </div>
        <div class="toast-body">
          <p class="toast-message">{{ toast.notification.message }}</p>

          <!-- Affichage de la communication pour les transactions -->
          <p
            *ngIf="
              toast.notification.type === 'transaction' &&
              toast.notification.data &&
              toast.notification.data['communication']
            "
            class="toast-communication"
          >
            "{{ toast.notification.data['communication'] }}"
          </p>

          <span class="toast-time">{{
            getRelativeTime(toast.notification.createdAt)
          }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 350px;
        width: 100%;
      }

      .toast-container.hide-all {
        display: none;
      }

      .toast {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        width: 100%;
        border-left: 4px solid #007bff;
      }

      .toast-header {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background-color: rgba(0, 0, 0, 0.03);
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      }

      .toast-title {
        flex: 1;
        margin-left: 10px;
        font-weight: 600;
        font-size: 14px;
      }

      .toast-close {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: #6c757d;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .toast-close:hover {
        background-color: rgba(0, 0, 0, 0.05);
        color: #333;
      }

      .toast-body {
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
      }

      .toast-message {
        margin: 0 0 6px 0;
        font-size: 13px;
        color: #333;
        line-height: 1.4;
      }

      .toast-communication {
        margin: 0 0 8px 0;
        font-size: 12px;
        color: #666;
        font-style: italic;
        background-color: rgba(0, 0, 0, 0.03);
        padding: 6px 8px;
        border-radius: 4px;
        border-left: 2px solid #0070c9;
      }

      .toast-time {
        font-size: 11px;
        color: #6c757d;
        align-self: flex-end;
      }

      /* Types de notifications */
      .toast.info {
        border-left-color: #007bff;
      }

      .toast.alert {
        border-left-color: #dc3545;
      }

      .toast.message {
        border-left-color: #28a745;
      }

      .toast.transaction {
        border-left-color: #0070c9;
      }
    `,
  ],
  animations: [
    trigger('toastAnimation', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'translateY(20px) scale(0.8)',
          height: 0,
          margin: 0,
          padding: 0,
        })
      ),
      state(
        'show',
        style({
          opacity: 1,
          transform: 'translateY(0) scale(1)',
          height: '*',
        })
      ),
      state(
        'hide',
        style({
          opacity: 0,
          transform: 'translateX(100%)',
          height: 0,
          margin: 0,
          padding: 0,
        })
      ),
      transition('void => show', [
        style({
          opacity: 0,
          transform: 'translateY(20px) scale(0.8)',
          height: '*',
          margin: '*',
          padding: '*',
        }),
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
      ]),
      transition('show => hide', [
        animate('250ms cubic-bezier(0.4, 0.0, 0.2, 1)'),
      ]),
    ]),
  ],
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  toasts: {
    id: number;
    notification: Notification;
    visible: boolean;
    timeoutId?: ReturnType<typeof setTimeout>;
  }[] = [];
  private destroy$ = new Subject<void>();
  private toastCounter = 0;

  @Input() displayDuration = 5000; // Durée d'affichage en millisecondes (5 secondes par défaut)

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // S'abonner aux nouvelles notifications
    this.notificationService.newNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        this.showToast(notification);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Nettoyer tous les timeouts en cours
    this.toasts.forEach((toast) => {
      if (toast.timeoutId) {
        clearTimeout(toast.timeoutId);
      }
    });
  }

  /**
   * Affiche un toast pour une notification
   */
  showToast(notification: Notification): void {
    const id = ++this.toastCounter;
    const toast = {
      id,
      notification,
      visible: true,
      timeoutId: undefined as unknown as ReturnType<typeof setTimeout>,
    };

    // Ajouter le toast à la liste
    this.toasts = [toast, ...this.toasts].slice(0, 5); // Limiter à 5 toasts max

    // Configurer le timeout pour masquer le toast après la durée spécifiée
    toast.timeoutId = setTimeout(() => {
      this.dismissToast(id);
    }, this.displayDuration);
  }

  /**
   * Ferme un toast spécifique
   */
  dismissToast(id: number): void {
    const index = this.toasts.findIndex((t) => t.id === id);
    if (index !== -1) {
      // Annuler le timeout si existant
      if (this.toasts[index].timeoutId) {
        clearTimeout(this.toasts[index].timeoutId);
      }

      // Marquer comme invisible pour l'animation
      this.toasts[index].visible = false;

      // Supprimer après la fin de l'animation
      setTimeout(() => {
        this.toasts = this.toasts.filter((t) => t.id !== id);
      }, 300);
    }
  }

  /**
   * Récupère la classe CSS en fonction du type de notification
   */
  getToastClass(notification: Notification): string {
    return notification.type || 'info';
  }

  /**
   * Récupère l'icône en fonction du type de notification
   */
  getIconForType(type: string): string {
    switch (type) {
      case 'info':
        return 'lucideAlertCircle';
      case 'alert':
        return 'lucideBellRing';
      case 'message':
        return 'lucideMessageSquare';
      case 'transaction':
        return 'lucideCreditCard';
      default:
        return 'lucideBellRing';
    }
  }

  /**
   * Formate la date relative (ex: "il y a 5 min")
   */
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return "À l'instant";
    } else if (diffMin < 60) {
      return `Il y a ${diffMin} min`;
    } else if (diffHour < 24) {
      return `Il y a ${diffHour} h`;
    } else if (diffDay < 7) {
      return `Il y a ${diffDay} j`;
    } else {
      return date.toLocaleDateString();
    }
  }
}
