import { HttpHandlerFn, HttpHeaders, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authToken = inject(AuthService).getToken()

  if(authToken) {
    let headers = new HttpHeaders()
    headers = headers.set('Authorization', `Bearer ${authToken}`)
    const newReq = req.clone({headers})
    return next(newReq)
  }

  return next(req)
};
