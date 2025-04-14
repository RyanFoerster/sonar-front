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

type InvoiceStatus = 'payment_pending' | 'pending' | 'paid';

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
    }),
  ],
  templateUrl: './all-invoices.component.html',
  styleUrl: './all-invoices.component.css',
})
export class AllInvoicesComponent implements OnInit {
  private readonly invoiceService = inject(InvoiceService);
  private readonly usersService = inject(UsersService);

  connectedUser = signal<UserEntity | null>(null);
  allInvoices = signal<InvoiceEntity[]>([]);
  searchTerm = signal<string>('');
  selectedStatus = signal<InvoiceStatus | 'all'>('all');
  currentPage = signal<number>(1);
  itemsPerPage = signal<number>(10);

  filteredInvoices = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.selectedStatus();
    const invoices = this.allInvoices()
      .filter((invoice) => invoice.type === 'invoice')
      .sort((a, b) => b.id - a.id);

    return invoices.filter((invoice) => {
      const statusMatch = status === 'all' || invoice.status === status;
      const searchMatch =
        !term ||
        invoice.client.name.toLowerCase().includes(term) ||
        invoice.client.company_number?.toString().includes(term) ||
        invoice.id.toString().includes(term);
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

  filterByStatus(status: InvoiceStatus | 'all') {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
  }

  searchInvoices(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
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
    console.log('Tentative de téléchargement de la facture:', invoice.id);
    toast.info(
      `Le téléchargement de la facture ${invoice.id} n'est pas encore implémenté.`
    );
  }

  getStatusLabel(status: string): string {
    switch (status as InvoiceStatus) {
      case 'payment_pending':
        return 'En attente';
      case 'pending':
        return 'En attente';
      case 'paid':
        return 'Payée';
      default:
        return status;
    }
  }

  getStatusClasses(status: string): Record<string, boolean> {
    const isPaid = status === 'paid';
    const isPending = status === 'payment_pending' || status === 'pending';

    return {
      'bg-green-100 text-green-800 border-green-200': isPaid,
      'bg-yellow-100 text-yellow-800 border-yellow-200': isPending,
      'bg-gray-100 text-gray-800 border-gray-200': !isPaid && !isPending,
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
}
