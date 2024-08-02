import {isPlatformBrowser} from '@angular/common';
import {inject, Injectable, PLATFORM_ID, signal} from '@angular/core';
import {environments} from '../../../environments/environments';
import {HttpClient} from "@angular/common/http";
import {tap} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private token = signal<string | null>(null)
  private refreshTokenFromStorage = signal<string | null>(null)
  private readonly platformId = inject(PLATFORM_ID)
  private httpClient: HttpClient = inject(HttpClient);

  constructor() {
      if(isPlatformBrowser(this.platformId)) {
        if(sessionStorage.getItem(environments.TOKEN_KEY)) {
          let tokenInStorage = sessionStorage.getItem(environments.TOKEN_KEY)
          let refreshToken = sessionStorage.getItem(environments.REFRESH_TOKEN_KEY)
          this.token.set(tokenInStorage)
          this.refreshTokenFromStorage.set(refreshToken)
        }
      }
  }

  async saveToken(token: string, refreshToken: string) {
    sessionStorage.removeItem(environments.TOKEN_KEY)
    sessionStorage.removeItem(environments.REFRESH_TOKEN_KEY)
    sessionStorage.setItem(environments.TOKEN_KEY, token)
    sessionStorage.setItem(environments.REFRESH_TOKEN_KEY, refreshToken)
    this.token.set(token)
    this.refreshTokenFromStorage.set(refreshToken)
  }

  getToken() {
    return this.token()
  }

  getRefreshToken() {
    return this.refreshTokenFromStorage()
  }

  removeToken() {
    sessionStorage.removeItem(environments.TOKEN_KEY)
    this.token.set(null)
  }

  refreshToken() {
    const refreshToken = sessionStorage.getItem(environments.REFRESH_TOKEN_KEY); // Assurez-vous de stocker le refresh token
    return this.httpClient.post<{ access_token: string, refresh_token: string }>(
      `${environments.API_URL}/auth/refresh`,
      { refreshToken }
    ).pipe(
      tap(async tokens => {
        await this.saveToken(tokens.access_token, tokens.refresh_token); // Mettre à jour l'access token
      })
    );
  }


}
