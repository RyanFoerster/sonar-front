import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
  input,
} from '@angular/core';
import { DatePipe, JsonPipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { HlmTableImports } from '@spartan-ng/ui-table-helm';
import {
  HlmPaginationDirective,
  HlmPaginationContentDirective,
  HlmPaginationItemDirective,
} from '@spartan-ng/ui-pagination-helm';
import {
  HlmAlertDialogComponent,
  HlmAlertDialogContentComponent,
  HlmAlertDialogDescriptionDirective,
  HlmAlertDialogFooterComponent,
  HlmAlertDialogHeaderComponent,
  HlmAlertDialogTitleDirective,
} from '@spartan-ng/ui-alertdialog-helm';
import {
  BrnAlertDialogContentDirective,
  BrnAlertDialogTriggerDirective,
} from '@spartan-ng/ui-alertdialog-brain';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';
import { provideIcons } from '@ng-icons/core';
import {
  lucideFileDown,
  lucideEdit,
  lucideFileText,
  lucideFilePlus,
  lucideMessageCircle,
} from '@ng-icons/lucide';

import { EuroFormatPipe } from '../../../../../shared/pipes/euro-format.pipe';
import { QuoteEntity } from '../../../../../shared/entities/quote.entity';
import { InvoiceEntity } from '../../../../../shared/entities/invoice.entity';
import { UserEntity } from '../../../../../shared/entities/user.entity';

// Importing the Document interface from parent component
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

export interface ModalContext {
  close: () => void;
}

@Component({
  selector: 'app-quotes-table',
  standalone: true,
  imports: [
    HlmButtonDirective,
    HlmIconComponent,
    RouterLink,
    DatePipe,
    EuroFormatPipe,
    HlmTableImports,
    HlmAlertDialogComponent,
    HlmAlertDialogContentComponent,
    HlmAlertDialogDescriptionDirective,
    HlmAlertDialogFooterComponent,
    HlmAlertDialogHeaderComponent,
    HlmAlertDialogTitleDirective,
    BrnAlertDialogContentDirective,
    BrnAlertDialogTriggerDirective,
    FormsModule,
    NgClass,
    HlmPaginationDirective,
    HlmPaginationContentDirective,
    HlmPaginationItemDirective,
    HlmToasterComponent,
    JsonPipe,
  ],
  providers: [
    provideIcons({
      lucideFileDown,
      lucideEdit,
      lucideFileText,
      lucideFilePlus,
      lucideMessageCircle,
    }),
    DatePipe,
  ],
  templateUrl: './quotes-table.component.html',
  styleUrl: './quotes-table.component.css',
})
export class QuotesTableComponent {
  @Input() allQuotes = signal<Document[]>([]);
  @Input() pagination: {
    currentPage: () => number;
    totalPages: () => number;
    totalItems: () => number;
  } = {
    currentPage: () => 1,
    totalPages: () => 1,
    totalItems: () => 0,
  };
  @Input() itemsPerPage = signal(10);
  @Input() currentFilter: 'all' | 'quotes' | 'invoiced_quotes' | 'credit-note' =
    'all';
  typeOfProjet = input<string>();
  canEditBilling = input<boolean>(false);
  hasAccessToBilling = input<boolean>(true);
  connectedUser = input<UserEntity | null>(null);

  @Output() pageChange = new EventEmitter<number>();
  @Output() filterChange = new EventEmitter<
    'all' | 'quotes' | 'invoiced_quotes' | 'credit-note'
  >();
  @Output() downloadQuote = new EventEmitter<Document>();
  @Output() downloadInvoice = new EventEmitter<Document>();
  @Output() loadCreditNoteEvent = new EventEmitter<number>();
  @Output() createInvoiceEvent = new EventEmitter<{
    quote: QuoteEntity;
    ctx: ModalContext;
  }>();

  protected paginatedDocuments = computed(() => {
    const startIndex =
      (this.pagination.currentPage() - 1) * this.itemsPerPage();
    return this.allQuotes().slice(startIndex, startIndex + this.itemsPerPage());
  });

  generateQuotePDF(quote: Document): void {
    this.downloadQuote.emit(quote);
  }

  generateInvoicePDF(invoice: Document): void {
    this.downloadInvoice.emit(invoice);
  }

  loadCreditNote(id: number): void {
    this.loadCreditNoteEvent.emit(id);
  }

  createInvoice(quote: QuoteEntity, ctx: ModalContext): void {
    this.createInvoiceEvent.emit({ quote, ctx });
  }

  onPageChange(page: number): void {
    this.pageChange.emit(page);
  }

  filterList(
    filter: 'all' | 'quotes' | 'invoiced_quotes' | 'credit-note'
  ): void {
    this.filterChange.emit(filter);
  }

  getVisiblePages(
    currentPage: number,
    totalPages: number
  ): (number | 'ellipsis')[] {
    const visibleCount = 5;
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= visibleCount) {
      // Cas simple : afficher toutes les pages si total ≤ visibleCount
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Toujours montrer la première page
      pages.push(1);

      // Gérer les ellipses et pages autour de la page courante
      if (currentPage <= 3) {
        // Près du début
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
      } else if (currentPage >= totalPages - 2) {
        // Près de la fin
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages - 1; i++) {
          pages.push(i);
        }
      } else {
        // Au milieu
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
      }

      // Toujours montrer la dernière page
      pages.push(totalPages);
    }

    return pages;
  }

  asQuoteEntity(doc: Document): QuoteEntity {
    return doc as unknown as QuoteEntity;
  }
}
