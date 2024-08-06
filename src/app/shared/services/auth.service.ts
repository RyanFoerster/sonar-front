import {isPlatformBrowser} from '@angular/common';
import {inject, Injectable, PLATFORM_ID, signal} from '@angular/core';
import {environments} from '../../../environments/environments';
import {HttpClient} from "@angular/common/http";
import {tap} from "rxjs";
import {UserEntity} from "../entities/user.entity";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private token = signal<string | null>(null);
  private refreshTokenFromStorage = signal<string | null>(null);
  private userFromStorage = signal<UserEntity | null>(null);
  private readonly platformId = inject(PLATFORM_ID);
  private httpClient: HttpClient = inject(HttpClient);



  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const tokenInStorage = localStorage.getItem(environments.TOKEN_KEY);
      const refreshTokenInStorage = localStorage.getItem(environments.REFRESH_TOKEN_KEY);

      if (tokenInStorage && refreshTokenInStorage) {
        this.token.set(tokenInStorage);
        this.refreshTokenFromStorage.set(refreshTokenInStorage);
      } else {
        this.token.set(null);
        this.refreshTokenFromStorage.set(null);

      }
    }
  }

  async saveToken(token: string, refreshToken: string) {
    console.log('Saving tokens:', token, refreshToken);
    localStorage.setItem(environments.TOKEN_KEY, token);
    localStorage.setItem(environments.REFRESH_TOKEN_KEY, refreshToken);
    this.token.set(token);
    this.refreshTokenFromStorage.set(refreshToken);
  }

  getToken() {
    return this.token();
  }

  getRefreshToken() {
    return this.refreshTokenFromStorage();
  }

  removeToken() {
    console.log('Removing tokens');
    localStorage.removeItem(environments.TOKEN_KEY);
    localStorage.removeItem(environments.REFRESH_TOKEN_KEY);
    this.token.set(null);
    this.refreshTokenFromStorage.set(null);
  }

  refreshToken() {
    const refreshToken = localStorage.getItem(environments.REFRESH_TOKEN_KEY);
    return this.httpClient.post<{ access_token: string, refresh_token: string }>(
      `${environments.API_URL}/auth/refresh`,
      { refreshToken }
    ).pipe(
      tap(async tokens => {
        console.log('Refreshing tokens:', tokens);
        await this.saveToken(tokens.access_token, tokens.refresh_token);
      })
    );
  }

  saveUser(user: UserEntity) {
    if(localStorage.getItem(environments.USER_KEY)) {
      localStorage.removeItem(environments.USER_KEY)
    }
    localStorage.setItem(environments.USER_KEY, JSON.stringify(user))
    this.userFromStorage.set(user)
  }

  removeUser() {
    localStorage.removeItem(environments.USER_KEY)
    this.userFromStorage.set(null)

  }

  getUser() {
    return this.userFromStorage()
  }


}
