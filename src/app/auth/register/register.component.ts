import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { CreateUserDto } from '../../shared/dtos/create-user.dto';
import { UsersService } from '../../shared/services/users.service';
import { catchError, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { provideIcons } from '@ng-icons/core';
import { lucideEye, lucideEyeOff } from '@ng-icons/lucide';

@Component({
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  formBuilder: FormBuilder = inject(FormBuilder);
  usersService: UsersService = inject(UsersService);
  router: Router = inject(Router);

  registerForm!: FormGroup;
  errorMessage: string = '';
  backendUserName: string = '';
  backendEmail: string = '';
  isLoading: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor() {
    this.registerForm = this.formBuilder.group(
      {
        username: ['', [Validators.required, Validators.minLength(2)]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
        email: ['', [Validators.required, Validators.email]],
        name: ['', [Validators.required, Validators.minLength(2)]],
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        numeroNational: [
          '',
          [
            Validators.required,
            Validators.minLength(11),
            Validators.maxLength(11),
            Validators.pattern(/^\d+$/),
          ],
        ],
        telephone: [
          '',
          [
            Validators.required,
            Validators.pattern(/^(\+\d{1,3}[- ]?)?\d{10}$/),
          ],
        ],
        address: ['', [Validators.required, Validators.minLength(5)]],
        iban: [
          '',
          [
            Validators.required,
            Validators.pattern(/^BE\d{2}[ ]\d{4}[ ]\d{4}[ ]\d{4}$/),
          ],
        ],
      },
      { validators: this.passwordMatchValidator }
    );
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
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  register() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.backendUserName = '';
      this.backendEmail = '';

      const user: CreateUserDto = {
        username: this.username,
        password: this.password,
        confirmPassword: this.confirmPassword,
        email: this.email,
        name: this.name,
        firstName: this.firstName,
        numeroNational: this.numeroNational,
        telephone: this.telephone,
        address: this.address,
        iban: this.iban,
      };

      this.usersService
        .signUp(user)
        .pipe(
          tap(() => {
            this.router.navigate(['/login']);
          }),
          catchError((error) => {
            this.isLoading = false;
            if(error?.error?.message === "Username already exists!" || error?.error?.message === "Ce nom de compte est déjà utilisé") {
              this.backendUserName = "L'utilisateur existe déjà.";
            }
            if(error?.error?.message === "email already exists!" || error?.error?.message === "Cet email est déjà utilisé") {
              this.backendEmail = "L'email existe déjà.";
            }
            this.errorMessage =
              "Une erreur est survenue lors de l'inscription. Veuillez réessayer.";
            throw error;

          })
        )
        .subscribe();
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
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
        break;
      case 'confirmPassword':
        if (control.hasError('passwordMismatch')) {
          return 'Les mots de passe ne correspondent pas';
        }
        if (control.hasError('minlength')) {
          return 'Le mot de passe doit contenir au moins 8 caractères';
        }
        break;
      case 'numeroNational':
        if (control.hasError('pattern')) {
          return 'Le numéro national doit contenir 11 chiffres';
        }
        if (control.hasError('minlength') || control.hasError('maxlength')) {
          return 'Le numéro national doit contenir exactement 11 chiffres';
        }
        break;
      case 'telephone':
        if (control.hasError('pattern')) {
          return 'Veuillez entrer un numéro de téléphone valide';
        }
        break;
      case 'iban':
        if (control.hasError('pattern')) {
          return 'Veuillez entrer un IBAN belge valide (format: BE68 5390 0754 7034)';
        }
        break;
      default:
        if (control.hasError('minlength')) {
          return 'Ce champ doit contenir au moins 2 caractères';
        }
    }
    return '';
  }

  get username() {
    return this.registerForm.controls['username'].value;
  }

  get password() {
    return this.registerForm.controls['password'].value;
  }

  get confirmPassword() {
    return this.registerForm.controls['confirmPassword'].value;
  }

  get email() {
    return this.registerForm.controls['email'].value;
  }

  get name() {
    return this.registerForm.controls['name'].value;
  }

  get firstName() {
    return this.registerForm.controls['firstName'].value;
  }

  get numeroNational() {
    return this.registerForm.controls['numeroNational'].value;
  }

  get telephone() {
    return this.registerForm.controls['telephone'].value;
  }

  get address() {
    return this.registerForm.controls['address'].value;
  }

  get iban() {
    return this.registerForm.controls['iban'].value;
  }
}
