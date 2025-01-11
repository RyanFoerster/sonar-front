import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UsersService } from '../services/users.service';
import { UserEntity } from '../entities/user.entity';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const activatedUserGuard: CanActivateFn = async (route, state) => {
  const usersService = inject(UsersService);
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Vérifier si nous sommes authentifiés
    if (!authService.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    let user: UserEntity;
    try {
      user = await firstValueFrom(usersService.getInfo());
    } catch (error) {
      // Si l'erreur est due à un token expiré, essayer de le rafraîchir
      const refreshToken = authService.getRefreshToken();
      if (!refreshToken) {
        router.navigate(['/login']);
        return false;
      }

      // Tenter de rafraîchir le token
      await firstValueFrom(authService.refreshToken());
      // Réessayer d'obtenir les informations de l'utilisateur
      user = await firstValueFrom(usersService.getInfo());
    }

    if (user.isActive) {
      return true;
    } else {
      router.navigate(['/rendez-vous']);
      return false;
    }
  } catch (error) {
    console.error('Error in activated user guard:', error);
    router.navigate(['/rendez-vous']);
    return false;
  }
};
