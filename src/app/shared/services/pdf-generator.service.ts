/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceEntity } from '../entities/invoice.entity';
import { QuoteEntity } from '../entities/quote.entity';
import * as QRCode from 'qrcode';

@Injectable({
  providedIn: 'root',
})
export class PdfGeneratorService {
  private readonly PAGE_MARGIN = 20;
  private readonly MAX_WIDTH = 60;
  private readonly COMPANY_INFO = {
    name: 'Sonar Artists ASBL',
    address: '6 rue Francisco Ferrer',
    city: '4460 Grâce-Hollogne, Belgique',
    email: 'info@sonarartists.be',
    vat: 'TVA BE0700273583',
    iban: 'BE0700273583', // À remplacer par l'IBAN réel
    bic: 'GEBABEBB', // À remplacer par le BIC réel
  };

  private formatDateBelgium(date: Date): string {
    return new Date(date).toLocaleDateString('fr-BE');
  }

  private getOptimizedPdfConfig(): any {
    return {
      compress: true,
      putOnlyUsedFonts: true,
      precision: 2,
      format: 'a4',
    };
  }

  private addHeader(doc: jsPDF): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoUrl = '/assets/images/SONAR.png';
    const logoWidth = 40;
    const aspectRatio = 1;
    const newLogoHeight = logoWidth / aspectRatio;

    // Optimisation de l'ajout du logo avec espacement correct
    doc.addImage(
      logoUrl,
      'PNG',
      this.PAGE_MARGIN,
      10,
      logoWidth,
      newLogoHeight,
      undefined,
      'MEDIUM'
    );

    // Ajustement des espacements pour le texte d'en-tête
    const headerStartY = 20;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);

    doc.text(
      this.COMPANY_INFO.name,
      pageWidth - this.PAGE_MARGIN,
      headerStartY,
      { align: 'right' }
    );
    doc.text(
      this.COMPANY_INFO.address,
      pageWidth - this.PAGE_MARGIN,
      headerStartY + 7,
      { align: 'right' }
    );
    doc.text(
      this.COMPANY_INFO.city,
      pageWidth - this.PAGE_MARGIN,
      headerStartY + 14,
      { align: 'right' }
    );
    doc.text(
      `Email: ${this.COMPANY_INFO.email}`,
      pageWidth - this.PAGE_MARGIN,
      headerStartY + 21,
      { align: 'right' }
    );

    // Ligne de séparation
    doc.setDrawColor(200);
    doc.line(
      this.PAGE_MARGIN,
      headerStartY + 30,
      pageWidth - this.PAGE_MARGIN,
      headerStartY + 30
    );
  }

  private addClientInfo(doc: jsPDF, client: any): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 80;
    const lineHeight = 7;

    doc.setFontSize(11);
    doc.text('Adressé à:', pageWidth - this.PAGE_MARGIN - 60, yPosition - 10);
    doc.setFontSize(10);

    const clientName = doc.splitTextToSize(client.name, this.MAX_WIDTH);
    clientName.forEach((line: string) => {
      doc.text(line, pageWidth - this.PAGE_MARGIN - 60, yPosition);
      yPosition += lineHeight;
    });

    doc.text(
      `${client.street} ${client.number}`,
      pageWidth - this.PAGE_MARGIN - 60,
      yPosition
    );
    yPosition += lineHeight;

    doc.text(
      `${client.postalCode} ${client.city}`,
      pageWidth - this.PAGE_MARGIN - 60,
      yPosition
    );
    yPosition += lineHeight;

    doc.text(client.country, pageWidth - this.PAGE_MARGIN - 60, yPosition);
    yPosition += lineHeight;

    doc.text(
      `Tél: ${client.phone}`,
      pageWidth - this.PAGE_MARGIN - 60,
      yPosition
    );
    yPosition += lineHeight;

    doc.text(
      `Email: ${client.email}`,
      pageWidth - this.PAGE_MARGIN - 60,
      yPosition
    );
  }

  private addProductsTable(doc: jsPDF, products: any[], type: string): number {
    const tableStart = 140; // Augmenté pour laisser plus d'espace en haut
    autoTable(doc, {
      startY: tableStart,
      head: [['Description', 'Quantité', 'Prix unitaire', 'Total HT']],
      body:
        type === 'credit_note'
          ? products.map((product) => {
              if (product.price < 0) {
                return [
                  product.description,
                  product.quantity,
                  `${product.price.toFixed(2)} €`,
                  `${(product.quantity * product.price).toFixed(2)} €`,
                ];
              }
              return [];
            })
          : products.map((product) => {
              return [
                product.description,
                product.quantity,
                `${product.price.toFixed(2)} €`,
                `${(product.quantity * product.price).toFixed(2)} €`,
              ];
            }),
      styles: {
        fontSize: 9,
        cellPadding: 5,
        minCellHeight: 12,
      },
      headStyles: {
        fillColor: [70, 70, 70],
        textColor: 255,
        minCellHeight: 14,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
      },
      margin: { top: 30 },
    });

    return (doc as any).lastAutoTable.finalY || tableStart;
  }

  generateQuotePDF(quote: QuoteEntity): void {
    const doc = new jsPDF(this.getOptimizedPdfConfig());
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Couleur principale pour le design
    const mainColor = [200, 192, 77] as [number, number, number]; // #C8C04D en RGB

    // Logo en haut à gauche
    try {
      const logoUrl = '/assets/images/SONAR.png';
      const logoSize = 40;
      doc.addImage(
        logoUrl,
        'PNG',
        this.PAGE_MARGIN,
        this.PAGE_MARGIN,
        logoSize,
        logoSize,
        undefined,
        'MEDIUM'
      );
    } catch (error: any) {
      console.warn(`Impossible de charger le logo: ${error.message}`);
    }

    // Titre "Devis" en haut à droite
    doc.setFontSize(28);
    doc.setTextColor(51, 51, 51);
    doc.setFont('helvetica', 'bold');
    doc.text('Devis', pageWidth - this.PAGE_MARGIN, 35, { align: 'right' });

    // Date et numéro de devis
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(
      this.formatDateBelgium(quote.quote_date),
      pageWidth - this.PAGE_MARGIN,
      45,
      { align: 'right' }
    );
    doc.text(`N°${quote.id}`, pageWidth - this.PAGE_MARGIN, 55, {
      align: 'right',
    });

    // Informations de l'émetteur
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(this.COMPANY_INFO.name, this.PAGE_MARGIN, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(this.COMPANY_INFO.address, this.PAGE_MARGIN, 75);
    doc.text(this.COMPANY_INFO.city, this.PAGE_MARGIN, 80);
    doc.text(`Email: ${this.COMPANY_INFO.email}`, this.PAGE_MARGIN, 85);
    doc.text(this.COMPANY_INFO.vat, this.PAGE_MARGIN, 90);

    // Informations du client
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(quote.client.name!, pageWidth - this.PAGE_MARGIN - 60, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.client.street, pageWidth - this.PAGE_MARGIN - 60, 75);
    doc.text(quote.client.city, pageWidth - this.PAGE_MARGIN - 60, 80);
    doc.text(
      quote.client.company_vat_number ?? 'TVA: BE 0790.515.752',
      pageWidth - this.PAGE_MARGIN - 60,
      85
    );

    // Titre du document
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Devis N°${quote.id} pour ${quote.client.name}`,
      this.PAGE_MARGIN,
      105
    );

    // Délai d'exécution
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Validité du devis : ${this.formatDateBelgium(
        quote.validation_deadline
      )}`,
      pageWidth - this.PAGE_MARGIN,
      115,
      { align: 'right' }
    );
    doc.text(
      `Délais de paiement : ${quote.payment_deadline} jours à compter de la date de prestation / livraison`,
      pageWidth - this.PAGE_MARGIN,
      120,
      { align: 'right' }
    );

    // Tableau des produits
    const startY = 125;
    autoTable(doc, {
      head: [['Description', 'Quantité(s)', 'Tarif', 'Remise', 'Total']],
      body: quote.products.map((product) => [
        product.description,
        product.quantity.toString(),
        `${product.price.toFixed(2)}€`,
        `0,00€`, // Remise fixe à 0 car la propriété discount n'existe pas
        `${(product.quantity * product.price).toFixed(2)}€`,
      ]),
      startY: startY,
      styles: {
        fontSize: 9,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: mainColor,
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center', // Alignement par défaut pour les en-têtes
      },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
      // Configuration spécifique pour les en-têtes de colonnes
      willDrawCell: function (data) {
        // Si c'est une cellule d'en-tête
        if (data.row.section === 'head') {
          // Définir l'alignement des en-têtes pour correspondre aux colonnes
          if (data.column.index === 0) {
            data.cell.styles.halign = 'left';
          } else if (data.column.index === 1) {
            data.cell.styles.halign = 'center';
          } else {
            data.cell.styles.halign = 'right';
          }
        }
      },
      margin: { left: this.PAGE_MARGIN, right: this.PAGE_MARGIN },
    });

    // Position Y après le tableau
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Sous-total et TVA
    autoTable(doc, {
      body: [
        ['Sous-total', `${quote.price_htva?.toFixed(2) || '0.00'}€`],
        ['TVA 6%', `${quote.total_vat_6.toFixed(2)}€`],
        ['TVA 21%', `${quote.total_vat_21.toFixed(2)}€`],
        ['Total', `${quote.total.toFixed(2)}€`],
      ],
      startY: finalY,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      theme: 'plain',
      columnStyles: {
        0: { cellWidth: 40, halign: 'left' },
        1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: pageWidth - 100 },
    });

    // Message de remerciement
    // doc.setFontSize(9);
    // doc.setTextColor(51, 51, 51);
    // doc.text('Cordialement,', this.PAGE_MARGIN, finalY + 40);
    // doc.text(
    //   'Si ce devis vous convient, veuillez nous le retourner signé et précédé de la mention :',
    //   this.PAGE_MARGIN,
    //   finalY + 50
    // );

    // Champs pour signature
    doc.setFont('helvetica', 'normal');
    // doc.text('Date :', this.PAGE_MARGIN, finalY + 20);
    // doc.text('Signature :', this.PAGE_MARGIN, finalY + 35);

    // Pied de page avec informations de l'entreprise
    const footerY = pageHeight - 30; // Réduit l'espace en bas

    // Calculer les positions horizontales pour éviter les chevauchements
    const col1X = this.PAGE_MARGIN;
    const col2X = pageWidth / 3;
    const col3X = (pageWidth / 3) * 2 - 10; // Ajusté pour éviter de sortir de la page

    // Colonne 1 - Siège social
    doc.setFont('helvetica', 'bold');
    doc.text('Siège social', col1X, footerY);
    doc.setFont('helvetica', 'normal');
    doc.text(this.COMPANY_INFO.address, col1X, footerY + 5);
    doc.text(this.COMPANY_INFO.city.split(',')[0], col1X, footerY + 10);
    doc.text('Belgique', col1X, footerY + 15);
    doc.text(this.COMPANY_INFO.vat.replace('TVA ', ''), col1X, footerY + 20);

    // Colonne 2 - Coordonnées
    doc.setFont('helvetica', 'bold');
    doc.text('Coordonnées', col2X, footerY);
    doc.setFont('helvetica', 'normal');
    doc.text(this.COMPANY_INFO.name, col2X, footerY + 5);
    doc.text(this.COMPANY_INFO.email, col2X, footerY + 10);
    // Vous pouvez ajouter un site web ici si disponible

    // Colonne 3 - Détails bancaires
    doc.setFont('helvetica', 'bold');
    doc.text('Détails bancaires', col3X, footerY);
    doc.setFont('helvetica', 'normal');
    doc.text(`IBAN: ${this.COMPANY_INFO.iban}`, col3X, footerY + 5);
    doc.text(`BIC: ${this.COMPANY_INFO.bic}`, col3X, footerY + 10);

    doc.save(`devis_${quote.id}.pdf`);
  }

  previewQuotePDF(quote: QuoteEntity): jsPDF {
    const doc = new jsPDF(this.getOptimizedPdfConfig());
    const pageHeight = doc.internal.pageSize.getHeight();

    try {
      this.addHeader(doc);
      this.addClientInfo(doc, quote.client);

      // Titre et informations du devis
      let yPosition = 60;
      doc.setFontSize(18);
      doc.setTextColor(0);
      doc.text(
        `DEVIS N°: ${new Date().getFullYear()}-${quote.id}`,
        this.PAGE_MARGIN,
        yPosition
      );

      doc.setFontSize(10);
      yPosition += 10;
      doc.text(
        `Date: ${this.formatDateBelgium(quote.quote_date)}`,
        this.PAGE_MARGIN,
        yPosition
      );
      yPosition += 7;
      doc.text(
        `Date de service: ${this.formatDateBelgium(quote.service_date)}`,
        this.PAGE_MARGIN,
        yPosition
      );

      const finalY = this.addProductsTable(doc, quote.products, 'quote');

      // Totaux et conditions
      this.addTotals(doc, quote, finalY);

      this.addFooter(doc, pageHeight, [
        `Conditions de paiement : ${quote.payment_deadline} jours à compter de la date de prestation / livraison`,
        `Validité du devis : ${this.formatDateBelgium(quote.quote_date)}`,
        'Nous vous remercions de votre confiance',
      ]);

      return doc;
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      throw error;
    }
  }

  private async generatePaymentQRCode(invoice: InvoiceEntity): Promise<string> {
    // Format EPC069-12 pour les virements SEPA
    const reference = `facture_${
      invoice.invoice_number
    }_${invoice.client.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const qrData = [
      'BCD', // Service Tag
      '002', // Version
      '1', // Character Set
      'SCT', // Identification
      this.COMPANY_INFO.bic, // BIC
      this.COMPANY_INFO.name, // Nom du bénéficiaire
      this.COMPANY_INFO.iban, // IBAN
      `EUR${Math.abs(invoice.total).toFixed(2)}`, // Montant
      '', // Purpose (peut être laissé vide)
      reference, // Référence personnalisée
      `FACTURE ${invoice.invoice_number} - ${this.formatDateBelgium(
        invoice.invoice_date
      )}`, // Description détaillée
    ].join('\n');

    try {
      // Optimisation de la génération du QR code
      return await QRCode.toDataURL(qrData, {
        width: 100,
        margin: 0,
        scale: 4,
        errorCorrectionLevel: 'L',
      });
    } catch (err) {
      console.error('Erreur lors de la génération du QR code:', err);
      return '';
    }
  }

  private async addPaymentQRCode(
    doc: jsPDF,
    invoice: InvoiceEntity,
    yPosition: number
  ): Promise<void> {
    const qrCodeDataUrl = await this.generatePaymentQRCode(invoice);
    if (qrCodeDataUrl) {
      const pageWidth = doc.internal.pageSize.getWidth();

      // Réduction de la taille du QR code
      const qrCodeWidth = 30; // Réduit de 40 à 30
      const qrCodeHeight = 30; // Réduit de 40 à 30
      const qrCodeX = this.PAGE_MARGIN;
      const qrCodeY = yPosition + 20; // Réduit l'espace vertical

      // Optimisation de l'ajout du QR code
      doc.addImage(
        qrCodeDataUrl,
        'PNG',
        qrCodeX,
        qrCodeY,
        qrCodeWidth,
        qrCodeHeight,
        undefined,
        'MEDIUM'
      );

      // Ajout des informations de paiement à côté du QR code
      doc.setFontSize(8); // Réduit de 9 à 8
      doc.setTextColor(0);
      let textY = qrCodeY + 5;
      doc.text('Informations de paiement:', qrCodeX + qrCodeWidth + 10, textY);
      textY += 6; // Réduit l'espacement vertical de 8 à 6
      doc.text(
        `IBAN: ${this.COMPANY_INFO.iban}`,
        qrCodeX + qrCodeWidth + 10,
        textY
      );
      textY += 6; // Réduit l'espacement vertical de 8 à 6
      doc.text(
        `BIC: ${this.COMPANY_INFO.bic}`,
        qrCodeX + qrCodeWidth + 10,
        textY
      );
      textY += 6; // Réduit l'espacement vertical de 8 à 6
      const reference = `facture_${
        invoice.invoice_number
      }_${invoice.client.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      doc.text(
        `Communication: ${reference}`,
        qrCodeX + qrCodeWidth + 10,
        textY
      );

      // Ajout des conditions de paiement en dessous du QR code
      // Calcul de la position pour éviter le chevauchement avec le pied de page
      const pageHeight = doc.internal.pageSize.getHeight();
      const footerStartY = pageHeight - 45; // Position de début du footer
      const conditionsPaiement =
        "Toute somme non payée à son échéance porte intérêt de retard de plein droit et sans mise en demeure préalable au taux de 12 % l'an. En cas de non-paiement à l'échéance, les factures sont majorées de plein droit d'une indemnité forfaitaire de 15 % à titre de dommages et intérêts conventionnels avec un minimum de 150 euros et indépendamment des intérêts de retard.";

      // Positionnement des conditions de paiement
      const conditionsY = qrCodeY + qrCodeHeight + 8; // Réduit l'espace après le QR code

      // Toujours afficher les conditions, mais adapter la taille et la position
      doc.setFontSize(7); // Taille de police réduite
      doc.setFont('helvetica', 'bold');
      doc.text('Conditions de paiement:', qrCodeX, conditionsY);

      doc.setFont('helvetica', 'normal');
      const maxWidth = pageWidth - 2 * this.PAGE_MARGIN;

      // Calculer l'espace disponible entre les conditions et le footer
      const availableHeight = footerStartY - conditionsY - 8;

      // Adapter la taille de police en fonction de l'espace disponible
      if (availableHeight < 30) {
        // Très peu d'espace disponible, utiliser une police très petite
        doc.setFontSize(6);
      } else if (availableHeight < 40) {
        // Espace limité, utiliser une petite police
        doc.setFontSize(6.5);
      }

      // Diviser le texte pour qu'il s'adapte à la largeur disponible
      const splitText = doc.splitTextToSize(conditionsPaiement, maxWidth);

      // Estimer la hauteur du texte
      const textHeight = splitText.length * 3; // Approximation de la hauteur (3 points par ligne)

      // Si le texte risque de dépasser le footer, réduire encore la taille
      if (conditionsY + 6 + textHeight > footerStartY) {
        // Réduire davantage la taille de police
        doc.setFontSize(5.5);
        const splitTextSmaller = doc.splitTextToSize(
          conditionsPaiement,
          maxWidth
        );
        doc.text(splitTextSmaller, qrCodeX, conditionsY + 6);
      } else {
        // Sinon, utiliser la taille déjà définie
        doc.text(splitText, qrCodeX, conditionsY + 6);
      }
    }
  }

  async generateInvoicePDF(invoice: InvoiceEntity): Promise<void> {
    const doc = new jsPDF(this.getOptimizedPdfConfig());
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Configuration initiale du document
    doc.setFontSize(10);
    doc.setFont('helvetica');

    // Définition des marges pour aligner avec le tableau
    const tableWidth = 190; // Largeur standard du tableau
    const contentLeftMargin = (pageWidth - tableWidth) / 2;
    const contentRightMargin = pageWidth - contentLeftMargin;

    // Optimisation de l'ajout du logo avec dimensions carrées
    try {
      const logoUrl = '/assets/images/SONAR.png';
      const logoSize = 40; // Taille carrée pour le logo
      doc.addImage(
        logoUrl,
        'PNG',
        contentLeftMargin,
        this.PAGE_MARGIN,
        logoSize,
        logoSize,
        undefined,
        'MEDIUM'
      );
    } catch (error: any) {
      console.warn(`Impossible de charger le logo: ${error.message}`);
    }

    // Titre Facture et date (ajusté pour le nouveau positionnement du logo)
    doc.setFontSize(28);
    doc.setTextColor(51, 51, 51);
    doc.setFont('helvetica', 'bold');
    const title = invoice.type === 'credit_note' ? 'Note de crédit' : 'Facture';
    doc.text(title, contentRightMargin, 35, { align: 'right' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(
      this.formatDateBelgium(invoice.invoice_date),
      contentRightMargin,
      45,
      { align: 'right' }
    );
    doc.text(
      `N°${new Date().getFullYear()}-${invoice.invoice_number}`,
      contentRightMargin,
      50,
      {
        align: 'right',
      }
    );

    // Informations de l'émetteur (ajustées pour le nouveau positionnement du logo)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(this.COMPANY_INFO.name, contentLeftMargin, 70);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(this.COMPANY_INFO.address, contentLeftMargin, 80);
    doc.text(this.COMPANY_INFO.email, contentLeftMargin, 85);

    // Informations du client (ajustées pour maintenir l'alignement)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.client.name, contentRightMargin, 70, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${invoice.client.street} ${invoice.client.number}`,
      contentRightMargin,
      80,
      { align: 'right' }
    );
    doc.text(
      `${invoice.client.postalCode} ${invoice.client.city}`,
      contentRightMargin,
      85,
      { align: 'right' }
    );
    doc.text(
      `TVA: ${invoice.client.company_vat_number || 'Non assujetti'}`,
      contentRightMargin,
      90,
      { align: 'right' }
    );

    // Titre de la facture (aligné avec le bord gauche du tableau)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const documentTitle =
      invoice.type === 'credit_note'
        ? `Note de crédit n°${invoice.invoice_number}`
        : `Facture n° ${new Date().getFullYear()}-${invoice.invoice_number}`;
    doc.text(documentTitle, contentLeftMargin, 95);

    // Date limite de paiement (alignée avec le bord gauche du tableau)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Date limite de paiement : ${
        invoice.payment_deadline
          ? this.formatDateBelgium(invoice.payment_deadline)
          : 'N/A'
      }`,
      contentLeftMargin,
      105
    );

    const startY = 115;

    // Tableau des produits avec marges alignées
    autoTable(doc, {
      head: [['Description', 'Qté', 'Prix HT', 'Remise', 'Total HT']],
      body: invoice.products.map((product) => [
        product.description,
        product.quantity.toString(),
        `${product.price_htva!.toFixed(2)}€`,
        '0,00€',
        `${(product.price_htva! * product.quantity).toFixed(2)}€`,
      ]),
      startY: startY,
      styles: {
        fontSize: 9,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [200, 192, 77],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: contentLeftMargin, right: contentLeftMargin },
    });

    // Position Y après le tableau
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // Tableau des totaux avec alignement amélioré
    autoTable(doc, {
      body: [
        ['Sous-total', `${invoice.price_htva.toFixed(2)}€`],
        ['TVA 6%', `${invoice.total_vat_6.toFixed(2)}€`],
        ['TVA 21%', `${invoice.total_vat_21.toFixed(2)}€`],
        ['Total', `${invoice.total.toFixed(2)}€`],
        ['Payé', '0,00€'],
        ['Solde', `${invoice.total.toFixed(2)}€`],
      ],
      startY: finalY,
      margin: { left: pageWidth - 90 },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      theme: 'plain',
      columnStyles: {
        0: { cellWidth: 40, halign: 'right' },
        1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      },
      didDrawCell: (data) => {
        // Mettre en surbrillance la dernière ligne (Solde)
        if (data.row.index === 5) {
          doc.setFillColor(0, 0, 0);
          doc.setTextColor(255, 255, 255);
        }
      },
    });

    // Informations bancaires en bas de page
    doc.setFontSize(9);
    doc.setTextColor(51, 51, 51);

    // Colonne 1 - Siège social
    doc.setFont('helvetica', 'bold');
    doc.text('Siège social', 10, pageHeight - 40);
    doc.setFont('helvetica', 'normal');
    doc.text(this.COMPANY_INFO.address, 10, pageHeight - 35);
    doc.text(this.COMPANY_INFO.city, 10, pageHeight - 30);

    // Colonne 2 - Coordonnées
    doc.setFont('helvetica', 'bold');
    doc.text('Coordonnées', 80, pageHeight - 40);
    doc.setFont('helvetica', 'normal');
    doc.text(this.COMPANY_INFO.name, 80, pageHeight - 35);
    doc.text(this.COMPANY_INFO.email, 80, pageHeight - 30);

    // Colonne 3 - Détails bancaires
    doc.setFont('helvetica', 'bold');
    doc.text('Détails bancaires', 150, pageHeight - 40);
    doc.setFont('helvetica', 'normal');
    doc.text(`IBAN: ${this.COMPANY_INFO.iban}`, 150, pageHeight - 35);
    doc.text('BIC: GEBABEBB', 150, pageHeight - 30);

    // Ajouter le QR code seulement pour les factures (pas pour les notes de crédit)
    if (invoice.type !== 'credit_note') {
      await this.addPaymentQRCode(doc, invoice, finalY);
    }

    const prefix = invoice.type === 'credit_note' ? 'note-credit' : 'facture';
    doc.save(`${prefix}_${invoice.invoice_number}.pdf`);
  }

  private calculateTotals(products: any[], type: string) {
    const isCredit = type === 'credit_note';
    return {
      totalHT: products.reduce(
        (sum: number, product: any) =>
          sum +
          (isCredit
            ? product.price_htva < 0
              ? product.price_htva
              : 0
            : product.price_htva),
        0
      ),
      totalVAT6: products
        .filter((product: any) => product.vat === 0.06)
        .reduce(
          (sum: number, product: any) =>
            sum +
            (isCredit
              ? product.tva_amount < 0
                ? product.tva_amount
                : 0
              : product.tva_amount),
          0
        ),
      totalVAT21: products
        .filter((product: any) => product.vat === 0.21)
        .reduce(
          (sum: number, product: any) =>
            sum +
            (isCredit
              ? product.tva_amount < 0
                ? product.tva_amount
                : 0
              : product.tva_amount),
          0
        ),
      totalTTC: products.reduce(
        (sum: number, product: any) =>
          sum +
          (isCredit ? (product.total < 0 ? product.total : 0) : product.total),
        0
      ),
    };
  }

  private addTotals(doc: jsPDF, document: any, finalY: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(10);
    let yPos = finalY + 10;

    const totals = this.calculateTotals(document.products, document.type);

    const totalLines = [
      { label: 'Total HT:', value: Math.abs(totals.totalHT) },
      { label: 'TVA 6%:', value: Math.abs(totals.totalVAT6) },
      { label: 'TVA 21%:', value: Math.abs(totals.totalVAT21) },
    ];

    totalLines.forEach((total) => {
      doc.text(total.label, pageWidth - this.PAGE_MARGIN - 50, yPos, {
        align: 'right',
      });
      doc.text(
        `${total.value.toFixed(2)} €`,
        pageWidth - this.PAGE_MARGIN,
        yPos,
        { align: 'right' }
      );
      yPos += 5;
    });

    // Ajouter un peu d'espace avant le total TTC
    yPos += 2;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total TTC:', pageWidth - this.PAGE_MARGIN - 50, yPos, {
      align: 'right',
    });
    doc.text(
      `${Math.abs(totals.totalTTC).toFixed(2)} €`,
      pageWidth - this.PAGE_MARGIN,
      yPos,
      { align: 'right' }
    );
  }

  private addFooter(
    doc: jsPDF,
    pageHeight: number,
    conditions: string[]
  ): void {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    conditions.forEach((condition, index) => {
      doc.text(condition, this.PAGE_MARGIN, pageHeight - 40 + index * 5);
    });

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      this.COMPANY_INFO.vat,
      doc.internal.pageSize.getWidth() / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
}
