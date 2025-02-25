import { DatePipe, Location, NgClass } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  signal,
  OnInit,
  ChangeDetectionStrategy,
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
  lucideSearch,
  lucideMessageCircle,
} from '@ng-icons/lucide';
import {
  BrnAlertDialogContentDirective,
  BrnAlertDialogTriggerDirective,
} from '@spartan-ng/ui-alertdialog-brain';
import {
  HlmAlertDialogComponent,
  HlmAlertDialogContentComponent,
  HlmAlertDialogDescriptionDirective,
  HlmAlertDialogFooterComponent,
  HlmAlertDialogHeaderComponent,
  HlmAlertDialogTitleDirective,
} from '@spartan-ng/ui-alertdialog-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';

import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { HlmTableImports } from '@spartan-ng/ui-table-helm';
import { firstValueFrom } from 'rxjs';
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
import { FormsModule } from '@angular/forms';
import { CompteGroupeService } from '../../../../shared/services/compte-groupe.service';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';

import {
  HlmPaginationDirective,
  HlmPaginationContentDirective,
  HlmPaginationItemDirective,
} from '@spartan-ng/ui-pagination-helm';

/* Ajout d'une interface pour le contexte modal */
interface ModalContext {
  close: () => void;
}

@Component({
  selector: 'app-facturation',
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
    BrnSelectImports,
    HlmSelectImports,
    HlmPaginationDirective,
    HlmPaginationContentDirective,
    HlmPaginationItemDirective,
  ],
  providers: [
    provideIcons({
      lucideFileDown,
      lucideCornerDownLeft,
      lucideEdit,
      lucideFileText,
      lucideArrowLeft,
      lucideFilePlus,
      lucideSearch,
      lucideMessageCircle,
    }),
    DatePipe,
  ],
  templateUrl: './facturation.component.html',
  styleUrl: './facturation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  protected isCreditNote = signal<boolean | null>(null);
  protected currentDate = new Date();
  protected reportDate = signal<Date>(this.currentDate);
  protected filterSelected = signal<'invoice' | 'credit-note' | 'all'>('all');
  protected isLoading = signal<boolean>(true);
  protected searchNumber = signal<string>('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected originalDocuments = signal<any[]>([]);

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const user = await firstValueFrom(this.services.users.getInfo());
    this.connectedUser.set(user);
    await this.initializeAccount(user);
  }

  private async initializeAccount(user: UserEntity): Promise<void> {
    this.isLoading.set(true);
    if (user.role === 'ADMIN') {
      await this.initializeAdminAccount();
    } else {
      this.initializeUserAccount(user);
    }
  }

  private async initializeAdminAccount(): Promise<void> {
    this.isLoading.set(true);
    if (this.typeOfProjet() === 'PRINCIPAL') {
      const data = await firstValueFrom(
        this.services.principal.getGroupByIdWithRelations(+this.id()!)
      );
      this.accountPrincipal = data;
      this.loadInvoices();
      this.initializeCreditNotes(data.invoice || []);
    } else {
      const data = await firstValueFrom(
        this.services.group.getGroupById(+this.id()!)
      );
      this.groupAccount.set(data);
      this.loadInvoices();
    }
  }

  private initializeUserAccount(user: UserEntity): void {
    this.isLoading.set(true);
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
    if (!this.accountPrincipal?.quote && !this.groupAccount()?.quote) {
      this.allDocuments.set([]);
      return;
    }

    const quotes = this.getFormattedQuotes();
    const creditNotes = this.getFormattedCreditNotes();
    let allDocs = [...quotes, ...creditNotes];

    allDocs = this.filterDocuments(allDocs);
    allDocs.sort(this.sortByDate);

    // Stocker les documents originaux avant la recherche
    this.originalDocuments.set(allDocs);

    // Appliquer le filtre de recherche
    if (this.searchNumber()) {
      allDocs = allDocs.filter((doc) => {
        const searchTerm = this.searchNumber().toLowerCase();
        if (doc.documentType === 'quote' && 'quote_number' in doc) {
          return `D-${doc.quote_number}`.toLowerCase().includes(searchTerm);
        } else if (
          doc.documentType === 'credit_note' &&
          'invoice_number' in doc
        ) {
          return `NC-${doc.invoice_number}`.toLowerCase().includes(searchTerm);
        }
        return false;
      });
    }

    this.updatePagination(allDocs);
    this.allDocuments.set(allDocs);
  }

  private getFormattedQuotes() {
    return this.typeOfProjet() === 'PRINCIPAL'
      ? this.accountPrincipal!.quote.map((quote) => ({
          ...quote,
          documentDate: quote.quote_date,
          documentType: 'quote',
        }))
      : this.groupAccount()!.quote.map((quote) => ({
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sortByDate(a: any, b: any) {
    return (
      new Date(b.documentDate).getTime() - new Date(a.documentDate).getTime()
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  async createInvoice(quote: QuoteEntity, ctx: ModalContext): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.services.invoice.createInvoice(quote, {
          account_id: +this.id()!,
          type: this.typeOfProjet() as 'PRINCIPAL' | 'GROUP',
        })
      );
      quote.invoice = data;
      ctx.close();
    } catch {
      // Gérer les erreurs si nécessaire
    }
  }

  async checkCreditNote(invoice_id: number): Promise<void> {
    try {
      const data: InvoiceEntity = await firstValueFrom(
        this.services.invoice.getCreditNoteByInvoiceId(invoice_id)
      );
      this.creditNote.set(data);
      this.creditNoteList.update((prev) => [...prev, data]);
      this.isCreditNote.set(!!data);
    } catch (error) {
      // Gérer les erreurs
      console.error(error);
    }
  }

  async loadCreditNote(creditNoteId: number): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.services.invoice.getCreditNoteByInvoiceId(creditNoteId)
      );
      this.creditNote.set(data);
      this.generateCreditNotePdf(this.creditNote()!);
    } catch (error) {
      // Gérer les erreurs
      console.error(error);
    }
  }

  setReportDate(date: Date): void {
    this.reportDate.set(date);
  }

  async reportQuoteDate(quote_id: number, ctx: ModalContext): Promise<void> {
    if (!this.reportDate()) return;
    try {
      const success = await firstValueFrom(
        this.services.quote.reportQuoteDate(
          quote_id,
          new Date(this.reportDate())
        )
      );
      if (success) {
        this.updateQuoteDate(quote_id);
        ctx.close();
        this.reportDate.set(this.currentDate);
        toast('Date du devis reportée');
      }
    } catch {
      // Gérer les erreurs
    }
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
    this.isLoading.set(false);
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

  protected hasAccessToBilling(): boolean {
    if (this.connectedUser()?.role === 'ADMIN') return true;

    if (this.typeOfProjet() === 'GROUP') {
      const userAccount = this.connectedUser()?.userSecondaryAccounts.find(
        (account) => account.id === +this.id()!
      );
      return userAccount?.role_billing !== 'NONE';
    }

    return false;
  }

  protected canEditBilling(): boolean {
    if (this.connectedUser()?.role === 'ADMIN') return true;

    if (this.typeOfProjet() === 'GROUP') {
      const userAccount = this.connectedUser()?.userSecondaryAccounts.find(
        (account) => account.id === +this.id()!
      );
      return userAccount?.role_billing === 'ADMIN';
    }

    return false;
  }

  protected onSearchChange(): void {
    this.pagination.currentPage.set(1);
    this.updateDocuments();
  }
}
