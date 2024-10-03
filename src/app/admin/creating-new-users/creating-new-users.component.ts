import { Component, inject } from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UsersService } from '../../shared/services/users.service';
import { CreateUserDto } from '../../shared/dtos/create-user.dto';
import { tap } from 'rxjs';
import {
  HlmAlertDescriptionDirective,
  HlmAlertDirective,
  HlmAlertIconDirective,
  HlmAlertTitleDirective,
} from '@spartan-ng/ui-alert-helm';
import { provideIcons } from '@ng-icons/core';
import { lucideBox } from '@ng-icons/lucide';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { toast } from 'ngx-sonner';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';

@Component({
  selector: 'app-creating-new-users',
  standalone: true,
  imports: [
    HlmInputDirective,
    HlmButtonDirective,
    HlmAlertDescriptionDirective,
    HlmAlertDirective,
    HlmAlertIconDirective,
    HlmAlertTitleDirective,
    ReactiveFormsModule,
    HlmIconComponent,
    HlmToasterComponent,
  ],
  providers: [provideIcons({ lucideBox })],
  templateUrl: './creating-new-users.component.html',
  styleUrl: './creating-new-users.component.css',
})
export class CreatingNewUsersComponent {
  formBuilder: FormBuilder = inject(FormBuilder);
  usersService: UsersService = inject(UsersService);

  registerForm!: FormGroup;

  constructor() {
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required]],
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
      confirmPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            '^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$=%^&*-]).{8,}$',
          ),
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
    if (this.registerForm.valid) {
      const user: CreateUserDto = this.registerForm.value;

      return this.usersService
        .signUpFromAdmin(user)
        .pipe(
          tap((data) => {
            if (data) {
              toast("Création de l'utilisateur réussie !");
            } else {
              throw Error("Création de l'utilisateur échouée");
            }
          }),
        )
        .subscribe();
    }

    return false;
  }

  protected readonly toast = toast;
}
