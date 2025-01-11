import {
  HttpEvent,
  HttpHandlerFn,
  HttpHeaders,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, switchMap, throwError, of, from } from 'rxjs';
import { AuthService } from '../services/auth.service';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

let isRefreshing = false;

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Ne pas intercepter les requêtes d'authentification
  if (
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/check-token') ||
    req.url.includes('/auth/forgot-password') ||
    req.url.includes('/auth/reset-password')
  ) {
    // Pour ces routes, on ajoute uniquement l'apikey
    const headers = new HttpHeaders();
    return next(req.clone({ headers }));
  }

  // Pour toutes les autres requêtes, on ajoute l'apikey et le token d'authentification si disponible
  let headers = new HttpHeaders();

  const authToken = authService.getToken();
  if (authToken) {
    headers = headers.set('Authorization', `Bearer ${authToken}`);
  }

  const clonedRequest = req.clone({ headers });

  return next(clonedRequest).pipe(
    catchError((error) => {
      if (error.status === 401) {
        if (isRefreshing) {
          return throwError(() => new Error('Session expirée'));
        }

        const refreshToken = authService.getRefreshToken();
        if (!refreshToken) {
          authService.logout();
          return throwError(() => new Error('Session expirée'));
        }

        isRefreshing = true;

        // Tentative de rafraîchissement du token
        return from(
          new Promise<HttpEvent<unknown>>((resolve, reject) => {
            authService.refreshToken().subscribe({
              next: (tokens) => {
                isRefreshing = false;
                // Mettre à jour les headers avec le nouveau token
                const newHeaders = new HttpHeaders().set(
                  'Authorization',
                  `Bearer ${tokens.access_token}`
                );

                // Cloner la requête originale avec les nouveaux headers
                const newRequest = req.clone({ headers: newHeaders });
                // Réessayer la requête originale
                next(newRequest).subscribe({
                  next: (event) => resolve(event),
                  error: (err) => reject(err),
                });
              },
              error: (refreshError) => {
                isRefreshing = false;
                console.error(
                  'Erreur lors du rafraîchissement du token:',
                  refreshError
                );
                authService.logout();
                router.navigate(['/login']);
                reject(new Error('Session expirée'));
              },
            });
          })
        );
      }
      return throwError(() => error);
    })
  );
}
