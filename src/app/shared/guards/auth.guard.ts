import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router: Router = inject(Router);
  let userLoginStatus = '';

  userLoginStatus = sessionStorage.getItem('userLogin') ?? '';

  const IsUserLogin: boolean | null = userLoginStatus
    ? JSON.parse(userLoginStatus)
    : null;

  if (IsUserLogin) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
