import {JsonPipe} from '@angular/common';
import {Component, inject, signal, WritableSignal,} from '@angular/core';
import {BrnAccordionContentComponent} from '@spartan-ng/ui-accordion-brain';
import {
  HlmAccordionContentDirective,
  HlmAccordionDirective,
  HlmAccordionIconDirective,
  HlmAccordionItemDirective,
  HlmAccordionTriggerDirective,
} from '@spartan-ng/ui-accordion-helm';
import {HlmIconComponent} from '@spartan-ng/ui-icon-helm';
import {AccordionModule} from 'primeng/accordion';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {InputTextModule} from 'primeng/inputtext';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {AccountComponentComponent} from './account-component/account-component.component';
import {AuthService} from '../../shared/services/auth.service';
import {UserEntity} from '../../shared/entities/user.entity';
import {UsersService} from '../../shared/services/users.service';
import {tap} from 'rxjs';
import {CompteGroupeEntity} from '../../shared/entities/compte-groupe.entity';
import {sign} from 'crypto';
import {CompteGroupeService} from '../../shared/services/compte-groupe.service';
import {ComptePrincipalService} from '../../shared/services/compte-principal.service';
import {PrincipalAccountEntity} from '../../shared/entities/principal-account.entity';
import {BrnDialogContentDirective, BrnDialogTriggerDirective} from '@spartan-ng/ui-dialog-brain';
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogDescriptionDirective,
  HlmDialogFooterComponent,
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective,
} from '@spartan-ng/ui-dialog-helm';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    BrnAccordionContentComponent,
    HlmAccordionContentDirective,
    HlmAccordionDirective,
    HlmAccordionIconDirective,
    HlmAccordionItemDirective,
    HlmAccordionTriggerDirective,
    HlmIconComponent,
    AccordionModule,
    InputTextModule,
    InputIconModule,
    IconFieldModule,
    HlmButtonDirective,
    AccountComponentComponent,
    JsonPipe,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogFooterComponent,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    ReactiveFormsModule,
    HlmDialogFooterComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {

  createGroupProjectForm!: FormGroup

  userConnected: WritableSignal<UserEntity | null> = signal(null);
  groupAccounts: WritableSignal<CompteGroupeEntity[] | null> = signal(null);
  comptePrincipal: WritableSignal<PrincipalAccountEntity[] | null> =
    signal(null);

  usersService: UsersService = inject(UsersService);
  groupAccountService: CompteGroupeService = inject(CompteGroupeService);
  comptePrincipalService: ComptePrincipalService = inject(ComptePrincipalService);
  formBuilder: FormBuilder = inject(FormBuilder)

  constructor() {
    this.setConnectedUser()

    this.createGroupProjectForm = this.formBuilder.group({
      username: ['', [Validators.required]],
    })
  }

  createGroupProject() {
    if(this.createGroupProjectForm.valid) {
      this.groupAccountService.createGroupeProject(this.createGroupProjectForm.value).pipe(
        tap(() => this.setConnectedUser())
      ).subscribe()
    }
  }

  setConnectedUser() {
    this.usersService
      .getInfo()
      .pipe(
        tap((data) => this.userConnected.set(data)),
        tap(() => {
          if (this.userConnected()?.role === 'ADMIN') {
            this.groupAccountService
              .getAllGroupAccount()
              .pipe(tap((data) => this.groupAccounts.set(data)))
              .subscribe();

            this.comptePrincipalService
              .getAllGroupPrincipal()
              .pipe(tap((data) => this.comptePrincipal.set(data)))
              .subscribe();
          }
        })
      )
      .subscribe();
  }


}
