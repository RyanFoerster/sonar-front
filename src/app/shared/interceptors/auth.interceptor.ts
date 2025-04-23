import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError,
  Observable,
  switchMap,
  throwError,
  filter,
  take,
} from 'rxjs';
import { AuthService } from '../services/auth.service';

// Fonction pour ajouter le token aux headers
const addTokenHeader = (
  request: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> => {
  return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
};

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);

  // Routes à exclure de l'interception (pas besoin de token ou géré différemment)
  const excludedUrls = [
    '/auth/login',
    '/auth/refresh', // Important: Ne pas intercepter la requête de refresh !
    '/auth/register',
    '/auth/check-token',
    '/auth/forgot-password',
    '/auth/reset-password',
    // Ajoutez ici d'autres URLs si nécessaire (ex: assets, routes publiques)
  ];

  if (excludedUrls.some((url) => req.url.includes(url))) {
    // Pour les routes exclues, passer directement
    return next(req);
  }

  // Ajouter le token actuel si disponible
  const currentToken = authService.getToken();
  let authReq = req;
  if (currentToken) {
    authReq = addTokenHeader(req, currentToken);
  }

  return next(authReq).pipe(
    catchError((error) => {
      // Vérifier si c'est une erreur 401
      if (error instanceof HttpErrorResponse && error.status === 401) {
        console.log('Interceptor: Erreur 401 détectée');
        // Gérer l'erreur 401
        return handle401Error(authReq, next, authService);
      }

      // Renvoyer les autres erreurs
      return throwError(() => error);
    })
  );
}

// Fonction séparée pour gérer l'erreur 401
function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<unknown>> {
  // Vérifier si un rafraîchissement est déjà en cours
  if (authService.isRefreshingSubject.getValue()) {
    console.log(
      'Interceptor: Rafraîchissement déjà en cours, mise en attente de la requête'
    );
    // Attendre que le rafraîchissement se termine
    return authService.isRefreshing$.pipe(
      filter((isRefreshing) => !isRefreshing), // Attendre que isRefreshing devienne false
      take(1), // Prendre la première émission
      switchMap(() => {
        console.log(
          'Interceptor: Rafraîchissement terminé, réessai de la requête en attente'
        );
        // Récupérer le nouveau token (qui a été mis à jour par le premier appel)
        const newToken = authService.getToken();
        if (newToken) {
          // Cloner la requête ORIGINALE avec le nouveau token
          return next(addTokenHeader(req, newToken));
        } else {
          // Si pas de nouveau token après refresh, logout
          authService.logout();
          return throwError(
            () => new Error('Session expirée après refresh (pas de token)')
          );
        }
      }),
      catchError((retryError) => {
        // Gérer l'erreur lors du réessai
        console.error(
          'Interceptor: Erreur lors du réessai de la requête après refresh',
          retryError
        );
        authService.logout(); // Déconnexion en cas d'échec du réessai
        return throwError(() => retryError);
      })
    );
  } else {
    console.log('Interceptor: Démarrage du processus de rafraîchissement');
    // Marquer le début du rafraîchissement
    authService.isRefreshingSubject.next(true);

    const refreshToken = authService.getRefreshToken();
    if (!refreshToken) {
      console.log('Interceptor: Pas de refresh token trouvé');
      authService.isRefreshingSubject.next(false);
      authService.logout();
      return throwError(
        () => new Error('Session expirée (pas de refresh token)')
      );
    }

    // Appeler refreshToken()
    return authService.refreshToken().pipe(
      switchMap((tokens) => {
        // authService.refreshToken s'occupe de mettre à jour isRefreshingSubject et de stocker le token
        console.log(
          'Interceptor: Refresh token réussi, réessai de la requête originale'
        );
        // Réessayer la requête originale avec le nouveau token
        return next(addTokenHeader(req, tokens.access_token));
      }),
      catchError((refreshError) => {
        // authService.refreshToken s'occupe de isRefreshingSubject, clearAuth et redirection en cas d'erreur
        console.error(
          'Interceptor: Échec du rafraîchissement du token',
          refreshError
        );
        // L'erreur est déjà gérée dans AuthService (logout/redirect)
        // On propage simplement une erreur indiquant l'échec du refresh
        return throwError(() => new Error('Session expirée (échec refresh)'));
      })
    );
  }
}
