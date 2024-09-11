import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { CreateUserDto } from '../../shared/dtos/create-user.dto';
import { UsersService } from '../../shared/services/users.service';
import { tap } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    HlmInputDirective,
    HlmButtonDirective,
    RouterLink,
    ReactiveFormsModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  formBuilder: FormBuilder = inject(FormBuilder);
  usersService: UsersService = inject(UsersService)
  router: Router = inject(Router)

  registerForm!: FormGroup;

  constructor() {
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),

        ],
      ],
      confirmPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),

        ],
      ],
      email: ['', [Validators.email, Validators.required]],
      name: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      numeroNational: [
        '',
        [
          Validators.required,
          Validators.minLength(11),
          Validators.maxLength(11),
        ],
      ],
      telephone: ['', [Validators.required]],
      address: ['', [Validators.required]],
      iban: ['', [Validators.required]],
    });
  }

  register() {

    if(this.registerForm.valid) {

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
        iban: this.iban
      }

      return this.usersService.signUp(user).pipe(
        tap((data) => {
          this.router.navigate(['/login'])
        })
      ).subscribe()

    }

    return false

  }

  get username() {
    return this.registerForm.controls['username'].value
  }

  get password() {
    return this.registerForm.controls['password'].value
  }

  get confirmPassword() {
    return this.registerForm.controls['confirmPassword'].value
  }

  get email() {
    return this.registerForm.controls['email'].value
  }

  get name() {
    return this.registerForm.controls['name'].value
  }

  get firstName() {
    return this.registerForm.controls['firstName'].value
  }

  get numeroNational() {
    return this.registerForm.controls['numeroNational'].value
  }

  get telephone() {
    return this.registerForm.controls['telephone'].value
  }

  get address() {
    return this.registerForm.controls['address'].value
  }

  get iban() {
    return this.registerForm.controls['iban'].value
  }

}
