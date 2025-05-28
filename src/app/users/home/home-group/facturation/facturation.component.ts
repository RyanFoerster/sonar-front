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
import { Router, RouterLink } from '@angular/router';
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
  lucideX,
} from '@ng-icons/lucide';

import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { HlmTableImports } from '@spartan-ng/ui-table-helm';
import { firstValueFrom } from 'rxjs';
import { CompteGroupeEntity } from '../../../../shared/entities/compte-groupe.entity';
import { InvoiceEntity } from '../../../../shared/entities/invoice.entity';
import { PrincipalAccountEntity } from '../../../../shared/entities/principal-account.entity';
import { QuoteEntity } from '../../../../shared/entities/quote.entity';
import { UserEntity } from '../../../../shared/entities/user.entity';
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

import { QuotesTableComponent } from './quotes-table/quotes-table.component';
import { InvoicesTableComponent } from './invoices-table/invoices-table.component';

import {
  HlmTabsComponent,
  HlmTabsContentDirective,
  HlmTabsListComponent,
  HlmTabsTriggerDirective,
} from '@spartan-ng/ui-tabs-helm';

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
  invoice_number?: number;
  quote_number?: number;
  invoice?: InvoiceEntity | null;
  group_acceptance?: string;
  order_giver_acceptance?: string;
  comment?: string;
  invoice_date?: Date;
  status?: string;
  reminder_level?: number;
  linkedInvoiceId?: number;
}

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
    FormsModule,
    QuotesTableComponent,
    InvoicesTableComponent,
    HlmTabsComponent,
    HlmTabsContentDirective,
    HlmTabsListComponent,
    HlmTabsTriggerDirective,
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
      lucideX,
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
    router: inject(Router),
  };

  id = input<number>();
  typeOfProjet = input<string>();

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
  protected originalDocuments = signal<Document[]>([]);

  protected reportDateFormatted = computed(() =>
    this.formatDate(this.reportDate())
  );
  protected notPastDate = computed(
    () => this.currentDate.toISOString().split('T')[0]
  );

  private readonly ITEMS_PER_PAGE = 10;
  private readonly INITIAL_PAGE = 1;

  activeTab: 'devis' | 'factures' = 'factures';

  protected pagination = {
    currentPage: signal(this.INITIAL_PAGE),
    totalPages: signal(0),
    totalItems: signal(0),
  };

  protected invoicesPagination = {
    currentPage: signal(this.INITIAL_PAGE),
    totalPages: signal(0),
    totalItems: signal(0),
  };

  protected itemsPerPage = signal(this.ITEMS_PER_PAGE);

  currentFilter: 'all' | 'quotes' | 'invoiced_quotes' | 'credit-note' = 'all';
  invoicesFilter: 'all' | 'invoices' | 'credit-notes' = 'all';
  invoices: InvoiceEntity[] = [];
  protected allDocuments = signal<Document[]>([]);
  protected allQuotes = signal<Document[]>([]);
  protected allInvoicesAndCreditNotes = signal<Document[]>([]);

  protected paginatedDocuments = computed(() => {
    const startIndex =
      (this.pagination.currentPage() - 1) * this.itemsPerPage();
    return this.allQuotes().slice(startIndex, startIndex + this.itemsPerPage());
  });

  protected paginatedInvoicesAndCreditNotes = computed(() => {
    const startIndex =
      (this.invoicesPagination.currentPage() - 1) * this.itemsPerPage();
    return this.allInvoicesAndCreditNotes().slice(
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
    this.activeTab = 'devis';
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

  private async initializeUserAccount(user: UserEntity): Promise<void> {
    this.isLoading.set(true);

    if (this.typeOfProjet() === 'PRINCIPAL') {
      const data = await firstValueFrom(
        this.services.principal.getGroupByIdWithRelations(+this.id()!)
      );
      this.accountPrincipal = data;
      this.loadInvoices();
      this.initializeCreditNotes(data.invoice || []);
    } else {
      if (
        user.userSecondaryAccounts.find(
          (account) => account.secondary_account_id === +this.id()!
        )
      ) {
        const data = await firstValueFrom(
          this.services.group.getGroupById(+this.id()!)
        );
        this.groupAccount.set(data);
        this.loadInvoices();
      } else {
        this.services.router.navigate(['/home']);
      }
    }
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
    let allDocs = [];

    const formattedQuotes = this.getFormattedQuotes();
    const formattedCreditNotes = this.getFormattedCreditNotes();
    const formattedInvoices = this.getFormattedInvoices();

    allDocs = [...formattedQuotes, ...formattedCreditNotes];

    const filteredDocs = this.filterDocuments(allDocs);

    let docsMatchingSearch = filteredDocs;
    if (this.searchNumber()) {
      const searchLower = this.searchNumber().toLowerCase();
      docsMatchingSearch = filteredDocs.filter((doc) => {
        if (doc.documentType === 'quote') {
          return `d-${doc.quote_number}`.toLowerCase().includes(searchLower);
        } else if (doc.documentType === 'credit_note') {
          return `nc-${doc.invoice_number}`.toLowerCase().includes(searchLower);
        }
        return false;
      });
    }

    const sortedDocs = docsMatchingSearch.sort(this.sortByDate);
    this.allDocuments.set(sortedDocs);

    this.updateSeparatedDocuments(
      formattedQuotes,
      formattedInvoices,
      formattedCreditNotes
    );

    this.updatePagination(this.allQuotes());
    this.updateInvoicesPagination(this.allInvoicesAndCreditNotes());
  }

  private updateSeparatedDocuments(
    quotes: Document[],
    invoices: Document[],
    creditNotes: Document[]
  ): void {
    let filteredQuotes = quotes;

    if (this.currentFilter === 'quotes') {
      filteredQuotes = quotes.filter((quote) => quote.status !== 'invoiced');
    } else if (this.currentFilter === 'invoiced_quotes') {
      filteredQuotes = quotes.filter((quote) => quote.status === 'invoiced');
    } else if (this.currentFilter === 'credit-note') {
      filteredQuotes = [];
    }

    if (this.searchNumber()) {
      const searchLower = this.searchNumber().toLowerCase();
      filteredQuotes = filteredQuotes.filter((quote) => {
        const currentYear = new Date().getFullYear();
        const paddedNumber =
          quote.quote_number?.toString().padStart(4, '0') || '';
        const formattedNumber =
          `d-${currentYear}/${paddedNumber}`.toLowerCase();
        return formattedNumber.includes(searchLower);
      });
    }

    const sortedQuotes = filteredQuotes.sort((a: Document, b: Document) => {
      const aNumber = a.quote_number || 0;
      const bNumber = b.quote_number || 0;
      return bNumber - aNumber;
    });

    this.allQuotes.set(sortedQuotes);

    let invoicesAndCreditNotes = [...invoices, ...creditNotes];

    if (this.invoicesFilter === 'invoices') {
      invoicesAndCreditNotes = invoices;
    } else if (this.invoicesFilter === 'credit-notes') {
      invoicesAndCreditNotes = creditNotes;
    }

    if (this.searchNumber()) {
      const searchLower = this.searchNumber().toLowerCase();
      invoicesAndCreditNotes = invoicesAndCreditNotes.filter((doc) => {
        if (doc.documentType === 'invoice') {
          const currentYear = new Date().getFullYear();
          const paddedNumber =
            doc.invoice_number?.toString().padStart(4, '0') || '';
          const formattedNumber =
            `f-${currentYear}/${paddedNumber}`.toLowerCase();
          return formattedNumber.includes(searchLower);
        } else if (doc.documentType === 'credit_note') {
          const currentYear = new Date().getFullYear();
          const paddedNumber =
            doc.invoice_number?.toString().padStart(4, '0') || '';
          const formattedNumber =
            `nc-${currentYear}/${paddedNumber}`.toLowerCase();
          return formattedNumber.includes(searchLower);
        }
        return false;
      });
    }

    const sortedInvoicesAndCreditNotes = invoicesAndCreditNotes.sort(
      (a: Document, b: Document) => {
        const aNumber = a.invoice_number || 0;
        const bNumber = b.invoice_number || 0;
        return bNumber - aNumber;
      }
    );

    this.allInvoicesAndCreditNotes.set(sortedInvoicesAndCreditNotes);
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

  // Ajout du champ commissionPourcentage dans le mapping du groupe
  private getFormattedInvoices() {
    const groupAccount = this.groupAccount();
    return this.invoices
      .filter((inv) => inv.type === 'invoice')
      .map((invoice) => ({
        ...invoice,
        documentDate: invoice.invoice_date,
        documentType: 'invoice',
        group_account: groupAccount
          ? {
            id: groupAccount.id,
            username: groupAccount.username,
            commissionPourcentage: groupAccount.commissionPourcentage,
          }
          : undefined,
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

  private sortByDate(a: Document, b: Document) {
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

  private updateInvoicesPagination(docs: Document[]): void {
    const totalItems = docs.length;
    const totalPages = Math.ceil(totalItems / this.itemsPerPage());

    this.invoicesPagination.totalItems.set(totalItems);
    this.invoicesPagination.totalPages.set(Math.max(1, totalPages));

    if (this.invoicesPagination.currentPage() > totalPages && totalPages > 0) {
      this.invoicesPagination.currentPage.set(totalPages);
    }
  }

  generateQuotePDF(quote: Document): void {
    this.services.pdf.generateQuotePDF(quote as unknown as QuoteEntity);
  }

  generateInvoicePDF(invoice: any): void {
    this.services.pdf.generateInvoicePDF(invoice as unknown as InvoiceEntity);
  }

  generateCreditNotePdf(creditNote?: InvoiceEntity): void {
    if (creditNote) {
      this.creditNote.set(creditNote as unknown as InvoiceEntity);
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

      if (this.typeOfProjet() === 'PRINCIPAL' && this.accountPrincipal) {
        const updatedAccount = await firstValueFrom(
          this.services.principal.getGroupByIdWithRelations(+this.id()!)
        );
        this.accountPrincipal = updatedAccount;
      } else if (this.groupAccount()) {
        const updatedGroup = await firstValueFrom(
          this.services.group.getGroupById(+this.id()!)
        );
        this.groupAccount.set(updatedGroup);
      }

      this.loadInvoices();
      toast('Facture créée avec succès');
    } catch (error) {
      toast('Erreur lors de la création de la facture', {
        description: "Veuillez réessayer ou contacter l'assistance.",
        style: { backgroundColor: 'rgb(239, 68, 68)' },
      });
      console.error(error);
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
      console.error(error);
    }
  }

  async loadCreditNote(creditNoteId: number): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.services.invoice.getCreditNoteByInvoiceId(creditNoteId)
      );
      this.creditNote.set(data);
      this.generateCreditNotePdf(this.creditNote()! as unknown as InvoiceEntity);
    } catch (error) {
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

    if (this.typeOfProjet() === 'PRINCIPAL') {
      const userAccount =
        this.connectedUser()?.comptePrincipal.id === +this.id()!;
      return userAccount;
    }

    return false;
  }

  protected canEditBilling(): boolean {
    if (this.connectedUser()?.role === 'ADMIN') return true;

    if (this.typeOfProjet() === 'GROUP') {
      const userAccount = this.connectedUser()?.userSecondaryAccounts.find(
        (account) => account.secondary_account_id === +this.id()!
      );
      return userAccount?.role_billing === 'ADMIN';
    }

    if (this.typeOfProjet() === 'PRINCIPAL') {
      const userAccount =
        this.connectedUser()?.comptePrincipal.id === +this.id()!;
      return userAccount;
    }

    return false;
  }

  protected onSearchChange(): void {
    this.pagination.currentPage.set(1);
    this.updateDocuments();
  }

  filterInvoicesList(type: 'all' | 'invoices' | 'credit-notes'): void {
    this.invoicesFilter = type;
    this.invoicesPagination.currentPage.set(1);
    this.updateDocuments();
  }

  protected onInvoicesPageChange(page: number): void {
    this.invoicesPagination.currentPage.set(page);
  }

  private getVisiblePagesGeneric(
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

  protected getVisibleInvoicesPages(
    currentPage: number,
    totalPages: number
  ): (number | 'ellipsis')[] {
    return this.getVisiblePagesGeneric(currentPage, totalPages);
  }

  protected asQuoteEntity(doc: Document): QuoteEntity {
    return doc as unknown as QuoteEntity;
  }

  protected asInvoiceEntity(doc: Document): InvoiceEntity {
    return doc as unknown as InvoiceEntity;
  }

  protected async handleInvoiceUpdate(): Promise<void> {
    this.activeTab = 'factures';
    this.isLoading.set(true);
    try {
      if (this.typeOfProjet() === 'PRINCIPAL') {
        const data = await firstValueFrom(
          this.services.principal.getGroupByIdWithRelations(+this.id()!)
        );
        this.accountPrincipal = data;
      } else if (this.typeOfProjet() === 'GROUP') {
        const data = await firstValueFrom(
          this.services.group.getGroupById(+this.id()!)
        );
        this.groupAccount.set(data);
      } else {
        await this.getConnectedUser();
      }

      this.loadInvoices();
      toast('Statut de la facture mis à jour.');
    } catch (error) {
      console.error(
        'Erreur lors du rechargement des données après mise à jour:',
        error
      );
      toast.error('Erreur lors du rechargement des données.');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected formatInvoiceNumber(invoice: Document): string {
    if (!invoice.invoice_number) return '';

    const currentYear = new Date().getFullYear();
    const paddedNumber = invoice.invoice_number.toString().padStart(4, '0');

    if (invoice.documentType === 'invoice') {
      return `f-${currentYear}/${paddedNumber}`;
    } else if (invoice.documentType === 'credit_note') {
      return `nc-${currentYear}/${paddedNumber}`;
    }

    return `${invoice.invoice_number}`;
  }

  protected formatQuoteNumber(quote: Document): string {
    if (!quote.quote_number) return '';

    const currentYear = new Date().getFullYear();
    const paddedNumber = quote.quote_number.toString().padStart(4, '0');
    return `d-${currentYear}/${paddedNumber}`;
  }

  getAllInvoicesEntities(): InvoiceEntity[] {
    return this.allInvoicesAndCreditNotes().map(doc => this.asInvoiceEntity(doc));
  }
  getPaginatedInvoicesEntities(): InvoiceEntity[] {
    return this.paginatedInvoicesAndCreditNotes().map(doc => this.asInvoiceEntity(doc));
  }
}
