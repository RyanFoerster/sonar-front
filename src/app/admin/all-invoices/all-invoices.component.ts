import { DatePipe, NgClass, CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import {
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import { take, tap } from 'rxjs';
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
  HlmPaginationEllipsisComponent,
  HlmPaginationItemDirective,
  HlmPaginationLinkDirective,
  HlmPaginationNextComponent,
  HlmPaginationPreviousComponent,
} from '@spartan-ng/ui-pagination-helm';
import { toast } from 'ngx-sonner';
import { PdfGeneratorService } from '../../shared/services/pdf-generator.service';

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
    HlmPaginationPreviousComponent,
    HlmPaginationLinkDirective,
    HlmPaginationEllipsisComponent,
    HlmPaginationNextComponent,
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
  private readonly invoiceService = inject(InvoiceService);
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
    this.invoiceService
      .update(invoiceId, { status: 'paid' })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.allInvoices.update((invoices) =>
            invoices.map((inv) =>
              inv.id === invoiceId ? { ...inv, status: 'paid' } : inv
            )
          );
          toast.success(`Facture ${invoiceId} marquée comme payée.`);
        },
        error: (err: unknown) => {
          console.error('Erreur lors du marquage comme payé:', err);
          toast.error('Erreur lors de la mise à jour du statut de la facture.');
        },
      });
  }

  downloadInvoice(invoice: InvoiceEntity): void {
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
}
