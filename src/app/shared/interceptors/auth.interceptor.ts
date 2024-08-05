import {HttpHandlerFn, HttpHeaders, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {catchError, switchMap, throwError} from "rxjs";
import {Router} from "@angular/router";

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authService = inject(AuthService);
  const router = inject(Router);
  const authToken = authService.getToken();

  if (authToken) {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${authToken}`);
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
