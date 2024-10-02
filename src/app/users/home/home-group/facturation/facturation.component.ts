import {AfterViewInit, Component, inject, input, OnDestroy, signal} from '@angular/core';
import {HlmButtonDirective} from "@spartan-ng/ui-button-helm";
import {HlmIconComponent} from "@spartan-ng/ui-icon-helm";
import {RouterLink} from "@angular/router";
import {UsersService} from "../../../../shared/services/users.service";
import {map, take, tap} from "rxjs";
import {UserEntity} from "../../../../shared/entities/user.entity";
import {DatePipe, JsonPipe, Location} from "@angular/common";
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTableImports,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import {EuroFormatPipe} from "../../../../shared/pipes/euro-format.pipe";
import {jsPDF} from 'jspdf';
import autoTable from 'jspdf-autotable';
import {QuoteEntity} from "../../../../shared/entities/quote.entity";
import {HlmSeparatorDirective} from "@spartan-ng/ui-separator-helm";
import {BrnSeparatorComponent} from "@spartan-ng/ui-separator-brain";
import {InvoiceService} from "../../../../shared/services/invoice.service";
import {BrnAlertDialogContentDirective, BrnAlertDialogTriggerDirective,} from '@spartan-ng/ui-alertdialog-brain';
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
import {BrnDialogContentDirective, BrnDialogTriggerDirective} from '@spartan-ng/ui-dialog-brain';
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogDescriptionDirective,
  HlmDialogFooterComponent,
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective,
} from '@spartan-ng/ui-dialog-helm';
import {CompteGroupeEntity} from "../../../../shared/entities/compte-groupe.entity";
import {InvoiceEntity} from "../../../../shared/entities/invoice.entity";
import {provideIcons} from "@ng-icons/core";
import {lucideCornerDownLeft, lucideEdit, lucideFileDown} from "@ng-icons/lucide";
import {AuthService} from "../../../../shared/services/auth.service";
import {PrincipalAccountEntity} from "../../../../shared/entities/principal-account.entity";
import {ComptePrincipalService} from "../../../../shared/services/compte-principal.service";
import {ClientEntity} from "../../../../shared/entities/client.entity";

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
    BrnDialogContentDirective, BrnDialogTriggerDirective
  ],
  providers: [
    provideIcons({
      lucideFileDown,
      lucideCornerDownLeft,
      lucideEdit
    })
  ],
  templateUrl: './facturation.component.html',
  styleUrl: './facturation.component.css'
})
export class FacturationComponent implements AfterViewInit, OnDestroy {

  private usersService: UsersService = inject(UsersService);
  private invoiceService: InvoiceService = inject(InvoiceService);
  private authService: AuthService = inject(AuthService);
  private principalService: ComptePrincipalService = inject(ComptePrincipalService);
  protected accountPrincipal: PrincipalAccountEntity | undefined;

  id = input<number>()
  typeOfProjet = input<string>()
  protected connectedUser = signal<UserEntity | null>(null);
  protected groupAccount = signal<CompteGroupeEntity | undefined>(undefined)
  protected creditNote = signal<InvoiceEntity | null>(null)
  protected isCreditNote = signal<Boolean | null>(null)


  constructor(private location: Location) {
  }

  goBack() {
    this.location.back()
  }

  async ngAfterViewInit() {
    await this.getConnectedUser()

  }


  async getConnectedUser() {
    this.usersService.getInfo().pipe(
      take(1),
      tap((data) => {
        this.connectedUser.set(data);
      }),
      tap(() => {
        if (this.connectedUser()?.role === "ADMIN") {
          if (this.typeOfProjet() === "PRINCIPAL") {
            this.principalService.getGroupById(+this.id()!).pipe(
              take(1),
              tap(data => {
                this.accountPrincipal = data
                console.log(this.accountPrincipal)
              })
            ).subscribe()
          }
        } else {
          const groupAccountFinded = this.connectedUser()?.userSecondaryAccounts.find(account => account.id === +this.id()!);
          this.groupAccount.set(groupAccountFinded?.group_account)
        }
      })
    ).subscribe();


    /*this.usersService.getInfo().pipe(
      map((data) => {
        this.connectedUser.set(data);
        return data.userSecondaryAccounts.find(account => account.id === +this.id()!);

      }),
      take(1)
    ).subscribe(groupAccountFinded => {
      this.groupAccount.set(groupAccountFinded?.group_account)
    });*/
  }

  generateQuotePDF(quote: QuoteEntity) {
    const doc = new jsPDF();

    // Ajouter le logo
    const logoUrl = '/assets/images/Groupe-30.png'; // Remplacez par le chemin de votre logo
    const img = new Image();
    img.src = logoUrl;

    img.onload = () => {
      doc.addImage(img, 'PNG', 10, 10, 50, 20); // Position et taille du logo

      // Informations sur l'utilisateur (alignées à gauche)
      doc.setFontSize(12);
      doc.text(`Créé par: ${this.connectedUser()?.firstName} ${this.connectedUser()?.name}`, 10, 40);
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
        ['Date du devis', quote.quote_date.toLocaleString()],
        ['Date de service', quote.service_date.toLocaleString()],
        ['Total HTVA', `${quote.price_htva.toFixed(2)} €`],
        ['Total TVA 6%', `${quote.total_vat_6.toFixed(2)} €`],
        ['Total TVA 21%', `${quote.total_vat_21.toFixed(2)} €`],
        ['Total TTC', `${quote.total.toFixed(2)} €`],
      ];

      autoTable(doc, {
        head: [['Information', 'Valeur']],
        body: invoiceData,
        startY: 100,
        styles: {fontSize: 10},
        headStyles: {fillColor: [100, 100, 100]}
      });

      // Récupérer la position Y après le premier tableau
      const yAfterInvoiceTable = doc.internal.pageSize.getHeight() - 100; // Laisser 100 unités en bas

      // Tableau pour les détails des produits
      const productData = quote.products.map(product => [
        product.description,
        `Quantité: ${product.quantity}`,
        `Prix: ${product.price.toFixed(2)} €`
      ]);

      autoTable(doc, {
        head: [['Produit', 'Quantité', 'Prix']],
        body: productData,
        startY: yAfterInvoiceTable,
        styles: {fontSize: 10},
        headStyles: {fillColor: [100, 100, 100]}
      });

      // Sauvegarder ou ouvrir le PDF
      doc.save(`devis_${quote.id}.pdf`);
    };
  }

  generateInvoicePDF(quote: QuoteEntity) {
    const doc = new jsPDF();
    const invoice = quote.invoice
    // Ajouter le logo
    const logoUrl = '/assets/images/Groupe-30.png'; // Remplacez par le chemin de votre logo
    const img = new Image();
    img.src = logoUrl;

    img.onload = () => {
      doc.addImage(img, 'PNG', 10, 10, 50, 20); // Position et taille du logo

      // Informations sur l'utilisateur (alignées à gauche)
      doc.setFontSize(12);
      doc.text(`Créé par: ${this.connectedUser()?.firstName} ${this.connectedUser()?.name}`, 10, 40);
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
        styles: {fontSize: 10},
        headStyles: {fillColor: [100, 100, 100]}
      });

      // Récupérer la position Y après le premier tableau
      const yAfterInvoiceTable = doc.internal.pageSize.getHeight() - 100; // Laisser 100 unités en bas

      // Tableau pour les détails des produits
      const productData = quote.products.map(product => [
        product.description,
        `Quantité: ${product.quantity}`,
        `Prix: ${product.price.toFixed(2)} €`
      ]);

      autoTable(doc, {
        head: [['Produit', 'Quantité', 'Prix']],
        body: productData,
        startY: yAfterInvoiceTable,
        styles: {fontSize: 10},
        headStyles: {fillColor: [100, 100, 100]}
      });

      // Sauvegarder ou ouvrir le PDF
      doc.save(`facture_${invoice.id}.pdf`);
    };
  }

  generateCreditNotePdf() {
    const doc = new jsPDF();
    // Ajouter le logo
    const logoUrl = '/assets/images/Groupe-30.png'; // Remplacez par le chemin de votre logo
    const img = new Image();
    img.src = logoUrl;

    img.onload = () => {
      doc.addImage(img, 'PNG', 10, 10, 50, 20); // Position et taille du logo

      // Informations sur l'utilisateur (alignées à gauche)
      doc.setFontSize(12);
      doc.text(`Créé par: ${this.connectedUser()?.firstName} ${this.connectedUser()?.name}`, 10, 40);
      doc.text(`Email: ${this.connectedUser()?.email}`, 10, 50);
      doc.text(`Téléphone: ${this.connectedUser()?.telephone}`, 10, 60);

      // Informations sur le client (alignées à droite)
      const clientInfo = `
        Client: ${this.creditNote()?.client.name}
        Email: ${this.creditNote()?.client.email}
        Téléphone: ${this.creditNote()?.client.phone}
        Adresse: ${this.creditNote()?.client.street} ${this.creditNote()?.client.number}, ${this.creditNote()?.client.city}, ${this.creditNote()?.client.country}, ${this.creditNote()?.client.postalCode}
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
        ['Date de la facture', this.creditNote()?.invoice_date.toLocaleString()!],
        ['Date de service', this.creditNote()?.service_date.toLocaleString()!],
        ['Total HTVA', `${this.creditNote()?.price_htva.toFixed(2)!} €`],
        ['Total TVA 6%', `${this.creditNote()?.total_vat_6.toFixed(2)!} €`],
        ['Total TVA 21%', `${this.creditNote()?.total_vat_21.toFixed(2)!} €`],
        ['Total note de crédit', `${this.creditNote()?.creditNoteAmount.toFixed(2)!} €`],
        ['Total TTC', `${(this.creditNote()?.total! - this.creditNote()?.creditNoteAmount!).toFixed(2)} €`],
      ];

      autoTable(doc, {
        head: [['Information', 'Valeur']],
        body: invoiceData,
        startY: 100,
        styles: {fontSize: 10},
        headStyles: {fillColor: [100, 100, 100]}
      });

      // Récupérer la position Y après le premier tableau
      const yAfterInvoiceTable = doc.internal.pageSize.getHeight() - 100; // Laisser 100 unités en bas

      // Tableau pour les détails des produits
      const productData = this.creditNote()?.products.map(product => [
        product.description,
        `Quantité: ${product.quantity}`,
        `Prix: ${product.price.toFixed(2)} €`
      ]);

      autoTable(doc, {
        head: [['Produit', 'Quantité', 'Prix']],
        body: productData,
        startY: yAfterInvoiceTable,
        styles: {fontSize: 10},
        headStyles: {fillColor: [100, 100, 100]}
      });

      // Sauvegarder ou ouvrir le PDF
      doc.save(`note_de_credit_${this.creditNote()?.id}.pdf`);
    };
  }

  createInvoice(quote: QuoteEntity, ctx: any) {
    this.invoiceService.createInvoice(quote, this.typeOfProjet()!, this.id()!).pipe(
      tap(data => {
        quote.invoice = data;
        ctx.close()
      }),
    ).subscribe()
  }

  ngOnDestroy(): void {
    this.groupAccount.set(undefined)
  }

  checkCreditNote(invoice_id: number) {
    this.invoiceService.getCreditNoteByInvoiceId(invoice_id).subscribe(
      data => {
        this.creditNote.set(data); // Récupération de la note de crédit
        // Vérification de la note de crédit après sa récupération
        if (this.creditNote()) {
          this.isCreditNote.set(true);
        } else {
          this.isCreditNote.set(false)
        }
      }
    )

  }


}
