import { DatePipe, NgClass } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import { BrnSeparatorComponent } from '@spartan-ng/ui-separator-brain';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import {
  HlmCaptionComponent,
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
@Component({
  selector: 'app-all-invoices',
  standalone: true,
  imports: [
    HlmTableComponent,
    HlmTrowComponent,
    HlmThComponent,
    HlmTdComponent,
    HlmCaptionComponent,
    EuroFormatPipe,
    DatePipe,
    BrnSeparatorComponent,
    HlmSeparatorDirective,
    BrnSelectImports,
    HlmSelectImports,
    HlmInputDirective,
    NgClass,
  ],
  templateUrl: './all-invoices.component.html',
  styleUrl: './all-invoices.component.css',
})
export class AllInvoicesComponent implements AfterViewInit {
  invoiceService = inject(InvoiceService);
  usersService = inject(UsersService);

  connectedUser = signal<UserEntity | null>(null);
  allInvoices = signal<InvoiceEntity[]>([]);
  filteredInvoices = signal<InvoiceEntity[]>([]);

  sortedInvoices = computed(() => {
    return this.filteredInvoices()
      .sort((a, b) => b.id - a.id)
      .filter((invoice) => invoice.type === 'invoice');
  });

  constructor() {}

  ngAfterViewInit(): void {
    this.usersService
      .getInfo()
      .pipe(
        take(1),
        tap((user) => {
          this.connectedUser.set(user);
        }),
      )
      .subscribe();
    this.invoiceService
      .getAll()
      .pipe(
        tap((invoices) => {
          this.allInvoices.set(invoices);
          this.filteredInvoices.set(invoices);
        }),
      )
      .subscribe();
  }

  sortInvoices(
    status:
      | 'payment_pending'
      | 'payment_done'
      | 'payment_error'
      | 'draft'
      | 'canceled'
      | 'sended'
      | 'all',
  ) {
    if (status === 'all') {
      this.filteredInvoices.set(this.allInvoices());
    } else {
      this.filteredInvoices.set(
        this.allInvoices().filter((invoice) => invoice.status === status),
      );
    }
  }

  searchInvoices(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    this.filteredInvoices.set(
      this.allInvoices().filter(
        (invoice) =>
          invoice.client.name.toLowerCase().includes(value.toLowerCase()) ||
          invoice.client.company_number?.toString().includes(value) ||
          invoice.id.toString().includes(value),
      ),
    );
  }
}
