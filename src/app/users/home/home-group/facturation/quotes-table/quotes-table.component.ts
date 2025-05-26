import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
  input, inject,
} from '@angular/core';
import {DatePipe, JsonPipe, NgClass, NgIf} from '@angular/common';
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
import { UserEntity } from '../../../../../shared/entities/user.entity';
import {quotes} from "html2canvas/dist/types/css/property-descriptors/quotes";
import {QuoteService} from "../../../../../shared/services/quote.service";
import {firstValueFrom} from "rxjs";
import {toast} from "ngx-sonner";

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
    NgIf,

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
  private readonly services = {quote: inject(QuoteService),}


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
  //@Output() acceptQuoteGroupeEvent = new EventEmitter<number>();

  // Ajout des signaux pour la modal de commentaire
  protected isCommentModalOpen = signal(false);
  protected currentCommentHtml = signal<string | null>(null);

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
  /**
   * Accepte un devis.
   * @param id L'ID du devis à accepter.
   */
  loadingAccept = signal<number | null>(null);

  async acceptQuoteGroupe(id: number) {
    this.loadingAccept.set(id);
    try {
      const updatedQuote = await firstValueFrom(this.services.quote.acceptQuoteGroupe(id));
      this.allQuotes.update((quotes) =>
        quotes.map((q) => q.id === id ? { ...q, group_acceptance: updatedQuote.group_acceptance } : q)
      );
      toast.success("Devis accepté avec succès.");
    } catch (error) {
      toast.error("Erreur lors de l'acceptation du devis.");
    } finally {
      this.loadingAccept.set(null);
    }
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

  /**
   * Ouvre la modal pour afficher le commentaire HTML.
   * @param comment Le commentaire HTML à afficher.
   */
  openCommentModal(comment: string | undefined): void {
    if (comment) {
      this.currentCommentHtml.set(comment);
      this.isCommentModalOpen.set(true);
    }
  }

  /**
   * Formate le numéro de devis.
   * @param doc Le document (devis)
   * @returns Le numéro formaté avec le préfixe approprié
   */
  formatQuoteNumber(doc: Document): string {
    if (!doc.quote_number) return '';

    const currentYear = new Date().getFullYear();
    const paddedNumber = doc.quote_number.toString().padStart(4, '0');

    // Format: d-(année)/000(numéro)
    return `d-${currentYear}/${paddedNumber}`;
  }

  /**
   * Supprime les balises HTML d'une chaîne de caractères.
   * @param html La chaîne HTML à nettoyer.
   * @returns La chaîne sans balises HTML.
   */
  stripHtmlTags(html: string): string {
    if (!html) {
      return '';
    }
    // Utilise DOMParser pour analyser et extraire le texte
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }
}
