import {
  Component,
  ElementRef, HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Notification,
  NotificationService,
} from '../../services/notification.service';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  X,
  VolumeX,
  Volume2,
} from 'lucide-angular';

import { provideIcons } from '@spartan-ng/ui-icon-helm';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import {
  lucideBell,
  lucideBellRing,
  lucideCheck,
  lucideCheckCheck,
  lucideTrash2,
  lucideX,
} from '@ng-icons/lucide';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-notification-manager',
  standalone: true,
  imports: [CommonModule, HlmIconComponent],
  providers: [
    provideIcons({
      lucideBell,
      lucideTrash2,
      lucideCheck,
      lucideX,
      lucideCheckCheck,
      lucideBellRing,
    }),
  ],
  templateUrl: './notification-manager.component.html',
  styleUrls: ['./notification-manager.component.css'],
})
export class NotificationManagerComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  isOpen = false;
  isLoading = false;
  currentPage = 1;
  totalPages = 1;
  pageSize = 10;
  totalNotifications = 0;
  notificationSound = true;
  currentFilter: 'all' | 'read' | 'unread' = 'unread';

  @ViewChild('notificationList') notificationList?: ElementRef;

  private destroy$ = new Subject<void>();
  private scrollSubscription?: Subscription;
  private intersectionObserver?: IntersectionObserver;


  @ViewChild('loadMoreTrigger') loadMoreTrigger?: ElementRef;

  // Icônes
  bellIcon = Bell;
  bellOffIcon = BellOff;
  checkIcon = Check;
  checkAllIcon = CheckCheck;
  trashIcon = Trash2;
  closeIcon = X;
  soundOffIcon = VolumeX;
  soundOnIcon = Volume2;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private authService: AuthService,
    private eRef: ElementRef,
  ) {}

  ngOnInit(): void {

    // S'abonner aux nouveaux événements de notification pour la mise à jour en temps réel
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        this.notifications = notifications;
      });

    // S'abonner au compteur de notifications non lues
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.unreadCount = count;
      });

    // S'abonner aux préférences de son des notifications
    this.notificationService.notificationSound$
      .pipe(takeUntil(this.destroy$))
      .subscribe((enabled) => {
        this.notificationSound = enabled;
      });

    // S'abonner aux nouvelles notifications
    this.notificationService.newNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Animer le badge de notification
        setTimeout(() => {
          const elements = document.getElementsByClassName('notification-bell');
          if (elements.length > 0) {
            elements[0].classList.add('new-notification');
            setTimeout(() => {
              elements[0].classList.remove('new-notification');
            }, 1000);
          }
        }, 100);
      });

    // Vérifier si l'utilisateur est authentifié avant de charger les notifications
    this.authService
      .getAuthState()
      .pipe(
        takeUntil(this.destroy$),
        filter((isAuthenticated) => isAuthenticated) // Ne continue que si l'utilisateur est authentifié
      )
      .subscribe(() => {
        // Charger les notifications initiales
        this.loadNotifications();

        // Charger le compteur de notifications non lues
        this.loadUnreadCount();

        // Initialiser l'observateur d'intersection pour le scroll infini
        this.setupIntersectionObserver();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  /**
   * Charge les notifications avec pagination
   */
  loadNotifications(page = 1): void {
    if (this.isLoading) return;

    this.isLoading = true;
    this.notificationService
      .getNotifications(page, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.totalNotifications = response.total;
          this.totalPages = Math.ceil(response.total / this.pageSize);
          this.currentPage = page;

          // Si c'est la première page, filtrer selon le filtre actuel
          if (page === 1 && this.currentFilter !== 'all') {
            this.applyFilter(this.currentFilter);
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des notifications', error);
          this.isLoading = false;
        },
      });
  }

  /**
   * Charge le compteur de notifications non lues
   */
  loadUnreadCount(): void {
    this.notificationService
      .getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => {
          console.error(
            'Erreur lors du chargement du compteur de notifications',
            error
          );
        },
      });
  }

  /**
   * Configure l'observateur d'intersection pour le scroll infini
   */
  setupIntersectionObserver(): void {
    if (!this.loadMoreTrigger) return;

    // Créer l'observateur d'intersection
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          this.currentPage < this.totalPages &&
          !this.isLoading
        ) {
          this.loadNextPage();
        }
      },
      { threshold: 0.1 }
    );

    // Observer l'élément déclencheur
    setTimeout(() => {
      if (this.loadMoreTrigger && this.intersectionObserver) {
        this.intersectionObserver.observe(this.loadMoreTrigger.nativeElement);
      }
    }, 500);
  }

  /**
   * Charge la page suivante de notifications
   */
  loadNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.loadNotifications(this.currentPage + 1);
    }
  }

  /**
   * Ouvre ou ferme le panneau de notifications
   */
  toggleNotificationPanel(): void {

    this.isOpen = !this.isOpen;


    if (this.isOpen) {

      // Recharger les notifications à l'ouverture
      this.loadNotifications();
      this.setupIntersectionObserver();
    }
  }

  /**
   * Marque une notification comme lue ou non lue
   */
  toggleReadStatus(notification: Notification, event: Event): void {
    event.stopPropagation();

    this.notificationService
      .markAsRead(notification.id, !notification.isRead)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Recharger les notifications après mise à jour
          this.loadNotifications(this.currentPage);

          // Recharger le compteur de notifications non lues
          this.loadUnreadCount();
        },
        error: (error) => {
          console.error(
            'Erreur lors du changement du statut de la notification',
            error
          );
        },
      });




  // Si c'est une notification de transaction, naviguer vers les détails de la transaction
    // if (
    //   notification.type === 'transaction' &&
    //   notification.data &&
    //   notification.data['transactionId']
    // ) {
    //   this.navigateToTransaction(Number(notification.data['transactionId']));
    // }
  }

  /**
   * Navigue vers les détails d'une transaction
   */
  navigateToTransaction(transactionId: number): void {
    // Fermer le panneau de notifications
    this.isOpen = false;

    // Naviguer vers la page de transaction
    setTimeout(() => {
      this.router.navigate(['/transactions', transactionId]);
    }, 300);
  }

  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead(event: Event): void {
    event.stopPropagation();

    this.notificationService
      .markAllAsRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Recharger les notifications après mise à jour
          this.loadNotifications(this.currentPage);

          // Recharger le compteur de notifications non lues
          this.loadUnreadCount();
        },
        error: (error) => {
          console.error(
            'Erreur lors du marquage de toutes les notifications comme lues',
            error
          );
        },
      });
  }

  /**
   * Supprime une notification
   */
  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();

    this.notificationService
      .deleteNotification(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => {
          console.error(
            'Erreur lors de la suppression de la notification',
            error
          );
        },
      });
  }

  /**
   * Active ou désactive le son des notifications
   */
  toggleNotificationSound(event: Event): void {
    event.stopPropagation();
    this.notificationService.toggleNotificationSound(!this.notificationSound);
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

  /**
   * Applique un filtre aux notifications (toutes, lues, non lues)
   */
  applyFilter(filter: 'all' | 'read' | 'unread'): void {
    this.currentFilter = filter;
    this.notificationService.filterNotifications(filter);
  }

  /**
   * Détermine si une notification contient des données supplémentaires
   */
  hasData(notification: Notification): boolean {
    return !!notification.data && Object.keys(notification.data).length > 0;
  }

  /**
   * Gère le clic sur une notification
   */
  handleNotificationClick(notification: Notification, event: Event): void {
    event.stopPropagation();

    // Marquer la notification comme lue
    if (!notification.isRead) {
      this.toggleReadStatus(notification, event);
    }

    // Déléguer la navigation au service de notifications
    this.notificationService.handleNotificationClick(notification);

  }

  /**
   * Retourne un libellé lisible pour le type de notification
   */
  getNotificationTypeLabel(type: string): string {
    switch (type) {
      case 'transaction':
        return 'Transaction';
      case 'event_invitation':
        return 'Événement';
      case 'group_invitation':
        return 'Groupe';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
    }
  }

  /**
   * Gère le clic en dehors du panneau de notifications
   *
   * @param event
   */
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }


}
