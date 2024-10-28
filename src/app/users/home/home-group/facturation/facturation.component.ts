import { DatePipe, JsonPipe, Location, NgClass } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  lucideCornerDownLeft,
  lucideEdit,
  lucideFileDown,
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
    }),
    DatePipe,
  ],
  templateUrl: './facturation.component.html',
  styleUrl: './facturation.component.css',
})
export class FacturationComponent implements AfterViewInit, OnDestroy {
  private usersService: UsersService = inject(UsersService);
  private invoiceService: InvoiceService = inject(InvoiceService);
  private authService: AuthService = inject(AuthService);
  private quoteService: QuoteService = inject(QuoteService);
  private principalService: ComptePrincipalService = inject(
    ComptePrincipalService,
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
    this.formatDate(this.reportDate()),
  );
  protected notPastDate = computed(
    () => this.currentDate.toISOString().split('T')[0],
  );

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
                    console.log('data', data);
                    for (const creditNote of data.invoice!) {
                      if (creditNote.type === 'credit_note') {
                        this.creditNoteList.set([
                          ...this.creditNoteList(),
                          creditNote,
                        ]);
                      }

                      console.log('creditNote', this.creditNoteList());
                    }
                  }),
                )
                .subscribe();
            } else {
              this.groupService
                .getGroupById(+this.id()!)
                .pipe(
                  take(1),
                  tap((data) => {
                    this.groupAccount.set(data);
                  }),
                )
                .subscribe();
            }
          } else {
            const groupAccountFinded =
              this.connectedUser()?.userSecondaryAccounts.find(
                (account) => account.id === +this.id()!,
              );
            this.groupAccount.set(groupAccountFinded?.group_account);
          }
        }),
      )
      .subscribe();
  }

  filterList(type: 'invoice' | 'credit-note' | 'all') {
    if (type === this.filterSelected()) {
      this.filterSelected.set('all');
    } else {
      this.filterSelected.set(type);
      if (this.filterSelected() === 'credit-note') {
        if (this.accountPrincipal) {
          for (const quote of this.accountPrincipal.quote!) {
            if (
              quote.invoice &&
              !this.creditNoteList().find(
                (creditNote) => creditNote.linkedInvoiceId === quote.invoice.id,
              )
            ) {
              this.checkCreditNote(quote.invoice.id);
            }
          }
        } else if (this.groupAccount()) {
          for (const quote of this.groupAccount()?.quote!) {
            if (
              quote.invoice &&
              !this.creditNoteList().find(
                (creditNote) => creditNote.linkedInvoiceId === quote.invoice.id,
              )
            ) {
              this.checkCreditNote(quote.invoice.id);
            }
          }
        }
      }
    }
  }

  // generateQuotePDF(quote: QuoteEntity) {
  //   const doc = new jsPDF();

  //   // Ajouter le logo
  //   const logoUrl = '/assets/images/Groupe-30.png'; // Remplacez par le chemin de votre logo
  //   const img = new Image();
  //   img.src = logoUrl;

  //   img.onload = () => {
  //     doc.addImage(img, 'PNG', 10, 10, 50, 20); // Position et taille du logo

  //     // Informations sur l'utilisateur (alignées à gauche)
  //     doc.setFontSize(12);
  //     doc.text(
  //       `Créé par: ${this.connectedUser()?.firstName} ${this.connectedUser()?.name}`,
  //       10,
  //       40,
  //     );
  //     doc.text(`Email: ${this.connectedUser()?.email}`, 10, 50);
  //     doc.text(`Téléphone: ${this.connectedUser()?.telephone}`, 10, 60);

  //     // Informations sur le client (alignées à droite)
  //     const clientInfo = `
  //       Client: ${quote.client.name}
  //       Email: ${quote.client.email}
  //       Téléphone: ${quote.client.phone}
  //       Adresse: ${quote.client.street} ${quote.client.number}, ${quote.client.city}, ${quote.client.country}, ${quote.client.postalCode}
  //     `;
  //     const clientLines = clientInfo.split('\n');
  //     const clientYStart = 40; // Position Y de départ pour le client
  //     const clientYSpacing = 10; // Espacement entre les lignes

  //     // Aligner à droite
  //     clientLines.forEach((line, index) => {
  //       const yPosition = clientYStart + index * clientYSpacing;
  //       const textWidth = doc.getTextWidth(line);
  //       const pageWidth = doc.internal.pageSize.getWidth();
  //       doc.text(line, pageWidth - textWidth - 10, yPosition); // Alignement à droite
  //     });

  //     // Tableau pour les informations sur le devis
  //     const invoiceData = [
  //       ['Information', 'Valeur'],
  //       ['Date du devis', quote.quote_date.toLocaleString()],
  //       ['Date de service', quote.service_date.toLocaleString()],
  //       ['Total HTVA', `${quote.price_htva.toFixed(2)} €`],
  //       ['Total TVA 6%', `${quote.total_vat_6.toFixed(2)} €`],
  //       ['Total TVA 21%', `${quote.total_vat_21.toFixed(2)} €`],
  //       ['Total TTC', `${quote.total.toFixed(2)} €`],
  //     ];

  //     autoTable(doc, {
  //       head: [['Information', 'Valeur']],
  //       body: invoiceData,
  //       startY: 100,
  //       styles: { fontSize: 10 },
  //       headStyles: { fillColor: [100, 100, 100] },
  //     });

  //     // Récupérer la position Y après le premier tableau
  //     const yAfterInvoiceTable = doc.internal.pageSize.getHeight() - 100; // Laisser 100 unités en bas

  //     // Tableau pour les détails des produits
  //     const productData = quote.products.map((product) => [
  //       product.description,
  //       `Quantité: ${product.quantity}`,
  //       `Prix: ${product.price.toFixed(2)} €`,
  //     ]);

  //     autoTable(doc, {
  //       head: [['Produit', 'Quantité', 'Prix']],
  //       body: productData,
  //       startY: yAfterInvoiceTable,
  //       styles: { fontSize: 10 },
  //       headStyles: { fillColor: [100, 100, 100] },
  //     });

  //     // Sauvegarder ou ouvrir le PDF
  //     doc.save(`devis_${quote.id}.pdf`);
  //   };
  // }

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
      const logoHeight = 15;
      const aspectRatio = logoWidth / logoHeight;

      // Calculer la nouvelle hauteur en conservant le ratio d'aspect
      const newLogoWidth = 40;
      const newLogoHeight = newLogoWidth / aspectRatio;

      doc.addImage(logoUrl, 'PNG', margin, margin, newLogoWidth, newLogoHeight);

      // Informations de l'entreprise
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Votre Entreprise SAS', pageWidth - margin, margin, {
        align: 'right',
      });
      doc.text('123 Rue du Commerce', pageWidth - margin, margin + 5, {
        align: 'right',
      });
      doc.text('75001 Paris, France', pageWidth - margin, margin + 10, {
        align: 'right',
      });
      doc.text('Tél: +33 1 23 45 67 89', pageWidth - margin, margin + 15, {
        align: 'right',
      });
      doc.text(
        'Email: contact@votreentreprise.com',
        pageWidth - margin,
        margin + 20,
        { align: 'right' },
      );

      // Ligne de séparation
      doc.setDrawColor(200);
      doc.line(margin, margin + 30, pageWidth - margin, margin + 30);
    };

    // Ajouter l'en-tête
    addHeader();

    // Titre du document
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text('DEVIS', pageWidth / 2, 60, { align: 'center' });

    // Informations du devis
    doc.setFontSize(10);
    doc.text(`Devis N°: ${quote.id}`, margin, 70);
    doc.text(
      `Date: ${new Date(quote.quote_date).toLocaleDateString()}`,
      margin,
      75,
    );
    doc.text(
      `Date de service: ${new Date(quote.service_date).toLocaleDateString()}`,
      margin,
      80,
    );

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
      yPosition,
    );
    yPosition += 5;
    doc.text(
      `${quote.client.postalCode} ${quote.client.city}`,
      pageWidth - margin - 60,
      yPosition,
    );
    yPosition += 5;
    doc.text(`${quote.client.country}`, pageWidth - margin - 60, yPosition);
    yPosition += 5;
    doc.text(`Tél: ${quote.client.phone}`, pageWidth - margin - 60, yPosition);
    yPosition += 5;
    doc.text(
      `Email: ${quote.client.email}`,
      pageWidth - margin - 60,
      yPosition,
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
      { align: 'right' },
    );
    doc.text(`TVA 6%:`, pageWidth - margin - 50, finalY + 15, {
      align: 'right',
    });
    doc.text(
      `${quote.total_vat_6.toFixed(2)} €`,
      pageWidth - margin,
      finalY + 15,
      { align: 'right' },
    );
    doc.text(`TVA 21%:`, pageWidth - margin - 50, finalY + 20, {
      align: 'right',
    });
    doc.text(
      `${quote.total_vat_21.toFixed(2)} €`,
      pageWidth - margin,
      finalY + 20,
      { align: 'right' },
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
      'Votre Entreprise SAS - SIRET 123 456 789 00010 - TVA FR12 123 456 789',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' },
    );

    // Sauvegarder le PDF
    doc.save(`devis_${quote.id}.pdf`);
  }

  generateInvoicePDF(quote: QuoteEntity) {
    const doc = new jsPDF();
    const invoice = quote.invoice;
    // Ajouter le logo
    const logoUrl = '/assets/images/Groupe-30.png'; // Remplacez par le chemin de votre logo
    const img = new Image();
    img.src = logoUrl;

    img.onload = () => {
      doc.addImage(img, 'PNG', 10, 10, 50, 20); // Position et taille du logo

      // Informations sur l'utilisateur (alignées à gauche)
      doc.setFontSize(12);
      doc.text(
        `Créé par: ${this.connectedUser()?.firstName} ${this.connectedUser()?.name}`,
        10,
        40,
      );
      doc.text(`Email: ${this.connectedUser()?.email}`, 10, 50);
      doc.text(`Téléphone: ${this.connectedUser()?.telephone}`, 10, 60);

      // Informations sur le client (alignées à droite)
      const clientInfo = `
        Client: ${quote.client.name}
        Email: ${quote.client.email}
        Téléphone: ${quote.client.phone}
        Adresse: ${quote.client.street} ${quote.client.number}, ${quote.client.city}, ${quote.client.country}, ${quote.client.postalCode}
      `;
      const clientLines = clientInfo.split('\n');
      const clientYStart = 40; // Position Y de départ pour le client
      const clientYSpacing = 10; // Espacement entre les lignes

      // Aligner à droite
      clientLines.forEach((line, index) => {
        const yPosition = clientYStart + index * clientYSpacing;
        const textWidth = doc.getTextWidth(line);
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.text(line, pageWidth - textWidth - 10, yPosition); // Alignement à droite
      });

      // Tableau pour les informations sur le devis
      const invoiceData = [
        ['Information', 'Valeur'],
        ['Date de la facture', invoice.invoice_date.toLocaleString()],
        ['Date de service', invoice.service_date.toLocaleString()],
        ['Total HTVA', `${invoice.price_htva.toFixed(2)} €`],
        ['Total TVA 6%', `${invoice.total_vat_6.toFixed(2)} €`],
        ['Total TVA 21%', `${invoice.total_vat_21.toFixed(2)} €`],
        ['Total TTC', `${invoice.total.toFixed(2)} €`],
      ];

      autoTable(doc, {
        head: [['Information', 'Valeur']],
        body: invoiceData,
        startY: 100,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [100, 100, 100] },
      });

      // Récupérer la position Y après le premier tableau
      const yAfterInvoiceTable = doc.internal.pageSize.getHeight() - 100; // Laisser 100 unités en bas

      // Tableau pour les détails des produits
      const productData = quote.products.map((product) => [
        product.description,
        `Quantité: ${product.quantity}`,
        `Prix: ${product.price.toFixed(2)} €`,
      ]);

      autoTable(doc, {
        head: [['Produit', 'Quantité', 'Prix']],
        body: productData,
        startY: yAfterInvoiceTable,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [100, 100, 100] },
      });

      doc.save(`facture_${invoice.id}.pdf`);
      // Sauvegarder ou ouvrir le PDF
    };
  }

  // generateCreditNotePdf() {
  //   const doc = new jsPDF();
  //   // Ajouter le logo
  //   const logoUrl = '/assets/images/Groupe-30.png'; // Remplacez par le chemin de votre logo
  //   const img = new Image();
  //   img.src = logoUrl;

  //   img.onload = () => {
  //     doc.addImage(img, 'PNG', 10, 10, 50, 20); // Position et taille du logo

  //     // Informations sur l'utilisateur (alignées à gauche)
  //     doc.setFontSize(12);
  //     doc.text(
  //       `Créé par: ${this.connectedUser()?.firstName} ${this.connectedUser()?.name}`,
  //       10,
  //       40,
  //     );
  //     doc.text(`Email: ${this.connectedUser()?.email}`, 10, 50);
  //     doc.text(`Téléphone: ${this.connectedUser()?.telephone}`, 10, 60);

  //     // Informations sur le client (alignées à droite)
  //     const clientInfo = `
  //       Client: ${this.creditNote()?.client.name}
  //       Email: ${this.creditNote()?.client.email}
  //       Téléphone: ${this.creditNote()?.client.phone}
  //       Adresse: ${this.creditNote()?.client.street} ${this.creditNote()?.client.number}, ${this.creditNote()?.client.city}, ${this.creditNote()?.client.country}, ${this.creditNote()?.client.postalCode}
  //     `;
  //     const clientLines = clientInfo.split('\n');
  //     const clientYStart = 40; // Position Y de départ pour le client
  //     const clientYSpacing = 10; // Espacement entre les lignes

  //     // Aligner à droite
  //     clientLines.forEach((line, index) => {
  //       const yPosition = clientYStart + index * clientYSpacing;
  //       const textWidth = doc.getTextWidth(line);
  //       const pageWidth = doc.internal.pageSize.getWidth();
  //       doc.text(line, pageWidth - textWidth - 10, yPosition); // Alignement à droite
  //     });

  //     // Tableau pour les informations sur le devis
  //     const invoiceData = [
  //       ['Information', 'Valeur'],
  //       [
  //         'Date de la facture',
  //         this.creditNote()?.invoice_date.toLocaleString()!,
  //       ],
  //       ['Date de service', this.creditNote()?.service_date.toLocaleString()!],
  //       ['Total HTVA', `${this.creditNote()?.price_htva.toFixed(2)!} €`],
  //       ['Total TVA 6%', `${this.creditNote()?.total_vat_6.toFixed(2)!} €`],
  //       ['Total TVA 21%', `${this.creditNote()?.total_vat_21.toFixed(2)!} €`],
  //       [
  //         'Total note de crédit',
  //         `${this.creditNote()?.creditNoteAmount.toFixed(2)!} €`,
  //       ],
  //       [
  //         'Total TTC',
  //         `${(this.creditNote()?.total! - this.creditNote()?.creditNoteAmount!).toFixed(2)} €`,
  //       ],
  //       ['Numéro de facture', `${this.creditNote()?.linkedInvoiceId}`],
  //     ];

  //     autoTable(doc, {
  //       head: [['Information', 'Valeur']],
  //       body: invoiceData,
  //       startY: 100,
  //       styles: { fontSize: 10 },
  //       headStyles: { fillColor: [100, 100, 100] },
  //     });

  //     // Récupérer la position Y après le premier tableau
  //     const yAfterInvoiceTable = doc.internal.pageSize.getHeight() - 100; // Laisser 100 unités en bas

  //     // Tableau pour les détails des produits
  //     const productData = this.creditNote()?.products.map((product) => [
  //       product.description,
  //       `Quantité: ${product.quantity}`,
  //       `Prix: ${product.price.toFixed(2)} €`,
  //     ]);

  //     autoTable(doc, {
  //       head: [['Produit', 'Quantité', 'Prix']],
  //       body: productData,
  //       startY: yAfterInvoiceTable,
  //       styles: { fontSize: 10 },
  //       headStyles: { fillColor: [100, 100, 100] },
  //     });

  //     // Sauvegarder ou ouvrir le PDF
  //     doc.save(`note_de_credit_${this.creditNote()?.id}.pdf`);
  //   };
  // }

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
        },
      );

      doc.text(
        'Email: contact@sonarartists.be',
        pageWidth - margin,
        margin + 20,
        { align: 'right' },
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
      `Date: ${new Date(this.creditNote()?.invoice_date!).toLocaleDateString()}`,
      margin,
      yPosition2,
    );
    yPosition2 += lineHeight;

    if (this.creditNote()?.service_date) {
      doc.text(
        `Date de service: ${new Date(this.creditNote()?.service_date!).toLocaleDateString()}`,
        margin,
        yPosition2,
      );
      yPosition2 += lineHeight;
    }

    if (this.creditNote()?.linkedInvoiceId) {
      doc.text(
        `Numéro de facture liée: ${this.creditNote()?.linkedInvoiceId}`,
        margin,
        yPosition2,
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
      maxWidth,
    );
    clientName.forEach((line: string) => {
      doc.text(line, pageWidth - margin - 60, yPosition);
      yPosition += 5;
    });

    doc.text(
      `${this.creditNote()?.client.street} ${this.creditNote()?.client.number}`,
      pageWidth - margin - 60,
      yPosition,
    );
    yPosition += 5;
    doc.text(
      `${this.creditNote()?.client.postalCode} ${this.creditNote()?.client.city}`,
      pageWidth - margin - 60,
      yPosition,
    );
    yPosition += 5;
    doc.text(
      `${this.creditNote()?.client.country}`,
      pageWidth - margin - 60,
      yPosition,
    );
    yPosition += 5;
    doc.text(
      `Tél: ${this.creditNote()?.client.phone}`,
      pageWidth - margin - 60,
      yPosition,
    );
    yPosition += 5;
    doc.text(
      `Email: ${this.creditNote()?.client.email}`,
      pageWidth - margin - 60,
      yPosition,
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
      `${Math.abs(this.creditNote()?.price_htva!).toFixed(2)} €`,
      pageWidth - margin,
      finalY + 10,
      { align: 'right' },
    );
    doc.text(`TVA 6%:`, pageWidth - margin - 50, finalY + 15, {
      align: 'right',
    });
    doc.text(
      `${Math.abs(this.creditNote()?.total_vat_6!).toFixed(2)} €`,
      pageWidth - margin,
      finalY + 15,
      { align: 'right' },
    );
    doc.text(`TVA 21%:`, pageWidth - margin - 50, finalY + 20, {
      align: 'right',
    });
    doc.text(
      `${Math.abs(this.creditNote()?.total_vat_21!).toFixed(2)} €`,
      pageWidth - margin,
      finalY + 20,
      { align: 'right' },
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
      { align: 'right' },
    );

    // Conditions et notes
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const conditions = [
      'Cette note de crédit annule et remplace la facture mentionnée ci-dessus.',
      `Date d'émission : ${this.formatDateBelgium(this.creditNote()?.invoice_date!)}`,
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
      { align: 'center' },
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
        }),
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.groupAccount.set(undefined);
  }

  checkCreditNote(invoice_id: number) {
    this.invoiceService
      .getCreditNoteByInvoiceId(invoice_id)
      .subscribe((data) => {
        this.creditNote.set(data); // Récupération de la note de crédit
        this.creditNoteList.update((prev) => [...prev, data]);
        // Vérification de la note de crédit après sa récupération
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
        }),
      )
      .subscribe();
  }
}
