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
    iban: ' BE56 1030 5642 6988', // À remplacer par l'IBAN réel
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
      didDrawPage: () => {
        this.addFooter(doc, doc.internal.pageSize.getHeight(), []);
      },
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

    // Tableau des totaux avec alignement amélioré
    autoTable(doc, {
      body: [
        ['Sous-total', `${quote.price_htva?.toFixed(2) || '0.00'}€`],
        ['TVA 6%', `${quote.total_vat_6.toFixed(2)}€`],
        ['TVA 21%', `${quote.total_vat_21.toFixed(2)}€`],
        ['Total', `${quote.total.toFixed(2)}€`],
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
    });

    // Réinitialiser les couleurs après le tableau des totaux
    doc.setTextColor(0, 0, 0);

    // Ajout des commentaires si présents - position remontée juste après le tableau des totaux
    if (quote.comment) {
      // Position idéale des commentaires - directement après le tableau des totaux
      const commentY =
        (doc as any).previousAutoTable?.finalY + 15 || finalY + 10;

      // Définition de la position du footer (fixe)
      const footerStartY = pageHeight - 45; // Position absolue du footer

      // Vérifier l'espace disponible sur la page actuelle
      const availableSpace = footerStartY - commentY - 10;

      // Calculer la hauteur approximative du texte
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const maxWidth = pageWidth - 2 * this.PAGE_MARGIN;
      const commentLines = doc.splitTextToSize(quote.comment, maxWidth);
      const lineHeight = 4;
      const commentHeight = commentLines.length * lineHeight + 15; // +15 pour le titre et l'espacement

      // Si pas assez d'espace, créer une nouvelle page
      if (commentHeight > availableSpace) {
        doc.addPage();

        // Titre des commentaires en haut de la nouvelle page
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Commentaires:', this.PAGE_MARGIN, this.PAGE_MARGIN + 10);
        doc.setFont('helvetica', 'normal');

        // Ajouter les lignes de commentaire
        doc.setFontSize(9);

        // Gérer la pagination des commentaires si nécessaire
        let currentY = this.PAGE_MARGIN + 20;

        for (const line of commentLines) {
          // Vérifier si on va dépasser la limite de la page
          if (currentY > footerStartY - 10) {
            // Passer à une nouvelle page
            doc.addPage();
            currentY = this.PAGE_MARGIN + 10;
          }

          // Écrire la ligne de commentaire
          doc.text(line, this.PAGE_MARGIN, currentY);
          currentY += lineHeight;
        }
      } else {
        // Si assez d'espace, ajouter les commentaires sur la page actuelle
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Commentaires:', this.PAGE_MARGIN, commentY);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        commentLines.forEach((line: string, index: number) => {
          doc.text(line, this.PAGE_MARGIN, commentY + 10 + index * lineHeight);
        });
      }
    }

    // Ajouter le footer sur la dernière page
    this.addFooter(doc, pageHeight, []);

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
  ): Promise<number> {
    const qrCodeDataUrl = await this.generatePaymentQRCode(invoice);
    let finalY = yPosition; // Initialiser avec la position de départ

    if (qrCodeDataUrl) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const footerStartY = pageHeight - 45; // Position de début du footer

      // Réduction de la taille du QR code
      const qrCodeWidth = 30;
      const qrCodeHeight = 30;
      const qrCodeX = this.PAGE_MARGIN;
      const qrCodeY = yPosition;

      // Calculer la hauteur totale nécessaire pour le QR code + infos + conditions
      const totalQrHeight = 80; // Estimation réaliste: QR(30) + Espace(5) + Info(20) + Espace(5) + TitreCond(5) + Cond(15)

      // Vérifier si on a assez d'espace sur la page actuelle
      if (qrCodeY + totalQrHeight > footerStartY) {
        // Pas assez d'espace, créer une nouvelle page
        doc.addPage();
        // Appel récursif et retourner sa position Y finale
        return this.addPaymentQRCode(doc, invoice, this.PAGE_MARGIN);
      }

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

      // Ajout des informations de paiement à côté du QR code (plus compact)
      doc.setFontSize(8);
      doc.setTextColor(0);
      let textY = qrCodeY + 5;
      doc.text('Informations de paiement:', qrCodeX + qrCodeWidth + 10, textY);
      textY += 5;
      doc.text(
        `IBAN: ${this.COMPANY_INFO.iban}`,
        qrCodeX + qrCodeWidth + 10,
        textY
      );
      textY += 5;
      doc.text(
        `BIC: ${this.COMPANY_INFO.bic}`,
        qrCodeX + qrCodeWidth + 10,
        textY
      );
      textY += 5;
      const reference = `facture_N°${new Date().getFullYear()}/000${
        invoice.invoice_number
      }`;
      doc.text(
        `Communication: ${reference}`,
        qrCodeX + qrCodeWidth + 10,
        textY
      );

      // Ajout des conditions de paiement en dessous du QR code
      const conditionsPaiement =
        "Toute somme non payée à son échéance porte intérêt de retard de plein droit et sans mise en demeure préalable au taux de 12 % l'an. En cas de non-paiement à l'échéance, les factures sont majorées de plein droit d'une indemnité forfaitaire de 15 % à titre de dommages et intérêts conventionnels avec un minimum de 150 euros et indépendamment des intérêts de retard.";

      // Positionnement des conditions de paiement - plus compact
      const conditionsY = qrCodeY + qrCodeHeight + 5;

      // Adapter la taille de police pour les conditions
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.text('Conditions de paiement:', qrCodeX, conditionsY);

      doc.setFont('helvetica', 'normal');
      const maxWidth = pageWidth - 2 * this.PAGE_MARGIN;

      // Diviser le texte pour qu'il s'adapte à la largeur disponible
      let splitText = doc.splitTextToSize(conditionsPaiement, maxWidth);

      // Calculer si le texte va dépasser le footer
      let textHeight = splitText.length * 3;

      if (conditionsY + 5 + textHeight > footerStartY) {
        // Si les conditions risquent de déborder, les afficher en taille plus petite
        doc.setFontSize(6);
        splitText = doc.splitTextToSize(conditionsPaiement, maxWidth);
        textHeight = splitText.length * 2.5; // Ajuster la hauteur pour la police plus petite
        doc.text(splitText, qrCodeX, conditionsY + 5);
      } else {
        doc.text(splitText, qrCodeX, conditionsY + 5);
      }

      // Calculer la position Y finale après les conditions
      finalY = conditionsY + 5 + textHeight;
    } else {
      // S'il n'y a pas de QR code généré, retourner la position initiale
      finalY = yPosition;
    }

    return finalY; // Retourner la position Y la plus basse atteinte
  }

  async generateInvoicePDF(invoice: InvoiceEntity): Promise<void> {
    console.log('Invoice in pdf:', invoice);
    const doc = new jsPDF(this.getOptimizedPdfConfig());
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerStartY = pageHeight - 45; // Position fixe du début du footer

    // Configuration initiale du document
    doc.setFontSize(10);
    doc.setFont('helvetica');

    // Marges de contenu pour un alignement cohérent
    const contentLeftMargin = this.PAGE_MARGIN; // Utiliser la marge standard
    const contentRightMargin = pageWidth - this.PAGE_MARGIN; // Utiliser la marge standard

    // Ajout du logo
    try {
      const logoUrl = '/assets/images/SONAR.png';
      const logoSize = 40;
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

    // Titre (Facture/Note de crédit) et Numéro/Date
    let currentY = this.PAGE_MARGIN + 10; // Démarrer un peu plus bas
    doc.setFontSize(28);
    doc.setTextColor(51, 51, 51);
    doc.setFont('helvetica', 'bold');
    const title = invoice.type === 'credit_note' ? 'Note de crédit' : 'Facture';
    doc.text(title, contentRightMargin, currentY, { align: 'right' });
    currentY += 10; // Espacement
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(
      this.formatDateBelgium(invoice.invoice_date),
      contentRightMargin,
      currentY,
      { align: 'right' }
    );
    currentY += 5;
    doc.text(
      `N°${new Date().getFullYear()}/000${invoice.invoice_number}`,
      contentRightMargin,
      currentY,
      {
        align: 'right',
      }
    );

    // Espacement avant les informations
    currentY = Math.max(currentY, this.PAGE_MARGIN + 40) + 15; // S'assurer d'être sous le logo + espace

    // Informations de l'émetteur
    const companyInfoStartY = currentY;
    doc.setFontSize(10); // Taille réduite pour plus de clarté
    doc.setFont('helvetica', 'bold');
    doc.text(this.COMPANY_INFO.name, contentLeftMargin, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(this.COMPANY_INFO.address, contentLeftMargin, currentY);
    currentY += 5;
    doc.text(this.COMPANY_INFO.city, contentLeftMargin, currentY);
    currentY += 5;
    doc.text(this.COMPANY_INFO.vat, contentLeftMargin, currentY);
    currentY += 5;
    doc.text(`Email: ${this.COMPANY_INFO.email}`, contentLeftMargin, currentY);
    const companyInfoEndY = currentY;

    // Informations du client (aligné à droite)
    currentY = companyInfoStartY; // Réinitialiser pour aligner verticalement
    const clientInfoX = contentRightMargin;
    doc.setFontSize(10); // Taille réduite
    doc.setFont('helvetica', 'bold');
    const clientNameLines = doc.splitTextToSize(
      invoice.client.name,
      this.MAX_WIDTH
    );
    clientNameLines.forEach((line: string) => {
      doc.text(line, clientInfoX, currentY, { align: 'right' });
      currentY += 5;
    });
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${invoice.client.street} ${invoice.client.number}`,
      clientInfoX,
      currentY,
      { align: 'right' }
    );
    currentY += 5;
    doc.text(
      `${invoice.client.postalCode} ${invoice.client.city}`,
      clientInfoX,
      currentY,
      { align: 'right' }
    );
    currentY += 5;
    doc.text(
      invoice.client.country, // Ajout du pays
      clientInfoX,
      currentY,
      { align: 'right' }
    );
    currentY += 5;
    doc.text(
      `TVA: ${invoice.client.company_vat_number || 'Non assujetti'}`,
      clientInfoX,
      currentY,
      { align: 'right' }
    );
    const clientInfoEndY = currentY;

    // Positionner le titre du document sous le bloc le plus bas (émetteur ou client)
    currentY = Math.max(companyInfoEndY, clientInfoEndY) + 15; // Espace après les infos

    // Titre de la facture
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const documentTitle =
      invoice.type === 'credit_note'
        ? `Note de crédit n°${new Date().getFullYear()}/000${
            invoice.invoice_number
          }`
        : `Facture n° ${new Date().getFullYear()}/000${invoice.invoice_number}`;
    doc.text(documentTitle, contentLeftMargin, currentY);
    currentY += 10; // Espace après le titre

    // Date limite de paiement
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Date limite de paiement : ${
        invoice.payment_deadline
          ? this.formatDateBelgium(invoice.payment_deadline)
          : 'N/A'
      }`,
      contentLeftMargin,
      currentY
    );
    currentY += 15; // Plus d'espace avant le tableau

    const productTableStartY = currentY;

    // Tableau des produits
    autoTable(doc, {
      head: [['Description', 'Qté', 'Prix HT', 'Remise', 'Total HT']],
      body: invoice.products.map((product) => [
        product.description,
        product.quantity.toString(),
        `${product.price_htva!.toFixed(2)}€`,
        '0,00€', // Remise fixe, à adapter si nécessaire
        `${(product.price_htva! * product.quantity).toFixed(2)}€`,
      ]),
      startY: productTableStartY,
      styles: {
        fontSize: 9,
        cellPadding: 4, // Padding réduit
      },
      headStyles: {
        fillColor: [200, 192, 77], // Jaune Sonar
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center', // Centrer les en-têtes par défaut
      },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' }, // Description alignée à gauche
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
      willDrawCell: function (data) {
        // Appliquer l'alignement spécifique pour l'en-tête de la description
        if (data.row.section === 'head' && data.column.index === 0) {
          data.cell.styles.halign = 'left';
        }
      },
      margin: { left: contentLeftMargin, right: contentLeftMargin },
      didDrawPage: () => {
        this.addFooter(doc, pageHeight, []);
      },
    });

    // Position Y juste après le tableau des produits
    const productsTableFinalY = (doc as any).lastAutoTable.finalY;

    // --- Gestion Tableau des Totaux ---
    // Positionner les totaux juste en dessous du tableau produits
    currentY = productsTableFinalY + 5; // Petit espace après tableau produits

    // Calculer la hauteur *réelle* du tableau des totaux (approximatif)
    const totalsRowCount = 4; // Sous-total, TVA 6%, TVA 21%, Total
    const totalsRowHeight = 7; // Basé sur fontSize 9 + padding 2
    const totalsTableHeight = totalsRowCount * totalsRowHeight;

    // Vérifier si les totaux tiennent sur la page actuelle
    if (currentY + totalsTableHeight > footerStartY) {
      doc.addPage();
      currentY = this.PAGE_MARGIN;
      // Le didDrawPage du tableau précédent a déjà ajouté le footer
    }

    // Dessiner le tableau des totaux
    autoTable(doc, {
      body: [
        ['Sous-total', `${invoice.price_htva.toFixed(2)}€`],
        ['TVA 6%', `${invoice.total_vat_6.toFixed(2)}€`],
        ['TVA 21%', `${invoice.total_vat_21.toFixed(2)}€`],
        ['Total', `${invoice.total.toFixed(2)}€`],
      ],
      startY: currentY,
      // Aligner le tableau des totaux à droite de la page
      margin: { left: contentRightMargin - 80 }, // Aligner la fin avec la marge droite (largeur table = 80)
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      theme: 'plain',
      columnStyles: {
        0: { cellWidth: 40, halign: 'right' }, // Libellé à droite
        1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }, // Montant à droite
      },
    });

    // Mettre à jour currentY après le tableau des totaux
    currentY = (doc as any).lastAutoTable.finalY + 5; // Espace réduit après totaux

    // Réinitialiser les styles
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    // --- Gestion QR Code (AVANT commentaires) ---
    let finalYAfterQRCode = currentY;
    if (invoice.type !== 'credit_note') {
      finalYAfterQRCode = await this.addPaymentQRCode(doc, invoice, currentY);
      // Ajouter un petit espace après le bloc QR/Conditions
      currentY = finalYAfterQRCode + 5; // Espace encore réduit
    }

    // --- Gestion Commentaires (APRES QR Code) ---
    // Utiliser la position Y après le QR code (ou après les totaux si pas de QR)

    // Calculer l'espace nécessaire pour les commentaires
    let spaceNeededForComments = 0;
    let commentLines: string[] = [];
    const commentTitleHeight = 10; // Hauteur titre + petit espacement
    const commentLineHeight = 4;
    const commentMaxWidth = pageWidth - 2 * contentLeftMargin;

    if (invoice.comment) {
      doc.setFontSize(9); // Taille pour le calcul
      commentLines = doc.splitTextToSize(invoice.comment, commentMaxWidth);
      spaceNeededForComments =
        commentLines.length * commentLineHeight + commentTitleHeight;
    }

    // Ajouter les commentaires (avec gestion de page si nécessaire)
    if (invoice.comment && commentLines.length > 0) {
      // Faut-il une nouvelle page AVANT les commentaires (basé sur l'espace RESTANT) ?
      if (currentY + spaceNeededForComments > footerStartY) {
        doc.addPage();
        currentY = this.PAGE_MARGIN; // Réinitialiser en haut de la nouvelle page
        // Le didDrawPage du tableau précédent (totaux) a déjà ajouté le footer
      }

      // Dessiner les commentaires
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Commentaires:', contentLeftMargin, currentY);
      currentY += 5; // Espace après titre

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      commentLines.forEach((line: string) => {
        // Vérifier si on dépasse PENDANT l'écriture des lignes (long commentaire)
        if (currentY + commentLineHeight > footerStartY) {
          doc.addPage();
          currentY = this.PAGE_MARGIN;
          // Le didDrawPage du tableau précédent OU le addFooter de la page d'avant
          // (si commentaires longs) devrait avoir géré le footer.
          // Redessiner le titre sur la nouvelle page
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('Commentaires:', contentLeftMargin, currentY);
          currentY += 5;
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
        }
        doc.text(line, contentLeftMargin, currentY);
        currentY += commentLineHeight;
      });
    }

    // Ajouter le footer sur la DERNIÈRE page explicitement
    // (didDrawPage ne s'exécute pas s'il n'y a pas de tableau sur la dernière page,
    // ou si le dernier élément n'est pas un tableau)
    this.addFooter(doc, pageHeight, []);

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
    const footerY = pageHeight - 30;

    // Ajouter les conditions si présentes
    if (conditions.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      conditions.forEach((condition, index) => {
        doc.text(condition, this.PAGE_MARGIN, pageHeight - 40 + index * 5);
      });
    }

    // Colonne 1 - Siège social
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Siège social', this.PAGE_MARGIN, footerY);
    doc.setFont('helvetica', 'normal');
    doc.text(this.COMPANY_INFO.address, this.PAGE_MARGIN, footerY + 5);
    doc.text(
      this.COMPANY_INFO.city.split(',')[0],
      this.PAGE_MARGIN,
      footerY + 10
    );
    doc.text('Belgique', this.PAGE_MARGIN, footerY + 15);
    doc.text(
      this.COMPANY_INFO.vat.replace('TVA ', ''),
      this.PAGE_MARGIN,
      footerY + 20
    );

    // Colonne 2 - Coordonnées
    const col2X = doc.internal.pageSize.getWidth() / 3;
    doc.setFont('helvetica', 'bold');
    doc.text('Coordonnées', col2X, footerY);
    doc.setFont('helvetica', 'normal');
    doc.text(this.COMPANY_INFO.name, col2X, footerY + 5);
    doc.text(this.COMPANY_INFO.email, col2X, footerY + 10);

    // Colonne 3 - Détails bancaires
    const col3X = (doc.internal.pageSize.getWidth() / 3) * 2;
    doc.setFont('helvetica', 'bold');
    doc.text('Détails bancaires', col3X, footerY);
    doc.setFont('helvetica', 'normal');
    doc.text(`IBAN: ${this.COMPANY_INFO.iban}`, col3X, footerY + 5);
    doc.text(`BIC: ${this.COMPANY_INFO.bic}`, col3X, footerY + 10);
  }
}
