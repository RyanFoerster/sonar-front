import {
  AfterViewInit,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  lucideChevronDown,
  lucideChevronRight,
  lucideCornerDownLeft,
  lucideEdit,
  lucideUsers,
} from '@ng-icons/lucide';
import { HlmAspectRatioDirective } from '@spartan-ng/ui-aspectratio-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmIconComponent, provideIcons } from '@spartan-ng/ui-icon-helm';
import { CompteGroupeService } from '../../../shared/services/compte-groupe.service';
import { ComptePrincipalService } from '../../../shared/services/compte-principal.service';
import { CompteGroupeEntity } from '../../../shared/entities/compte-groupe.entity';
import { PrincipalAccountEntity } from '../../../shared/entities/principal-account.entity';
import { UsersService } from '../../../shared/services/users.service';
import { UserEntity } from '../../../shared/entities/user.entity';
import { EMPTY, switchMap, take, tap } from 'rxjs';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { JsonPipe, Location } from '@angular/common';

import {
  BrnPopoverCloseDirective,
  BrnPopoverComponent,
  BrnPopoverContentDirective,
  BrnPopoverTriggerDirective,
} from '@spartan-ng/ui-popover-brain';
import {
  HlmPopoverCloseDirective,
  HlmPopoverContentDirective,
} from '@spartan-ng/ui-popover-helm';

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

@Component({
  selector: 'app-home-group',
  standalone: true,
  imports: [
    HlmAspectRatioDirective,
    HlmButtonDirective,
    HlmIconComponent,
    RouterLink,
    BrnPopoverCloseDirective,
    BrnPopoverComponent,
    BrnPopoverContentDirective,
    BrnPopoverTriggerDirective,
    HlmPopoverCloseDirective,
    HlmPopoverContentDirective,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogFooterComponent,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    JsonPipe,
  ],
  templateUrl: './home-group.component.html',
  styleUrl: './home-group.component.css',
  providers: [
    provideIcons({
      lucideEdit,
      lucideChevronRight,
      lucideCornerDownLeft,
      lucideChevronDown,
      lucideUsers,
    }),
  ],
})
export class HomeGroupComponent implements AfterViewInit {
  id = input<number>();
  typeOfProjet = input<string>();
  projet: WritableSignal<CompteGroupeEntity | PrincipalAccountEntity | null> =
    signal(null);
  connectedUser: WritableSignal<UserEntity | null> = signal(null);
  userInfo: WritableSignal<UserEntity | null> = signal(null);
  members: WritableSignal<any[]> = signal([]);

  private compteGroupeService: CompteGroupeService =
    inject(CompteGroupeService);
  private comptePrincipalService: ComptePrincipalService = inject(
    ComptePrincipalService
  );
  private usersService: UsersService = inject(UsersService);

  constructor(private location: Location) {}

  async ngAfterViewInit() {
    await this.fetchUserProjectInfo();
  }

  async fetchUserProjectInfo() {
    this.usersService
      .getInfo()
      .pipe(
        tap((user) => this.connectedUser.set(user)),
        switchMap((user) => {
          if (user.role === 'ADMIN') {
            return this.typeOfProjet() === 'PRINCIPAL'
              ? this.comptePrincipalService.getGroupById(this.id()!).pipe(
                  tap((data) => this.projet.set(data)),
                  switchMap(() =>
                    this.usersService
                      .getUserInfoByPrincipalAccount(this.id()!)
                      .pipe(tap((data) => this.userInfo.set(data)))
                  )
                )
              : this.compteGroupeService.getGroupById(this.id()!).pipe(
                  tap((data) => this.projet.set(data)),
                  switchMap(() =>
                    this.compteGroupeService.getAllMembers(this.id()!).pipe(
                      tap((members) => {
                        this.members.set(members);
                        if (members.length > 0) {
                          this.userInfo.set(members[0]);
                        }
                        console.log('members', members);
                      })
                    )
                  )
                );
          }

          // Pour les utilisateurs non-admin
          if (
            this.typeOfProjet() === 'PRINCIPAL' &&
            user.comptePrincipal.id === this.id()
          ) {
            return this.comptePrincipalService
              .getGroupById(this.id()!)
              .pipe(tap((data) => this.projet.set(data)));
          }

          if (this.typeOfProjet() === 'GROUP') {
            const hasAccess = user.userSecondaryAccounts?.some(
              (account) => account.secondary_account_id === +this.id()!
            );
            console.log('hasAccess:', hasAccess);
            console.log(
              'user.userSecondaryAccounts:',
              user.userSecondaryAccounts
            );
            console.log('this.id():', this.id());
            if (hasAccess) {
              return this.compteGroupeService.getGroupById(this.id()!).pipe(
                tap((data) => {
                  console.log('Groupe data:', data);
                  this.projet.set(data);
                }),
                switchMap(() =>
                  this.compteGroupeService.getAllMembers(this.id()!).pipe(
                    tap((members) => {
                      console.log('Members data structure:', members);
                      if (members.length > 0) {
                        this.members.set(members);
                        this.userInfo.set(members[0]);
                        console.log('Members after set:', this.members());
                      }
                    })
                  )
                )
              );
            }
          }

          return EMPTY;
        }),
        take(1)
      )
      .subscribe();
  }

  goBack() {
    this.location.back();
  }
}
