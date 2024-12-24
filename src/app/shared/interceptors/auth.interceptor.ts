import {
  HttpEvent,
  HttpHandlerFn,
  HttpHeaders,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Ne pas intercepter les requêtes de rafraîchissement de token et de vérification
  if (
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/check-token')
  ) {
    return next(req);
  }

  let headers = new HttpHeaders().set(
    'apikey',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluZnBscXNjaWZubmpmYmF0c2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMwNTA3MjcsImV4cCI6MjAzODYyNjcyN30.jINf2PmZklBFMcSjHeO0c2GY3nGRdwQ4YSA4T5bJxok'
  );

  const authToken = authService.getToken();
  if (authToken) {
    headers = headers.set('Authorization', `Bearer ${authToken}`);
  }

  const clonedRequest = req.clone({ headers });

  return next(clonedRequest).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Vérifier si nous avons les tokens nécessaires pour le rafraîchissement
        const refreshToken = authService.getRefreshToken();
        if (refreshToken) {
          return (authService.refreshToken() as Observable<TokenResponse>).pipe(
            switchMap((tokens) => {
              // Mettre à jour les headers avec le nouveau token
              const newHeaders = headers.set(
                'Authorization',
                `Bearer ${tokens.access_token}`
              );
              // Cloner la requête avec les nouveaux headers
              const newRequest = req.clone({ headers: newHeaders });
              // Réessayer la requête originale avec le nouveau token
              return next(newRequest);
            }),
            catchError((refreshError) => {
              console.error(
                'Erreur lors du rafraîchissement du token:',
                refreshError
              );
              authService.logout();
              return throwError(() => refreshError);
            })
          );
        } else {
          // Pas de refresh token disponible, déconnexion
          authService.logout();
          return throwError(() => new Error('Session expirée'));
        }
      }
      // Pour les autres erreurs, les renvoyer simplement
      return throwError(() => error);
    })
  );
}
