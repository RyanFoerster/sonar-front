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
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';

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
    ReactiveFormsModule,
    HlmInputDirective,
    HlmLabelDirective,
    HlmSpinnerComponent,
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

  protected readonly state = {
    isLoadingUpdateName: signal(false),
    errorMessage: signal(''),
  };

  protected updateNameForm: FormGroup;

  constructor(private location: Location, private formBuilder: FormBuilder) {
    this.updateNameForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

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
                    this.comptePrincipalService.getAllMembers(this.id()!).pipe(
                      tap((data) => {
                        if (data.length > 0) {
                          this.members.set([{ user: data[0].user }]);
                        }
                      })
                    )
                  )
                )
              : this.compteGroupeService.getGroupById(this.id()!).pipe(
                  tap((data) => this.projet.set(data)),
                  switchMap(() =>
                    this.compteGroupeService.getAllMembers(this.id()!).pipe(
                      tap((members) => {
                        if (members.length > 0) {
                          this.members.set(members);
                          this.userInfo.set(members[0]);
                        }
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
            if (hasAccess) {
              return this.compteGroupeService.getGroupById(this.id()!).pipe(
                tap((data) => {
                  this.projet.set(data);
                }),
                switchMap(() =>
                  this.compteGroupeService.getAllMembers(this.id()!).pipe(
                    tap((members) => {
                      if (members.length > 0) {
                        this.members.set(members);
                        this.userInfo.set(members[0]);
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

  protected canEditName(): boolean {
    if (!this.typeOfProjet() || !this.connectedUser()) return false;

    // Vérifier si c'est un projet de groupe
    if (this.typeOfProjet() !== 'GROUP') return false;

    const user = this.connectedUser();
    if (!user) return false;

    // Les admins peuvent toujours modifier
    if (user.role === 'ADMIN') return true;

    // Vérifier si l'utilisateur est membre du groupe
    const isMember = this.members().some(
      (member) => member.user.id === user.id
    );
    return isMember;
  }

  protected updateGroupName(ctx: { close: () => void }): void {
    if (this.updateNameForm.valid && this.projet()) {
      this.state.isLoadingUpdateName.set(true);
      const newUsername = this.updateNameForm.get('username')?.value;

      if (this.typeOfProjet() === 'GROUP') {
        const currentGroup = this.projet() as CompteGroupeEntity;

        this.compteGroupeService
          .updateGroupName(currentGroup.id, newUsername)
          .pipe(
            switchMap(() =>
              this.compteGroupeService.getGroupById(currentGroup.id)
            )
          )
          .subscribe({
            next: (updatedGroup) => {
              this.projet.set(updatedGroup);
              this.updateNameForm.reset();
              this.state.errorMessage.set('');
              this.state.isLoadingUpdateName.set(false);
              ctx.close();
            },
            error: (error) => {
              console.error('Erreur lors de la mise à jour du nom:', error);
              this.state.errorMessage.set(
                error.error.message || 'Une erreur est survenue'
              );
              this.state.isLoadingUpdateName.set(false);
            },
          });
      }
    }
  }
}
