import { Component, effect, inject, signal } from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {
  BrnDialogContentDirective,
  BrnDialogTriggerDirective,
} from '@spartan-ng/ui-dialog-brain';
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogDescriptionDirective,
  HlmDialogFooterComponent,
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective,
} from '@spartan-ng/ui-dialog-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import { MeetService } from '../../shared/services/meet.service';
import { MeetEntity } from '../../shared/entities/meet.entity';
import { DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UsersService } from '../../shared/services/users.service';
import { AuthService } from '../../shared/services/auth.service';
import { UserEntity } from '../../shared/entities/user.entity';

@Component({
  selector: 'app-home-new-users',
  standalone: true,
  imports: [
    BrnSelectImports,
    HlmSelectImports,
    BrnDialogTriggerDirective,
    BrnDialogContentDirective,

    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogHeaderComponent,
    HlmDialogFooterComponent,
    HlmDialogTitleDirective,
    HlmDialogDescriptionDirective,

    HlmLabelDirective,
    HlmInputDirective,
    HlmButtonDirective,
    DatePipe,
    ReactiveFormsModule,
  ],
  templateUrl: './home-new-users.component.html',
  styleUrl: './home-new-users.component.css',
})
export class HomeNewUsersComponent {
  private meetService: MeetService = inject(MeetService);
  private userService: UsersService = inject(UsersService);
  private authService: AuthService = inject(AuthService);
  private formBuilder: FormBuilder = inject(FormBuilder);

  protected connectedUser = signal<UserEntity | null>(null);
  protected meets = signal<MeetEntity[]>([]);
  private meetToBeRegistered = signal<MeetEntity | null>(null);
  updateInfoUser: FormGroup;

  constructor() {
    effect(
      () => {
        this.connectedUser.set(this.authService.getUser());

        this.setUpdateInfoUserForm();

        this.meetService.getAll().subscribe((meets) => {
          const meetsInFuture = meets.filter(
            (meet) => new Date(meet.startDate).getTime() > new Date().getTime()
          );
          this.meets.set(meetsInFuture);
          this.meets().sort(
            (a, b) =>
              new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        });
      },
      {
        allowSignalWrites: true,
      }
    );

    this.updateInfoUser = this.formBuilder.group({
      firstName: ['', Validators.required],
      name: ['', Validators.required],
      username: ['', Validators.required],
      numeroNational: ['', Validators.required],
      telephone: ['', Validators.required],
      address: ['', Validators.required],
      iban: ['', Validators.required],
    });
  }

  setMeetToBeRegistered(meet: MeetEntity) {
    this.meetToBeRegistered.set(meet);
  }

  setUpdateInfoUserForm() {
    this.updateInfoUser.patchValue(this.connectedUser()!);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerToMeet(ctx: any) {
    this.meetService
      .registerToMeet(this.meetToBeRegistered()!)
      .subscribe((result) => {
        if (result) {
          this.meetToBeRegistered.set(null);
          ctx.close();
        }
      });
  }

  updateUser() {
    if (this.updateInfoUser.valid) {
      const userDto = this.updateInfoUser.value;
      this.userService.update(userDto).subscribe((user) => {
        this.authService.setUser(user);
        this.connectedUser.set(user);
      });
    } else {
      alert('Formulaire invalide');
    }
  }
}
