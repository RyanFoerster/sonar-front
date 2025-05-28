import {Component, input, output, inject, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import {
  HlmPaginationDirective,
  HlmPaginationContentDirective,
  HlmPaginationItemDirective,
} from '@spartan-ng/ui-pagination-helm';
import { EuroFormatPipe } from '../../../../../shared/pipes/euro-format.pipe';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';
import { InvoiceService } from '../../../../../shared/services/invoice.service';
import { provideIcons } from '@ng-icons/core';
import { lucideCheckCircle } from '@ng-icons/lucide';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {InvoiceEntity} from "../../../../../shared/entities/invoice.entity";
import {switchMap, take, throwError} from "rxjs";
import {toast} from "ngx-sonner";
import {VirementSepaEntity} from "../../../../../shared/entities/virement-sepa.entity";
import {TransactionService} from "../../../../../shared/services/transaction.service";
import {VirementSepaService} from "../../../../../shared/services/virement-sepa.service";
import {ComptePrincipalService} from "../../../../../shared/services/compte-principal.service";
import {BrnDialogContentDirective, BrnDialogTriggerDirective} from "@spartan-ng/ui-dialog-brain";
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogDescriptionDirective,
  HlmDialogHeaderComponent, HlmDialogTitleDirective
} from "@spartan-ng/ui-dialog-helm";
import {VirementSepaDto} from "../../../../../shared/dtos/virement-sepa.dto";
import {TransactionDto} from "../../../../../shared/dtos/transaction.dto";
import {TransactionEntity} from "../../../../../shared/entities/transaction.entity";
import {CompteGroupeService} from "../../../../../shared/services/compte-groupe.service";


@Component({
  selector: 'app-invoices-table',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HlmButtonDirective,
    HlmIconComponent,
    HlmPaginationDirective,
    HlmPaginationContentDirective,
    HlmPaginationItemDirective,
    HlmToasterComponent,
    EuroFormatPipe,
    ReactiveFormsModule,
    FormsModule,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
  ],
  providers: [provideIcons({ lucideCheckCircle })],
  templateUrl: './invoices-table.component.html',
  styleUrl: './invoices-table.component.css',
})
export class InvoicesTableComponent {
  isEditing: any;
  // Pour stocker le type choisi : 'percent' ou 'fixed'
  commissionType: 'percent' | 'fixed' = 'percent';

  // Valeurs éditées séparées
  editedCommissionPercent: number | null = null;
  editedCommissionFixed: number | null = null;
  allInvoices = signal<InvoiceEntity[]>([]);
  allInvoicesAndCreditNotes = input<InvoiceEntity[]>([]);
  paginatedInvoicesAndCreditNotes = input<InvoiceEntity[]>([]);
  invoicesFilter = input<string>('all');
  invoicesPagination = input<{
    currentPage: () => number;
    totalPages: () => number;
  }>({
    currentPage: () => 1,
    totalPages: () => 1,
  });
  typeOfProjet = input<string>('');
  canEditBilling = input<boolean>(false);
  hasAccessToBilling = input<boolean>(false);
  connectedUser = input<any>(null);

  private readonly invoiceService = inject(InvoiceService);
  private readonly transactionService = inject(TransactionService);
  private readonly virementService= inject(VirementSepaService)
  private readonly groupAccountService = inject(CompteGroupeService);
  private readonly principalAccountService = inject(ComptePrincipalService);

  getVisibleInvoicesPages = (
    currentPage: number,
    totalPages: number
  ): (number | 'ellipsis')[] => {
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
  };

  filterInvoicesListEvent = output<'all' | 'invoices' | 'credit-notes'>();
  invoicesPageChangeEvent = output<number>();
  generateInvoicePDFEvent = output<InvoiceEntity>();
  generateCreditNotePdfEvent = output<InvoiceEntity>();
  loadCreditNoteEvent = output<number>();
  invoiceStatusUpdated = output<number>();

  filterInvoicesList(filter: 'all' | 'invoices' | 'credit-notes'): void {
    this.filterInvoicesListEvent.emit(filter);
  }

  onInvoicesPageChange(page: number): void {
    this.invoicesPageChangeEvent.emit(page);
  }

  generateInvoicePDF(invoice: InvoiceEntity): void {
    this.generateInvoicePDFEvent.emit(invoice);
  }

  generateCreditNotePdf(creditNote: InvoiceEntity): void {
    this.generateCreditNotePdfEvent.emit(creditNote);
  }

  loadCreditNote(id: number): void {
    this.loadCreditNoteEvent.emit(id);
  }

  markAsPaid(invoiceId: number): void {
    console.log('Marking invoice as paid:', invoiceId);
    const invoice = this.allInvoicesAndCreditNotes().find(inv => inv.id === invoiceId);
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
                          next: () => {
                            toast.success('Transaction de commission créée.');
                            // Recharge la liste des factures ici
                            this.invoiceStatusUpdated.emit(invoiceId);
                          },
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

  asInvoiceEntity(doc: InvoiceEntity): InvoiceEntity {
    return doc;
  }

  /**
   * Formate le numéro de facture selon son type.
   * @param doc Le document (facture ou note de crédit)
   * @returns Le numéro formaté avec le préfixe approprié
   */
  formatInvoiceNumber(doc: InvoiceEntity): string {
    if (!doc.invoice_number) return '';

    const currentYear = new Date().getFullYear();
    const paddedNumber = doc.invoice_number.toString().padStart(4, '0');

    if (doc.type === 'invoice') {
      // Format global: f-(année)/000(numéro)
      return `f-${currentYear}/${paddedNumber}`;
    } else if (doc.type === 'credit_note') {
      // Format note de crédit: nc-(année)/000(numéro)
      return `nc-${currentYear}/${paddedNumber}`;
    }

    return `${doc.invoice_number}`;
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
        this.invoiceStatusUpdated.emit(invoice.id);
      },
      error: (err) => {
        toast.error('Erreur lors de l\'annulation : ' + (err?.message || err));
        console.error('Erreur lors de l\'annulation :', err);
      }
    });
  }

}
