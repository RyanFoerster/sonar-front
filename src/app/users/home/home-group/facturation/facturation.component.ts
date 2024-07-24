import {AfterViewInit, Component, inject, input, signal} from '@angular/core';
import {HlmButtonDirective} from "@spartan-ng/ui-button-helm";
import {HlmIconComponent} from "@spartan-ng/ui-icon-helm";
import {RouterLink} from "@angular/router";
import {UsersService} from "../../../../shared/services/users.service";
import {tap} from "rxjs";
import {UserEntity} from "../../../../shared/entities/user.entity";
import {DatePipe, JsonPipe} from "@angular/common";
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import {EuroFormatPipe} from "../../../../shared/pipes/euro-format.pipe";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {ProductEntity} from "../../../../shared/entities/product.entity";
import {QuoteEntity} from "../../../../shared/entities/quote.entity";

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
  ],
  templateUrl: './facturation.component.html',
  styleUrl: './facturation.component.css'
})
export class FacturationComponent implements AfterViewInit {

  private usersService: UsersService = inject(UsersService);

  id = input<number>()
  protected connectedUser = signal<UserEntity | null>(null);

  async ngAfterViewInit() {
    await this.getConnectedUser()

  }

  async getConnectedUser() {
    this.usersService.getInfo().pipe(
      tap((data) => this.connectedUser.set(data))
    ).subscribe()
  }

  generatePDF(quote: QuoteEntity) {
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
        styles: { fontSize: 10 },
        headStyles: { fillColor: [100, 100, 100] }
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
        styles: { fontSize: 10 },
        headStyles: { fillColor: [100, 100, 100] }
      });

      // Sauvegarder ou ouvrir le PDF
      doc.save(`devis_${quote.id}.pdf`);
    };
  }
}
