import {AfterViewInit, Component, importProvidersFrom, inject, input, signal} from '@angular/core';
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {BrnDialogContentDirective, BrnDialogTriggerDirective} from '@spartan-ng/ui-dialog-brain';
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogDescriptionDirective,
  HlmDialogFooterComponent,
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective,
} from '@spartan-ng/ui-dialog-helm';
import {
  BrnPopoverComponent,
  BrnPopoverContentDirective,
  BrnPopoverTriggerDirective,
} from '@spartan-ng/ui-popover-brain';
import {HlmCommandImports} from '@spartan-ng/ui-command-helm';
import {HlmIconComponent} from '@spartan-ng/ui-icon-helm';
import {HlmPopoverContentDirective} from '@spartan-ng/ui-popover-helm';
import {HlmInputDirective} from '@spartan-ng/ui-input-helm';
import {HlmLabelDirective} from '@spartan-ng/ui-label-helm';
import {HlmCheckboxComponent} from '@spartan-ng/ui-checkbox-helm';
import {BrnSelectImports} from '@spartan-ng/ui-select-brain';
import {HlmSelectImports} from '@spartan-ng/ui-select-helm';
import {CompteGroupeEntity} from "../../../../shared/entities/compte-groupe.entity";
import {CompteGroupeService} from "../../../../shared/services/compte-groupe.service";
import {HlmSpinnerComponent} from "@spartan-ng/ui-spinner-helm";
import {DatePipe, JsonPipe} from "@angular/common";
import {UsersService} from "../../../../shared/services/users.service";
import {UserEntity} from "../../../../shared/entities/user.entity";
import {Meta, Title} from "@angular/platform-browser";
import {UserSecondaryAccountService} from "../../../../shared/services/user-secondary-account.service";
import {UserSecondaryAccountEntity} from "../../../../shared/entities/user-secondary-account.entity";
import {provideIcons} from "@ng-icons/core";
import {lucideCheck, lucideChevronsUpDown, lucideSearch} from "@ng-icons/lucide";
import {delay, tap} from "rxjs";
import { BrnAccordionContentComponent } from '@spartan-ng/ui-accordion-brain';
import {
  HlmAccordionContentDirective,
  HlmAccordionDirective,
  HlmAccordionIconDirective,
  HlmAccordionItemDirective,
  HlmAccordionTriggerDirective,
} from '@spartan-ng/ui-accordion-helm';
import {BrnSeparatorComponent} from "@spartan-ng/ui-separator-brain";
import {HlmSeparatorDirective} from "@spartan-ng/ui-separator-helm";
import {BrnCommandImports} from "@spartan-ng/ui-command-brain";


@Component({
  selector: 'app-membership',
  standalone: true,
  imports: [
    HlmAccordionContentDirective,
    HlmAccordionDirective,
    HlmAccordionIconDirective,
    HlmAccordionItemDirective,
    HlmAccordionTriggerDirective,
    BrnAccordionContentComponent,
    BrnSelectImports,
    HlmSelectImports,
    HlmCheckboxComponent,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    HlmCaptionComponent,
    HlmTableComponent,
    HlmTdComponent,
    HlmThComponent,
    HlmTrowComponent,
    HlmButtonDirective,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogFooterComponent,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    HlmLabelDirective,
    HlmInputDirective,
    HlmSpinnerComponent,
    JsonPipe,
    DatePipe,
    HlmCheckboxComponent,
    HlmCheckboxComponent,
    HlmCheckboxComponent,
    HlmCheckboxComponent,
    BrnPopoverComponent,
    BrnPopoverContentDirective,
    BrnPopoverTriggerDirective,
    HlmCommandImports,
    HlmIconComponent,
    HlmPopoverContentDirective,
    HlmSpinnerComponent,
    BrnSeparatorComponent,
    HlmSeparatorDirective,
    HlmIconComponent,
    BrnCommandImports
  ],
  providers: [provideIcons({lucideChevronsUpDown, lucideSearch, lucideCheck})],
  templateUrl: './membership.component.html',
  styleUrl: './membership.component.css'
})

export class MembershipComponent implements AfterViewInit {
  protected id = input()
  protected typeOfProjet = input<string>()
  protected account = signal<CompteGroupeEntity | null>(null)
  protected users = signal<UserEntity[]>([])
  protected connectedUser = signal<UserEntity | undefined>(undefined)
  protected userGroup = signal<UserSecondaryAccountEntity | undefined>(undefined)
  protected currentDate = new Date()

  private readonly groupAccountService: CompteGroupeService = inject(CompteGroupeService)
  private readonly usersService: UsersService = inject(UsersService)
  private readonly userSecondaryAccountService: UserSecondaryAccountService = inject(UserSecondaryAccountService)


  public state = signal<'closed' | 'open'>('closed');
  protected usersFromDB = signal<UserEntity[]>([])
  public currentUser = signal<UserEntity | undefined>(undefined);
  protected isSpinner = signal<boolean>(false)
  protected errorMessage = signal<string | undefined>(undefined)

  constructor(private titleService: Title, private metaService: Meta) {
    this.titleService.setTitle('Gestion des membres');
    this.metaService.updateTag({name: 'description', content: 'Ajoutez un nouveau membre à votre projet de groupe.'});

  }

  ngAfterViewInit() {

    this.usersService.getInfo().subscribe(data => {
      this.connectedUser.set(data)
      const account = this.connectedUser()?.userSecondaryAccounts.find(account => account.secondary_account_id === +this.id()!)
      this.userGroup.set(account)
    })

    if (this.typeOfProjet() === "GROUP") {
      this.usersService.getAllUsersGroup(+this.id()!).subscribe(data => {
        this.users.set(data)
      });
    }
  }

  checkViewerRole(user: UserEntity, role: "billing" | "agenda" | "treasury" | "gestion" | "contract" | "document") {
    const account = user.userSecondaryAccounts.find(account => account.secondary_account_id === +this.id()!);

    if (role === "billing") {
      return account?.role_billing === "VIEWER"
    } else if (role === "agenda") {
      return account?.role_agenda === "VIEWER"
    } else if (role === "treasury") {
      return account?.role_treasury === "VIEWER"
    } else if (role === "gestion") {
      return account?.role_gestion === "VIEWER"
    } else if (role === "contract") {
      return account?.role_contract === "VIEWER"
    } else {
      return account?.role_document === "VIEWER"
    }

  }

  changeViewerRole(event: any, role: "billing" | "agenda" | "treasury" | "gestion" | "contract" | "document", user: UserEntity) {

    const account: UserSecondaryAccountEntity | undefined = user.userSecondaryAccounts.find(account => account.secondary_account_id === +this.id()!);

    console.log(account)

    if (account) {
      const roleMap: { [key: string]: keyof UserSecondaryAccountEntity } = {
        billing: 'role_billing',
        agenda: 'role_agenda',
        treasury: 'role_treasury',
        gestion: 'role_gestion',
        contract: 'role_contract',
        document: 'role_document'
      };

      // Utilisation d'une variable pour déterminer le statut
      const status: "ADMIN" | "VIEWER" | "NONE" = event === false ? "NONE" : "VIEWER";

      // Mise à jour du rôle correspondant
      const roleProperty = roleMap[role]; // roleProperty est de type keyof UserSecondaryAccountEntity

      // Affectation de la valeur à la propriété correspondante
      // @ts-ignore
      account[roleProperty] = status; // TypeScript devrait maintenant reconnaître que roleProperty est valide

      this.userSecondaryAccountService.updateUserSecondaryAccount(+this.id()!, account).subscribe()
    }
  }

  checkAdminRole(user: UserEntity, role: "billing" | "agenda" | "treasury" | "gestion" | "contract" | "document") {
    const account = user.userSecondaryAccounts.find(account => account.secondary_account_id === +this.id()!);

    if (role === "billing") {
      return account?.role_billing === "ADMIN"
    } else if (role === "agenda") {
      return account?.role_agenda === "ADMIN"
    } else if (role === "treasury") {
      return account?.role_treasury === "ADMIN"
    } else if (role === "gestion") {
      return account?.role_gestion === "ADMIN"
    } else if (role === "contract") {
      return account?.role_contract === "ADMIN"
    } else {
      return account?.role_document === "ADMIN"
    }
  }

  changeAdminRole(event: any, role: "billing" | "agenda" | "treasury" | "gestion" | "contract" | "document", user: UserEntity) {

    const account: UserSecondaryAccountEntity | undefined = user.userSecondaryAccounts.find(account => account.secondary_account_id === +this.id()!);

    if (account) {
      const roleMap: { [key: string]: keyof UserSecondaryAccountEntity } = {
        billing: 'role_billing',
        agenda: 'role_agenda',
        treasury: 'role_treasury',
        gestion: 'role_gestion',
        contract: 'role_contract',
        document: 'role_document'
      };

      // Utilisation d'une variable pour déterminer le statut
      const status: "ADMIN" | "VIEWER" | "NONE" = event === false ? "NONE" : "ADMIN";

      // Mise à jour du rôle correspondant
      const roleProperty = roleMap[role]; // roleProperty est de type keyof UserSecondaryAccountEntity

      // Affectation de la valeur à la propriété correspondante
      // @ts-ignore
      account[roleProperty] = status; // TypeScript devrait maintenant reconnaître que roleProperty est valide

      this.userSecondaryAccountService.updateUserSecondaryAccount(+this.id()!, account).subscribe()
    }


  }

  stateChanged(state: 'open' | 'closed') {
    this.state.set(state);
  }

  commandSelected(user: UserEntity) {
    this.state.set('closed');
    if (this.currentUser()?.email === user.email) {
      this.currentUser.set(undefined);
    } else {
      this.currentUser.set(user);
    }
  }

  async fetchAllUsers() {
    this.usersService.findAll().subscribe(data => {
      this.usersFromDB.set(data)
    })
  }

  addMemberToGroup(ctx: any) {
    if (this.currentUser()?.email) {

      this.userSecondaryAccountService.addMemberGroupeProject({secondary_account_id: +this.id()!}, this.currentUser()?.email!).pipe(
        tap(async () => {
          this.isSpinner.set(true)
          this.usersService.getAllUsersGroup(+this.id()!).subscribe(data => {
            this.users.set(data)
          });
        }),
        delay(1000),
        tap(() => this.isSpinner.set(false)),
      ).subscribe({
        error: err => this.errorMessage.set(err.error.message)
      })
    }
  }


}