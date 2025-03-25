import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CreateUserDto } from '../dtos/create-user.dto';
import { environment } from '../../../environments/environment';
import { SignInDto } from '../dtos/sign-in.dto';
import { LoggedUser } from '../entities/logged-user.entity';
import { UserEntity } from '../entities/user.entity';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { NotificationService } from '../../services/notification.service';
import { FirebaseMessagingService } from '../../services/firebase-messaging.service';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  httpClient: HttpClient = inject(HttpClient);

  constructor(
    private notificationService: NotificationService,
    private firebaseMessagingService: FirebaseMessagingService
  ) {}

  signUp(createuserDto: CreateUserDto) {
    return this.httpClient.post<boolean>(
      `${environment.API_URL}/auth/register`,
      createuserDto
    );
  }

  signUpFromAdmin(createuserDto: CreateUserDto) {
    return this.httpClient.post<boolean>(
      `${environment.API_URL}/auth/register-from-admin`,

      createuserDto
    );
  }

  signIn(credentials: SignInDto) {
    return this.httpClient
      .post<LoggedUser>(`${environment.API_URL}/auth/login`, credentials)
      .pipe(
        tap(() => {
          // Utiliser un seul point d'initialisation dans l'application
          // Le service de notification sera initialisé via AuthService.getAuthState()
          console.log(
            "Connexion réussie, les services de notification seront initialisés par le listener d'authentification"
          );
        })
      );
  }

  getInfo() {
    return this.httpClient.get<UserEntity>(`${environment.API_URL}/users`);
  }

  update(updteUserDto: UpdateUserDto) {
    return this.httpClient.patch<UserEntity>(
      `${environment.API_URL}/users`,

      updteUserDto
    );
  }

  getAllUsersGroup(id: number) {
    return this.httpClient.get<UserEntity[]>(
      `${environment.API_URL}/users/groups`,

      { params: { id } }
    );
  }

  getUserInfoByPrincipalAccount(id: number) {
    return this.httpClient.get<UserEntity>(
      `${environment.API_URL}/users/principal-account/${id}`
    );
  }

  getUserInfoBySecondaryAccount(id: number) {
    return this.httpClient.get<UserEntity>(
      `${environment.API_URL}/users/secondary-account/${id}`
    );
  }

  findAll() {
    return this.httpClient.get<UserEntity[]>(
      `${environment.API_URL}/users/all`
    );
  }

  findAllUsersWithoutRelations() {
    return this.httpClient.get<UserEntity[]>(
      `${environment.API_URL}/users/all-without-relations`
    );
  }

  findAllPendingUser() {
    return this.httpClient.get<UserEntity[]>(
      `${environment.API_URL}/users/pending`
    );
  }

  getProfilePicture(filename: string) {
    return this.httpClient.get(`${environment.API_URL}/users/${filename}`, {
      responseType: 'blob',
    });
  }

  toggleActiveUser(user: UserEntity) {
    return this.httpClient.patch(
      `${environment.API_URL}/users/toggleActive`,
      user
    );
  }

  deleteUser(id: number) {
    return this.httpClient.delete(`${environment.API_URL}/users/${id}`);
  }

  forgotPassword(email: string) {
    return this.httpClient.post(`${environment.API_URL}/auth/forgot-password`, {
      email,
    });
  }

  resetPassword(token: string, password: string) {
    return this.httpClient.put(`${environment.API_URL}/auth/reset-password`, {
      resetToken: token,
      newPassword: password,
    });
  }
}
