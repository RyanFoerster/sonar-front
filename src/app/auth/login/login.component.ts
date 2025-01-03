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
import { tap } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    HlmInputDirective,
    HlmButtonDirective,
    RouterLink,
    ReactiveFormsModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  formBuilder: FormBuilder = inject(FormBuilder);
  router: Router = inject(Router);
  usersService: UsersService = inject(UsersService);
  authService: AuthService = inject(AuthService);

  loginForm!: FormGroup;

  constructor() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  login() {
    if (this.loginForm.valid) {
      const credentials: SignInDto = {
        email: this.email,
        password: this.password,
      };

      this.authService
        .login(this.email, this.password)
        .pipe(
          tap(() => {
            this.usersService
              .signIn(credentials)
              .pipe(
                tap((data) => {
                  this.authService.setUser(data.user);
                  if (data.user.isActive) {
                    this.router.navigate(['/home']);
                  } else {
                    this.router.navigate(['/rendez-vous']);
                  }
                })
              )
              .subscribe();
          })
        )
        .subscribe();
    }
  }

  get email() {
    return this.loginForm.controls['email'].value;
  }

  get password() {
    return this.loginForm.controls['password'].value;
  }
}
