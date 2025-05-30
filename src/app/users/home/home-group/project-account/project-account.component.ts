import { DatePipe, Location, NgClass } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  inject,
  input,
  signal,
  type WritableSignal,
  type Signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  HlmAccordionContentComponent,
  HlmAccordionDirective,
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
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective,
} from '@spartan-ng/ui-dialog-helm';
import { HlmIconComponent, provideIcons } from '@spartan-ng/ui-icon-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import {
  HlmPaginationContentDirective,
  HlmPaginationDirective,
  HlmPaginationItemDirective,
} from '@spartan-ng/ui-pagination-helm';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import {
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import {
  catchError,
  delay,
  forkJoin,
  from,
  lastValueFrom,
  of,
  tap,
} from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { CompteGroupeEntity } from '../../../../shared/entities/compte-groupe.entity';
import { PrincipalAccountEntity } from '../../../../shared/entities/principal-account.entity';
import { TransactionEntity } from '../../../../shared/entities/transaction.entity';
import { EuroFormatPipe } from '../../../../shared/pipes/euro-format.pipe';
import { CompteGroupeService } from '../../../../shared/services/compte-groupe.service';
import { ComptePrincipalService } from '../../../../shared/services/compte-principal.service';
import { TransactionService } from '../../../../shared/services/transaction.service';
import { BeneficiaryService } from '../../../../shared/services/beneficiary.service';
import { Beneficiary } from '../../../../shared/entities/beneficiary.entity';
import {
  lucideArrowLeftRight,
  lucideBanknote,
  lucideBell,
  lucideChevronDown,
  lucideCornerDownLeft,
  lucideUpload,
  lucideFileUp,
  lucideSearch,
  lucideX,
} from '@ng-icons/lucide';
import {
  BrnPopoverComponent,
  BrnPopoverContentDirective,
  BrnPopoverTriggerDirective,
} from '@spartan-ng/ui-popover-brain';
import { HlmPopoverContentDirective } from '@spartan-ng/ui-popover-helm';
import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';
import { TransactionDto } from '../../../../shared/dtos/transaction.dto';
import { VirementSepaDto } from '../../../../shared/dtos/virement-sepa.dto';
import { VirementSepaService } from '../../../../shared/services/virement-sepa.service';
import { atLeastOneRequired } from '../../../../shared/validators/at-least-one-required.validator';
import { HostListener } from '@angular/core';

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
  amount_htva: FormControl<number | null>;
  amount_tva: FormControl<number | null>;
  communication: FormControl<string>;
  structured_communication: FormControl<string>;
  account_owner: FormControl<string>;
  iban: FormControl<string>;
}

interface Recipient {
  id: number;
  type: 'PRINCIPAL' | 'GROUP';
}

interface SelectedAccount {
  id: number;
  username: string;
  type: 'PRINCIPAL' | 'GROUP';
  firstName?: string;
  name?: string;
}

// Interface pour typer l'objet state
interface ProjectAccountState {
  isSpinner: WritableSignal<boolean>;
  isLoadingTransfer: WritableSignal<boolean>;
  isLoadingVirement: WritableSignal<boolean>;
  accountPrincipal: WritableSignal<PrincipalAccountEntity | undefined>;
  accountGroup: WritableSignal<CompteGroupeEntity | undefined>;
  transactionRecipient: WritableSignal<TransactionEntity[] | undefined>;
  transactionSender: WritableSignal<TransactionEntity[] | undefined>;
  principalAccounts: WritableSignal<PrincipalAccountEntity[]>;
  filteredPrincipalAccounts: WritableSignal<PrincipalAccountEntity[]>;
  groupAccounts: WritableSignal<CompteGroupeEntity[] | undefined>;
  filteredGroupAccounts: WritableSignal<CompteGroupeEntity[] | undefined>;
  amountHtva: WritableSignal<number>;
  amountTva: WritableSignal<number>;
  errorMessage: WritableSignal<string>;
  beneficiaries: WritableSignal<Beneficiary[]>;
  filteredBeneficiaries: WritableSignal<Beneficiary[]>;
  selectedBeneficiary: WritableSignal<Beneficiary | null>;
  showBeneficiariesDropdown: WritableSignal<boolean>;
  visibleBeneficiaries: WritableSignal<Beneficiary[]>;
  beneficiariesPageSize: WritableSignal<number>;
  beneficiariesCurrentPage: WritableSignal<number>;
  beneficiariesTotalItems: WritableSignal<number>;
  beneficiariesTotalPages: WritableSignal<number>;
  searchValue: WritableSignal<string>;
  isSearchActive: Signal<boolean>;
  resetForm: (form: FormGroup) => void;
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
    HlmTableComponent,
    HlmTdComponent,
    HlmThComponent,
    HlmTrowComponent,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    HlmInputDirective,
    EuroFormatPipe,
    DatePipe,
    HlmIconComponent,
    HlmAccordionTriggerDirective,
    HlmAccordionItemDirective,
    HlmAccordionDirective,
    HlmAccordionContentComponent,
    HlmThComponent,
    NgClass,
    ReactiveFormsModule,
    HlmSpinnerComponent,
    HlmPaginationDirective,
    HlmPaginationContentDirective,
    HlmPaginationItemDirective,
    BrnPopoverComponent,
    BrnPopoverContentDirective,
    BrnPopoverTriggerDirective,
    HlmPopoverContentDirective,
  ],
  providers: [
    provideIcons({
      lucideCornerDownLeft,
      lucideBell,
      lucideUpload,
      lucideBanknote,
      lucideArrowLeftRight,
      lucideChevronDown,
      lucideFileUp,
      lucideSearch,
      lucideX,
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
    beneficiary: inject(BeneficiaryService),
    formBuilder: inject(FormBuilder),
    router: inject(Router),
    location: inject(Location),
  };

  // Inputs
  protected readonly id = input<string>();
  protected readonly typeOfProjet = input<string>();

  // State signals
  protected readonly state: ProjectAccountState = {
    isSpinner: signal(false),
    isLoadingTransfer: signal(false),
    isLoadingVirement: signal(false),
    accountPrincipal: signal<PrincipalAccountEntity | undefined>(undefined),
    accountGroup: signal<CompteGroupeEntity | undefined>(undefined),
    transactionRecipient: signal<TransactionEntity[] | undefined>(undefined),
    transactionSender: signal<TransactionEntity[] | undefined>(undefined),
    principalAccounts: signal<PrincipalAccountEntity[]>([]),
    filteredPrincipalAccounts: signal<PrincipalAccountEntity[]>([]),
    groupAccounts: signal<CompteGroupeEntity[] | undefined>(undefined),
    filteredGroupAccounts: signal<CompteGroupeEntity[] | undefined>(undefined),
    amountHtva: signal(0),
    amountTva: signal(0),
    errorMessage: signal(''),
    beneficiaries: signal<Beneficiary[]>([]),
    filteredBeneficiaries: signal<Beneficiary[]>([]),
    selectedBeneficiary: signal<Beneficiary | null>(null),
    showBeneficiariesDropdown: signal(false),
    visibleBeneficiaries: signal<Beneficiary[]>([]),
    beneficiariesPageSize: signal(10),
    beneficiariesCurrentPage: signal(1),
    beneficiariesTotalItems: signal(0),
    beneficiariesTotalPages: signal(1),
    searchValue: signal(''),
    isSearchActive: computed(() => this.state.searchValue().trim().length > 0),
    resetForm: (form: FormGroup) => {
      form.reset();
      this.state.amountHtva.set(0);
      this.state.amountTva.set(0);
      this.state.selectedBeneficiary.set(null);
      this.state.searchValue.set('');
    },
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
      .sort((a: PrincipalAccountEntity, b: PrincipalAccountEntity) =>
        (a.username ?? '').localeCompare(b.username ?? '')
      )
  );

  protected readonly sortedGroupAccounts = computed(() =>
    this.state
      .filteredGroupAccounts()
      ?.slice()
      .sort((a: CompteGroupeEntity, b: CompteGroupeEntity) =>
        (a.username ?? '').localeCompare(b.username ?? '')
      )
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected downloadInvoice(virement: any): void {
    if (!virement || !virement.id) return;

    this.services.virementSepa.downloadInvoice(virement.id).subscribe({
      next: (response) => {
        if (!response.body) {
          console.error('Aucun contenu reçu');
          return;
        }

        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'facture.pdf';
        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
            contentDisposition
          );
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        const blob = new Blob([response.body], { type: 'application/pdf' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement de la facture:', error);
      },
    });
  }

  private initializeForms(): void {
    this.transactionForm = this.services.formBuilder.group({
      communication: ['', [Validators.required]],
      amount: ['', [Validators.required]],
      recipients: ['', [Validators.required]],
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
        amount_htva: new FormControl(null, {
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
    await this.loadBeneficiaries();
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
    if (this.virementSepaForm.valid && this.selectedFile) {
      this.state.isLoadingVirement.set(true);
      const virementSepa: VirementSepaDto = {
        ...this.virementSepaForm.value,
        amount_total: this.virementSepaForm.value.amount_htva,
        amount_htva: this.amount_debited(),
      };

      // Créer ou mettre à jour le bénéficiaire si les champs sont remplis
      const beneficiaryData = {
        account_owner: this.virementSepaForm.value.account_owner,
        iban: this.virementSepaForm.value.iban,
      };

      this.services.beneficiary
        .createBeneficiary(beneficiaryData)
        .pipe(
          switchMap(() =>
            this.services.virementSepa.createVirementSepa(
              virementSepa,
              +this.id()!,
              this.typeOfProjet()!,
              this.selectedFile!
            )
          ),
          tap(() => {
            ctx.close();
            this.resetFormState();
            this.selectedFile = null;
            this.state.selectedBeneficiary.set(null);
          }),
          switchMap(() => {
            return forkJoin([
              from(this.fetchTransaction()),
              from(this.fetchVirements()),
              from(this.loadBeneficiaries()),
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

  protected onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        this.selectedFile = file;
      }
    }
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
    this.services.principalAccount.getAllGroupPrincipal().subscribe({
      next: (data) => {
        if (!data || data.length === 0) {
          console.warn('Aucun compte principal retourné par le serveur');
        }
        this.state.principalAccounts.set(data);
        this.state.filteredPrincipalAccounts.set(data);
      },
      error: (error) => {
        console.error(
          'Erreur lors du chargement des comptes principaux:',
          error
        );
      },
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

  protected filterAllAccounts(event: Event) {
    const target = event.target as HTMLInputElement;
    const searchValue = target.value.toLowerCase().trim();
    const currentSelections =
      this.transactionForm.get('recipients')?.value || [];

    // Filtrer les comptes principaux en excluant ceux déjà sélectionnés
    const filteredPrincipalAccounts = this.state
      .principalAccounts()
      .filter((account) => {
        const isSelected = currentSelections.some(
          (selection: Recipient) =>
            selection.id === account.id && selection.type === 'PRINCIPAL'
        );
        return (
          !isSelected &&
          (account.username?.toLowerCase().includes(searchValue) ||
            account.id.toString().includes(searchValue) ||
            account.user?.firstName?.toLowerCase().includes(searchValue) ||
            account.user?.name?.toLowerCase().includes(searchValue))
        );
      });

    this.state.filteredPrincipalAccounts.set(filteredPrincipalAccounts);

    // Filtrer les comptes de groupe en excluant ceux déjà sélectionnés
    const filteredGroupAccounts =
      this.state.groupAccounts()?.filter((account) => {
        const isSelected = currentSelections.some(
          (selection: Recipient) =>
            selection.id === account.id && selection.type === 'GROUP'
        );
        return (
          !isSelected &&
          (account.username?.toLowerCase().includes(searchValue) ||
            account.id.toString().includes(searchValue))
        );
      }) || [];

    this.state.filteredGroupAccounts.set(filteredGroupAccounts);
  }

  protected getSelectedAccounts(): SelectedAccount[] {
    const currentSelections =
      this.transactionForm.get('recipients')?.value || [];
    const selectedAccounts: SelectedAccount[] = [];

    // Ajouter les comptes principaux sélectionnés
    currentSelections.forEach((selection: Recipient) => {
      if (selection.type === 'PRINCIPAL') {
        const account = this.state
          .principalAccounts()
          .find((a) => a.id === selection.id);
        if (account) {
          selectedAccounts.push({
            id: account.id,
            username: account.username || '',
            type: 'PRINCIPAL',
            firstName: account.user?.firstName || '',
            name: account.user?.name || '',
          });
        }
      } else {
        const account = this.state
          .groupAccounts()
          ?.find((a) => a.id === selection.id);
        if (account) {
          selectedAccounts.push({
            id: account.id,
            username: account.username || '',
            type: 'GROUP',
          });
        }
      }
    });

    return selectedAccounts;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendTransaction(ctx: any) {
    if (this.transactionForm.valid) {
      this.state.isLoadingTransfer.set(true);
      const formValues = this.transactionForm.value;

      // Séparer les destinataires par type
      const recipients = (formValues.recipients || []) as Recipient[];
      const recipientPrincipal = recipients
        .filter((r) => r.type === 'PRINCIPAL')
        .map((r) => r.id);
      const recipientGroup = recipients
        .filter((r) => r.type === 'GROUP')
        .map((r) => r.id);

      const transactionDto: TransactionDto = {
        communication: formValues.communication,
        amount: formValues.amount,
        recipientPrincipal,
        recipientGroup,
      };

      if (this.state.accountPrincipal()) {
        transactionDto.senderPrincipal = this.state.accountPrincipal()?.id;
      } else {
        transactionDto.senderGroup = this.state.accountGroup()?.id;
      }

      if (recipientGroup.length === 0 && recipientPrincipal.length === 0) {
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
    this.state.isSpinner.set(true);
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

    try {
      const data = await service.getGroupById(+this.id()!).toPromise();
      if (!data) return false;

      accountSetter.set(data);
      const accountId = data.id;

      const result = await forkJoin({
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
        ](accountId, this.pagination.sender.currentPage(), this.itemsPerPage()),
      }).toPromise();

      if (!result) return false;

      const { recipientTransactions, senderTransactions } = result;

      this.state.transactionRecipient.set(recipientTransactions.data);
      this.state.transactionSender.set(senderTransactions.data);

      this.pagination.recipient.totalItems.set(
        recipientTransactions.meta.total
      );
      this.pagination.recipient.totalPages.set(
        recipientTransactions.meta.totalPages
      );

      this.pagination.sender.totalItems.set(senderTransactions.meta.total);
      this.pagination.sender.totalPages.set(senderTransactions.meta.totalPages);

      this.state.isSpinner.set(false);

      return true;
    } catch (error) {
      console.error('Erreur lors de la récupération des données :', error);
      return false;
    }
  }

  async fetchVirements(): Promise<void> {
    const projectType = this.typeOfProjet();
    const id = this.id();

    if (!projectType || !id) return;

    const service =
      projectType === 'PRINCIPAL'
        ? this.services.principalAccount
        : this.services.groupAccount;

    try {
      const data = await service.getGroupById(+id).toPromise();
      if (!data) return;

      // Trier les virements par date la plus récente
      const virements = [...(data.virementSepa || [])].sort((a, b) => {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
      const updatedData = {
        ...data,
        virementSepa: virements.slice(start, end),
      };

      if (projectType === 'PRINCIPAL') {
        this.state.accountPrincipal.set(updatedData as PrincipalAccountEntity);
      } else {
        this.state.accountGroup.set(updatedData as CompteGroupeEntity);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des virements :', error);
    }
  }

  filterPrincipalAccounts(event: Event) {
    const target = event.target as HTMLInputElement;
    const searchValue = target.value.toLowerCase().trim();

    if (!this.state.principalAccounts().length) {
      console.warn('Aucun compte principal chargé. Chargement des comptes...');
      this.getAllPrincipalAccount();
      return;
    }

    const filteredAccounts = this.state
      .principalAccounts()
      .filter((account) => {
        if (!account) {
          console.warn('Compte invalide trouvé:', account);
          return false;
        }

        const username = account.username?.toLowerCase() || '';
        const name = account.user?.name?.toLowerCase() || '';
        const firstName = account.user?.firstName?.toLowerCase() || '';

        const isMatch =
          username.includes(searchValue) ||
          name.includes(searchValue) ||
          firstName.includes(searchValue);

        return isMatch;
      });

    this.state.filteredPrincipalAccounts.set(filteredAccounts);
  }

  protected openConvertToPdfDialog(): void {
    // Créer un input file temporaire pour la sélection du fichier
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';
    input.multiple = false;

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        this.convertToPdf(file);
      }
    };

    input.click();
  }

  private convertToPdf(file: File): void {
    this.state.isLoadingVirement.set(true);
    this.state.errorMessage.set('');

    const formData = new FormData();
    formData.append('file', file);

    this.services.virementSepa.convertToPdf(formData).subscribe({
      next: (response: Blob) => {
        // Créer un nouveau Blob avec le type MIME PDF explicite
        const pdfBlob = new Blob([response], { type: 'application/pdf' });

        // Créer une URL pour le blob
        const url = window.URL.createObjectURL(pdfBlob);

        // Créer un lien temporaire pour le téléchargement
        const link = document.createElement('a');
        link.href = url;
        link.download = `${file.name.split('.')[0]}.pdf`;

        // Déclencher le téléchargement
        document.body.appendChild(link);
        link.click();

        // Nettoyer
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.state.isLoadingVirement.set(false);
      },
      error: (error) => {
        console.error('Erreur lors de la conversion en PDF:', error);
        this.state.errorMessage.set(
          'Erreur lors de la conversion en PDF. Veuillez réessayer.'
        );
        this.state.isLoadingVirement.set(false);
      },
    });
  }

  private async loadBeneficiaries() {
    try {
      // Charge uniquement la première page des bénéficiaires au chargement initial
      const data = await lastValueFrom(
        this.services.beneficiary.getBeneficiariesPage(1).pipe(take(1))
      );

      if (data && data.items && data.items.length > 0) {
        // Stocker les infos de pagination
        const totalItems = data.total || 0;
        const totalPages = data.totalPages || 1;

        console.log('Bénéficiaires chargés:', {
          items: data.items.length,
          totalItems,
          totalPages,
          page: data.page,
        });

        this.state.beneficiaries.set(data.items);
        this.state.filteredBeneficiaries.set(data.items);
        this.state.beneficiariesTotalItems.set(totalItems);
        this.state.beneficiariesTotalPages.set(totalPages);

        // Initialiser la page courante
        this.state.beneficiariesCurrentPage.set(1);

        // Initialiser les bénéficiaires visibles
        this.state.visibleBeneficiaries.set(data.items);
      } else {
        this.state.beneficiaries.set([]);
        this.state.filteredBeneficiaries.set([]);
        this.state.beneficiariesTotalItems.set(0);
        this.state.beneficiariesTotalPages.set(1);
        this.state.visibleBeneficiaries.set([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des bénéficiaires:', error);
      this.state.beneficiaries.set([]);
      this.state.filteredBeneficiaries.set([]);
      this.state.beneficiariesTotalItems.set(0);
      this.state.beneficiariesTotalPages.set(1);
      this.state.visibleBeneficiaries.set([]);
    }
  }

  protected filterBeneficiaries(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value.toLowerCase().trim();

    // Mettre à jour le signal searchValue
    this.state.searchValue.set(value);

    if (!value) {
      // Si le champ est vide, afficher tous les bénéficiaires déjà chargés
      this.state.filteredBeneficiaries.set(this.state.beneficiaries());
      // Mise à jour direct de visibleBeneficiaries avec tous les bénéficiaires
      this.state.visibleBeneficiaries.set(this.state.beneficiaries());
      // Réinitialiser la pagination
      this.state.beneficiariesCurrentPage.set(1);
      return;
    }

    if (value.length >= 3) {
      // Si le texte a au moins 3 caractères, utiliser la recherche backend
      console.log(`Recherche backend pour: "${value}"`);
      this.services.beneficiary
        .searchBeneficiaries(value)
        .pipe(
          take(1),
          tap((results) => {
            console.log(
              `Résultats de recherche pour "${value}":`,
              results.length
            );

            // Assurer qu'il n'y a pas de doublons dans les résultats de recherche
            const uniqueResults = new Map<number, Beneficiary>();
            results.forEach((beneficiary) => {
              if (beneficiary && beneficiary.id) {
                uniqueResults.set(beneficiary.id, beneficiary);
              }
            });

            const filteredResults = Array.from(uniqueResults.values());

            this.state.filteredBeneficiaries.set(filteredResults);
            // Appliquer directement les résultats de recherche à visibleBeneficiaries
            this.state.visibleBeneficiaries.set(filteredResults);

            // Réinitialiser la pagination
            this.state.beneficiariesCurrentPage.set(1);
          }),
          catchError((error) => {
            console.error(
              'Erreur lors de la recherche des bénéficiaires:',
              error
            );
            return of([]);
          })
        )
        .subscribe();
    } else {
      // Sinon, filtrer sur les données locales déjà chargées
      console.log(`Filtrage local pour: "${value}"`);
      const currentBeneficiaries = this.state.beneficiaries();
      if (!Array.isArray(currentBeneficiaries)) {
        this.state.filteredBeneficiaries.set([]);
        this.state.visibleBeneficiaries.set([]);
        return;
      }

      const filtered = currentBeneficiaries.filter(
        (beneficiary) =>
          beneficiary?.account_owner?.toLowerCase().includes(value) ||
          beneficiary?.iban?.toLowerCase().includes(value)
      );

      console.log(
        `Filtrage local: ${filtered.length} résultats sur ${currentBeneficiaries.length}`
      );

      this.state.filteredBeneficiaries.set(filtered);
      // Appliquer directement les résultats filtrés à visibleBeneficiaries
      this.state.visibleBeneficiaries.set(filtered);

      // Réinitialiser la pagination
      this.state.beneficiariesCurrentPage.set(1);
    }
  }

  protected toggleBeneficiariesDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.state.showBeneficiariesDropdown.set(
      !this.state.showBeneficiariesDropdown()
    );
    if (this.state.showBeneficiariesDropdown()) {
      // S'assurer que la liste des bénéficiaires n'a pas de doublons avant de l'afficher
      const uniqueBeneficiaries = new Map<number, Beneficiary>();
      this.state.beneficiaries().forEach((beneficiary) => {
        if (beneficiary && beneficiary.id) {
          uniqueBeneficiaries.set(beneficiary.id, beneficiary);
        }
      });
      const allBeneficiaries = Array.from(uniqueBeneficiaries.values());
      this.state.filteredBeneficiaries.set(allBeneficiaries);

      // Réinitialiser la pagination et charger la première page
      this.state.beneficiariesCurrentPage.set(1);
      this.loadMoreBeneficiaries();
    }
  }

  // Méthode pour charger plus de bénéficiaires
  protected loadMoreBeneficiaries(loadMore = false): void {
    if (loadMore) {
      // Récupérer la page suivante depuis le serveur
      const nextPage = this.state.beneficiariesCurrentPage() + 1;

      // Vérifier si une recherche est en cours
      const searchInput = document.querySelector(
        'input[placeholder="Rechercher un bénéficiaire"]'
      ) as HTMLInputElement;
      const searchValue = searchInput?.value?.trim().toLowerCase() || '';

      console.log(
        'Chargement de la page',
        nextPage,
        'recherche:',
        searchValue ? 'oui' : 'non'
      );

      // Si une recherche est active avec 3 caractères ou plus, utiliser l'API de recherche
      if (searchValue && searchValue.length >= 3) {
        this.services.beneficiary
          .searchBeneficiaries(searchValue)
          .pipe(
            take(1),
            tap((results) => {
              console.log(`Réponse de recherche pour "${searchValue}":`, {
                results: results.length,
              });

              // Assurer qu'il n'y a pas de doublons dans les résultats de recherche
              const uniqueResults = new Map<number, Beneficiary>();
              results.forEach((beneficiary) => {
                if (beneficiary && beneficiary.id) {
                  uniqueResults.set(beneficiary.id, beneficiary);
                }
              });

              const filteredResults = Array.from(uniqueResults.values());
              this.state.filteredBeneficiaries.set(filteredResults);
              this.state.visibleBeneficiaries.set(filteredResults);
            }),
            catchError((error) => {
              console.error(
                'Erreur lors de la recherche des bénéficiaires:',
                error
              );
              return of([]);
            })
          )
          .subscribe();
        return;
      }

      // Sinon, charger la page suivante normalement
      this.services.beneficiary
        .getBeneficiariesPage(nextPage)
        .pipe(
          take(1),
          tap((data) => {
            console.log(`Réponse du serveur pour la page ${nextPage}:`, {
              page: data.page,
              items: data.items?.length ?? 'N/A',
              totalPages: data.totalPages,
              firstId:
                data.items && data.items.length > 0 ? data.items[0]?.id : 'N/A',
              lastId:
                data.items && data.items.length > 0
                  ? data.items[data.items.length - 1]?.id
                  : 'N/A',
            });

            if (data && typeof data.totalPages !== 'undefined') {
              this.state.beneficiariesTotalPages.set(data.totalPages);
            } else {
              console.warn(
                'Réponse API invalide ou totalPages manquant pour la page',
                nextPage
              );
              return;
            }

            if (data && data.items) {
              this.state.beneficiariesCurrentPage.set(nextPage);

              if (data.items.length > 0) {
                const currentIds = new Set(
                  this.state.beneficiaries().map((b) => b.id)
                );
                const newBeneficiaries = data.items.filter(
                  (b) => b && b.id && !currentIds.has(b.id)
                );

                console.log(
                  'Nouveaux bénéficiaires uniques après filtrage:',
                  newBeneficiaries.length,
                  'IDs:',
                  newBeneficiaries.map((b) => b.id)
                );

                if (newBeneficiaries.length > 0) {
                  const updatedBeneficiaries = [
                    ...this.state.beneficiaries(),
                    ...newBeneficiaries,
                  ];
                  this.state.beneficiaries.set(updatedBeneficiaries);

                  if (!this.state.isSearchActive()) {
                    this.state.filteredBeneficiaries.set(updatedBeneficiaries);
                    this.state.visibleBeneficiaries.set([
                      ...this.state.visibleBeneficiaries(),
                      ...newBeneficiaries,
                    ]);
                  } else {
                    const searchValue = this.state.searchValue();
                    const filteredNew = newBeneficiaries.filter(
                      (beneficiary) =>
                        beneficiary?.account_owner
                          ?.toLowerCase()
                          .includes(searchValue) ||
                        beneficiary?.iban?.toLowerCase().includes(searchValue)
                    );
                    this.state.visibleBeneficiaries.set([
                      ...this.state.visibleBeneficiaries(),
                      ...filteredNew,
                    ]);
                  }
                } else {
                  console.warn(
                    'Aucun nouveau bénéficiaire unique trouvé pour la page',
                    nextPage
                  );
                }
              } else {
                console.log('Aucun item trouvé pour la page', nextPage);
              }
            } else {
              console.warn(
                'Réponse API invalide (items manquants) pour la page',
                nextPage
              );
            }
          }),
          catchError((error) => {
            console.error(
              'Erreur lors du chargement des bénéficiaires supplémentaires:',
              error
            );
            return of(null);
          })
        )
        .subscribe();
    }
  }

  protected selectBeneficiary(beneficiary: Beneficiary): void {
    this.state.selectedBeneficiary.set(beneficiary);
    this.state.showBeneficiariesDropdown.set(false);
    this.state.filteredBeneficiaries.set([]); // Vider les suggestions
    this.virementSepaForm.patchValue({
      account_owner: beneficiary.account_owner,
      iban: beneficiary.iban,
    });
  }

  @HostListener('document:click', ['$event'])
  protected onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdownElement = target.closest('.beneficiary-dropdown');

    if (!dropdownElement) {
      this.state.showBeneficiariesDropdown.set(false);
      // S'assurer que la liste filtrée n'a pas de doublons
      const uniqueBeneficiaries = new Map<number, Beneficiary>();
      this.state.beneficiaries().forEach((beneficiary) => {
        if (beneficiary && beneficiary.id) {
          uniqueBeneficiaries.set(beneficiary.id, beneficiary);
        }
      });
      this.state.filteredBeneficiaries.set(
        Array.from(uniqueBeneficiaries.values())
      );
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  protected onEscapePressed(event: KeyboardEvent): void {
    event.stopPropagation();
    this.state.showBeneficiariesDropdown.set(false);
    // S'assurer que la liste filtrée n'a pas de doublons
    const uniqueBeneficiaries = new Map<number, Beneficiary>();
    this.state.beneficiaries().forEach((beneficiary) => {
      if (beneficiary && beneficiary.id) {
        uniqueBeneficiaries.set(beneficiary.id, beneficiary);
      }
    });
    this.state.filteredBeneficiaries.set(
      Array.from(uniqueBeneficiaries.values())
    );
  }

  protected addAccount(account: {
    id: number;
    type: 'PRINCIPAL' | 'GROUP';
    username: string;
  }): void {
    const currentSelections =
      this.transactionForm.get('recipients')?.value || [];
    if (
      !currentSelections.some(
        (selection: Recipient) =>
          selection.id === account.id && selection.type === account.type
      )
    ) {
      this.transactionForm.patchValue({
        recipients: [
          ...currentSelections,
          { id: account.id, type: account.type },
        ],
      });
      const mockEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        data: '',
      });
      Object.defineProperty(mockEvent, 'target', {
        value: { value: '' },
        writable: false,
      });
      this.filterAllAccounts(mockEvent);
    }
  }

  protected removeAccount(account: {
    id: number;
    type: 'PRINCIPAL' | 'GROUP';
    username: string;
  }): void {
    const currentSelections =
      this.transactionForm.get('recipients')?.value || [];
    const updatedSelections = currentSelections.filter(
      (selection: Recipient) =>
        !(selection.id === account.id && selection.type === account.type)
    );
    this.transactionForm.patchValue({ recipients: updatedSelections });
    const mockEvent = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      data: '',
    });
    Object.defineProperty(mockEvent, 'target', {
      value: { value: '' },
      writable: false,
    });
    this.filterAllAccounts(mockEvent);
  }
}
