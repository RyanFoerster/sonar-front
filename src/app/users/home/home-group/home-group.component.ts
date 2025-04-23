import {
  AfterViewInit,
  Component,
  inject,
  input,
  signal,
  WritableSignal,
  ChangeDetectorRef,
} from '@angular/core';
import {
  lucideChevronDown,
  lucideChevronRight,
  lucideCornerDownLeft,
  lucideEdit,
  lucideUsers,
  lucideCalendar,
  lucideTrash2,
  lucideLogOut,
} from '@ng-icons/lucide';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmIconComponent, provideIcons } from '@spartan-ng/ui-icon-helm';
import { CompteGroupeService } from '../../../shared/services/compte-groupe.service';
import { ComptePrincipalService } from '../../../shared/services/compte-principal.service';
import { CompteGroupeEntity } from '../../../shared/entities/compte-groupe.entity';
import { PrincipalAccountEntity } from '../../../shared/entities/principal-account.entity';
import { UsersService } from '../../../shared/services/users.service';
import { UserEntity } from '../../../shared/entities/user.entity';
import { EMPTY, switchMap, take, tap, catchError, finalize, of } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { Location } from '@angular/common';
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
import { UserSecondaryAccountEntity } from '../../../shared/entities/user-secondary-account.entity';

@Component({
  selector: 'app-home-group',
  standalone: true,
  imports: [
    HlmButtonDirective,
    HlmIconComponent,
    RouterLink,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogFooterComponent,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
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
      lucideCalendar,
      lucideTrash2,
      lucideLogOut,
    }),
  ],
})
export class HomeGroupComponent implements AfterViewInit {
  id = input<number>();
  typeOfProjet = input<string>();
  projet: WritableSignal<CompteGroupeEntity | PrincipalAccountEntity | null> =
    signal(null);
  connectedUser: WritableSignal<UserEntity | null> = signal(null);
  connectedUserAccountInfo: WritableSignal<UserSecondaryAccountEntity | null> =
    signal(null);
  members: WritableSignal<UserSecondaryAccountEntity[]> = signal([]);

  private compteGroupeService: CompteGroupeService =
    inject(CompteGroupeService);
  private comptePrincipalService: ComptePrincipalService = inject(
    ComptePrincipalService
  );
  private usersService: UsersService = inject(UsersService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  protected readonly state = {
    isLoadingUpdateName: signal(false),
    isLoadingMembers: signal(false),
    isLeavingGroup: signal(false),
    removingMemberId: signal<number | null>(null),
    errorMessage: signal(''),
    successMessage: signal(''),
  };

  protected updateNameForm: FormGroup;

  constructor(private location: Location, private formBuilder: FormBuilder) {
    this.updateNameForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  async ngAfterViewInit() {
    await this.fetchInitialData();
  }

  async fetchInitialData() {
    this.state.isLoadingMembers.set(true);
    this.state.errorMessage.set('');
    this.state.successMessage.set('');

    this.usersService
      .getInfo()
      .pipe(
        tap((user) => {
          this.connectedUser.set(user);
        }),
        switchMap((user) => {
          if (!this.id()) {
            console.error(
              '[HomeGroup] fetchInitialData - ERROR: Project ID is missing!'
            );
            this.state.errorMessage.set('ID du projet manquant.');
            return EMPTY;
          }
          const projectId = +this.id()!;

          // Si admin général, récupérer les infos du projet directement
          if (user.role === 'ADMIN') {
            if (this.typeOfProjet() === 'PRINCIPAL') {
              return this.comptePrincipalService.getGroupById(projectId).pipe(
                tap((data) => {
                  this.projet.set(data);
                  this.cdr.detectChanges(); // Force change detection
                }),
                switchMap(() =>
                  of([
                    {
                      user: user,
                      role_gestion: 'ADMIN',
                    } as Partial<UserSecondaryAccountEntity>,
                  ])
                )
              );
            } else {
              // GROUP

              return this.compteGroupeService.getGroupById(projectId).pipe(
                tap((data) => {
                  this.projet.set(data);
                  this.cdr.detectChanges(); // Force change detection
                }),
                switchMap((groupData) => {
                  if (!groupData) return of([]); // Handle case where groupData might be null/undefined
                  return this.fetchMembers(projectId);
                })
              );
            }
          }

          // Utilisateur normal

          if (this.typeOfProjet() === 'PRINCIPAL') {
            if (user.comptePrincipal?.id === projectId) {
              return this.comptePrincipalService.getGroupById(projectId).pipe(
                tap((data) => {
                  this.projet.set(data);
                  this.cdr.detectChanges(); // Force change detection
                }),
                switchMap(() =>
                  of([
                    {
                      user: user,
                      role_gestion: 'ADMIN',
                    } as Partial<UserSecondaryAccountEntity>,
                  ])
                )
              );
            } else {
              console.error(
                '[HomeGroup] fetchInitialData - ERROR: Access Denied - Principal Project'
              );
              this.state.errorMessage.set(
                'Accès non autorisé à ce projet principal.'
              );
              return EMPTY; // Pas d'accès
            }
          } else {
            // GROUP

            const accountInfo = user.userSecondaryAccounts?.find((acc) => {
              // Logguer les détails de chaque élément pendant l'itération du find

              return acc.secondary_account_id === +projectId;
            });

            if (accountInfo) {
              this.connectedUserAccountInfo.set(accountInfo);
              return this.compteGroupeService.getGroupById(projectId).pipe(
                tap((data) => {
                  this.projet.set(data);
                  this.cdr.detectChanges(); // Force change detection
                }),
                switchMap((groupData) => {
                  if (!groupData) return of([]); // Handle case where groupData might be null/undefined
                  return this.fetchMembers(projectId);
                })
              );
            } else {
              console.error(
                '[HomeGroup] fetchInitialData - ERROR: Access Denied - Not a member'
              );
              this.state.errorMessage.set(
                "Vous n'êtes pas membre de ce groupe."
              );
              return EMPTY; // Pas membre
            }
          }
        }),
        take(1),
        finalize(() => {
          this.state.isLoadingMembers.set(false);
          this.cdr.detectChanges(); // Ensure UI updates after loading finishes
        })
      )
      .subscribe({
        error: (err) => {
          console.error(
            '[HomeGroup] fetchInitialData - ERROR in subscription:',
            err
          );
          this.state.errorMessage.set(
            err.error?.message ||
              'Impossible de charger les informations du projet.'
          );
          this.cdr.detectChanges(); // Update UI with error
        },
      });
  }

  fetchMembers(projectId: number) {
    this.state.isLoadingMembers.set(true);
    return this.compteGroupeService.getAllMembers(projectId).pipe(
      tap((members) => {
        this.members.set(members);
        const currentUserAccount = members.find(
          (m) => m.user.id === this.connectedUser()?.id
        );
        if (currentUserAccount) {
          this.connectedUserAccountInfo.set(currentUserAccount);
        }
      }),
      catchError((err) => {
        console.error('Erreur lors du chargement des membres:', err);
        this.state.errorMessage.set(
          err.error?.message || 'Impossible de charger les membres du groupe.'
        );
        return of([]);
      }),
      finalize(() => this.state.isLoadingMembers.set(false))
    );
  }

  goBack() {
    this.location.back();
  }

  protected canEditName(): boolean {
    if (!this.typeOfProjet() || !this.connectedUser()) return false;

    const user = this.connectedUser();
    if (!user) return false;

    if (user.role === 'ADMIN') return true;

    if (this.typeOfProjet() === 'GROUP') {
      return this.connectedUserAccountInfo()?.role_gestion === 'ADMIN';
    }

    return false;
  }

  protected updateGroupName(ctx: { close: () => void }): void {
    if (this.updateNameForm.valid && this.projet()) {
      this.state.isLoadingUpdateName.set(true);
      this.state.errorMessage.set('');
      this.state.successMessage.set('');
      const newUsername = this.updateNameForm.get('username')?.value;
      const projectId = this.id();

      if (this.typeOfProjet() === 'GROUP' && projectId) {
        this.compteGroupeService
          .updateGroupName(projectId, newUsername)
          .pipe(
            switchMap(() => this.compteGroupeService.getGroupById(projectId)),
            finalize(() => this.state.isLoadingUpdateName.set(false))
          )
          .subscribe({
            next: (updatedGroup) => {
              this.projet.set(updatedGroup);
              this.updateNameForm.reset();
              this.state.successMessage.set('Nom du groupe mis à jour.');
              ctx.close();
            },
            error: (error) => {
              console.error('Erreur lors de la mise à jour du nom:', error);
              this.state.errorMessage.set(
                error.error?.message || 'Une erreur est survenue'
              );
            },
          });
      } else {
        this.state.isLoadingUpdateName.set(false);
      }
    }
  }

  protected isCurrentUserMember(): boolean {
    const userId = this.connectedUser()?.id;
    if (!userId || this.typeOfProjet() !== 'GROUP') {
      return false;
    }
    return this.members().some((member) => member.user.id === userId);
  }

  protected canRemoveMember(memberUserId: number): boolean {
    if (this.typeOfProjet() !== 'GROUP' || !this.connectedUser()) return false;

    const connectedUserId = this.connectedUser()?.id;
    if (connectedUserId === memberUserId) return false;

    if (this.connectedUser()?.role === 'ADMIN') return true;

    return this.connectedUserAccountInfo()?.role_gestion === 'ADMIN';
  }

  protected leaveCurrentGroup(): void {
    const groupId = this.id();
    if (!groupId || this.typeOfProjet() !== 'GROUP') return;

    if (
      confirm(
        'Êtes-vous sûr de vouloir quitter ce groupe ? Cette action est irréversible.'
      )
    ) {
      this.state.isLeavingGroup.set(true);
      this.state.errorMessage.set('');
      this.state.successMessage.set('');

      this.compteGroupeService
        .leaveGroup(groupId)
        .pipe(finalize(() => this.state.isLeavingGroup.set(false)))
        .subscribe({
          next: (response) => {
            this.state.successMessage.set(response.message);
            this.router.navigate(['/users/home']);
          },
          error: (err) => {
            console.error('Erreur lors du départ du groupe:', err);
            this.state.errorMessage.set(
              err.error?.message || 'Impossible de quitter le groupe.'
            );
          },
        });
    }
  }

  protected removeMemberFromGroup(memberUserId: number): void {
    const groupId = this.id();
    if (!groupId || !this.canRemoveMember(memberUserId)) return;

    const memberToRemove = this.members().find(
      (m) => m.user.id === memberUserId
    );
    const memberName = memberToRemove
      ? `${memberToRemove.user.firstName} ${memberToRemove.user.name}`
      : 'ce membre';

    if (
      confirm(`Êtes-vous sûr de vouloir retirer ${memberName} de ce groupe ?`)
    ) {
      this.state.removingMemberId.set(memberUserId);
      this.state.errorMessage.set('');
      this.state.successMessage.set('');

      this.compteGroupeService
        .removeMember(groupId, memberUserId)
        .pipe(finalize(() => this.state.removingMemberId.set(null)))
        .subscribe({
          next: (response) => {
            this.state.successMessage.set(response.message);
            this.members.update((currentMembers) =>
              currentMembers.filter((m) => m.user.id !== memberUserId)
            );
          },
          error: (err) => {
            console.error(
              `Erreur lors du retrait du membre ${memberUserId}:`,
              err
            );
            this.state.errorMessage.set(
              err.error?.message || 'Impossible de retirer le membre.'
            );
          },
        });
    }
  }
}
