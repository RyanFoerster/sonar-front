import { DatePipe, JsonPipe, Location, NgClass } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  signal,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideCornerDownLeft,
  lucideEdit,
  lucideFileDown,
  lucideFilePlus,
  lucideFileText,
} from '@ng-icons/lucide';
import {
  BrnAlertDialogContentDirective,
  BrnAlertDialogTriggerDirective,
} from '@spartan-ng/ui-alertdialog-brain';
import {
  HlmAlertDialogActionButtonDirective,
  HlmAlertDialogCancelButtonDirective,
  HlmAlertDialogComponent,
  HlmAlertDialogContentComponent,
  HlmAlertDialogDescriptionDirective,
  HlmAlertDialogFooterComponent,
  HlmAlertDialogHeaderComponent,
  HlmAlertDialogOverlayDirective,
  HlmAlertDialogTitleDirective,
} from '@spartan-ng/ui-alertdialog-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {
  BrnDialogContentDirective,
  BrnDialogTriggerDirective,
} from '@spartan-ng/ui-dialog-brain';
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogDescriptionDirective,
  HlmDialogFooterComponent,
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective,
} from '@spartan-ng/ui-dialog-helm';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { BrnSeparatorComponent } from '@spartan-ng/ui-separator-brain';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTableImports,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import { take, tap } from 'rxjs';
import { CompteGroupeEntity } from '../../../../shared/entities/compte-groupe.entity';
import { InvoiceEntity } from '../../../../shared/entities/invoice.entity';
import { PrincipalAccountEntity } from '../../../../shared/entities/principal-account.entity';
import { QuoteEntity } from '../../../../shared/entities/quote.entity';
import { UserEntity } from '../../../../shared/entities/user.entity';
import { EuroFormatPipe } from '../../../../shared/pipes/euro-format.pipe';
import { AuthService } from '../../../../shared/services/auth.service';
import { ComptePrincipalService } from '../../../../shared/services/compte-principal.service';
import { InvoiceService } from '../../../../shared/services/invoice.service';
import { QuoteService } from '../../../../shared/services/quote.service';
import { UsersService } from '../../../../shared/services/users.service';
import { PdfGeneratorService } from '../../../../shared/services/pdf-generator.service';
import { toast } from 'ngx-sonner';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';
import { FormsModule } from '@angular/forms';
import { CompteGroupeService } from '../../../../shared/services/compte-groupe.service';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';

import { HlmSpinnerComponent } from '@spartan-ng/ui-spinner-helm';

import {
  HlmPaginationDirective,
  HlmPaginationContentDirective,
  HlmPaginationItemDirective,
  HlmPaginationLinkDirective,
  HlmPaginationEllipsisComponent,
  HlmPaginationNextComponent,
  HlmPaginationPreviousComponent,
} from '@spartan-ng/ui-pagination-helm';

@Component({
  selector: 'app-facturation',
  standalone: true,
  imports: [
    HlmButtonDirective,
    HlmIconComponent,
    RouterLink,
    JsonPipe,
    HlmCaptionComponent,
    HlmTableComponent,
    HlmTdComponent,
    HlmThComponent,
    HlmTrowComponent,
    DatePipe,
    EuroFormatPipe,
    HlmSeparatorDirective,
    BrnSeparatorComponent,
    HlmTableImports,
    HlmAlertDialogActionButtonDirective,
    HlmAlertDialogCancelButtonDirective,
    HlmAlertDialogComponent,
    HlmAlertDialogContentComponent,
    HlmAlertDialogDescriptionDirective,
    HlmAlertDialogFooterComponent,
    HlmAlertDialogHeaderComponent,
    HlmAlertDialogOverlayDirective,
    HlmAlertDialogTitleDirective,
    BrnAlertDialogContentDirective,
    BrnAlertDialogTriggerDirective,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogFooterComponent,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    FormsModule,
    DatePipe,
    HlmToasterComponent,
    NgClass,
    BrnSelectImports,
    HlmSelectImports,
    HlmPaginationDirective,
    HlmPaginationContentDirective,
    HlmPaginationItemDirective,
    HlmPaginationLinkDirective,
    HlmPaginationEllipsisComponent,
    HlmPaginationNextComponent,
    HlmPaginationPreviousComponent,
    HlmSpinnerComponent,
  ],
  providers: [
    provideIcons({
      lucideFileDown,
      lucideCornerDownLeft,
      lucideEdit,
      lucideFileText,
      lucideArrowLeft,
      lucideFilePlus,
    }),
    DatePipe,
  ],
  templateUrl: './facturation.component.html',
  styleUrl: './facturation.component.css',
})
export class FacturationComponent implements OnInit, OnDestroy {
  private readonly services = {
    users: inject(UsersService),
    invoice: inject(InvoiceService),
    auth: inject(AuthService),
    quote: inject(QuoteService),
    principal: inject(ComptePrincipalService),
    group: inject(CompteGroupeService),
    pdf: inject(PdfGeneratorService),
    datePipe: inject(DatePipe),
  };

  // Inputs
  id = input<number>();
  typeOfProjet = input<string>();

  // State signals
  protected accountPrincipal: PrincipalAccountEntity | undefined;
  protected connectedUser = signal<UserEntity | null>(null);
  protected groupAccount = signal<CompteGroupeEntity | undefined>(undefined);
  protected creditNote = signal<InvoiceEntity | null>(null);
  protected creditNoteList = signal<InvoiceEntity[]>([]);
  protected isCreditNote = signal<Boolean | null>(null);
  protected currentDate = new Date();
  protected reportDate = signal<Date>(this.currentDate);
  protected filterSelected = signal<'invoice' | 'credit-note' | 'all'>('all');
  protected isLoading = signal<boolean | null>(null);

  // Computed values
  protected reportDateFormatted = computed(() =>
    this.formatDate(this.reportDate())
  );
  protected notPastDate = computed(
    () => this.currentDate.toISOString().split('T')[0]
  );

  // Pagination constants
  private readonly ITEMS_PER_PAGE = 10;
  private readonly INITIAL_PAGE = 1;

  // Pagination state
  protected pagination = {
    currentPage: signal(this.INITIAL_PAGE),
    totalPages: signal(0),
    totalItems: signal(0),
  };

  protected itemsPerPage = signal(this.ITEMS_PER_PAGE);

  // Documents state
  currentFilter: 'all' | 'quotes' | 'invoiced_quotes' | 'credit-note' = 'all';
  invoices: InvoiceEntity[] = [];
  protected allDocuments = signal<any[]>([]);
  protected paginatedDocuments = computed(() => {
    const startIndex =
      (this.pagination.currentPage() - 1) * this.itemsPerPage();
    return this.allDocuments().slice(
      startIndex,
      startIndex + this.itemsPerPage()
    );
  });

  constructor(private location: Location) {
    this.isLoading.set(true);
  }

  private formatDate(date: Date): string {
    return this.services.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  goBack(): void {
    this.location.back();
  }

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    await this.getConnectedUser();
  }

  private async getConnectedUser(): Promise<void> {
    this.services.users
      .getInfo()
      .pipe(
        take(1),
        tap((user) => {
          this.connectedUser.set(user);
          this.initializeAccount(user);
          this.isLoading.set(false);
        })
      )
      .subscribe();
  }

  private initializeAccount(user: UserEntity): void {
    if (user.role === 'ADMIN') {
      this.initializeAdminAccount();
    } else {
      this.initializeUserAccount(user);
    }
  }

  private initializeAdminAccount(): void {
    if (this.typeOfProjet() === 'PRINCIPAL') {
      this.services.principal
        .getGroupById(+this.id()!)
        .pipe(
          take(1),
          tap((data) => {
            this.accountPrincipal = data;
            this.loadInvoices();
            this.initializeCreditNotes(data.invoice || []);
          })
        )
        .subscribe();
    } else {
      this.services.group
        .getGroupById(+this.id()!)
        .pipe(
          take(1),
          tap((data) => {
            this.groupAccount.set(data);
            this.loadInvoices();
          })
        )
        .subscribe();
    }
  }

  private initializeUserAccount(user: UserEntity): void {
    const groupAccount = user.userSecondaryAccounts.find(
      (account) => account.id === +this.id()!
    );
    this.groupAccount.set(groupAccount?.group_account);
    this.loadInvoices();
  }

  private initializeCreditNotes(invoices: InvoiceEntity[]): void {
    const creditNotes = invoices.filter((inv) => inv.type === 'credit_note');
    this.creditNoteList.set(creditNotes);
  }

  filterList(type: 'all' | 'quotes' | 'invoiced_quotes' | 'credit-note'): void {
    this.currentFilter = type;
    this.pagination.currentPage.set(1);
    this.updateDocuments();
  }

  private updateDocuments(): void {
    if (!this.accountPrincipal?.quote) {
      this.allDocuments.set([]);
      return;
    }

    const quotes = this.getFormattedQuotes();
    const creditNotes = this.getFormattedCreditNotes();
    let allDocs = [...quotes, ...creditNotes];

    allDocs = this.filterDocuments(allDocs);
    allDocs.sort(this.sortByDate);

    this.updatePagination(allDocs);
    this.allDocuments.set(allDocs);
  }

  private getFormattedQuotes() {
    return this.accountPrincipal!.quote.map((quote) => ({
      ...quote,
      documentDate: quote.quote_date,
      documentType: 'quote',
    }));
  }

  private getFormattedCreditNotes() {
    return this.invoices
      .filter((inv) => inv.type === 'credit_note')
      .map((invoice) => ({
        ...invoice,
        documentDate: invoice.invoice_date,
        documentType: 'credit_note',
      }));
  }

  private filterDocuments(docs: any[]) {
    switch (this.currentFilter) {
      case 'quotes':
        return docs.filter(
          (doc) => doc.documentType === 'quote' && !doc.invoice
        );
      case 'invoiced_quotes':
        return docs.filter(
          (doc) => doc.documentType === 'quote' && doc.invoice
        );
      case 'credit-note':
        return docs.filter((doc) => doc.documentType === 'credit_note');
      default:
        return docs;
    }
  }

  private sortByDate(a: any, b: any) {
    return (
      new Date(b.documentDate).getTime() - new Date(a.documentDate).getTime()
    );
  }

  private updatePagination(docs: any[]) {
    this.pagination.totalItems.set(docs.length);
    this.pagination.totalPages.set(
      Math.ceil(docs.length / this.itemsPerPage())
    );
  }

  generateQuotePDF(quote: QuoteEntity): void {
    this.services.pdf.generateQuotePDF(quote);
  }

  generateInvoicePDF(invoice: InvoiceEntity): void {
    this.services.pdf.generateInvoicePDF(invoice);
  }

  generateCreditNotePdf(creditNote?: InvoiceEntity): void {
    if (creditNote) {
      this.creditNote.set(creditNote);
    }
    if (this.creditNote()) {
      this.services.pdf.generateInvoicePDF(this.creditNote()!);
      this.creditNote.set(null);
    }
  }

  createInvoice(quote: QuoteEntity, ctx: any): void {
    this.services.invoice
      .createInvoice(quote, {
        account_id: +this.id()!,
        type: this.typeOfProjet() as 'PRINCIPAL' | 'GROUP',
      })
      .pipe(
        take(1),
        tap((data) => {
          quote.invoice = data;
          ctx.close();
        })
      )
      .subscribe();
  }

  checkCreditNote(invoice_id: number): void {
    this.services.invoice
      .getCreditNoteByInvoiceId(invoice_id)
      .pipe(
        take(1),
        tap((data: InvoiceEntity) => {
          this.creditNote.set(data);
          this.creditNoteList.update((prev) => [...prev, data]);
          this.isCreditNote.set(!!data);
        })
      )
      .subscribe();
  }

  loadCreditNote(creditNoteId: number): void {
    this.services.invoice
      .getCreditNoteByInvoiceId(creditNoteId)
      .pipe(
        take(1),
        tap((data) => {
          this.creditNote.set(data);
          this.generateCreditNotePdf(this.creditNote()!);
        })
      )
      .subscribe();
  }

  setReportDate(date: Date): void {
    this.reportDate.set(date);
  }

  reportQuoteDate(quote_id: number, ctx: any): void {
    if (!this.reportDate()) return;

    this.services.quote
      .reportQuoteDate(quote_id, new Date(this.reportDate()!))
      .pipe(
        take(1),
        tap((success) => {
          if (!success) return;

          this.updateQuoteDate(quote_id);
          ctx.close();
          this.reportDate.set(this.currentDate);
          toast('Date du devis reportée');
        })
      )
      .subscribe();
  }

  private updateQuoteDate(quote_id: number): void {
    if (this.accountPrincipal) {
      this.accountPrincipal.quote = this.accountPrincipal.quote.map((quote) =>
        quote.id === quote_id
          ? { ...quote, quote_date: new Date(this.reportDate()!) }
          : quote
      );
    } else if (this.groupAccount()) {
      const updatedQuotes = this.groupAccount()!.quote.map((quote) =>
        quote.id === quote_id
          ? { ...quote, quote_date: new Date(this.reportDate()!) }
          : quote
      );
      this.groupAccount.update((account) => ({
        ...account!,
        quote: updatedQuotes,
      }));
    }
  }

  private loadInvoices(): void {
    this.invoices =
      this.typeOfProjet() === 'PRINCIPAL'
        ? [...(this.accountPrincipal?.invoice || [])]
        : [...(this.groupAccount()?.invoice || [])];
    this.updateDocuments();
  }

  protected getVisiblePages(
    currentPage: number,
    totalPages: number
  ): (number | 'ellipsis')[] {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 'ellipsis', totalPages - 1, totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, 2, 'ellipsis', totalPages - 2, totalPages - 1, totalPages];
    }

    return [
      1,
      'ellipsis',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      'ellipsis',
      totalPages,
    ];
  }

  protected onPageChange(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages()) {
      this.pagination.currentPage.set(page);
    }
  }

  ngOnDestroy(): void {
    this.groupAccount.set(undefined);
  }
}
