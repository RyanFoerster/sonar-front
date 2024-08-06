import {AfterViewInit, Component, effect, inject, signal} from '@angular/core';
import {lucideEdit} from '@ng-icons/lucide';
import {HlmAspectRatioDirective} from '@spartan-ng/ui-aspectratio-helm';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {HlmIconComponent, provideIcons} from '@spartan-ng/ui-icon-helm';
import {BrnDialogContentDirective, BrnDialogTriggerDirective} from '@spartan-ng/ui-dialog-brain';
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogDescriptionDirective,
  HlmDialogFooterComponent,
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective,
} from '@spartan-ng/ui-dialog-helm';
import {UserEntity} from "../../shared/entities/user.entity";
import {UsersService} from "../../shared/services/users.service";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {UpdateUserDto} from "../../shared/dtos/update-user.dto";
import {switchMap} from "rxjs";
import {NgOptimizedImage} from "@angular/common";


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    HlmAspectRatioDirective,
    HlmButtonDirective,
    HlmIconComponent,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogFooterComponent,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    ReactiveFormsModule,
    NgOptimizedImage
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  providers: [provideIcons({lucideEdit})]
})
export class ProfileComponent implements AfterViewInit {

  protected connectedUser = signal<UserEntity | null>(null)
  protected profilePicture = signal<any>(null)
  protected updateUserForm!: FormGroup

  private usersService: UsersService = inject(UsersService)
  private formBuilder: FormBuilder = inject(FormBuilder)

  constructor() {

    this.updateUserForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      name: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      numeroNational: ['', [Validators.required]],
      telephone: ['', [Validators.required]],
      email: ['', [Validators.required]],
      iban: ['', [Validators.required]],
      address: [''],
    })

    effect(() => {
      const user = this.connectedUser();
      if (user) {
        this.updateUserForm.patchValue({iban: user.iban});
        this.updateUserForm.patchValue({username: user.comptePrincipal.username});
        this.updateUserForm.patchValue({name: user.name});
        this.updateUserForm.patchValue({firstName: user.firstName});
        this.updateUserForm.patchValue({numeroNational: user.numeroNational});
        this.updateUserForm.patchValue({telephone: user.telephone});
        this.updateUserForm.patchValue({email: user.email});
        this.updateUserForm.patchValue({address: user.address});
      }
    });
  }

  ngAfterViewInit() {

    this.usersService.getInfo().subscribe(data => {
      this.connectedUser.set(data)
    });
  }

  updateUser(ctx: any) {

    console.log(this.updateUserForm.value)

    if (this.updateUserForm.valid) {
      const updateUserDto: UpdateUserDto = this.updateUserForm.value

      this.usersService.update(updateUserDto).subscribe(user => {
        this.connectedUser.set(user)
        ctx.close()
      })
    }
  }

}
