import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserEntity } from '../entities/user.entity';
import { NotificationService } from '../../services/notification.service';
import { FirebaseMessagingService } from '../../services/firebase-messaging.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly httpClient = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly LOCAL_VERSION_KEY = 'app_version';
  private readonly notificationService = inject(NotificationService);
  private readonly firebaseMessagingService = inject(FirebaseMessagingService);

  private readonly authState = new BehaviorSubject<boolean>(false);
  private readonly currentUser = new BehaviorSubject<UserEntity | null>(null);

  constructor() {
    this.initializeAuth();
    this.checkAppVersion();
  }

  // Méthodes publiques
  login(
    email: string,
    password: string
  ): Observable<{ access_token: string; refresh_token: string }> {
    return this.httpClient
      .post<{ access_token: string; refresh_token: string }>(
        `${environment.API_URL}/auth/login`,
        { email, password }
      )
      .pipe(
        tap((tokens) => {
          this.setTokens(tokens.access_token, tokens.refresh_token);
        })
      );
  }

  logout(): void {
    // Déconnecter les services de notification avant de nettoyer l'authentification
    console.log('Déconnexion des services de notification...');

    // Déconnecter le WebSocket
    this.notificationService.disconnectSocket();

    // Déconnecter Firebase Messaging
    this.firebaseMessagingService.disconnectMessaging();

    // Attendre un court instant pour permettre aux déconnexions de se terminer
    setTimeout(() => {
      // Nettoyer l'authentification et rediriger
      this.clearAuth();
      this.router.navigate(['/login']);
    }, 500);
  }

  refreshToken(): Observable<{ access_token: string; refresh_token: string }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearAuth();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.httpClient
      .post<{ access_token: string; refresh_token: string }>(
        `${environment.API_URL}/auth/refresh`,
        { refresh_token: refreshToken }
      )
      .pipe(
        tap((tokens) => {
          this.setTokens(tokens.access_token, tokens.refresh_token);
        }),
        catchError((error) => {
          console.error('Erreur refresh token:', error);
          this.clearAuth();
          return throwError(() => error);
        })
      );
  }

  checkToken(): Observable<boolean> {
    this.checkAppVersion();
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.httpClient
      .post<boolean>(`${environment.API_URL}/auth/check-token`, {}, { headers })
      .pipe(
        tap((isValid) => {
          if (!isValid) {
            this.clearAuth();
          }
        }),
        catchError((error) => {
          console.error('Erreur check token:', error);
          this.clearAuth();
          return throwError(() => error);
        })
      );
  }

  // Getters publics
  getToken(): string | null {
    return localStorage.getItem(environment.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(environment.REFRESH_TOKEN_KEY);
  }

  getUser(): UserEntity | null {
    const userStr = localStorage.getItem(environment.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.authState.getValue();
  }

  getAuthState(): Observable<boolean> {
    return this.authState.asObservable();
  }

  getCurrentUser(): Observable<UserEntity | null> {
    return this.currentUser.asObservable();
  }

  // Méthodes pour gérer l'utilisateur
  setUser(user: UserEntity): void {
    localStorage.setItem(environment.USER_KEY, JSON.stringify(user));
    this.currentUser.next(user);
    this.authState.next(true);
  }

  // Méthodes privées
  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getUser();

    if (token && user) {
      this.currentUser.next(user);
      this.authState.next(true);
    } else {
      this.clearAuth();
    }
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(environment.TOKEN_KEY, accessToken);
    localStorage.setItem(environment.REFRESH_TOKEN_KEY, refreshToken);
  }

  private clearAuth(): void {
    localStorage.removeItem(environment.TOKEN_KEY);
    localStorage.removeItem(environment.REFRESH_TOKEN_KEY);
    localStorage.removeItem(environment.USER_KEY);
    this.currentUser.next(null);
    this.authState.next(false);
  }

  private checkAppVersion(): void {
    const localVersion = localStorage.getItem(this.LOCAL_VERSION_KEY);
    if (localVersion !== environment.APP_VERSION) {
      this.clearAuth();
      localStorage.setItem(this.LOCAL_VERSION_KEY, environment.APP_VERSION);
    }
  }
}
