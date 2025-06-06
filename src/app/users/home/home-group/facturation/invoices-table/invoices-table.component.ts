import { Component, input, output, inject } from '@angular/core';
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

interface Document {
  id: number;
  documentType: 'quote' | 'invoice' | 'credit_note' | string;
  documentDate: Date;
  total: number;
  client: {
    id: number;
    name: string;
    firstname?: string;
    lastname?: string;
    email: string;
    street?: string;
    number?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    phone?: string;
    company_vat_number?: string;
    is_physical_person?: boolean;
  };
  main_account?: {
    id: number;
    username: string;
  };
  group_account?: {
    id: number;
    username: string;
  };
  invoice_number?: number;
  quote_number?: number;
  invoice?: any;
  group_acceptance?: string;
  order_giver_acceptance?: string;
  comment?: string;
  [key: string]: any; // Pour permettre d'autres propriétés
}

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
  ],
  providers: [provideIcons({ lucideCheckCircle })],
  templateUrl: './invoices-table.component.html',
  styleUrl: './invoices-table.component.css',
})
export class InvoicesTableComponent {
  allInvoicesAndCreditNotes = input<Document[]>([]);
  paginatedInvoicesAndCreditNotes = input<Document[]>([]);
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
  generateInvoicePDFEvent = output<Document>();
  generateCreditNotePdfEvent = output<Document>();
  loadCreditNoteEvent = output<number>();
  invoiceStatusUpdated = output<number>();

  filterInvoicesList(filter: 'all' | 'invoices' | 'credit-notes'): void {
    this.filterInvoicesListEvent.emit(filter);
  }

  onInvoicesPageChange(page: number): void {
    this.invoicesPageChangeEvent.emit(page);
  }

  generateInvoicePDF(invoice: Document): void {
    this.generateInvoicePDFEvent.emit(invoice);
  }

  generateCreditNotePdf(creditNote: Document): void {
    this.generateCreditNotePdfEvent.emit(creditNote);
  }

  loadCreditNote(id: number): void {
    this.loadCreditNoteEvent.emit(id);
  }

  markAsPaid(invoiceId: number): void {
    this.invoiceService.update(invoiceId, { status: 'paid' }).subscribe({
      next: (/* updatedInvoice */) => {
        console.log(`Facture ${invoiceId} marquée comme payée.`);
        this.invoiceStatusUpdated.emit(invoiceId);
        // Mettre à jour la liste locale pour refléter le changement
        /* const updateLocalList = (list: Document[]) =>
          list.map((doc) =>
            doc.id === invoiceId && doc.documentType === 'invoice'
              ? { ...doc, status: 'paid' }
              : doc
          ); */

        // Mettre à jour à la fois la liste complète et la liste paginée si nécessaire
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour du statut:', err);
        // toast.error('Erreur lors de la mise à jour du statut de la facture.');
      },
    });
  }

  asInvoiceEntity(doc: Document): Document {
    return doc;
  }

  /**
   * Formate le numéro de facture selon son type.
   * @param doc Le document (facture ou note de crédit)
   * @returns Le numéro formaté avec le préfixe approprié
   */
  formatInvoiceNumber(doc: Document): string {
    if (!doc.invoice_number) return '';

    const currentYear = new Date().getFullYear();
    const paddedNumber = doc.invoice_number.toString().padStart(4, '0');

    if (doc.documentType === 'invoice') {
      // Format global: f-(année)/000(numéro)
      return `f-${currentYear}/${paddedNumber}`;
    } else if (doc.documentType === 'credit_note') {
      // Format note de crédit: nc-(année)/000(numéro)
      return `nc-${currentYear}/${paddedNumber}`;
    }

    return `${doc.invoice_number}`;
  }
}
