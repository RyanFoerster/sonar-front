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

  loginForm!: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;

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

      this.usersService
        .signIn(credentials)
        .pipe(
          tap((data) => {
            this.isLoading = false;
            this.authService.setUser(data.user);
            this.authService.setTokens(data.access_token, data.refresh_token);
            if (data.user.isActive) {
              this.router.navigate(['/home']);
            } else {
              this.router.navigate(['/rendez-vous']);
            }
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
