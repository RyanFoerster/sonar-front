import {inject, signal} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {UsersService} from "../services/users.service";
import {UserEntity} from "../entities/user.entity";
import {firstValueFrom} from "rxjs";

export const activatedUserGuard: CanActivateFn = async (route, state) => {
  const usersService = inject(UsersService);
  const router = inject(Router);

  try {
    const user: UserEntity = await firstValueFrom(usersService.getInfo());
    if (user.isActive) {
      return true;
    } else {
      router.navigate(['/rendez-vous']);
      return false;
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
    router.navigate(['/rendez-vous']);
    return false;
  }
};
