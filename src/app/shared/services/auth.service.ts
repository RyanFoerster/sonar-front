import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  tap,
  catchError,
  throwError,
  Subject,
} from 'rxjs';
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

  // Rendre le BehaviorSubject public
  isRefreshingSubject = new BehaviorSubject<boolean>(false);
  isRefreshing$ = this.isRefreshingSubject.asObservable();

  // Subject pour stocker le nouveau token après rafraîchissement
  private tokenRefreshedSource = new Subject<string>();
  tokenRefreshed$ = this.tokenRefreshedSource.asObservable();

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
    console.log('[AuthService] refreshToken: Tentative de refresh démarrée.');

    console.log('[AuthService] refreshToken: Marque isRefreshing à true.');
    this.isRefreshingSubject.next(true);

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      console.log('[AuthService] refreshToken: Pas de refresh token trouvé.');
      this.isRefreshingSubject.next(false);
      this.clearAuth(); // Déjà présent
      // Redirection ajoutée ici si ce n'est pas déjà géré ailleurs
      this.router.navigate(['/login']);
      return throwError(() => new Error('No refresh token available'));
    }

    console.log(
      '[AuthService] refreshToken: Envoi de la requête POST /auth/refresh...'
    );
    return this.httpClient
      .post<{ access_token: string; refresh_token: string }>(
        `${environment.API_URL}/auth/refresh`,
        { refresh_token: refreshToken }
      )
      .pipe(
        tap((tokens) => {
          console.log(
            '[AuthService] refreshToken: Requête réussie, nouveaux tokens reçus.'
          );
          this.setTokens(tokens.access_token, tokens.refresh_token);
          // Émettre le nouveau token pour les requêtes en attente
          this.tokenRefreshedSource.next(tokens.access_token);
          console.log(
            '[AuthService] refreshToken: Marque isRefreshing à false (succès).'
          );
          this.isRefreshingSubject.next(false); // Fin du rafraîchissement
        }),
        catchError((error) => {
          console.error(
            '[AuthService] refreshToken: Erreur lors de la requête POST /auth/refresh:',
            error
          );
          this.isRefreshingSubject.next(false); // Fin du rafraîchissement (échec)
          this.clearAuth();
          // S'assurer de la redirection en cas d'échec du refresh
          this.router.navigate(['/login']);
          return throwError(() => error); // Re-throw l'erreur
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
    console.log(
      "[AuthService] clearAuth: Nettoyage des données d'authentification."
    );
    localStorage.removeItem(environment.TOKEN_KEY);
    localStorage.removeItem(environment.REFRESH_TOKEN_KEY);
    localStorage.removeItem(environment.USER_KEY);
    this.currentUser.next(null);
    this.authState.next(false);
    // S'assurer que l'état de rafraîchissement est aussi réinitialisé
    this.isRefreshingSubject.next(false);
    console.log('[AuthService] clearAuth: isRefreshingSubject remis à false.');
  }

  private checkAppVersion(): void {
    const localVersion = localStorage.getItem(this.LOCAL_VERSION_KEY);
    const currentVersion = environment.APP_VERSION;

    if (localVersion !== currentVersion) {
      console.log(
        `Mise à jour de la version locale de ${localVersion} vers ${currentVersion}`
      );
      localStorage.setItem(this.LOCAL_VERSION_KEY, currentVersion);
      // Optionnel : Forcer la déconnexion ou le rechargement si la version change drastiquement
      // this.logout(); ou window.location.reload();
    }
  }
}
