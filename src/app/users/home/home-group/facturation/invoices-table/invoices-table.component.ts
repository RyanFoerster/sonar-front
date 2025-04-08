import { Component, input, output } from '@angular/core';
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
interface Document {
  id: number;
  documentType: 'quote' | 'invoice' | 'credit_note' | string;
  documentDate: Date;
  total: number;
  client: {
    id: number;
    name: string;
    email: string;
    street?: string;
    number?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    phone?: string;
    company_vat_number?: string;
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

  asInvoiceEntity(doc: Document): Document {
    return doc;
  }
}
