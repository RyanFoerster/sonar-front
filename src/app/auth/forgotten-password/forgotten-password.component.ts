import {Component, inject, signal} from '@angular/core';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {AuthService} from "../../shared/services/auth.service";
import {UsersService} from "../../shared/services/users.service";
@Component({
  selector: 'app-forgotten-password',
  standalone: true,
  imports: [
    HlmButtonDirective,
    HlmInputDirective,
    ReactiveFormsModule
  ],
  templateUrl: './forgotten-password.component.html',
  styleUrl: './forgotten-password.component.css'
})
export class ForgottenPasswordComponent {

  private formBuilder = inject(FormBuilder)
  private usersService = inject(UsersService)
  protected resetPasswordForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]]
  })

  isEmailSended = signal(false)


  constructor() {
  }

  resetPassword() {
    if (this.resetPasswordForm.valid) {
      const email = this.resetPasswordForm.value.email
      this.usersService.forgotPassword(email!).subscribe(res => {
        this.isEmailSended.set(true)
      })
    }
  }



}
