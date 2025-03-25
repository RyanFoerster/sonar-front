import { Component, inject } from '@angular/core';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SignInDto } from '../../shared/dtos/sign-in.dto';
import { UsersService } from '../../shared/services/users.service';
import { AuthService } from '../../shared/services/auth.service';
import { catchError, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideEye, lucideEyeOff } from '@ng-icons/lucide';
import { NotificationService } from '../../services/notification.service';
import { FirebaseMessagingService } from '../../services/firebase-messaging.service';

import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    HlmInputDirective,
    HlmButtonDirective,
    RouterLink,
    ReactiveFormsModule,
    CommonModule,
    HlmIconComponent,
  ],
  providers: [
    provideIcons({
      lucideEye,
      lucideEyeOff,
    }),
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  schemas: [NO_ERRORS_SCHEMA],
})
export class LoginComponent {
  formBuilder: FormBuilder = inject(FormBuilder);
  router: Router = inject(Router);
  usersService: UsersService = inject(UsersService);
  authService: AuthService = inject(AuthService);
  notificationService: NotificationService = inject(NotificationService);
  firebaseMessagingService: FirebaseMessagingService = inject(
    FirebaseMessagingService
  );

  loginForm!: FormGroup;
  errorMessage = '';
  isLoading = false;
  showPassword = false;

  constructor() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  login() {
    this.errorMessage = '';
    if (this.loginForm.valid) {
      this.isLoading = true;
      const credentials: SignInDto = {
        email: this.email,
        password: this.password,
      };

      console.debug(credentials);

      this.usersService
        .signIn(credentials)
        .pipe(
          tap((data) => {
            this.isLoading = false;

            // 1. Mettre à jour l'authentification
            this.authService.setUser(data.user);
            this.authService.setTokens(data.access_token, data.refresh_token);

            // 2. Initialiser les services de notification explicitement ici
            console.log(
              'Initialisation forcée des services de notification avant navigation'
            );

            // Initialiser WebSocket
            this.notificationService.loadUserData(); // S'assurer que userId est à jour
            this.notificationService.initSocket();

            // Observer l'état de connexion du WebSocket
            const waitForSocketConnection = new Promise<void>((resolve) => {
              const subscription =
                this.notificationService.socketState$.subscribe(
                  (isConnected) => {
                    if (isConnected) {
                      console.log(
                        'WebSocket connecté avec succès, prêt pour la navigation'
                      );
                      subscription.unsubscribe();
                      resolve();
                    }
                  }
                );

              // Timeout de sécurité pour ne pas bloquer indéfiniment
              setTimeout(() => {
                subscription.unsubscribe();
                console.log(
                  'Timeout de connexion WebSocket atteint, navigation forcée'
                );
                resolve();
              }, 2000);
            });

            // Initialiser les notifications FCM si les permissions sont déjà accordées
            let fcmPromise = Promise.resolve();
            if (
              'Notification' in window &&
              Notification.permission === 'granted'
            ) {
              fcmPromise = new Promise<void>((resolve) => {
                this.firebaseMessagingService.requestPermission().subscribe({
                  next: (token) => {
                    if (token) {
                      console.log(
                        'Token FCM récupéré avec succès avant navigation'
                      );
                    }
                    resolve();
                  },
                  error: () => resolve(),
                  complete: () => resolve(),
                });

                // Timeout de sécurité
                setTimeout(() => {
                  console.log('Timeout FCM atteint, navigation forcée');
                  resolve();
                }, 2000);
              });
            }

            // 3. Attendre que les initialisations soient terminées avant de naviguer
            Promise.all([waitForSocketConnection, fcmPromise]).then(() => {
              console.log(
                "Services de notification initialisés, navigation vers la page d'accueil"
              );
              if (data.user.isActive) {
                this.router.navigate(['/home']);
              } else {
                this.router.navigate(['/rendez-vous']);
              }
            });
          }),
          catchError((error) => {
            this.isLoading = false;
            this.errorMessage = 'Email ou mot de passe incorrect';
            throw error;
          })
        )
        .subscribe();
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  get email() {
    return this.loginForm.controls['email'].value;
  }

  get password() {
    return this.loginForm.controls['password'].value;
  }

  getEmailErrorMessage(): string {
    const control = this.loginForm.get('email');
    if (control?.hasError('required')) {
      return "L'email est requis";
    }
    if (control?.hasError('email')) {
      return 'Veuillez entrer un email valide';
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    const control = this.loginForm.get('password');
    if (control?.hasError('required')) {
      return 'Le mot de passe est requis';
    }
    if (control?.hasError('minlength')) {
      return 'Le mot de passe doit contenir au moins 8 caractères';
    }
    return '';
  }
}
