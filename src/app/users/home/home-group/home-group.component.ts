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
import { Location } from '@angular/common';

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
  ],
  templateUrl: './home-group.component.html',
  styleUrl: './home-group.component.css',
  providers: [
    provideIcons({
      lucideEdit,
      lucideChevronRight,
      lucideCornerDownLeft,
      lucideChevronDown,
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

  private compteGroupeService: CompteGroupeService =
    inject(CompteGroupeService);
  private comptePrincipalService: ComptePrincipalService = inject(
    ComptePrincipalService
  );
  private authService: AuthService = inject(AuthService);
  private usersService: UsersService = inject(UsersService);

  constructor(private location: Location) {}

  async ngAfterViewInit() {
    await this.fetchUserProjectInfo();
  }

  async fetchUserProjectInfo() {
    this.usersService
      .getInfo()
      .pipe(
        tap((data) => this.connectedUser.set(data)),
        switchMap((user) => {
          // Récupération des informations utilisateur si admin
          if (user.role === 'ADMIN') {
            const userInfoObservable =
              this.typeOfProjet() === 'PRINCIPAL'
                ? this.usersService.getUserInfoByPrincipalAccount(this.id()!)
                : this.usersService.getUserInfoBySecondaryAccount(this.id()!);

            return userInfoObservable.pipe(
              tap((data) => this.userInfo.set(data)),
              switchMap(() => {
                // Récupération des informations du projet
                if (this.typeOfProjet() === 'PRINCIPAL') {
                  return this.comptePrincipalService.getGroupById(this.id()!);
                } else if (this.typeOfProjet() === 'GROUP') {
                  return this.compteGroupeService.getGroupById(this.id()!);
                }
                return EMPTY;
              })
            );
          }

          // Pour les utilisateurs non-admin
          if (this.typeOfProjet() === 'PRINCIPAL') {
            if (user.comptePrincipal.id === this.id()) {
              return this.comptePrincipalService.getGroupById(this.id()!);
            }
          } else if (this.typeOfProjet() === 'GROUP') {
            const hasAccess = user.userSecondaryAccounts?.some(
              (account) => account.id === this.id()
            );
            if (hasAccess) {
              return this.compteGroupeService.getGroupById(this.id()!);
            }
          }
          return EMPTY;
        }),
        tap((data) => {
          if (data) {
            this.projet.set(data);
          }
        }),
        take(1)
      )
      .subscribe();
  }

  goBack() {
    this.location.back();
  }
}
