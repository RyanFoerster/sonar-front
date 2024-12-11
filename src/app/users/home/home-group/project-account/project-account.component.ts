import {
  AfterViewInit,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
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
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import {
  HlmPaginationContentDirective,
  HlmPaginationDirective,
  HlmPaginationEllipsisComponent,
  HlmPaginationItemDirective,
  HlmPaginationLinkDirective,
  HlmPaginationNextComponent,
  HlmPaginationPreviousComponent,
} from '@spartan-ng/ui-pagination-helm';
import { ComptePrincipalService } from '../../../../shared/services/compte-principal.service';
import { CompteGroupeService } from '../../../../shared/services/compte-groupe.service';
import { PrincipalAccountEntity } from '../../../../shared/entities/principal-account.entity';
import { CompteGroupeEntity } from '../../../../shared/entities/compte-groupe.entity';
import { Router } from '@angular/router';
import { EuroFormatPipe } from '../../../../shared/pipes/euro-format.pipe';
import { TransactionService } from '../../../../shared/services/transaction.service';
import { TransactionEntity } from '../../../../shared/entities/transaction.entity';
import { catchError, delay, EMPTY, forkJoin, of, switchMap, tap } from 'rxjs';
import { DatePipe, JsonPipe, Location, NgClass } from '@angular/common';
import { HlmIconComponent, provideIcons } from '@spartan-ng/ui-icon-helm';
import {
  HlmAccordionContentComponent,
  HlmAccordionDirective,
  HlmAccordionIconDirective,
  HlmAccordionItemDirective,
  HlmAccordionTriggerDirective,
} from '@spartan-ng/ui-accordion-helm';
import { BrnAccordionContentComponent } from '@spartan-ng/ui-accordion-brain';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TransactionDto } from '../../../../shared/dtos/transaction.dto';
import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';
import { atLeastOneRequired } from '../../../../shared/validators/at-least-one-required.validator';
import { VirementSepaService } from '../../../../shared/services/virement-sepa.service';
import { VirementSepaDto } from '../../../../shared/dtos/virement-sepa.dto';
import { lucideCornerDownLeft } from '@ng-icons/lucide';
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
  providers: [provideIcons({ lucideCornerDownLeft })],
  templateUrl: './project-account.component.html',
  styleUrl: './project-account.component.css',
})
export class ProjectAccountComponent implements AfterViewInit {
  private principalAccountService: ComptePrincipalService = inject(
    ComptePrincipalService
  );
  private groupAccountService: CompteGroupeService =
    inject(CompteGroupeService);
  private transactionService: TransactionService = inject(TransactionService);
  private virementSepaService: VirementSepaService =
    inject(VirementSepaService);
  private formBuilder: FormBuilder = inject(FormBuilder);
  private router: Router = inject(Router);

  protected id = input<string>();
  protected typeOfProjet = input<string>();

  protected isSpinner = signal(false);
  protected accountPrincipal = signal<PrincipalAccountEntity | undefined>(
    undefined
  );
  protected accountGroup = signal<CompteGroupeEntity | undefined>(undefined);
  protected transactionRecipient = signal<TransactionEntity[] | undefined>(
    undefined
  );
  protected transactionSender = signal<TransactionEntity[] | undefined>(
    undefined
  );
  protected principalAccounts = signal<PrincipalAccountEntity[] | undefined>(
    undefined
  );
  protected groupAccounts = signal<CompteGroupeEntity[] | undefined>(undefined);
  protected amountHtva = signal(0);
  protected amountTva = signal(0);
  protected errorMessage = signal('');
  protected selectedFile: File | null = null;

  protected amount_total = computed(
    () => +this.amountHtva() - +this.amountTva()
  );

  protected transactionForm!: FormGroup;
  protected virementSepaForm!: FormGroup;

  // Pagination pour les transactions sortantes
  protected currentPageSender = signal(1);
  protected totalPagesSender = signal(0);
  protected totalItemsSender = signal(0);

  // Pagination pour les transactions entrantes
  protected currentPageRecipient = signal(1);
  protected totalPagesRecipient = signal(0);
  protected totalItemsRecipient = signal(0);

  // Pagination pour les virements
  protected currentPageVirement = signal(1);
  protected totalPagesVirement = signal(0);
  protected totalItemsVirement = signal(0);

  // Nombre d'éléments par page
  protected itemsPerPage = signal(10);

  protected getPagesForSender(): number[] {
    return Array(this.totalPagesSender())
      .fill(0)
      .map((_, i) => i + 1);
  }

  protected getPagesForRecipient(): number[] {
    return Array(this.totalPagesRecipient())
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
    if (page >= 1 && page <= this.totalPagesSender()) {
      this.currentPageSender.set(page);
      this.fetchTransaction();
    }
  }

  protected onPageChangeRecipient(page: number): void {
    if (page >= 1 && page <= this.totalPagesRecipient()) {
      this.currentPageRecipient.set(page);
      this.fetchTransaction();
    }
  }

  protected onPageChangeVirement(page: number): void {
    if (page >= 1 && page <= this.totalPagesVirement()) {
      this.currentPageVirement.set(page);
      this.fetchVirements();
    }
  }

  constructor(private location: Location) {
    this.transactionForm = this.formBuilder.group({
      communication: ['', [Validators.required]],
      amount: ['', [Validators.required]],
      recipientGroup: ['', []],
      recipientPrincipal: ['', []],
    });

    this.virementSepaForm = this.formBuilder.group(
      {
        account_owner: ['', [Validators.required]],
        iban: ['', [Validators.required]],
        amount_htva: ['', [Validators.required]],
        amount_tva: ['', [Validators.required]],
        communication: [''],
        structured_communication: [''],
      },
      {
        validators: atLeastOneRequired(),
      }
    );
  }

  async ngAfterViewInit() {
    await this.fetchTransaction();
    this.fetchVirements();
  }

  getAllPrincipalAccount() {
    this.principalAccountService
      .getAllGroupPrincipal()
      .subscribe((data) => this.principalAccounts.set(data));
  }

  getAllGroupAccount() {
    this.groupAccountService
      .getAllGroupAccount()
      .subscribe((data) => this.groupAccounts.set(data));
  }

  fetchAllAccount() {
    this.getAllPrincipalAccount();
    this.getAllGroupAccount();
  }

  sendTransaction(ctx: any) {
    if (this.transactionForm.valid) {
      let transactionDto: TransactionDto = { ...this.transactionForm.value };
      if (this.accountPrincipal()) {
        transactionDto.senderPrincipal = this.accountPrincipal()?.id;
      } else {
        transactionDto.senderGroup = this.accountGroup()?.id;
      }

      if (
        transactionDto.recipientGroup?.length === 0 &&
        transactionDto.recipientPrincipal?.length === 0
      ) {
        throw new Error('Aucun destinataire');
      }

      this.transactionService
        .createTransaction(transactionDto)
        .pipe(
          tap(async () => {
            ctx.close();
            await this.fetchTransaction();
            this.isSpinner.set(true);
          }),
          delay(1000),
          tap(() => this.isSpinner.set(false))
        )
        .subscribe();
    }
  }

  async fetchTransaction() {
    const projectType = this.typeOfProjet();
    if (projectType !== 'PRINCIPAL' && projectType !== 'GROUP') {
      return this.router.navigate(['/home']);
    }

    const isPrincipal = projectType === 'PRINCIPAL';
    const service = isPrincipal
      ? this.principalAccountService
      : this.groupAccountService;
    const accountSetter = isPrincipal
      ? this.accountPrincipal
      : this.accountGroup;

    return service
      .getGroupById(+this.id()!)
      .pipe(
        tap((data) => accountSetter.set(data)),
        switchMap((data) => {
          const accountId = data.id;
          return forkJoin({
            recipientTransactions: this.transactionService[
              isPrincipal
                ? 'getRecipientPrincipalTransactionById'
                : 'getRecipientGroupTransactionById'
            ](accountId, this.currentPageRecipient(), this.itemsPerPage()),
            senderTransactions: this.transactionService[
              isPrincipal
                ? 'getSenderPrincipalTransactionById'
                : 'getSenderGroupTransactionById'
            ](accountId, this.currentPageSender(), this.itemsPerPage()),
          });
        }),
        tap(({ recipientTransactions, senderTransactions }) => {
          this.transactionRecipient.set(recipientTransactions.data);
          this.transactionSender.set(senderTransactions.data);

          this.totalItemsRecipient.set(recipientTransactions.meta.total);
          this.totalPagesRecipient.set(recipientTransactions.meta.totalPages);

          this.totalItemsSender.set(senderTransactions.meta.total);
          this.totalPagesSender.set(senderTransactions.meta.totalPages);
        }),
        catchError((error) => {
          console.error('Erreur lors de la récupération des données :', error);
          return EMPTY;
        })
      )
      .subscribe();
  }

  setAmountHtva(event: any) {
    this.amountHtva.set(event.target.value);
  }

  setAmountTva(event: any) {
    this.amountTva.set(event.target.value);
  }

  createVirementSepa(ctx: any) {
    console.log(this.virementSepaForm.value);
    if (this.virementSepaForm.valid) {
      const virementSepa: VirementSepaDto = this.virementSepaForm.value;
      virementSepa.amount_total = this.amount_total();
      this.virementSepaService
        .createVirementSepa(
          virementSepa,
          +this.id()!,
          this.typeOfProjet()!,
          this.selectedFile
        )
        .pipe(
          tap(async (data) => {
            console.log(data);
            ctx.close();
            await this.fetchTransaction();
            this.isSpinner.set(true);
            this.virementSepaForm.reset();
          }),
          delay(500),
          tap(() => this.isSpinner.set(false)),
          catchError((err) => {
            this.isSpinner.set(false); // Assurez-vous d'arrêter le spinner en cas d'erreur
            this.errorMessage.set(err.error.message); // Affichez un message d'erreur
            return of(null); // Retournez une valeur par défaut pour éviter la propagation de l'erreur
          })
        )
        .subscribe();
    }
  }

  goBack() {
    this.location.back();
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  protected fetchVirements(): void {
    const projectType = this.typeOfProjet();
    const id = this.id();

    if (!projectType || !id) return;

    const service =
      projectType === 'PRINCIPAL'
        ? this.principalAccountService
        : this.groupAccountService;

    service
      .getGroupById(+id)
      .pipe(
        tap((data) => {
          const virements = data.virementSepa || [];
          const start = (this.currentPageVirement() - 1) * this.itemsPerPage();
          const end = start + this.itemsPerPage();

          // Calculer le nombre total de pages
          this.totalItemsVirement.set(virements.length);
          this.totalPagesVirement.set(
            Math.ceil(virements.length / this.itemsPerPage())
          );

          // Mettre à jour les virements pour la page actuelle
          if (projectType === 'PRINCIPAL') {
            this.accountPrincipal.set({
              ...data,
              virementSepa: virements.slice(start, end),
            });
          } else {
            this.accountGroup.set({
              ...data,
              virementSepa: virements.slice(start, end),
            });
          }
        })
      )
      .subscribe();
  }
}
