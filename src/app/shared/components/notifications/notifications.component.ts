import { Component, inject, signal, HostListener } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucideUsers,
  lucideChevronRight,
  lucideX,
} from '@ng-icons/lucide';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import {
  NotificationService,
  Notification,
} from '../../services/notification.service';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { NotificationListComponent } from './notification-list.component';
import { CompteGroupeService } from '../../services/compte-groupe.service';
import { CompteGroupeEntity } from '../../entities/compte-groupe.entity';
import { map, forkJoin } from 'rxjs';

interface NotificationWithGroup extends Notification {
  group?: CompteGroupeEntity;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    DatePipe,
    NgClass,
    HlmIconComponent,
    HlmButtonDirective,
    NotificationListComponent,
  ],
  providers: [
    provideIcons({ lucideBell, lucideUsers, lucideChevronRight, lucideX }),
  ],
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent {
  private notificationService = inject(NotificationService);
  private groupService = inject(CompteGroupeService);
  protected showNotifications = signal(false);
  protected showAllNotificationsModal = signal(false);

  constructor() {
    // Charger les notifications initiales
    this.loadNotificationsWithGroups();

    // Rafraîchir les notifications toutes les 5 secondes
    setInterval(() => {
      this.loadNotificationsWithGroups();
    }, 5000);
  }

  private loadNotificationsWithGroups(): void {
    this.notificationService.loadNotifications();
    const currentNotifications = this.notificationService.notifications();

    // Pour chaque notification de type GROUP_INVITATION avec un groupId défini, récupérer les infos du groupe
    const groupRequests = currentNotifications
      .filter(
        (n: Notification) =>
          n.type === 'GROUP_INVITATION' &&
          n.groupId !== undefined &&
          n.groupId !== null
      )
      .map((notification: Notification) =>
        this.groupService
          .getGroupById(notification.groupId!)
          .pipe(
            map(
              (group) => ({ ...notification, group } as NotificationWithGroup)
            )
          )
      );

    if (groupRequests.length > 0) {
      forkJoin(groupRequests).subscribe((notificationsWithGroups) => {
        const updatedNotifications = currentNotifications.map(
          (notification) => {
            const withGroup = notificationsWithGroups.find(
              (n) => n.id === notification.id
            );
            return withGroup || notification;
          }
        );
        this.notificationService.notifications.set(updatedNotifications);
      });
    }
  }

  protected notifications() {
    return this.notificationService
      .notifications()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  protected unreadNotificationsCount() {
    return this.notifications().filter((n) => n.status === 'PENDING').length;
  }

  protected toggleNotifications(): void {
    this.showNotifications.update((value) => !value);
    if (this.showAllNotificationsModal()) {
      this.showAllNotificationsModal.set(false);
    }
  }

  protected openAllNotifications(): void {
    this.showAllNotificationsModal.set(true);
    this.showNotifications.set(false);
    // Empêcher le scroll du body quand la modale est ouverte
    document.body.style.overflow = 'hidden';
  }

  protected closeAllNotifications(): void {
    this.showAllNotificationsModal.set(false);
    // Réactiver le scroll du body
    document.body.style.overflow = 'auto';
  }

  protected respondToInvitation(notificationId: number, accept: boolean): void {
    this.notificationService
      .respondToInvitation(notificationId, accept)
      .subscribe({
        next: () => {
          // Rafraîchir les notifications après la réponse
          this.loadNotificationsWithGroups();
          // Fermer les modales
          this.showNotifications.set(false);
          this.showAllNotificationsModal.set(false);
          // Réactiver le scroll du body
          document.body.style.overflow = 'auto';
          // Déclencher l'événement de rafraîchissement des membres
          window.dispatchEvent(new CustomEvent('refreshGroupMembers'));
        },
        error: (error) => {
          console.error("Erreur lors de la réponse à l'invitation:", error);
        },
      });
  }

  // Fermer le dropdown quand on clique en dehors
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const notificationContainer = document.querySelector(
      '.notifications-container'
    );
    if (notificationContainer && !notificationContainer.contains(target)) {
      this.showNotifications.set(false);
    }
  }

  // Fermer la modale avec la touche Escape
  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.showAllNotificationsModal()) {
      this.closeAllNotifications();
    }
  }
}
