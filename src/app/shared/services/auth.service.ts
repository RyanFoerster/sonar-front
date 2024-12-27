import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserEntity } from '../entities/user.entity';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly httpClient = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly authState = new BehaviorSubject<boolean>(false);
  private readonly currentUser = new BehaviorSubject<UserEntity | null>(null);

  constructor() {
    this.initializeAuth();
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
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<{ access_token: string; refresh_token: string }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearAuth();
      throw new Error('No refresh token available');
    }

    return this.httpClient
      .post<{ access_token: string; refresh_token: string }>(
        `${environment.API_URL}/auth/refresh`,
        { refreshToken }
      )
      .pipe(
        tap((tokens) => {
          this.setTokens(tokens.access_token, tokens.refresh_token);
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

  private setTokens(accessToken: string, refreshToken: string): void {
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
}
