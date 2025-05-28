import { DatePipe, NgClass, CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import {
  HlmTableComponent,
  HlmTableDirective,
  HlmTdComponent, HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import {of, switchMap, take, tap, throwError} from 'rxjs';
import { InvoiceEntity } from '../../shared/entities/invoice.entity';
import { UserEntity } from '../../shared/entities/user.entity';
import { EuroFormatPipe } from '../../shared/pipes/euro-format.pipe';
import { InvoiceService } from '../../shared/services/invoice.service';
import { UsersService } from '../../shared/services/users.service';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmIconComponent, provideIcons } from '@spartan-ng/ui-icon-helm';
import {
  lucideCheckCircle,
  lucideChevronDown,
  lucideFileDown,
  lucideFileText,
  lucideArrowUpDown,
} from '@ng-icons/lucide';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';
import {
  HlmPaginationContentDirective,
  HlmPaginationDirective,
  HlmPaginationItemDirective,
} from '@spartan-ng/ui-pagination-helm';
import { toast } from 'ngx-sonner';
import { PdfGeneratorService } from '../../shared/services/pdf-generator.service';
import {TransactionDto} from "../../shared/dtos/transaction.dto";
import {TransactionService} from "../../shared/services/transaction.service";
import {
  HlmDialogComponent,
  HlmDialogContentComponent, HlmDialogDescriptionDirective,
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective
} from "@spartan-ng/ui-dialog-helm";
import {BrnDialogContentDirective, BrnDialogTriggerDirective} from "@spartan-ng/ui-dialog-brain";
import {VirementSepaDto} from "../../shared/dtos/virement-sepa.dto";
import {VirementSepaEntity} from "../../shared/entities/virement-sepa.entity";
import {VirementSepaService} from "../../shared/services/virement-sepa.service";
import {ComptePrincipalService} from "../../shared/services/compte-principal.service";
import {CompteGroupeService} from "../../shared/services/compte-groupe.service";
import {TransactionEntity} from "../../shared/entities/transaction.entity";

type InvoiceStatus =
  | 'payment_pending'
  | 'pending'
  | 'paid'
  | 'first_reminder_sent'
  | 'second_reminder_sent'
  | 'final_notice_sent';
type FilterStatus = InvoiceStatus | 'all' | 'pending_and_payment_pending';

interface QuoteLike {
  quote_number?: number | string;
}

@Component({
  selector: 'app-all-invoices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmTableComponent,
    HlmTrowComponent,
    HlmThComponent,
    HlmTdComponent,
    EuroFormatPipe,
    DatePipe,
    BrnSelectImports,
    HlmSelectImports,
    HlmInputDirective,
    NgClass,
    HlmButtonDirective,
    HlmIconComponent,
    HlmToasterComponent,
    HlmPaginationDirective,
    HlmPaginationContentDirective,
    HlmPaginationItemDirective,
    HlmDialogHeaderComponent,
    HlmDialogContentComponent,
    BrnDialogContentDirective,
    HlmDialogComponent,
    BrnDialogTriggerDirective,
    HlmDialogTitleDirective,
    HlmDialogDescriptionDirective,
    HlmTableDirective,
  ],
  providers: [
    provideIcons({
      lucideCheckCircle,
      lucideChevronDown,
      lucideFileDown,
      lucideFileText,
      lucideArrowUpDown,
    }),
  ],
  templateUrl: './all-invoices.component.html',
  styleUrl: './all-invoices.component.css',
})
export class AllInvoicesComponent implements OnInit {
  isEditing: any;

  // Pour stocker le type choisi : 'percent' ou 'fixed'
  commissionType: 'percent' | 'fixed' = 'percent';

  // Valeurs éditées séparées
  editedCommissionPercent: number | null = null;
  editedCommissionFixed: number | null = null;

  private readonly invoiceService = inject(InvoiceService);
  private readonly transactionService = inject(TransactionService);
  private readonly virementService= inject(VirementSepaService)

  private readonly principalAccountService = inject(ComptePrincipalService);
  private readonly groupAccountService = inject(CompteGroupeService);
  private readonly usersService = inject(UsersService);
  private readonly pdfService = inject(PdfGeneratorService);

  connectedUser = signal<UserEntity | null>(null);
  allInvoices = signal<InvoiceEntity[]>([]);
  searchTerm = signal<string>('');
  selectedStatus = signal<FilterStatus>('all');
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10);
  sortOrder = signal<'asc' | 'desc'>('desc');
  sortField = signal<'invoice_number' | 'invoice_date' | 'total' | 'id'>(
    'invoice_number'
  );

  filteredInvoices = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.selectedStatus();
    const sortField = this.sortField();
    const sortOrder = this.sortOrder();

    // Filtre toutes les factures et notes de crédit (on pourrait ajouter un filtre de type plus tard)
    let invoices = [...this.allInvoices()];

    // Tri des factures
    invoices = invoices.sort((a, b) => {
      let comparison = 0;
      let numA: number, numB: number;
      let dateA: number, dateB: number;

      switch (sortField) {
        case 'invoice_number':
          // Convertir les numéros de facture en nombres si possible pour un tri correct
          numA = parseInt(a.invoice_number?.toString() || '0', 10);
          numB = parseInt(b.invoice_number?.toString() || '0', 10);
          comparison = numA - numB;
          break;
        case 'invoice_date':
          dateA = new Date(a.invoice_date || 0).getTime();
          dateB = new Date(b.invoice_date || 0).getTime();
          comparison = dateA - dateB;
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
        case 'id':
        default:
          comparison = a.id - b.id;
          break;
      }

      // Inverser le tri si descendant
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return invoices.filter((invoice) => {
      let statusMatch = false;
      if (status === 'all') {
        statusMatch = true;
      } else if (status === 'pending_and_payment_pending') {
        statusMatch =
          invoice.status === 'pending' || invoice.status === 'payment_pending';
      } else {
        statusMatch = invoice.status === status;
      }

      // Format du numéro selon le type de document avec l'année courante
      const currentYear = new Date().getFullYear();
      const paddedNumber =
        invoice.invoice_number?.toString().padStart(4, '0') || '';

      let formattedNumber = '';
      if (invoice.type === 'invoice') {
        formattedNumber = `f-${currentYear}/${paddedNumber}`.toLowerCase();
      } else if (invoice.type === 'credit_note') {
        formattedNumber = `nc-${currentYear}/${paddedNumber}`.toLowerCase();
      }

      const searchMatch =
        !term ||
        invoice.client.name.toLowerCase().includes(term) ||
        invoice.client.company_number?.toString().includes(term) ||
        invoice.id.toString().includes(term) ||
        invoice.invoice_number?.toString().includes(term) ||
        formattedNumber.includes(term);

      return statusMatch && searchMatch;
    });
  });

  totalPages = computed(() => {
    const totalItems = this.filteredInvoices().length;
    return Math.ceil(totalItems / this.itemsPerPage());
  });

  paginatedInvoices = computed(() => {
    const allFiltered = this.filteredInvoices();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return allFiltered.slice(start, end);
  });


  ngOnInit(): void {

    this.usersService
      .getInfo()
      .pipe(
        take(1),
        tap((user) => this.connectedUser.set(user))
      )
      .subscribe();

    this.invoiceService
      .getAll()
      .pipe(
        take(1),
        tap((invoices: InvoiceEntity[]) => {
          console.log('invoices', invoices);
          this.allInvoices.set(invoices);
        })
      )
      .subscribe();
  }

  filterByStatus(status: FilterStatus) {
    console.log(status);
    this.selectedStatus.set(status);
    this.currentPage.set(1);
  }

  searchInvoices(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.currentPage.set(1);
  }

  sortBy(field: 'invoice_number' | 'invoice_date' | 'total' | 'id'): void {
    if (this.sortField() === field) {
      // Inverser l'ordre si on clique sur le même champ
      this.sortOrder.update((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      // Définir le nouveau champ et réinitialiser l'ordre
      this.sortField.set(field);
      this.sortOrder.set('asc');
    }
    // Réinitialiser la pagination
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  markAsPaid(invoiceId: number): void {
    const invoice = this.allInvoices().find(inv => inv.id === invoiceId);
    if (!invoice) {
      toast.error('Facture introuvable.');
      return;
    }


    // Calcul de la commission
    const commission = this.calculateCommissionAmount(invoice);
    const montant = invoice.price_htva;

    // Préparation du DTO

    const virementDto: VirementSepaDto = {
      account_owner: invoice.client.name,
      iban: " ",
      amount_htva: montant,
      amount_tva: 0,
      amount_total: invoice.total,
      communication: `Paiement facture ` + this.formatInvoiceNumber(invoice),
      structured_communication: '',
      transaction_type: 'INCOMING',
      invoice_id: invoice.id
    };


    //verifie si c'est un virement de groupe ou de principal
    let type : string = "";
    let idAccount : number = 0;
   if(invoice.main_account?.id){
      type = "PRINCIPAL"
     idAccount = invoice.main_account.id
   }
    else if(invoice.group_account?.id) {
      type = "GROUP"
     idAccount = invoice.group_account.id
   }

    this.virementService.createVirementSepaFromBank( virementDto, idAccount, type)
      .pipe(take(1))
      .subscribe({
        next: (virement: VirementSepaEntity) => {
          toast.success('Virement SEPA créé et attribué au groupe.');
          // Modification du statut de la facture
          this.invoiceService
            .update(invoice.id, { status: 'paid' })
            .pipe(take(1))
            .subscribe({
              next: () => {
                this.allInvoices.update((invoices) =>
                  invoices.map((inv) =>
                    inv.id === invoice.id ? { ...inv, status: 'paid' } : inv
                  )
                );
                toast.success(`Facture ${invoice.id} marquée comme payée.`);
                this.principalAccountService.getCommisionAccount()
                  .pipe(take(1))
                  .subscribe({
                    next: (idCommisionAccount: number) => {
                      const transactionDtoCommission: TransactionDto = {
                        amount: commission,
                        communication: `Commission pour la facture ` + this.formatInvoiceNumber(invoice),
                        senderGroup: invoice.group_account?.id ?? null,
                        senderPrincipal: invoice.main_account?.id ?? null,
                        recipientPrincipal: [idCommisionAccount],
                        invoice_id: invoice.id

                      };
                      this.transactionService
                        .createTransaction(transactionDtoCommission)
                        .pipe(take(1))
                        .subscribe({
                          next: () => toast.success('Transaction de commission créée.'),
                          error: (err: unknown) => {
                            console.error('Erreur lors de la création de la transaction de commission:', err);
                            toast.error('Erreur lors de la création de la transaction de commission.');
                          }
                        });
                    },
                    error: (err: unknown) => {
                      console.error('Erreur lors de la récupération du compte commission:', err);
                      toast.error('Erreur lors de la récupération du compte commission.');
                    }
                  });


              },
              error: (err: unknown) => {
                console.error('Erreur lors de la mise à jour du statut:', err);
                toast.error('Erreur lors de la mise à jour du statut de la facture.');
              },
            });
        },
        error: (err: unknown) => {
          console.error('Erreur lors de la création du virement SEPA :', err);
          toast.error('Erreur lors de la création du virement SEPA.');
        }
      });




  }
  downloadInvoice(invoice: InvoiceEntity): void {
    console.log('invoice', invoice);
    this.pdfService.generateInvoicePDF(invoice);
  }

  getStatusLabel(status: string | undefined): string {
    switch (status as FilterStatus) {
      case 'payment_pending':
        return 'Paiement en attente';
      case 'pending':
        return 'En attente';
      case 'paid':
        return 'Payée';
      case 'first_reminder_sent':
        return '1er rappel envoyé';
      case 'second_reminder_sent':
        return '2ème rappel envoyé';
      case 'final_notice_sent':
        return 'Mise en demeure envoyée';
      default:
        return status || '';
    }
  }

  getStatusClasses(status: string | undefined): Record<string, boolean> {
    const isPaid = status === 'paid';
    const isPending = status === 'pending';
    const isPaymentPending = status === 'payment_pending';
    const isFirstReminder = status === 'first_reminder_sent';
    const isSecondReminder = status === 'second_reminder_sent';
    const isFinalNotice = status === 'final_notice_sent';

    return {
      'bg-green-100 text-green-800 border-green-200': isPaid,
      'bg-yellow-100 text-yellow-800 border-yellow-200': isPending,
      'bg-blue-100 text-blue-800 border-blue-200': isPaymentPending,
      'bg-orange-100 text-orange-800 border-orange-200': isFirstReminder,
      'bg-red-100 text-red-800 border-red-200': isSecondReminder,
      'bg-purple-100 text-purple-800 border-purple-200': isFinalNotice,
      'bg-gray-100 text-gray-800 border-gray-200':
        !isPaid &&
        !isPending &&
        !isPaymentPending &&
        !isFirstReminder &&
        !isSecondReminder &&
        !isFinalNotice,
    };
  }

  getVisiblePages(): (number | 'ellipsis')[] {
    const currentPage = this.currentPage();
    const totalPages = this.totalPages();
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= halfVisible + 1) {
        for (let i = 1; i <= maxVisiblePages - 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - halfVisible) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - maxVisiblePages + 2; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (
          let i = currentPage - halfVisible + 1;
          i <= currentPage + halfVisible - 1;
          i++
        ) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    return pages;
  }

  /**
   * Formate le numéro de facture selon son type.
   * @param invoice La facture à formater
   * @returns Le numéro formaté avec le préfixe approprié
   */
  formatInvoiceNumber(invoice: InvoiceEntity): string {
    if (!invoice.invoice_number) return '';

    const currentYear = new Date().getFullYear();
    const paddedNumber = invoice.invoice_number.toString().padStart(4, '0');

    if (invoice.type === 'invoice') {
      // Format global: f-(année)/000(numéro)
      return `f-${currentYear}/${paddedNumber}`;
    } else if (invoice.type === 'credit_note') {
      // Format note de crédit: nc-(année)/000(numéro)
      return `nc-${currentYear}/${paddedNumber}`;
    }

    return `${invoice.invoice_number}`;
  }

  /**
   * Formate le numéro de devis.
   * @param quote Le devis à formater
   * @returns Le numéro formaté avec le préfixe approprié
   */
  formatQuoteNumber(quote: QuoteLike): string {
    if (!quote.quote_number) return '';

    const currentYear = new Date().getFullYear();
    const paddedNumber = quote.quote_number.toString().padStart(4, '0');

    // Format: d-(année)/000(numéro)
    return `d-${currentYear}/${paddedNumber}`;
  }

  editCommission(invoice: InvoiceEntity) {
    const account = invoice.main_account ?? invoice.group_account;

    this.editedCommissionPercent = account?.commissionPourcentage ?? null;
    this.editedCommissionFixed = account?.commission ?? null;

    this.commissionType = this.editedCommissionPercent != null ? 'percent' : 'fixed';
    this.isEditing = true;
  }

  cancelEdit() {
    this.isEditing = false;
    this.editedCommissionPercent = null;
    this.editedCommissionFixed = null;
  }

  saveCommission(invoice: InvoiceEntity) {
    const account = invoice.main_account ?? invoice.group_account;
    if (!account) return;

    if (this.commissionType === 'percent' && this.editedCommissionPercent != null) {
      account.commissionPourcentage = this.editedCommissionPercent;
      account.commission = undefined;
    } else if (this.commissionType === 'fixed' && this.editedCommissionFixed != null) {
      account.commission = this.editedCommissionFixed;
      account.commissionPourcentage = undefined;
    }

    this.cancelEdit();
  }

  calculateCommissionAmount(invoice: InvoiceEntity): number {
    const account = invoice.main_account ?? invoice.group_account;
    const percent = account?.commissionPourcentage;
    const fixed = account?.commission;
    const priceHtva = invoice.price_htva ?? 0;

    if (percent != null) {
      return (priceHtva * percent) / 100;
    } else if (fixed != null) {
      return fixed;
    } else {
      return 0;
    }
  }

  cancel(invoice: InvoiceEntity) {
    let virementBackup: VirementSepaEntity | null = null;
    let transactionBackup: TransactionEntity | null = null;

    // On vérifie d'abord la présence du virement et de la transaction
    this.virementService.getVirementSepaByInvoiceId(invoice.id).pipe(
      take(1),
      switchMap((virement: VirementSepaEntity | null) => {
        if (!virement) return throwError(() => new Error('Aucun virement SEPA trouvé.'));
        virementBackup = virement;
        return this.transactionService.getTransactionByInvoiceId(invoice.id).pipe(
          take(1),
          switchMap((transaction: TransactionEntity | null) => {
            if (!transaction) return throwError(() => new Error('Aucune transaction trouvée.'));
            transactionBackup = transaction;

            // Toutes les entités existent, on peut commencer les modifications
            // 1. Reverse virement (décrémente le solde et supprime le virement)
            let updateSolde$ = invoice.group_account
              ? this.groupAccountService.updateGroupeSolde(invoice.group_account.id, -virement.amount_htva).pipe(take(1))
              : this.principalAccountService.updatePrincipalSolde(invoice.main_account.id, -virement.amount_htva).pipe(take(1));
            return updateSolde$.pipe(
              switchMap(() => this.virementService.deleteVirementSepa(virement.id).pipe(take(1))),
              // 2. Suppression de la transaction et update soldes
              switchMap(() => this.transactionService.deleteTransaction(transaction.id).pipe(take(1))),
              switchMap(() => {
                let updateSolde2$ = invoice.group_account
                  ? this.groupAccountService.updateGroupeSolde(invoice.group_account.id, transaction.amount).pipe(take(1))
                  : this.principalAccountService.updatePrincipalSolde(invoice.main_account.id, transaction.amount).pipe(take(1));
                const updateCommission$ = this.principalAccountService.getCommisionAccount().pipe(
                  take(1),
                  switchMap((idCommisionAccount: number) =>
                    this.principalAccountService.updatePrincipalSolde(idCommisionAccount, -transaction.amount).pipe(take(1))
                  )
                );
                return (updateSolde2$ ? updateSolde2$ : updateCommission$).pipe(
                  switchMap(() => updateCommission$)
                );
              }),
              // 3. Mise à jour du statut de la facture
              switchMap(() => this.invoiceService.update(invoice.id, { status: 'payment_pending' }).pipe(take(1)))
            );
          })
        );
      })
    ).subscribe({
      next: () => {
        this.allInvoices.update((invoices) =>
          invoices.map((inv) =>
            inv.id === invoice.id ? { ...inv, status: 'pending' } : inv
          )
        );
        toast.success(`Facture ${invoice.id} annulée.`);
      },
      error: (err) => {
        toast.error('Erreur lors de l\'annulation : ' + (err?.message || err));
        console.error('Erreur lors de l\'annulation :', err);
      }
    });
  }


}
