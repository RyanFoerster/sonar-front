import {AfterViewInit, Component, inject, input, OnDestroy, signal} from '@angular/core';
import {HlmButtonDirective} from "@spartan-ng/ui-button-helm";
import {HlmIconComponent} from "@spartan-ng/ui-icon-helm";
import {RouterLink} from "@angular/router";
import {UsersService} from "../../../../shared/services/users.service";
import {map, tap} from "rxjs";
import {UserEntity} from "../../../../shared/entities/user.entity";
import {DatePipe, JsonPipe} from "@angular/common";
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
import {CompteGroupeEntity} from "../../../../shared/entities/compte-groupe.entity";

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
  ],
  templateUrl: './facturation.component.html',
  styleUrl: './facturation.component.css'
})
export class FacturationComponent implements AfterViewInit, OnDestroy {

  private usersService: UsersService = inject(UsersService);
  private invoiceService: InvoiceService = inject(InvoiceService);

  id = input<number>()
  typeOfProjet = input<string>()
  protected connectedUser = signal<UserEntity | null>(null);
  protected groupAccount = signal<CompteGroupeEntity | undefined>(undefined)

  async ngAfterViewInit() {
    await this.getConnectedUser()

  }


  async getConnectedUser() {
    this.usersService.getInfo().pipe(
      map((data) => {
        this.connectedUser.set(data);
        return data.userSecondaryAccounts.find(account => account.id === +this.id()!);
      })
    ).subscribe(groupAccountFinded => {
      this.groupAccount.set(groupAccountFinded?.group_account)
    });
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

}