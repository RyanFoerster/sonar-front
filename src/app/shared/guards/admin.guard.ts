import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {UsersService} from "../services/users.service";
import {UserEntity} from "../entities/user.entity";
import {firstValueFrom} from "rxjs";

export const adminGuard: CanActivateFn = async (route, state) => {
  const usersService = inject(UsersService)
  const router: Router = inject(Router)
  try {
    const user: UserEntity = await firstValueFrom(usersService.getInfo());
    if (user.role === "ADMIN") {
      return true;
    } else {
      router.navigate(['/home']);
      return false;
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
    router.navigate(['/home']);
    return false;
  }
};
