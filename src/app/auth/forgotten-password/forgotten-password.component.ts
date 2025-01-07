import { Component, inject, OnInit, signal } from '@angular/core';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormGroup,
} from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { UsersService } from '../../shared/services/users.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of, take, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { provideIcons } from '@ng-icons/core';
import { lucideEye, lucideEyeOff } from '@ng-icons/lucide';

@Component({
  selector: 'app-forgotten-password',
  standalone: true,
  imports: [
    HlmButtonDirective,
    HlmInputDirective,
    ReactiveFormsModule,
    CommonModule,
    HlmIconComponent,
    RouterLink,
  ],
  providers: [
    provideIcons({
      lucideEye,
      lucideEyeOff,
    }),
  ],
  templateUrl: './forgotten-password.component.html',
  styleUrl: './forgotten-password.component.css',
})
export class ForgottenPasswordComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private usersService = inject(UsersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected resetTokenForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected resetPasswordForm = this.formBuilder.group(
    {
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$=%^&*-]).{8,}$'
          ),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator }
  );

  tokenFromUrl = signal<string | null>(null);
  isEmailSent = signal(false);
  errorMessage = signal<string>('');
  isLoading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor() {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      if (token) {
        this.tokenFromUrl.set(token);
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
    }
    return null;
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword') {
    if (field === 'password') {
      this.showPassword.set(!this.showPassword());
    } else {
      this.showConfirmPassword.set(!this.showConfirmPassword());
    }
  }

  getErrorMessage(controlName: string): string {
    const control =
      controlName === 'email'
        ? this.resetTokenForm.get(controlName)
        : this.resetPasswordForm.get(controlName);

    if (!control?.errors || !control.touched) return '';

    if (control.hasError('required')) {
      return 'Ce champ est requis';
    }

    switch (controlName) {
      case 'email':
        if (control.hasError('email')) {
          return 'Veuillez entrer un email valide';
        }
        break;
      case 'password':
        if (control.hasError('minlength')) {
          return 'Le mot de passe doit contenir au moins 8 caractères';
        }
        if (control.hasError('pattern')) {
          return 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial';
        }
        break;
      case 'confirmPassword':
        if (control.hasError('passwordMismatch')) {
          return 'Les mots de passe ne correspondent pas';
        }
        break;
    }
    return '';
  }

  resetToken() {
    if (this.resetTokenForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      const email = this.resetTokenForm.value.email;

      this.usersService
        .forgotPassword(email!)
        .pipe(
          tap(() => {
            this.isEmailSent.set(true);
            this.isLoading.set(false);
          }),
          catchError((error) => {
            this.isLoading.set(false);
            this.errorMessage.set(
              'Une erreur est survenue. Veuillez réessayer.'
            );
            return of(null);
          })
        )
        .subscribe();
    } else {
      this.resetTokenForm.markAllAsTouched();
    }
  }

  resetPassword() {
    if (this.resetPasswordForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      const password = this.resetPasswordForm.value.password;

      this.usersService
        .resetPassword(this.tokenFromUrl()!, password!)
        .pipe(
          take(1),
          tap(() => {
            this.router.navigate(['/login']);
          }),
          catchError((error) => {
            this.isLoading.set(false);
            this.errorMessage.set(
              'Une erreur est survenue lors de la réinitialisation. Veuillez réessayer.'
            );
            return of(null);
          })
        )
        .subscribe();
    } else {
      this.resetPasswordForm.markAllAsTouched();
    }
  }
}
