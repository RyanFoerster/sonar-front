import {HttpHandlerFn, HttpHeaders, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {catchError, delay, switchMap, throwError} from "rxjs";
import {Router} from "@angular/router";

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authService = inject(AuthService);
  const router = inject(Router);
  const authToken = authService.getToken();
  let headers = new HttpHeaders().set('apikey', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluZnBscXNjaWZubmpmYmF0c2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMwNTA3MjcsImV4cCI6MjAzODYyNjcyN30.jINf2PmZklBFMcSjHeO0c2GY3nGRdwQ4YSA4T5bJxok");
  if (authToken) {
    headers = headers.set('Authorization', `Bearer ${authToken}`);
    req = req.clone({headers});
  }


  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        if (authService.getToken() !== null && authService.getRefreshToken() !== null) {
          return authService.refreshToken().pipe(
            switchMap(tokens => {
              const newAuthToken = tokens.access_token;
              const newHeaders = new HttpHeaders().set('Authorization', `Bearer ${newAuthToken}`);
              const newReq = req.clone({headers: newHeaders});
              return next(newReq);
            }),
            catchError(err => {
              // Si le rafraîchissement échoue, déconnectez l'utilisateur
              authService.removeToken();
              router.navigate(['/login']);
              return throwError(err);
            })
          );
        }
      }
      return throwError(error);
    })
  );
}
