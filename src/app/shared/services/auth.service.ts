import {isPlatformBrowser} from '@angular/common';
import {inject, Injectable, PLATFORM_ID, signal} from '@angular/core';
import {environments} from '../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private token = signal<string | null>(null)
  private readonly platformId = inject(PLATFORM_ID)

  constructor() {
      if(isPlatformBrowser(this.platformId)) {
        if(sessionStorage.getItem(environments.TOKEN_KEY)) {
          let tokenInStorage = sessionStorage.getItem(environments.TOKEN_KEY)
          this.token.set(tokenInStorage)
        }
      }
  }

  saveToken(token: string) {
    sessionStorage.removeItem(environments.TOKEN_KEY)
    sessionStorage.setItem(environments.TOKEN_KEY, token)
    this.token.set(token)

  }

  getToken() {
    return this.token()
  }

  removeToken() {
    sessionStorage.removeItem(environments.TOKEN_KEY)
    this.token.set(null)
  }


}
