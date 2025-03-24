import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  Observable,
  interval,
  switchMap,
  tap,
  delay,
  Subscription,
} from 'rxjs';
import { AuthService } from './auth.service';

export interface Notification {
  id: number;
  type: 'GROUP_INVITATION' | 'ROLE_CHANGE' | 'OTHER';
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
  fromUserId: number;
  toUserId: number;
  groupId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly httpClient = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly POLLING_INTERVAL = 5000; // 5 secondes
  private pollingSubscription?: Subscription;

  notifications = signal<Notification[]>([]);

  constructor() {
    // Démarrer le polling des notifications si l'utilisateur est connecté
    if (this.authService.getToken()) {
      this.startPolling();
    }

    // S'abonner aux changements d'état d'authentification
    this.authService.getAuthState().subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.startPolling();
      } else {
        this.stopPolling();
        this.notifications.set([]);
      }
    });
  }

  private startPolling() {
    if (!this.pollingSubscription) {
      this.pollingSubscription = interval(this.POLLING_INTERVAL)
        .pipe(switchMap(() => this.fetchNotifications()))
        .subscribe();
    }
  }

  private stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  private fetchNotifications(): Observable<Notification[]> {
    if (!this.authService.getToken()) {
      return new Observable(); // Retourne un Observable vide si non authentifié
    }
    return this.httpClient
      .get<Notification[]>(`${environment.API_URL}/alert-notifications`)
      .pipe(tap((notifications) => this.notifications.set(notifications)));
  }

  loadNotifications(): void {
    if (this.authService.getToken()) {
      this.fetchNotifications().subscribe();
    }
  }

  createGroupInvitation(toUserId: number, groupId: number): Observable<any> {
    return this.httpClient
      .post(`${environment.API_URL}/alert-notifications/group-invitation`, {
        toUserId,
        groupId,
        type: 'GROUP_INVITATION',
        message: 'Vous avez été invité à rejoindre un groupe',
      })
      .pipe(tap(() => this.loadNotifications()));
  }

  respondToInvitation(
    notificationId: number,
    accept: boolean
  ): Observable<any> {
    return this.httpClient
      .patch(
        `${environment.API_URL}/alert-notifications/${notificationId}/respond`,
        {
          accept,
        }
      )
      .pipe(
        tap(() => this.loadNotifications()),
        delay(500),
        tap(() => {
          if (accept) {
            window.dispatchEvent(new CustomEvent('refreshGroupMembers'));
          }
        })
      );
  }

  markAsRead(notificationId: number): Observable<any> {
    return this.httpClient
      .patch(
        `${environment.API_URL}/alert-notifications/${notificationId}/read`,
        {}
      )
      .pipe(tap(() => this.loadNotifications()));
  }
}
