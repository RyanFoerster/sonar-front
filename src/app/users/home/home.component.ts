import { Component, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { tap, catchError, throwError } from 'rxjs';
import {
  HlmAccordionContentComponent,
  HlmAccordionDirective,
  HlmAccordionIconDirective,
  HlmAccordionItemDirective,
  HlmAccordionTriggerDirective,
} from '@spartan-ng/ui-accordion-helm';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {
  BrnDialogContentDirective,
  BrnDialogTriggerDirective,
} from '@spartan-ng/ui-dialog-brain';
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogDescriptionDirective,
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective,
} from '@spartan-ng/ui-dialog-helm';
import { AccountComponentComponent } from './account-component/account-component.component';
import { UsersService } from '../../shared/services/users.service';
import { CompteGroupeService } from '../../shared/services/compte-groupe.service';
import { ComptePrincipalService } from '../../shared/services/compte-principal.service';
import { UserEntity } from '../../shared/entities/user.entity';
import { CompteGroupeEntity } from '../../shared/entities/compte-groupe.entity';
import { PrincipalAccountEntity } from '../../shared/entities/principal-account.entity';
import { GroupProjectDto } from '../../shared/dtos/group-project.dto';
import { UserSecondaryAccountEntity } from '../../shared/entities/user-secondary-account.entity';
import { provideIcons } from '@ng-icons/core';
import { lucideLoader } from '@ng-icons/lucide';
import { NotificationTestComponent } from '../../test/notification-test/notification-test.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HlmAccordionContentComponent,
    HlmAccordionDirective,
    HlmAccordionIconDirective,
    HlmAccordionItemDirective,
    HlmAccordionTriggerDirective,
    HlmIconComponent,
    HlmInputDirective,
    HlmButtonDirective,
    AccountComponentComponent,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    ReactiveFormsModule,
    FormsModule,
    NotificationTestComponent,
  ],
  providers: [provideIcons({ lucideLoader })],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly usersService = inject(UsersService);
  private readonly groupAccountService = inject(CompteGroupeService);
  private readonly comptePrincipalService = inject(ComptePrincipalService);
  private readonly formBuilder = inject(FormBuilder);
  readonly createGroupProjectForm = this.formBuilder.group({
    username: ['', [Validators.required]],
  });

  private readonly userConnected = signal<UserEntity | null>(null);
  protected readonly groupAccounts = signal<CompteGroupeEntity[] | null>(null);
  private readonly comptePrincipal = signal<PrincipalAccountEntity[] | null>(
    null
  );
  protected readonly searchTerm = signal<string>('');
  protected readonly errorMessage = signal<string>('');
  protected readonly isLoadingAccounts = signal<boolean>(false);

  // Computed signals pour les données filtrées
  readonly filteredGroupAccounts = computed(() => {
    const accounts = this.groupAccounts();
    const term = this.searchTerm().toLowerCase().trim();

    if (!accounts || !term) return accounts;

    return accounts.filter(
      (account) =>
        account.username.toLowerCase().includes(term) ||
        account.id.toString().includes(term) ||
        account.userSecondaryAccount?.some(
          (member: UserSecondaryAccountEntity) =>
            member.user.firstName.toLowerCase().includes(term) ||
            member.user.name.toLowerCase().includes(term) ||
            member.user.email.toLowerCase().includes(term)
        )
    );
  });

  readonly filteredPrincipalAccounts = computed(() => {
    const accounts = this.comptePrincipal();
    const term = this.searchTerm().toLowerCase().trim();

    if (!accounts || !term) return accounts;

    return accounts.filter(
      (account) =>
        account.username.toLowerCase().includes(term) ||
        account.id.toString().includes(term) ||
        account.user?.firstName.toLowerCase().includes(term) ||
        account.user?.name.toLowerCase().includes(term) ||
        account.user?.email.toLowerCase().includes(term)
    );
  });

  // Computed signal pour l'utilisateur connecté
  readonly isAdmin = computed(() => this.userConnected()?.role === 'ADMIN');
  readonly userPrincipalAccount = computed(
    () => this.userConnected()?.comptePrincipal
  );
  readonly userSecondaryAccounts = computed(
    () => this.userConnected()?.userSecondaryAccounts
  );

  constructor() {
    this.initializeData();
  }

  private initializeData(): void {
    this.usersService
      .getInfo()
      .pipe(
        tap((user) => {
          this.userConnected.set(user);
          if (this.isAdmin()) {
            this.isLoadingAccounts.set(true);
            this.loadAdminData();
          } else {
            this.loadUserData();
          }
        })
      )
      .subscribe();
  }

  private loadAdminData(): void {
    this.groupAccountService
      .getAllGroupAccount()
      .pipe(
        tap((data) => this.groupAccounts.set(data.sort((a, b) => a.id - b.id)))
      )
      .subscribe();

    this.comptePrincipalService
      .getAllGroupPrincipal()
      .pipe(
        tap((data) =>
          this.comptePrincipal.set(data.sort((a, b) => a.id - b.id))
        ),
        tap(() => this.isLoadingAccounts.set(false))
      )
      .subscribe();
  }

  private loadUserData(): void {
    this.groupAccountService
      .getGroupByUser(this.userConnected()?.id || 0)
      .pipe(
        tap((data) => this.groupAccounts.set(data.sort((a, b) => a.id - b.id))),
        tap(() => console.log(this.groupAccounts()))
      )
      .subscribe();
  }

  onSearch(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value;
    this.searchTerm.set(searchValue);
  }

  createGroupProject(): void {
    if (this.createGroupProjectForm.valid) {
      const formValue = this.createGroupProjectForm.value;
      const groupProjectDto: GroupProjectDto = {
        username: formValue.username || '',
      };

      this.groupAccountService
        .createGroupeProject(groupProjectDto)
        .pipe(
          tap(() => {
            this.errorMessage.set('');
            this.createGroupProjectForm.reset();
            this.initializeData();
          }),
          catchError((error) => {
            console.error('Erreur lors de la création du groupe:', error);
            this.errorMessage.set(
              error.error?.message ||
                'Une erreur est survenue lors de la création du groupe'
            );
            return throwError(() => error);
          })
        )
        .subscribe();
    }
  }

  // Getters publics pour le template
  getUserConnected() {
    return this.userConnected;
  }
  getSearchTermValue() {
    return this.searchTerm();
  }
}
