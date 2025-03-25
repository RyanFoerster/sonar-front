import { Location } from '@angular/common';
import {
  AfterViewInit,
  Component,
  inject,
  input,
  signal,
  HostListener,
  OnDestroy,
  computed,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideChevronDown,
  lucideChevronsUpDown,
  lucideChevronUp,
  lucideCornerDownLeft,
  lucideSearch,
  lucideUserPlus,
} from '@ng-icons/lucide';
import { finalize, tap, EMPTY, catchError } from 'rxjs';
import { Observable } from 'rxjs';

// Spartan UI imports

import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmCheckboxComponent } from '@spartan-ng/ui-checkbox-helm';
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
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';

// Local imports
import { CompteGroupeEntity } from '../../../../shared/entities/compte-groupe.entity';
import { UserEntity } from '../../../../shared/entities/user.entity';
import { UserSecondaryAccountEntity } from '../../../../shared/entities/user-secondary-account.entity';
import { CompteGroupeService } from '../../../../shared/services/compte-groupe.service';
import { UserSecondaryAccountService } from '../../../../shared/services/user-secondary-account.service';
import { UsersService } from '../../../../shared/services/users.service';

// Types et Enums
export type RoleType =
  | 'billing'
  | 'agenda'
  | 'treasury'
  | 'gestion'
  | 'contract'
  | 'document';
export type RoleStatus = 'ADMIN' | 'VIEWER' | 'NONE';

interface MemberWithUser {
  user: UserEntity;
  userSecondaryAccounts: UserSecondaryAccountEntity[];
}

@Component({
  selector: 'app-membership',
  standalone: true,
  imports: [
    BrnSelectImports,
    HlmSelectImports,
    HlmCheckboxComponent,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    HlmButtonDirective,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogFooterComponent,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    HlmLabelDirective,
    HlmSpinnerComponent,
    HlmIconComponent,
  ],
  providers: [
    provideIcons({
      lucideChevronsUpDown,
      lucideSearch,
      lucideCheck,
      lucideCornerDownLeft,
      lucideUserPlus,
      lucideChevronDown,
      lucideChevronUp,
    }),
  ],
  templateUrl: './membership.component.html',
  styleUrl: './membership.component.css',
})
export class MembershipComponent implements AfterViewInit, OnDestroy {
  protected id = input();
  protected typeOfProjet = input<string>();
  protected account = signal<CompteGroupeEntity | null>(null);
  protected users = signal<UserEntity[]>([]);
  protected connectedUser = signal<UserEntity | undefined>(undefined);
  protected userGroup = signal<UserSecondaryAccountEntity | undefined>(
    undefined
  );
  protected currentDate = new Date();

  private readonly groupAccountService: CompteGroupeService =
    inject(CompteGroupeService);
  private readonly usersService: UsersService = inject(UsersService);
  private readonly userSecondaryAccountService: UserSecondaryAccountService =
    inject(UserSecondaryAccountService);

  public state = signal<'closed' | 'open'>('closed');
  protected usersFromDB = signal<UserEntity[]>([]);
  public currentUser = signal<UserEntity | undefined>(undefined);
  protected isSpinner = signal<boolean>(false);
  protected errorMessage = signal<string | undefined>(undefined);
  protected members = signal<MemberWithUser[]>([]);
  protected selectedUsers = signal<UserEntity[]>([]);
  protected filteredUsers = signal<UserEntity[]>([]);
  protected searchTerm = signal<string>('');
  protected isDropdownOpen = signal(false);
  protected isLoadingUsers = signal<boolean>(false);
  private hasLoadedUsers = false;

  // Ajout des signaux computed
  protected readonly sortedUsers = computed(() =>
    this.usersFromDB().sort((a, b) => a.name.localeCompare(b.name))
  );

  protected readonly filteredAndSortedUsers = computed(() => {
    const searchTerm = this.searchTerm().toLowerCase();
    const users = this.sortedUsers();

    if (!searchTerm) return users;

    return users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(searchTerm) ||
        user.name.toLowerCase().includes(searchTerm) ||
        user.username.toLowerCase().includes(searchTerm)
    );
  });

  // Map des rôles pour éviter la répétition
  private readonly roleMap: Record<RoleType, keyof UserSecondaryAccountEntity> =
    {
      billing: 'role_billing',
      agenda: 'role_agenda',
      treasury: 'role_treasury',
      gestion: 'role_gestion',
      contract: 'role_contract',
      document: 'role_document',
    };

  constructor(
    private titleService: Title,
    private metaService: Meta,
    private location: Location
  ) {
    this.titleService.setTitle('Gestion des membres');
    this.metaService.updateTag({
      name: 'description',
      content: 'Ajoutez un nouveau membre à votre projet de groupe.',
    });
  }

  private refreshMembersHandler = () => {
    if (this.typeOfProjet() === 'GROUP') {
      this.refreshMembers().subscribe({
        error: (error) => {
          console.error('Erreur lors du chargement des membres:', error);
          this.errorMessage.set('Erreur lors du chargement des membres');
          this.isSpinner.set(false);
        },
      });
    }
  };

  ngAfterViewInit() {
    // Écouter l'événement de rafraîchissement des membres
    window.addEventListener('refreshGroupMembers', this.refreshMembersHandler);

    this.usersService.getInfo().subscribe({
      next: (data) => {
        this.connectedUser.set(data);
        const account = this.connectedUser()?.userSecondaryAccounts.find(
          (account) => account.secondary_account_id === +this.id()!
        );
        this.userGroup.set(account);

        if (this.typeOfProjet() === 'GROUP') {
          // Charger les membres du groupe
          this.refreshMembers().subscribe({
            error: (error) => {
              console.error('Erreur lors du chargement des membres:', error);
              this.errorMessage.set('Erreur lors du chargement des membres');
              this.isSpinner.set(false);
            },
          });

          // Précharger la liste des utilisateurs
          this.fetchAllUsers();
        }
      },
      error: (error) => {
        console.error(
          'Erreur lors de la récupération des informations utilisateur:',
          error
        );
        this.errorMessage.set(
          'Erreur lors de la récupération des informations utilisateur'
        );
        this.isSpinner.set(false);
      },
    });
  }

  ngOnDestroy() {
    // Nettoyer l'écouteur d'événement
    window.removeEventListener(
      'refreshGroupMembers',
      this.refreshMembersHandler
    );
  }

  stateChanged(state: 'open' | 'closed'): void {
    this.state.set(state);
  }

  commandSelected(user: UserEntity): void {
    this.state.set('closed');
    if (this.currentUser()?.email === user.email) {
      this.currentUser.set(undefined);
    } else {
      this.currentUser.set(user);
    }
  }

  async fetchAllUsers(): Promise<void> {
    if (this.hasLoadedUsers) return;

    this.isLoadingUsers.set(true);
    this.errorMessage.set(undefined);

    this.usersService
      .findAllUsersWithoutRelations()
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du chargement des utilisateurs:', error);
          this.errorMessage.set('Erreur lors du chargement des utilisateurs');
          return EMPTY;
        }),
        finalize(() => {
          this.isLoadingUsers.set(false);
          this.hasLoadedUsers = true;
        })
      )
      .subscribe((users) => {
        this.usersFromDB.set(users);
        this.filteredUsers.set(users);
      });
  }

  checkViewerRole(user: UserEntity, role: RoleType): boolean {
    const account = this.findUserAccount(user);
    return account?.[this.roleMap[role]] === 'VIEWER';
  }

  checkAdminRole(user: UserEntity, role: RoleType): boolean {
    const account = this.findUserAccount(user);
    return account?.[this.roleMap[role]] === 'ADMIN';
  }

  private findUserAccount(
    user: UserEntity
  ): UserSecondaryAccountEntity | undefined {
    const member = this.members().find((m) => m.user.id === user.id);
    return member?.userSecondaryAccounts[0];
  }

  changeViewerRole(event: boolean, role: RoleType, user: UserEntity): void {
    const account = this.findUserAccount(user);
    if (!account) return;

    const status: RoleStatus = event ? 'VIEWER' : 'NONE';
    const roleProperty = this.roleMap[role];

    (account[roleProperty] as RoleStatus) = status;

    this.updateUserRole(account);
  }

  changeAdminRole(event: boolean, role: RoleType, user: UserEntity): void {
    const account = this.findUserAccount(user);
    if (!account) return;

    const status: RoleStatus = event ? 'ADMIN' : 'NONE';
    const roleProperty = this.roleMap[role];

    (account[roleProperty] as RoleStatus) = status;

    this.updateUserRole(account);
  }

  private updateUserRole(account: UserSecondaryAccountEntity): void {
    this.isSpinner.set(true);
    this.userSecondaryAccountService
      .updateUserSecondaryAccount(+this.id()!, account)
      .pipe(
        finalize(() => {
          this.isSpinner.set(false);
        })
      )
      .subscribe({
        next: () => {
          // Rafraîchir la liste des membres après la mise à jour
          this.refreshMembers();
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du rôle:', error);
          this.errorMessage.set('Erreur lors de la mise à jour du rôle');
        },
      });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private refreshMembers(): Observable<any> {
    if (this.typeOfProjet() === 'GROUP') {
      this.isSpinner.set(true);
      return this.groupAccountService.getGroupById(+this.id()!).pipe(
        tap((account: CompteGroupeEntity) => {
          this.account.set(account);
          const memberData: MemberWithUser[] = (
            account.userSecondaryAccount || []
          )
            .map((secondaryAccount: UserSecondaryAccountEntity) => {
              const user = secondaryAccount.user;
              if (!user) return null;
              return {
                user,
                userSecondaryAccounts: [secondaryAccount],
              };
            })
            .filter(
              (member: MemberWithUser | null): member is MemberWithUser =>
                member !== null
            );
          this.members.set(memberData);
        }),
        finalize(() => {
          this.isSpinner.set(false);
        })
      );
    }
    return EMPTY;
  }

  addMemberToGroup(ctx: { close: () => void }): void {
    if (!this.currentUser()?.email) return;

    this.isSpinner.set(true);
    this.errorMessage.set(undefined);

    // Créer une invitation pour l'utilisateur
    const invitation = {
      secondary_account_id: +this.id()!,
      invitedUserId: this.currentUser()!.id,
    };

    this.groupAccountService.inviteUserToGroup(invitation).subscribe({
      next: () => {
        this.isSpinner.set(false);
        ctx.close();
        // Rafraîchir la liste des membres
        this.refreshMembers().subscribe();
      },
      error: (error: any) => {
        console.error("Erreur lors de l'invitation de l'utilisateur:", error);
        this.errorMessage.set("Erreur lors de l'invitation de l'utilisateur");
        this.isSpinner.set(false);
      },
    });
  }

  goBack() {
    this.location.back();
  }

  // Ajout des méthodes pour gérer les événements de checkbox de manière typée
  protected isDisabledViewer(user: UserEntity, role: RoleType): boolean {
    return (
      this.checkAdminRole(user, role) ||
      (this.connectedUser()?.role !== 'ADMIN' &&
        this.userGroup()?.role_gestion !== 'ADMIN')
    );
  }

  protected isDisabledAdmin(user: UserEntity, role: RoleType): boolean {
    return (
      this.checkViewerRole(user, role) ||
      (this.connectedUser()?.role !== 'ADMIN' &&
        this.userGroup()?.role_gestion !== 'ADMIN')
    );
  }

  protected onViewerChange(
    checked: string | boolean,
    role: RoleType,
    user: UserEntity
  ): void {
    this.changeViewerRole(
      typeof checked === 'boolean' ? checked : checked === 'true',
      role,
      user
    );
  }

  protected onAdminChange(
    checked: string | boolean,
    role: RoleType,
    user: UserEntity
  ): void {
    this.changeAdminRole(
      typeof checked === 'boolean' ? checked : checked === 'true',
      role,
      user
    );
  }

  protected getUserInitials(user: UserEntity | undefined | null): string {
    if (!user?.firstName || !user?.name) return '';
    return `${user.firstName[0]}${user.name[0]}`;
  }

  protected filterUsers(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value.toLowerCase());
    this.filteredUsers.set(this.filteredAndSortedUsers());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const selectContainer = document.querySelector('.my-6.relative');
    if (selectContainer && !selectContainer.contains(target)) {
      this.isDropdownOpen.set(false);
    }
  }

  toggleDropdown() {
    this.isDropdownOpen.update((value) => !value);
  }

  protected toggleUserSelection(user: UserEntity): void {
    const currentUsers = this.selectedUsers();
    const isSelected = currentUsers.some((u) => u.id === user.id);

    if (isSelected) {
      this.selectedUsers.set(currentUsers.filter((u) => u.id !== user.id));
    } else {
      this.selectedUsers.set([...currentUsers, user]);
    }

    // Réinitialiser la recherche et la liste filtrée
    const searchInput = document.querySelector(
      '#searchInput'
    ) as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }
    this.searchTerm.set('');
    this.filteredUsers.set(this.filteredAndSortedUsers());
  }

  protected isUserSelected(user: UserEntity): boolean {
    return this.selectedUsers().some((u) => u.id === user.id);
  }

  protected addMembersToGroup(ctx: { close: () => void }): void {
    if (this.selectedUsers().length === 0) return;

    this.isSpinner.set(true);
    this.errorMessage.set(undefined);

    // Utiliser forkJoin pour envoyer toutes les invitations
    const invitationObservables = this.selectedUsers().map((user) => {
      const invitation = {
        secondary_account_id: +this.id()!,
        invitedUserId: user.id,
      };
      return this.groupAccountService.inviteUserToGroup(invitation);
    });

    // Utiliser forkJoin pour traiter toutes les invitations simultanément
    import('rxjs').then(({ forkJoin }) => {
      forkJoin(invitationObservables).subscribe({
        next: () => {
          this.isSpinner.set(false);
          ctx.close();
          this.selectedUsers.set([]);
          // Rafraîchir la liste des membres
          this.refreshMembers().subscribe();
        },
        error: (error: any) => {
          console.error("Erreur lors de l'invitation des utilisateurs:", error);
          this.errorMessage.set("Erreur lors de l'invitation des utilisateurs");
          this.isSpinner.set(false);
        },
      });
    });
  }

  protected getSortedUsers(): UserEntity[] {
    const currentUsers = this.selectedUsers();
    const allUsers = this.filteredAndSortedUsers();

    // Séparer les utilisateurs sélectionnés et non sélectionnés
    const selectedUsers = allUsers.filter((user) =>
      currentUsers.some((selectedUser) => selectedUser.id === user.id)
    );
    const unselectedUsers = allUsers.filter(
      (user) =>
        !currentUsers.some((selectedUser) => selectedUser.id === user.id)
    );

    // Retourner la liste combinée avec les sélectionnés en premier
    return [...selectedUsers, ...unselectedUsers];
  }
}
