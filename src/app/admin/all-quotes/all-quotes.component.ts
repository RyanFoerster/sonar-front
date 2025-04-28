import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  HlmPaginationContentDirective,
  HlmPaginationDirective,
  HlmPaginationEllipsisComponent,
  HlmPaginationItemDirective,
  HlmPaginationLinkDirective,
  HlmPaginationNextComponent,
  HlmPaginationPreviousComponent,
} from '@spartan-ng/ui-pagination-helm';
import {
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmIconComponent, provideIcons } from '@spartan-ng/ui-icon-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';
import {
  lucideArrowUpDown,
  lucideChevronDown,
  lucideFileDown,
  lucideFileText,
  lucideCheckCircle, // Si besoin d'actions similaires
  // Ajoutez d'autres icônes si nécessaire
} from '@ng-icons/lucide';
import { take, tap } from 'rxjs';
import { toast } from 'ngx-sonner';

import { QuoteEntity } from '../../shared/entities/quote.entity';
import { UserEntity } from '../../shared/entities/user.entity';
import { EuroFormatPipe } from '../../shared/pipes/euro-format.pipe';
import { QuoteService } from '../../shared/services/quote.service';
import { UsersService } from '../../shared/services/users.service';
import { PdfGeneratorService } from '../../shared/services/pdf-generator.service';
// import { PdfGeneratorService } from '../../shared/services/pdf-generator.service'; // Si besoin de générer/télécharger PDF

type FilterQuoteStatus = string | 'all';

@Component({
  selector: 'app-all-quotes',
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
      lucideArrowUpDown,
      lucideChevronDown,
      lucideFileDown,
      lucideFileText,
      lucideCheckCircle, // Si besoin
    }),
  ],
  templateUrl: './all-quotes.component.html',
  styleUrl: './all-quotes.component.css',
})
export class AllQuotesComponent implements OnInit {
  private readonly quoteService = inject(QuoteService);
  private readonly usersService = inject(UsersService);
  private readonly pdfService = inject(PdfGeneratorService); // Si besoin

  connectedUser = signal<UserEntity | null>(null);
  allQuotes = signal<QuoteEntity[]>([]);
  searchTerm = signal<string>('');
  selectedStatus = signal<FilterQuoteStatus>('all');
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10);
  sortOrder = signal<'asc' | 'desc'>('desc');
  sortField = signal<'quote_number' | 'quote_date' | 'total' | 'id'>('id');

  filteredQuotes = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.selectedStatus();
    const field = this.sortField();
    const order = this.sortOrder();

    let quotes = [...this.allQuotes()];

    // Tri
    quotes = quotes.sort((a, b) => {
      let comparison = 0;
      let numA: number, numB: number;
      let dateA: number, dateB: number;

      switch (field) {
        case 'quote_number':
          numA = a.quote_number || 0;
          numB = b.quote_number || 0;
          comparison = numA - numB;
          break;
        case 'quote_date':
          dateA = new Date(a.quote_date || 0).getTime();
          dateB = new Date(b.quote_date || 0).getTime();
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
      return order === 'asc' ? comparison : -comparison;
    });

    // Filtre et Recherche
    return quotes.filter((quote) => {
      const statusMatch = status === 'all' || quote.status === status;

      const formattedNumber = this.formatQuoteNumber(quote).toLowerCase();

      const searchMatch =
        !term ||
        quote.client.name.toLowerCase().includes(term) ||
        quote.client.company_number?.toString().includes(term) ||
        quote.id.toString().includes(term) ||
        quote.quote_number?.toString().includes(term) ||
        formattedNumber.includes(term);
      // || (quote as any).main_account?.username.toLowerCase().includes(term) // Commented out due to entity mismatch
      // || (quote as any).group_account?.username.toLowerCase().includes(term); // Commented out due to entity mismatch

      return statusMatch && searchMatch;
    });
  });

  totalPages = computed(() => {
    const totalItems = this.filteredQuotes().length;
    return Math.ceil(totalItems / this.itemsPerPage());
  });

  paginatedQuotes = computed(() => {
    const allFiltered = this.filteredQuotes();
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

    this.quoteService
      .getAllAdmin() // Utilise la nouvelle méthode du service
      .pipe(
        take(1),
        tap((quotes: QuoteEntity[]) => {
          console.log('quotes', quotes);
          this.allQuotes.set(quotes);
        })
      )
      .subscribe();
  }

  filterByStatus(status: FilterQuoteStatus) {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
  }

  searchQuotes(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.currentPage.set(1);
  }

  sortBy(field: 'quote_number' | 'quote_date' | 'total' | 'id'): void {
    if (this.sortField() === field) {
      this.sortOrder.update((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortOrder.set('asc'); // Par défaut ascendant pour un nouveau champ
    }
    this.currentPage.set(1);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  // --- Méthodes utilitaires (Statuts, Formatage) ---

  getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'accepted':
        return 'Accepté';
      case 'refused':
        return 'Refusé';
      case 'invoiced':
        return 'Facturé';
      case 'expired':
        return 'Expiré';
      default:
        return status || 'Inconnu';
    }
  }

  getStatusClasses(status: string | undefined): Record<string, boolean> {
    return {
      'bg-yellow-100 text-yellow-800 border-yellow-200': status === 'pending',
      'bg-green-100 text-green-800 border-green-200': status === 'accepted',
      'bg-red-100 text-red-800 border-red-200': status === 'refused',
      'bg-blue-100 text-blue-800 border-blue-200': status === 'invoiced',
      'bg-gray-100 text-gray-800 border-gray-200':
        status === 'expired' || !status,
    };
  }

  formatQuoteNumber(quote: QuoteEntity): string {
    if (!quote.quote_number) return '';
    const year =
      new Date(quote.quote_date).getFullYear() || new Date().getFullYear();
    const paddedNumber = quote.quote_number.toString().padStart(4, '0');
    return `d-${year}/${paddedNumber}`;
  }

  downloadQuote(quote: QuoteEntity): void {
    // Implémentez la logique de téléchargement du PDF du devis si nécessaire
    this.pdfService.generateQuotePDF(quote);
    toast.info(
      `Téléchargement du devis ${this.formatQuoteNumber(quote)} demandé.`
    );
  }

  // --- Pagination --- Géré par HlmPagination components
  getVisiblePages(): (number | 'ellipsis')[] {
    const currentPage = this.currentPage();
    const totalPages = this.totalPages();
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= halfVisible + 1) {
        for (let i = 1; i <= maxVisiblePages - 1; i++) pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - halfVisible) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - maxVisiblePages + 2; i <= totalPages; i++)
          pages.push(i);
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (
          let i = currentPage - halfVisible + 1;
          i <= currentPage + halfVisible - 1;
          i++
        )
          pages.push(i);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    return pages;
  }
}
