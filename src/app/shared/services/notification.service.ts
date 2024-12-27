import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, interval, switchMap, tap, delay } from 'rxjs';

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
  private readonly POLLING_INTERVAL = 5000; // 5 secondes

  notifications = signal<Notification[]>([]);

  constructor() {
    // Démarrer le polling des notifications
    this.startPolling();
  }

  private startPolling() {
    interval(this.POLLING_INTERVAL)
      .pipe(switchMap(() => this.fetchNotifications()))
      .subscribe();
  }

  private fetchNotifications(): Observable<Notification[]> {
    return this.httpClient
      .get<Notification[]>(`${environment.API_URL}/notifications`)
      .pipe(tap((notifications) => this.notifications.set(notifications)));
  }

  loadNotifications(): void {
    this.fetchNotifications().subscribe();
  }

  createGroupInvitation(toUserId: number, groupId: number): Observable<any> {
    return this.httpClient
      .post(`${environment.API_URL}/notifications/group-invitation`, {
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
      .patch(`${environment.API_URL}/notifications/${notificationId}/respond`, {
        accept,
      })
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
      .patch(`${environment.API_URL}/notifications/${notificationId}/read`, {})
      .pipe(tap(() => this.loadNotifications()));
  }
}
