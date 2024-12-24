import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router: Router = inject(Router);

  const token = authService.getToken();
  const user = authService.getUser();

  if (token && user) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
