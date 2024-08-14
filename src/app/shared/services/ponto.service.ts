import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Router} from "@angular/router";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class PontoService {

  private clientId = 'd5db4621-1af8-4718-93b1-0239486bf237';
  private redirectUri = 'http://localhost:4200/callback';
  private pontoAuthUrl = 'https://authorization.ibanity.com/ponto-connect/oauth2/authorize';
  private pontoTokenUrl = 'https://api.ibanity.com/ponto-connect/oauth2/token';
  private pontoApiUrl = 'https://api.ibanity.com/ponto-connect/accounts';

  private accessToken: string | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  redirectToPonto() {
    //const url = `${this.pontoAuthUrl}?client_id=${this.clientId}&response_type=code&redirect_uri=${encodeURIComponent(this.redirectUri)}`;
    const url = `${this.pontoApiUrl}`
    window.location.href = url;
  }

  handleCallback(code: string) {
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('code', code);
    body.set('redirect_uri', this.redirectUri);
    body.set('client_id', this.clientId);

    return this.http.post(this.pontoTokenUrl, body.toString(), {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    }).subscribe((response: any) => {
      this.accessToken = response.access_token;
      this.router.navigate(['/']);
    });
  }

  getAccountBalance(): Observable<any> {
    if (!this.accessToken) {
      throw new Error('Access token is missing. Please authenticate first.');
    }

    return this.http.get(this.pontoApiUrl, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.accessToken}`
      })
    });
  }
}
