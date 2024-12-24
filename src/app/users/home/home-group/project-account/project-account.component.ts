import { DatePipe, JsonPipe, Location, NgClass } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  inject,
  input,
  signal,
  type WritableSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  HlmAccordionContentComponent,
  HlmAccordionDirective,
  HlmAccordionIconDirective,
  HlmAccordionItemDirective,
  HlmAccordionTriggerDirective,
} from '@spartan-ng/ui-accordion-helm';
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
import { HlmIconComponent, provideIcons } from '@spartan-ng/ui-icon-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import {
  HlmPaginationContentDirective,
  HlmPaginationDirective,
  HlmPaginationEllipsisComponent,
  HlmPaginationItemDirective,
  HlmPaginationLinkDirective,
  HlmPaginationNextComponent,
  HlmPaginationPreviousComponent,
} from '@spartan-ng/ui-pagination-helm';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import {
  catchError,
  delay,
  EMPTY,
  forkJoin,
  from,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { CompteGroupeEntity } from '../../../../shared/entities/compte-groupe.entity';
import { PrincipalAccountEntity } from '../../../../shared/entities/principal-account.entity';
import { TransactionEntity } from '../../../../shared/entities/transaction.entity';
import { EuroFormatPipe } from '../../../../shared/pipes/euro-format.pipe';
import { CompteGroupeService } from '../../../../shared/services/compte-groupe.service';
import { ComptePrincipalService } from '../../../../shared/services/compte-principal.service';
import { TransactionService } from '../../../../shared/services/transaction.service';

import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  lucideArrowLeftRight,
  lucideBanknote,
  lucideBell,
  lucideCornerDownLeft,
  lucideUpload,
} from '@ng-icons/lucide';
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
import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';
import { TransactionDto } from '../../../../shared/dtos/transaction.dto';
import { VirementSepaDto } from '../../../../shared/dtos/virement-sepa.dto';
import { VirementSepaService } from '../../../../shared/services/virement-sepa.service';
import { atLeastOneRequired } from '../../../../shared/validators/at-least-one-required.validator';

// Constantes
const ITEMS_PER_PAGE = 10;
const INITIAL_PAGE = 1;

// Interfaces
interface PaginationState {
  currentPage: WritableSignal<number>;
  totalPages: WritableSignal<number>;
  totalItems: WritableSignal<number>;
}

interface FormState {
  amount_htva: FormControl<number>;
  amount_tva: FormControl<number | null>;
  communication: FormControl<string>;
  structured_communication: FormControl<string>;
  account_owner: FormControl<string>;
  iban: FormControl<string>;
}

@Component({
  selector: 'app-project-account',
  standalone: true,
  imports: [
    BrnSelectImports,
    HlmSelectImports,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    HlmButtonDirective,
    HlmCaptionComponent,
    HlmTableComponent,
    HlmTdComponent,
    HlmThComponent,
    HlmTrowComponent,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogFooterComponent,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    HlmInputDirective,
    HlmLabelDirective,
    EuroFormatPipe,
    DatePipe,
    HlmIconComponent,
    HlmAccordionTriggerDirective,
    HlmAccordionItemDirective,
    HlmAccordionDirective,
    HlmAccordionIconDirective,
    HlmAccordionContentComponent,
    HlmThComponent,
    NgClass,
    ReactiveFormsModule,
    HlmSpinnerComponent,
    JsonPipe,
    HlmPaginationDirective,
    HlmPaginationContentDirective,
    HlmPaginationItemDirective,
    HlmPaginationLinkDirective,
    HlmPaginationEllipsisComponent,
    HlmPaginationNextComponent,
    HlmPaginationPreviousComponent,
    BrnPopoverCloseDirective,
    BrnPopoverComponent,
    BrnPopoverContentDirective,
    BrnPopoverTriggerDirective,
    HlmPopoverCloseDirective,
    HlmPopoverContentDirective,
  ],
  providers: [
    provideIcons({
      lucideCornerDownLeft,
      lucideBell,
      lucideUpload,
      lucideBanknote,
      lucideArrowLeftRight,
    }),
  ],
  templateUrl: './project-account.component.html',
  styleUrl: './project-account.component.css',
})
export class ProjectAccountComponent implements AfterViewInit {
  // Services injection
  private readonly services = {
    principalAccount: inject(ComptePrincipalService),
    groupAccount: inject(CompteGroupeService),
    transaction: inject(TransactionService),
    virementSepa: inject(VirementSepaService),
    formBuilder: inject(FormBuilder),
    router: inject(Router),
    location: inject(Location),
  };

  // Inputs
  protected readonly id = input<string>();
  protected readonly typeOfProjet = input<string>();

  // State signals
  protected readonly state = {
    isSpinner: signal(false),
    isLoadingTransfer: signal(false),
    isLoadingVirement: signal(false),
    accountPrincipal: signal<PrincipalAccountEntity | undefined>(undefined),
    accountGroup: signal<CompteGroupeEntity | undefined>(undefined),
    transactionRecipient: signal<TransactionEntity[] | undefined>(undefined),
    transactionSender: signal<TransactionEntity[] | undefined>(undefined),
    principalAccounts: signal<PrincipalAccountEntity[] | undefined>(undefined),
    filteredPrincipalAccounts: signal<PrincipalAccountEntity[] | undefined>(
      undefined
    ),
    groupAccounts: signal<CompteGroupeEntity[] | undefined>(undefined),
    filteredGroupAccounts: signal<CompteGroupeEntity[] | undefined>(undefined),
    amountHtva: signal(0),
    amountTva: signal(0),
    errorMessage: signal(''),
  };

  // Computed values
  protected readonly amount_debited = computed(
    () => +this.state.amountHtva() - +this.state.amountTva()
  );

  // Computed values pour les comptes triés
  protected readonly sortedPrincipalAccounts = computed(() =>
    this.state
      .filteredPrincipalAccounts()
      ?.slice()
      .sort((a, b) => (a.username ?? '').localeCompare(b.username ?? ''))
  );

  protected readonly sortedGroupAccounts = computed(() =>
    this.state
      .filteredGroupAccounts()
      ?.slice()
      .sort((a, b) => (a.username ?? '').localeCompare(b.username ?? ''))
  );

  // Pagination states
  protected readonly pagination = {
    sender: {
      currentPage: signal(INITIAL_PAGE),
      totalPages: signal(0),
      totalItems: signal(0),
    } as PaginationState,
    recipient: {
      currentPage: signal(INITIAL_PAGE),
      totalPages: signal(0),
      totalItems: signal(0),
    } as PaginationState,
    virement: {
      currentPage: signal(INITIAL_PAGE),
      totalPages: signal(0),
      totalItems: signal(0),
    } as PaginationState,
  };

  protected readonly itemsPerPage = signal(ITEMS_PER_PAGE);
  protected selectedFile: File | null = null;

  // Forms
  protected transactionForm!: FormGroup;
  protected virementSepaForm!: FormGroup;

  constructor() {
    this.initializeForms();
  }

  private initializeForms(): void {
    this.transactionForm = this.services.formBuilder.group({
      communication: ['', [Validators.required]],
      amount: ['', [Validators.required]],
      recipientGroup: [''],
      recipientPrincipal: [''],
    });

    this.virementSepaForm = this.services.formBuilder.group<FormState>(
      {
        account_owner: new FormControl('', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        iban: new FormControl('', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        amount_htva: new FormControl(0, {
          nonNullable: true,
          validators: [Validators.required],
        }),
        amount_tva: new FormControl(null),
        communication: new FormControl('', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        structured_communication: new FormControl('', { nonNullable: true }),
      },
      {
        validators: [atLeastOneRequired()],
      }
    );
  }

  async ngAfterViewInit() {
    await this.fetchTransaction();
    await this.fetchVirements();
  }

  protected setAmountHtva(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.state.amountHtva.set(Number(target.value));
  }

  protected setAmountTva(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.state.amountTva.set(Number(target.value));
  }

  protected createVirement(ctx: { close: () => void }): void {
    if (this.virementSepaForm.valid) {
      this.state.isLoadingVirement.set(true);
      const virementSepa: VirementSepaDto = {
        ...this.virementSepaForm.value,
        amount_total: this.virementSepaForm.value.amount_htva,
        amount_htva: this.amount_debited(),
      };

      this.services.virementSepa
        .createVirementSepa(
          virementSepa,
          +this.id()!,
          this.typeOfProjet()!,
          this.selectedFile
        )
        .pipe(
          tap(() => {
            ctx.close();
            this.resetFormState();
          }),
          switchMap(() => {
            return forkJoin([
              from(this.fetchTransaction()),
              from(this.fetchVirements()),
            ]);
          }),
          delay(300),
          tap(() => {
            this.state.isLoadingVirement.set(false);
            this.state.isSpinner.set(false);
          }),
          catchError((err) => {
            this.state.isLoadingVirement.set(false);
            this.state.isSpinner.set(false);
            this.state.errorMessage.set(err.error.message);
            return of(null);
          })
        )
        .subscribe();
    }
  }

  private resetFormState(): void {
    this.virementSepaForm.reset();
    this.virementSepaForm.patchValue({
      amount_htva: 0,
      amount_tva: null,
      structured_communication: '',
      communication: '',
    });
    this.state.amountHtva.set(0);
    this.state.amountTva.set(0);
  }

  protected onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedFile = target.files?.[0] ?? null;
  }

  protected goBack(): void {
    this.services.location.back();
  }

  protected getPagesForSender(): number[] {
    return Array(this.pagination.sender.totalPages())
      .fill(0)
      .map((_, i) => i + 1);
  }

  protected getPagesForRecipient(): number[] {
    return Array(this.pagination.recipient.totalPages())
      .fill(0)
      .map((_, i) => i + 1);
  }

  protected getVisiblePages(
    currentPage: number,
    totalPages: number
  ): (number | 'ellipsis')[] {
    const result: (number | 'ellipsis')[] = [];
    const visibleCount = 3; // Nombre de pages visibles consécutives

    if (totalPages <= 5) {
      // Si moins de 5 pages, on affiche tout
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Gestion du début de la pagination
    if (currentPage <= 3) {
      // Afficher 1, 2, 3, ..., dernière-1, dernière
      for (let i = 1; i <= 3; i++) {
        result.push(i);
      }
      result.push('ellipsis');
      result.push(totalPages - 1);
      result.push(totalPages);
      return result;
    }

    // Gestion de la fin de la pagination
    if (currentPage >= totalPages - 2) {
      result.push(1);
      result.push(2);
      result.push('ellipsis');
      for (let i = totalPages - 2; i <= totalPages; i++) {
        result.push(i);
      }
      return result;
    }

    // Gestion du milieu de la pagination
    result.push(currentPage - 1);
    result.push(currentPage);
    result.push(currentPage + 1);
    result.push('ellipsis');
    result.push(totalPages - 1);
    result.push(totalPages);

    return result;
  }

  protected onPageChangeSender(page: number): void {
    if (page >= 1 && page <= this.pagination.sender.totalPages()) {
      this.pagination.sender.currentPage.set(page);
      this.fetchTransaction();
    }
  }

  protected onPageChangeRecipient(page: number): void {
    if (page >= 1 && page <= this.pagination.recipient.totalPages()) {
      this.pagination.recipient.currentPage.set(page);
      this.fetchTransaction();
    }
  }

  protected onPageChangeVirement(page: number): void {
    if (page >= 1 && page <= this.pagination.virement.totalPages()) {
      this.pagination.virement.currentPage.set(page);
      this.fetchVirements();
    }
  }

  getAllPrincipalAccount() {
    this.services.principalAccount.getAllGroupPrincipal().subscribe((data) => {
      this.state.principalAccounts.set(data);
      this.state.filteredPrincipalAccounts.set(data);
    });
  }

  getAllGroupAccount() {
    this.services.groupAccount.getAllGroupAccount().subscribe((data) => {
      this.state.groupAccounts.set(data);
      this.state.filteredGroupAccounts.set(data);
    });
  }

  filterGroupAccounts(event: Event) {
    const target = event.target as HTMLInputElement;
    const searchValue = target.value.toLowerCase();

    const filteredAccounts = this.state
      .groupAccounts()
      ?.filter((account) =>
        account.username?.toLowerCase().includes(searchValue)
      );

    this.state.filteredGroupAccounts.set(filteredAccounts);
  }

  fetchAllAccount() {
    this.getAllPrincipalAccount();
    this.getAllGroupAccount();
  }

  sendTransaction(ctx: any) {
    if (this.transactionForm.valid) {
      this.state.isLoadingTransfer.set(true);
      let transactionDto: TransactionDto = { ...this.transactionForm.value };
      if (this.state.accountPrincipal()) {
        transactionDto.senderPrincipal = this.state.accountPrincipal()?.id;
      } else {
        transactionDto.senderGroup = this.state.accountGroup()?.id;
      }

      if (
        transactionDto.recipientGroup?.length === 0 &&
        transactionDto.recipientPrincipal?.length === 0
      ) {
        throw new Error('Aucun destinataire');
      }

      this.services.transaction
        .createTransaction(transactionDto)
        .pipe(
          tap(() => {
            ctx.close();
            this.transactionForm.reset();
          }),
          switchMap(() => {
            this.state.isSpinner.set(true);
            return forkJoin([
              from(this.fetchTransaction()),
              from(this.fetchVirements()),
            ]);
          }),
          tap(() => {
            this.state.isLoadingTransfer.set(false);
            this.state.isSpinner.set(false);
          }),
          catchError((err) => {
            this.state.isLoadingTransfer.set(false);
            this.state.isSpinner.set(false);
            this.state.errorMessage.set(err.error.message);
            return of(null);
          })
        )
        .subscribe();
    }
  }

  async fetchTransaction() {
    const projectType = this.typeOfProjet();
    if (projectType !== 'PRINCIPAL' && projectType !== 'GROUP') {
      return this.services.router.navigate(['/home']);
    }

    const isPrincipal = projectType === 'PRINCIPAL';
    const service = isPrincipal
      ? this.services.principalAccount
      : this.services.groupAccount;
    const accountSetter = isPrincipal
      ? this.state.accountPrincipal
      : this.state.accountGroup;

    return service
      .getGroupById(+this.id()!)
      .pipe(
        tap((data) => accountSetter.set(data)),
        switchMap((data) => {
          const accountId = data.id;
          return forkJoin({
            recipientTransactions: this.services.transaction[
              isPrincipal
                ? 'getRecipientPrincipalTransactionById'
                : 'getRecipientGroupTransactionById'
            ](
              accountId,
              this.pagination.recipient.currentPage(),
              this.itemsPerPage()
            ),
            senderTransactions: this.services.transaction[
              isPrincipal
                ? 'getSenderPrincipalTransactionById'
                : 'getSenderGroupTransactionById'
            ](
              accountId,
              this.pagination.sender.currentPage(),
              this.itemsPerPage()
            ),
          }).pipe(
            tap(({ recipientTransactions, senderTransactions }) => {
              this.state.transactionRecipient.set(recipientTransactions.data);
              this.state.transactionSender.set(senderTransactions.data);

              this.pagination.recipient.totalItems.set(
                recipientTransactions.meta.total
              );
              this.pagination.recipient.totalPages.set(
                recipientTransactions.meta.totalPages
              );

              this.pagination.sender.totalItems.set(
                senderTransactions.meta.total
              );
              this.pagination.sender.totalPages.set(
                senderTransactions.meta.totalPages
              );
            })
          );
        }),
        catchError((error) => {
          console.error('Erreur lors de la récupération des données :', error);
          return EMPTY;
        })
      )
      .toPromise();
  }

  async fetchVirements(): Promise<void> {
    const projectType = this.typeOfProjet();
    const id = this.id();

    if (!projectType || !id) return;

    const service =
      projectType === 'PRINCIPAL'
        ? this.services.principalAccount
        : this.services.groupAccount;

    service
      .getGroupById(+id)
      .pipe(
        tap((data) => {
          // Trier les virements par date la plus récente
          const virements = [...(data.virementSepa || [])].sort((a, b) => {
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          });

          const start =
            (this.pagination.virement.currentPage() - 1) * this.itemsPerPage();
          const end = start + this.itemsPerPage();

          // Calculer le nombre total de pages
          this.pagination.virement.totalItems.set(virements.length);
          this.pagination.virement.totalPages.set(
            Math.ceil(virements.length / this.itemsPerPage())
          );

          // Mettre à jour les virements pour la page actuelle
          if (projectType === 'PRINCIPAL') {
            this.state.accountPrincipal.set({
              ...data,
              virementSepa: virements.slice(start, end),
            });
          } else {
            this.state.accountGroup.set({
              ...data,
              virementSepa: virements.slice(start, end),
            });
          }
        })
      )
      .subscribe();
  }

  filterPrincipalAccounts(event: Event) {
    const target = event.target as HTMLInputElement;
    const searchValue = target.value.toLowerCase();

    const filteredAccounts = this.state
      .principalAccounts()
      ?.filter((account) =>
        account.username?.toLowerCase().includes(searchValue)
      );

    this.state.filteredPrincipalAccounts.set(filteredAccounts);
  }
}
