import {isPlatformBrowser} from '@angular/common';
import {inject, Injectable, PLATFORM_ID, signal} from '@angular/core';
import {environment} from '../../../environments/environment';
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
      const tokenInStorage = localStorage.getItem(environment.TOKEN_KEY);
      const refreshTokenInStorage = localStorage.getItem(environment.REFRESH_TOKEN_KEY);
      const userInStorage = localStorage.getItem(environment.USER_KEY);
      if (tokenInStorage && refreshTokenInStorage) {
        this.token.set(tokenInStorage);
        this.refreshTokenFromStorage.set(refreshTokenInStorage);
        this.userFromStorage.set(JSON.parse(userInStorage ?? "{}"))
        sessionStorage.setItem("userLogin", String(true))
      } else {
        this.token.set(null);
        this.refreshTokenFromStorage.set(null);
        this.userFromStorage.set(null)
        sessionStorage.setItem("userLogin", String(false))
      }
    }
  }

  async saveToken(token: string, refreshToken: string) {
    localStorage.setItem(environment.TOKEN_KEY, token);
    localStorage.setItem(environment.REFRESH_TOKEN_KEY, refreshToken);
    sessionStorage.setItem("userLogin", String(true))
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
    localStorage.removeItem(environment.TOKEN_KEY);
    localStorage.removeItem(environment.REFRESH_TOKEN_KEY);
    sessionStorage.setItem("userLogin", String(false))
    this.token.set(null);
    this.refreshTokenFromStorage.set(null);
  }

  refreshToken() {
    const refreshToken = localStorage.getItem(environment.REFRESH_TOKEN_KEY);
    return this.httpClient.post<{ access_token: string, refresh_token: string }>(
      `${environment.API_URL}/auth/refresh`,
      { refreshToken }
    ).pipe(
      tap(async tokens => {
        await this.saveToken(tokens.access_token, tokens.refresh_token);
      })
    );
  }

  saveUser(user: UserEntity) {
    if(localStorage.getItem(environment.USER_KEY)) {
      localStorage.removeItem(environment.USER_KEY)
    }
    localStorage.setItem(environment.USER_KEY, JSON.stringify(user))
    this.userFromStorage.set(user)
  }

  removeUser() {
    localStorage.removeItem(environment.USER_KEY)
    this.userFromStorage.set(null)

  }

  getUser() {
    return this.userFromStorage()
  }


}
