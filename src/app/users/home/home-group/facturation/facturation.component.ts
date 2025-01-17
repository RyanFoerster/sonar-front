import { DatePipe, JsonPipe, Location, NgClass } from '@angular/common';
import {
  AfterViewInit,
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
  lucideCornerDownLeft,
  lucideEdit,
  lucideFileDown,
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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import {
  BrnPopoverCloseDirective,
  BrnPopoverComponent,
  BrnPopoverContentDirective,
  BrnPopoverTriggerDirective,
} from '@spartan-ng/ui-popover-brain';
import {
  HlmPopoverCloseDirective,
  HlmPopoverContentDirective,
} from '@spartan-ng/ui-popover-helm';
import { toast } from 'ngx-sonner';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';
import { FormsModule } from '@angular/forms';
import { CompteGroupeService } from '../../../../shared/services/compte-groupe.service';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
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
    BrnPopoverCloseDirective,
    BrnPopoverComponent,
    BrnPopoverContentDirective,
    BrnPopoverTriggerDirective,
    HlmPopoverCloseDirective,
    HlmPopoverContentDirective,
    FormsModule,
    DatePipe,
    HlmToasterComponent,
    NgClass,
    BrnSelectImports,
    HlmSelectImports,
  ],
  providers: [
    provideIcons({
      lucideFileDown,
      lucideCornerDownLeft,
      lucideEdit,
      lucideFileText,
    }),
    DatePipe,
  ],
  templateUrl: './facturation.component.html',
  styleUrl: './facturation.component.css',
})
export class FacturationComponent implements OnInit, OnDestroy {
  private usersService: UsersService = inject(UsersService);
  private invoiceService: InvoiceService = inject(InvoiceService);
  private authService: AuthService = inject(AuthService);
  private quoteService: QuoteService = inject(QuoteService);
  private principalService: ComptePrincipalService = inject(
    ComptePrincipalService
  );
  private datePipe: DatePipe = inject(DatePipe);
  private groupService: CompteGroupeService = inject(CompteGroupeService);

  protected accountPrincipal: PrincipalAccountEntity | undefined;

  id = input<number>();
  typeOfProjet = input<string>();
  protected connectedUser = signal<UserEntity | null>(null);
  protected groupAccount = signal<CompteGroupeEntity | undefined>(undefined);
  protected creditNote = signal<InvoiceEntity | null>(null);
  protected creditNoteList = signal<InvoiceEntity[]>([]);
  protected isCreditNote = signal<Boolean | null>(null);
  protected currentDate = new Date();
  protected reportDate = signal<Date>(this.currentDate);
  protected filterSelected = signal<'invoice' | 'credit-note' | 'all'>('all');

  protected reportDateFormatted = computed(() =>
    this.formatDate(this.reportDate())
  );
  protected notPastDate = computed(
    () => this.currentDate.toISOString().split('T')[0]
  );

  currentFilter: 'all' | 'quotes' | 'invoiced_quotes' | 'credit-note' = 'all';
  invoices: any[] = [];

  constructor(private location: Location) {}

  private formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  private formatDateBelgium(date: Date): string {
    return this.datePipe.transform(date, 'dd/MM/yyyy') || '';
  }

  goBack() {
    this.location.back();
  }

  async ngAfterViewInit() {
    await this.getConnectedUser();
  }

  async getConnectedUser() {
    this.usersService
      .getInfo()
      .pipe(
        take(1),
        tap((data) => {
          this.connectedUser.set(data);
        }),
        tap(() => {
          if (this.connectedUser()?.role === 'ADMIN') {
            if (this.typeOfProjet() === 'PRINCIPAL') {
              this.principalService
                .getGroupById(+this.id()!)
                .pipe(
                  take(1),
                  tap((data) => {
                    this.accountPrincipal = data;
                    this.loadInvoices();
                    for (const creditNote of data.invoice!) {
                      if (creditNote.type === 'credit_note') {
                        this.creditNoteList.set([
                          ...this.creditNoteList(),
                          creditNote,
                        ]);
                      }
                    }
                  })
                )
                .subscribe();
            } else {
              this.groupService
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
          } else {
            const groupAccountFinded =
              this.connectedUser()?.userSecondaryAccounts.find(
                (account) => account.id === +this.id()!
              );
            this.groupAccount.set(groupAccountFinded?.group_account);
            this.loadInvoices();
          }
        })
      )
      .subscribe();
  }

  filterList(type: 'all' | 'quotes' | 'invoiced_quotes' | 'credit-note'): void {
    this.currentFilter = type;
  }

  getAllDocuments() {
    if (!this.accountPrincipal?.quote) return [];

    // Combiner les devis et les notes de crédit
    let allDocs = [];

    // Ajouter les devis avec leur date
    const quotes = this.accountPrincipal.quote.map((quote) => ({
      ...quote,
      documentDate: new Date(quote.quote_date),
      documentType: 'quote',
    }));

    // Ajouter les notes de crédit avec leur date
    const creditNotes = this.invoices
      .filter((inv) => inv.type === 'credit_note')
      .map((invoice) => ({
        ...invoice,
        documentDate: new Date(invoice.invoice_date),
        documentType: 'credit_note',
      }));

    // Combiner tous les documents
    allDocs = [...quotes, ...creditNotes];

    // Appliquer les filtres
    if (this.currentFilter === 'quotes') {
      allDocs = allDocs.filter(
        (doc) => doc.documentType === 'quote' && !doc.invoice
      );
    } else if (this.currentFilter === 'invoiced_quotes') {
      allDocs = allDocs.filter(
        (doc) => doc.documentType === 'quote' && doc.invoice
      );
    } else if (this.currentFilter === 'credit-note') {
      allDocs = allDocs.filter((doc) => doc.documentType === 'credit_note');
    }

    // Trier par date décroissante
    return allDocs.sort(
      (a, b) => b.documentDate.getTime() - a.documentDate.getTime()
    );
  }

  sortedInvoices(): any[] {
    return [];
  }

  getQuotes() {
    return [];
  }

  generateQuotePDF(quote: QuoteEntity) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = 60;

    // Fonction pour ajouter un en-tête à chaque page
    const addHeader = () => {
      // Logo de l'entreprise
      const logoUrl = '/assets/images/SONAR.png';
      const logoWidth = 40;
      const logoHeight = 40;
      const aspectRatio = logoWidth / logoHeight;

      // Calculer la nouvelle hauteur en conservant le ratio d'aspect
      const newLogoWidth = 40;
      const newLogoHeight = newLogoWidth / aspectRatio;

      doc.addImage(logoUrl, 'PNG', margin, 5, newLogoWidth, newLogoHeight);

      // Informations de l'entreprise
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Sonar Artists ASBL', pageWidth - margin, margin, {
        align: 'right',
      });
      doc.text('6 rue Francisco Ferrer', pageWidth - margin, margin + 5, {
        align: 'right',
      });
      doc.text(
        '4460 Grâce-Hollogne, Belgique',
        pageWidth - margin,
        margin + 10,
        {
          align: 'right',
        }
      );
      doc.text(
        'Email: contact@sonarartists.be',
        pageWidth - margin,
        margin + 20,
        { align: 'right' }
      );

      // Ligne de séparation
      doc.setDrawColor(200);
      doc.line(margin, margin + 30, pageWidth - margin, margin + 30);
    };

    // Ajouter l'en-tête
    addHeader();

    let yPosition2 = 60;
    const lineHeight = 7; // Espacement entre les lignes
    const titleLineHeight = 10; // Espacement spécifique après le titre

    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text(`DEVIS N°: ${quote.id}`, margin, yPosition2);
    yPosition2 += titleLineHeight;

    // Informations du devis
    doc.setFontSize(10);
    doc.text(
      `Date: ${new Date(quote.quote_date).toLocaleDateString()}`,
      margin,
      yPosition2
    );
    yPosition2 += lineHeight;

    doc.text(
      `Date de service: ${new Date(quote.service_date).toLocaleDateString()}`,
      margin,
      yPosition2
    );
    yPosition2 += lineHeight;

    // Informations du client
    doc.setFontSize(11);
    doc.text('Adressé à:', pageWidth - margin - 60, 70);
    doc.setFontSize(10);

    let yPosition = 75;
    const clientName = doc.splitTextToSize(quote.client.name, maxWidth);
    clientName.forEach((line: string) => {
      doc.text(line, pageWidth - margin - 60, yPosition);
      yPosition += 5;
    });

    doc.text(
      `${quote.client.street} ${quote.client.number}`,
      pageWidth - margin - 60,
      yPosition
    );
    yPosition += 5;
    doc.text(
      `${quote.client.postalCode} ${quote.client.city}`,
      pageWidth - margin - 60,
      yPosition
    );
    yPosition += 5;
    doc.text(`${quote.client.country}`, pageWidth - margin - 60, yPosition);
    yPosition += 5;
    doc.text(`Tél: ${quote.client.phone}`, pageWidth - margin - 60, yPosition);
    yPosition += 5;
    doc.text(
      `Email: ${quote.client.email}`,
      pageWidth - margin - 60,
      yPosition
    );

    // Tableau des produits
    const tableStart = 120;
    autoTable(doc, {
      startY: tableStart,
      head: [['Description', 'Quantité', 'Prix unitaire', 'Total HT']],
      body: quote.products.map((product) => [
        product.description,
        product.quantity,
        `${product.price.toFixed(2)} €`,
        `${(product.quantity * product.price).toFixed(2)} €`,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [70, 70, 70], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
      },
    });

    // Récupérer la position Y après le tableau
    const finalY = (doc as any).lastAutoTable.finalY || tableStart;

    // Résumé des totaux
    doc.setFontSize(10);
    doc.text(`Total HT:`, pageWidth - margin - 50, finalY + 10, {
      align: 'right',
    });
    doc.text(
      `${quote.price_htva.toFixed(2)} €`,
      pageWidth - margin,
      finalY + 10,
      { align: 'right' }
    );
    doc.text(`TVA 6%:`, pageWidth - margin - 50, finalY + 15, {
      align: 'right',
    });
    doc.text(
      `${quote.total_vat_6.toFixed(2)} €`,
      pageWidth - margin,
      finalY + 15,
      { align: 'right' }
    );
    doc.text(`TVA 21%:`, pageWidth - margin - 50, finalY + 20, {
      align: 'right',
    });
    doc.text(
      `${quote.total_vat_21.toFixed(2)} €`,
      pageWidth - margin,
      finalY + 20,
      { align: 'right' }
    );
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total TTC:`, pageWidth - margin - 50, finalY + 30, {
      align: 'right',
    });
    doc.text(`${quote.total.toFixed(2)} €`, pageWidth - margin, finalY + 30, {
      align: 'right',
    });

    // Conditions et notes
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const conditions = [
      'Conditions de paiement : 30 jours à compter de la date de facturation',
      `Validité du devis : ${this.formatDateBelgium(quote.quote_date)}`,
      'Nous vous remercions de votre confiance',
    ];
    conditions.forEach((condition, index) => {
      doc.text(condition, margin, pageHeight - 40 + index * 5);
    });

    // Pied de page
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      'Sonar Artists ASBL - TVA BE0123456789',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Sauvegarder le PDF
    doc.save(`devis_${quote.id}.pdf`);
  }

  generateInvoicePDF(invoice: InvoiceEntity | QuoteEntity['invoice']) {
    if (!invoice) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = 60;

    // Fonction pour ajouter un en-tête à chaque page
    const addHeader = () => {
      // Logo de l'entreprise
      const logoUrl = '/assets/images/SONAR.png';
      const logoWidth = 40;
      const logoHeight = 40;
      const aspectRatio = logoWidth / logoHeight;

      // Calculer la nouvelle hauteur en conservant le ratio d'aspect
      const newLogoWidth = 40;
      const newLogoHeight = newLogoWidth / aspectRatio;

      doc.addImage(logoUrl, 'PNG', margin, 5, newLogoWidth, newLogoHeight);

      // Informations de l'entreprise
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Sonar Artists ASBL', pageWidth - margin, margin, {
        align: 'right',
      });
      doc.text('6 rue Francisco Ferrer', pageWidth - margin, margin + 5, {
        align: 'right',
      });
      doc.text(
        '4460 Grâce-Hollogne, Belgique',
        pageWidth - margin,
        margin + 10,
        {
          align: 'right',
        }
      );
      doc.text(
        'Email: contact@sonarartists.be',
        pageWidth - margin,
        margin + 20,
        { align: 'right' }
      );

      // Ligne de séparation
      doc.setDrawColor(200);
      doc.line(margin, margin + 30, pageWidth - margin, margin + 30);
    };

    // Ajouter l'en-tête
    addHeader();

    let yPosition2 = 60;
    const lineHeight = 7;
    const titleLineHeight = 10;

    doc.setFontSize(18);
    doc.setTextColor(0);

    // Adapter le titre selon le type de document
    const title =
      invoice.type === 'credit_note'
        ? 'NOTE DE CRÉDIT N°: NC-'
        : 'FACTURE N°: F-';
    doc.text(`${title}${invoice.invoice_number}`, margin, yPosition2);
    yPosition2 += titleLineHeight;

    // Informations du document
    doc.setFontSize(10);
    doc.text(
      `Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`,
      margin,
      yPosition2
    );
    yPosition2 += lineHeight;

    if (invoice.service_date) {
      doc.text(
        `Date de service: ${new Date(
          invoice.service_date
        ).toLocaleDateString()}`,
        margin,
        yPosition2
      );
      yPosition2 += lineHeight;
    }

    // Informations du client
    doc.setFontSize(11);
    doc.text('Adressé à:', pageWidth - margin - 60, 70);
    doc.setFontSize(10);

    let yPosition = 75;
    const clientName = doc.splitTextToSize(invoice.client.name, maxWidth);
    clientName.forEach((line: string) => {
      doc.text(line, pageWidth - margin - 60, yPosition);
      yPosition += 5;
    });

    doc.text(
      `${invoice.client.street} ${invoice.client.number}`,
      pageWidth - margin - 60,
      yPosition
    );
    yPosition += 5;
    doc.text(
      `${invoice.client.postalCode} ${invoice.client.city}`,
      pageWidth - margin - 60,
      yPosition
    );
    yPosition += 5;
    doc.text(`${invoice.client.country}`, pageWidth - margin - 60, yPosition);
    yPosition += 5;
    doc.text(
      `Tél: ${invoice.client.phone}`,
      pageWidth - margin - 60,
      yPosition
    );
    yPosition += 5;
    doc.text(
      `Email: ${invoice.client.email}`,
      pageWidth - margin - 60,
      yPosition
    );

    // Tableau des produits
    const tableStart = 120;
    autoTable(doc, {
      startY: tableStart,
      head: [['Description', 'Quantité', 'Prix unitaire', 'Total HT']],
      body: invoice.products.map((product) => [
        product.description,
        product.quantity,
        `${product.price.toFixed(2)} €`,
        `${(product.quantity * product.price).toFixed(2)} €`,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [70, 70, 70], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
      },
    });

    // Récupérer la position Y après le tableau
    const finalY = (doc as any).lastAutoTable.finalY || tableStart;

    // Résumé des totaux
    doc.setFontSize(10);
    doc.text(`Total HT:`, pageWidth - margin - 50, finalY + 10, {
      align: 'right',
    });
    doc.text(
      `${invoice.price_htva.toFixed(2)} €`,
      pageWidth - margin,
      finalY + 10,
      { align: 'right' }
    );
    doc.text(`TVA 6%:`, pageWidth - margin - 50, finalY + 15, {
      align: 'right',
    });
    doc.text(
      `${invoice.total_vat_6.toFixed(2)} €`,
      pageWidth - margin,
      finalY + 15,
      { align: 'right' }
    );
    doc.text(`TVA 21%:`, pageWidth - margin - 50, finalY + 20, {
      align: 'right',
    });
    doc.text(
      `${invoice.total_vat_21.toFixed(2)} €`,
      pageWidth - margin,
      finalY + 20,
      { align: 'right' }
    );
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total TTC:`, pageWidth - margin - 50, finalY + 30, {
      align: 'right',
    });
    doc.text(`${invoice.total.toFixed(2)} €`, pageWidth - margin, finalY + 30, {
      align: 'right',
    });

    // Conditions et notes
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const conditions = [
      'Conditions de paiement : 30 jours à compter de la date de facturation',
      `Date d'émission : ${this.formatDateBelgium(invoice.invoice_date)}`,
      'Nous vous remercions de votre confiance',
    ];
    conditions.forEach((condition, index) => {
      doc.text(condition, margin, pageHeight - 40 + index * 5);
    });

    // Pied de page
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      'Sonar Artists ASBL - TVA BE0123456789',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Sauvegarder le PDF avec le bon préfixe
    const prefix = invoice.type === 'credit_note' ? 'note-credit' : 'facture';
    doc.save(`${prefix}_${invoice.invoice_number}.pdf`);
  }

  generateCreditNotePdf(creditNote?: InvoiceEntity) {
    if (creditNote) this.creditNote.set(creditNote);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = 60;

    // Fonction pour ajouter un en-tête à chaque page
    const addHeader = () => {
      // Logo de l'entreprise
      const logoUrl = '/assets/images/SONAR.png';
      const logoWidth = 40;
      const logoHeight = 40;
      const aspectRatio = logoWidth / logoHeight;

      // Calculer la nouvelle hauteur en conservant le ratio d'aspect
      const newLogoWidth = 40;
      const newLogoHeight = newLogoWidth / aspectRatio;

      doc.addImage(logoUrl, 'PNG', margin, 5, newLogoWidth, newLogoHeight);

      // Informations de l'entreprise
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Sonar Artists ASBL', pageWidth - margin, margin, {
        align: 'right',
      });
      doc.text('6 rue Francisco Ferrer', pageWidth - margin, margin + 5, {
        align: 'right',
      });
      doc.text(
        '4460 Grâce-Hollogne, Belgique',
        pageWidth - margin,
        margin + 10,
        {
          align: 'right',
        }
      );

      doc.text(
        'Email: contact@sonarartists.be',
        pageWidth - margin,
        margin + 20,
        { align: 'right' }
      );

      // Ligne de séparation
      doc.setDrawColor(200);
      doc.line(margin, margin + 30, pageWidth - margin, margin + 30);
    };

    // Ajouter l'en-tête
    addHeader();

    let yPosition2 = 60;
    const lineHeight = 7; // Espacement entre les lignes
    const titleLineHeight = 10; // Espacement spécifique après le titre

    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text(`Note de crédit N°: ${this.creditNote()?.id}`, margin, yPosition2);
    yPosition2 += titleLineHeight; // Espace réduit après le titre

    // Informations de la note de crédit
    doc.setFontSize(10);
    doc.text(
      `Date: ${new Date(
        this.creditNote()?.invoice_date!
      ).toLocaleDateString()}`,
      margin,
      yPosition2
    );
    yPosition2 += lineHeight;

    if (this.creditNote()?.service_date) {
      doc.text(
        `Date de service: ${new Date(
          this.creditNote()?.service_date!
        ).toLocaleDateString()}`,
        margin,
        yPosition2
      );
      yPosition2 += lineHeight;
    }

    if (this.creditNote()?.linkedInvoiceId) {
      doc.text(
        `Numéro de facture liée: ${this.creditNote()?.linkedInvoiceId}`,
        margin,
        yPosition2
      );
      yPosition2 += lineHeight;
    }

    // Informations du client
    doc.setFontSize(11);
    doc.text('Adressé à:', pageWidth - margin - 60, 70);
    doc.setFontSize(10);

    let yPosition = 75;
    const clientName = doc.splitTextToSize(
      this.creditNote()?.client.name!,
      maxWidth
    );
    clientName.forEach((line: string) => {
      doc.text(line, pageWidth - margin - 60, yPosition);
      yPosition += 5;
    });

    doc.text(
      `${this.creditNote()?.client.street} ${this.creditNote()?.client.number}`,
      pageWidth - margin - 60,
      yPosition
    );
    yPosition += 5;
    doc.text(
      `${this.creditNote()?.client.postalCode} ${
        this.creditNote()?.client.city
      }`,
      pageWidth - margin - 60,
      yPosition
    );
    yPosition += 5;
    doc.text(
      `${this.creditNote()?.client.country}`,
      pageWidth - margin - 60,
      yPosition
    );
    yPosition += 5;
    doc.text(
      `Tél: ${this.creditNote()?.client.phone}`,
      pageWidth - margin - 60,
      yPosition
    );
    yPosition += 5;
    doc.text(
      `Email: ${this.creditNote()?.client.email}`,
      pageWidth - margin - 60,
      yPosition
    );

    // Tableau des produits
    const tableStart = 120;
    autoTable(doc, {
      startY: tableStart,
      head: [['Description', 'Quantité', 'Prix unitaire', 'Total HT']],
      body: this.creditNote()?.products.map((product) => [
        product.description,
        product.quantity,
        `${Math.abs(product.price).toFixed(2)} €`,
        `${Math.abs(product.quantity * product.price).toFixed(2)} €`,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [70, 70, 70], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
      },
    });

    // Récupérer la position Y après le tableau
    const finalY = (doc as any).lastAutoTable.finalY || tableStart;

    // Résumé des totaux
    doc.setFontSize(10);
    doc.text(`Total HT:`, pageWidth - margin - 50, finalY + 10, {
      align: 'right',
    });
    doc.text(
      `${Math.abs(
        this.creditNote()?.products.reduce(
          (acc, product) => acc + product.quantity * product.price,
          0
        )!
      ).toFixed(2)} €`,
      pageWidth - margin,
      finalY + 10,
      { align: 'right' }
    );
    doc.text(`TVA 6%:`, pageWidth - margin - 50, finalY + 15, {
      align: 'right',
    });
    doc.text(
      `${Math.abs(
        this.creditNote()?.products.reduce(
          (acc, product) =>
            product.vat === 0.06
              ? acc + product.quantity * product.price * 0.06
              : acc,
          0
        )!
      ).toFixed(2)} €`,
      pageWidth - margin,
      finalY + 15,
      { align: 'right' }
    );
    doc.text(`TVA 21%:`, pageWidth - margin - 50, finalY + 20, {
      align: 'right',
    });
    doc.text(
      `${Math.abs(
        this.creditNote()?.products.reduce(
          (acc, product) =>
            product.vat === 0.21
              ? acc + product.quantity * product.price * 0.21
              : acc,
          0
        )!
      ).toFixed(2)} €`,
      pageWidth - margin,
      finalY + 20,
      { align: 'right' }
    );
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total note de crédit:`, pageWidth - margin - 50, finalY + 30, {
      align: 'right',
    });
    doc.text(
      `${Math.abs(this.creditNote()?.creditNoteAmount!).toFixed(2)} €`,
      pageWidth - margin,
      finalY + 30,
      { align: 'right' }
    );

    // Conditions et notes
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const conditions = [
      'Cette note de crédit annule et remplace la facture mentionnée ci-dessus.',
      `Date d'émission : ${this.formatDateBelgium(
        this.creditNote()?.invoice_date!
      )}`,
      'Nous vous remercions de votre compréhension.',
    ];
    conditions.forEach((condition, index) => {
      doc.text(condition, margin, pageHeight - 40 + index * 5);
    });

    // Pied de page
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      'Sonar Artists ASBL - TVA BE0123456789',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Sauvegarder le PDF
    doc.save(`note_de_credit_${this.creditNote()?.id}.pdf`);
    this.creditNote.set(null);
  }

  createInvoice(quote: QuoteEntity, ctx: any) {
    this.invoiceService
      .createInvoice(quote, this.typeOfProjet()!, this.id()!)
      .pipe(
        tap((data) => {
          quote.invoice = data;
          ctx.close();
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.groupAccount.set(undefined);
  }

  checkCreditNote(invoice_id: number) {
    this.invoiceService
      .getCreditNoteByInvoiceId(invoice_id)
      .subscribe((data: InvoiceEntity) => {
        this.creditNote.set(data);
        this.creditNoteList.update((prev) => [...prev, data]);
        if (this.creditNote()) {
          this.isCreditNote.set(true);
        } else {
          this.isCreditNote.set(false);
        }
      });
  }

  setReportDate(date: Date) {
    this.reportDate.set(date);
  }

  reportQuoteDate(quote_id: number, ctx: any) {
    if (!this.reportDate()) {
      // Gérer le cas où aucune date n'est sélectionnée
      return;
    }

    this.quoteService
      .reportQuoteDate(quote_id, new Date(this.reportDate()!))
      .pipe(
        take(1),
        tap((data) => {
          if (!data) return;

          if (data && this.accountPrincipal) {
            this.accountPrincipal.quote.forEach((quote) => {
              if (quote.id === quote_id) {
                quote.quote_date = new Date(this.reportDate()!);
              }
            });
          } else if (data && this.groupAccount()) {
            this.groupAccount()?.quote.forEach((quote) => {
              if (quote.id === quote_id) {
                quote.quote_date = new Date(this.reportDate()!);
              }
            });
          }
          ctx.close();
          this.reportDate.set(this.currentDate); // Réinitialiser la date après l'enregistrement
          toast('Date du devis reportée', {
            action: {
              label: 'Undo',
              onClick: () => console.log('Undo'),
            },
          });
        })
      )
      .subscribe();
  }

  ngOnInit() {
    // Les factures seront chargées après l'initialisation du compte
  }

  private loadInvoices() {
    // Charger les factures selon le type de compte
    if (this.typeOfProjet() === 'PRINCIPAL' && this.accountPrincipal) {
      this.invoices = [...(this.accountPrincipal.invoice || [])];
    } else if (this.groupAccount()) {
      this.invoices = [...(this.groupAccount()?.invoice || [])];
    }
  }
}
