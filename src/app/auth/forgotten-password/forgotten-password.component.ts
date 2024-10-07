import { Component, inject, OnInit, signal } from '@angular/core';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { UsersService } from '../../shared/services/users.service';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, of, take, tap } from 'rxjs';

@Component({
  selector: 'app-forgotten-password',
  standalone: true,
  imports: [HlmButtonDirective, HlmInputDirective, ReactiveFormsModule],
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
  protected resetPasswordForm = this.formBuilder.group({
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(
          '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$=%^&*-]).{8,}$',
        ),
      ],
    ],
  });

  tokenFromUrl = signal<string | null>(null);

  isEmailSended = signal(false);

  ngOnInit() {
    // Vérifier le paramètre 'token' dans l'URL
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      if (token) {
        // Effectuez des actions en fonction du token si nécessaire
        this.tokenFromUrl.set(token);
      } else {
        console.log('No token found');
      }
    });
  }

  constructor() {}

  resetToken() {
    if (this.resetTokenForm.valid) {
      const email = this.resetTokenForm.value.email;
      this.usersService.forgotPassword(email!).subscribe((res) => {
        this.isEmailSended.set(true);
      });
    }
  }

  resetPassword() {
    if (this.resetPasswordForm.valid) {
      const password = this.resetPasswordForm.value.password;
      this.usersService
        .resetPassword(this.tokenFromUrl()!, password!)
        .pipe(
          take(1),
          tap(() => this.router.navigate(['/login'])),
          catchError((err) => {
            console.log(err);
            return of(null);
          }),
        )
        .subscribe();
    }
  }
}
