import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subscription, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserEntity } from '../entities/user.entity';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private token = signal<string | null>(null);
  private refreshTokenFromStorage = signal<string | null>(null);
  private userFromStorage = signal<UserEntity | null>(null);
  private authState = new BehaviorSubject<boolean>(false);
  private currentUser = new BehaviorSubject<UserEntity | null>(null);
  private httpClient: HttpClient = inject(HttpClient);
  private router: Router = inject(Router);
  private tokenCheckInterval: Subscription | null = null;
  private readonly TOKEN_CHECK_INTERVAL = 60000;

  constructor() {
    this.initializeAuthState();
  }

  private initializeAuthState() {
    const tokenInStorage = localStorage.getItem(environment.TOKEN_KEY);
    const refreshTokenInStorage = localStorage.getItem(
      environment.REFRESH_TOKEN_KEY
    );
    const userInStorage = localStorage.getItem(environment.USER_KEY);

    if (tokenInStorage && refreshTokenInStorage && userInStorage) {
      try {
        const user = JSON.parse(userInStorage);
        this.token.set(tokenInStorage);
        this.refreshTokenFromStorage.set(refreshTokenInStorage);
        this.userFromStorage.set(user);
        this.currentUser.next(user);
        this.authState.next(true);
        this.startTokenCheck();
      } catch (error) {
        console.error(
          "Erreur lors de l'initialisation de l'état d'authentification:",
          error
        );
        this.clearAuthState();
      }
    } else {
      this.clearAuthState();
    }
  }

  private clearAuthState() {
    this.token.set(null);
    this.refreshTokenFromStorage.set(null);
    this.userFromStorage.set(null);
    this.currentUser.next(null);
    this.authState.next(false);
    localStorage.removeItem(environment.TOKEN_KEY);
    localStorage.removeItem(environment.REFRESH_TOKEN_KEY);
    localStorage.removeItem(environment.USER_KEY);

    if (this.tokenCheckInterval) {
      this.tokenCheckInterval.unsubscribe();
      this.tokenCheckInterval = null;
    }
  }

  private startTokenCheck() {
    if (this.tokenCheckInterval) {
      this.tokenCheckInterval.unsubscribe();
    }

    // Vérifier immédiatement la validité du token de manière silencieuse
    this.checkTokenValidity(true);

    // Mettre en place la vérification périodique
    this.tokenCheckInterval = new Subscription();
    const checkInterval = setInterval(() => {
      this.checkTokenValidity(true);
    }, this.TOKEN_CHECK_INTERVAL);

    this.tokenCheckInterval.add(() => {
      clearInterval(checkInterval);
    });
  }

  private checkTokenValidity(silent: boolean = false) {
    if (!this.getToken()) {
      if (!silent) {
        this.clearAuthState();
      }
      return;
    }

    this.httpClient
      .get(`${environment.API_URL}/auth/check-token`)
      .pipe(
        tap(
          () => {
            this.authState.next(true);
          },
          (error) => {
            if (error.status === 401) {
              const refreshToken = this.getRefreshToken();
              if (refreshToken) {
                this.refreshToken().subscribe({
                  next: () => {
                    this.authState.next(true);
                  },
                  error: () => {
                    if (!silent) {
                      this.clearAuthState();
                      this.router.navigate(['/login']);
                    }
                  },
                });
              } else if (!silent) {
                this.clearAuthState();
                this.router.navigate(['/login']);
              }
            } else if (!silent) {
              this.clearAuthState();
              this.router.navigate(['/login']);
            }
          }
        )
      )
      .subscribe();
  }

  async saveToken(token: string, refreshToken: string) {
    localStorage.setItem(environment.TOKEN_KEY, token);
    localStorage.setItem(environment.REFRESH_TOKEN_KEY, refreshToken);
    this.token.set(token);
    this.refreshTokenFromStorage.set(refreshToken);
    this.authState.next(true);
    this.startTokenCheck();
  }

  getToken() {
    if (!this.token()) {
      const tokenInStorage = localStorage.getItem(environment.TOKEN_KEY);
      if (tokenInStorage) {
        this.token.set(tokenInStorage);
        return tokenInStorage;
      }
    }
    return this.token();
  }

  getRefreshToken() {
    if (!this.refreshTokenFromStorage()) {
      const refreshToken = localStorage.getItem(environment.REFRESH_TOKEN_KEY);
      if (refreshToken) {
        this.refreshTokenFromStorage.set(refreshToken);
        return refreshToken;
      }
    }
    return this.refreshTokenFromStorage();
  }

  isAuthenticated(): boolean {
    return this.authState.getValue();
  }

  logout() {
    this.clearAuthState();
    this.router.navigate(['/login']);
  }

  refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearAuthState();
      return new Observable((subscriber) =>
        subscriber.error('No refresh token')
      );
    }

    return this.httpClient
      .post<{ access_token: string; refresh_token: string }>(
        `${environment.API_URL}/auth/refresh`,
        { refreshToken }
      )
      .pipe(
        tap(async (tokens) => {
          await this.saveToken(tokens.access_token, tokens.refresh_token);
        })
      );
  }

  saveUser(user: UserEntity) {
    localStorage.setItem(environment.USER_KEY, JSON.stringify(user));
    this.userFromStorage.set(user);
    this.currentUser.next(user);
    this.authState.next(true);
  }

  getUser() {
    if (!this.userFromStorage()) {
      const userInStorage = localStorage.getItem(environment.USER_KEY);
      if (userInStorage) {
        try {
          const user = JSON.parse(userInStorage);
          this.userFromStorage.set(user);
          this.currentUser.next(user);
          return user;
        } catch (error) {
          this.clearAuthState();
        }
      }
    }
    return this.userFromStorage();
  }

  getAuthState(): Observable<boolean> {
    return this.authState.asObservable();
  }

  getCurrentUser(): Observable<UserEntity | null> {
    return this.currentUser.asObservable();
  }
}
