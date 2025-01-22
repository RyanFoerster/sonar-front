import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceEntity } from '../entities/invoice.entity';
import { QuoteEntity } from '../entities/quote.entity';

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
  };

  constructor() {}

  private formatDateBelgium(date: Date): string {
    return new Date(date).toLocaleDateString('fr-BE');
  }

  private addHeader(doc: jsPDF): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoUrl = '/assets/images/SONAR.png';
    const logoWidth = 40;
    const aspectRatio = 1;
    const newLogoHeight = logoWidth / aspectRatio;

    doc.addImage(logoUrl, 'PNG', this.PAGE_MARGIN, 5, logoWidth, newLogoHeight);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      this.COMPANY_INFO.name,
      pageWidth - this.PAGE_MARGIN,
      this.PAGE_MARGIN,
      { align: 'right' }
    );
    doc.text(
      this.COMPANY_INFO.address,
      pageWidth - this.PAGE_MARGIN,
      this.PAGE_MARGIN + 5,
      { align: 'right' }
    );
    doc.text(
      this.COMPANY_INFO.city,
      pageWidth - this.PAGE_MARGIN,
      this.PAGE_MARGIN + 10,
      { align: 'right' }
    );
    doc.text(
      `Email: ${this.COMPANY_INFO.email}`,
      pageWidth - this.PAGE_MARGIN,
      this.PAGE_MARGIN + 20,
      { align: 'right' }
    );

    doc.setDrawColor(200);
    doc.line(
      this.PAGE_MARGIN,
      this.PAGE_MARGIN + 30,
      pageWidth - this.PAGE_MARGIN,
      this.PAGE_MARGIN + 30
    );
  }

  private addClientInfo(doc: jsPDF, client: any): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 75;

    doc.setFontSize(11);
    doc.text('Adressé à:', pageWidth - this.PAGE_MARGIN - 60, 70);
    doc.setFontSize(10);

    const clientName = doc.splitTextToSize(client.name, this.MAX_WIDTH);
    clientName.forEach((line: string) => {
      doc.text(line, pageWidth - this.PAGE_MARGIN - 60, yPosition);
      yPosition += 5;
    });

    doc.text(
      `${client.street} ${client.number}`,
      pageWidth - this.PAGE_MARGIN - 60,
      yPosition
    );
    yPosition += 5;
    doc.text(
      `${client.postalCode} ${client.city}`,
      pageWidth - this.PAGE_MARGIN - 60,
      yPosition
    );
    yPosition += 5;
    doc.text(client.country, pageWidth - this.PAGE_MARGIN - 60, yPosition);
    yPosition += 5;
    doc.text(
      `Tél: ${client.phone}`,
      pageWidth - this.PAGE_MARGIN - 60,
      yPosition
    );
    yPosition += 5;
    doc.text(
      `Email: ${client.email}`,
      pageWidth - this.PAGE_MARGIN - 60,
      yPosition
    );
  }

  private addProductsTable(doc: jsPDF, products: any[]): number {
    const tableStart = 120;
    autoTable(doc, {
      startY: tableStart,
      head: [['Description', 'Quantité', 'Prix unitaire', 'Total HT']],
      body: products.map((product) => [
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

    return (doc as any).lastAutoTable.finalY || tableStart;
  }

  generateQuotePDF(quote: QuoteEntity): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

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

    const finalY = this.addProductsTable(doc, quote.products);

    // Totaux et conditions
    this.addTotals(doc, quote, finalY);
    this.addFooter(doc, pageHeight, [
      `Conditions de paiement : ${quote.payment_deadline} jours à compter de la date de facturation`,
      `Validité du devis : ${this.formatDateBelgium(quote.quote_date)}`,
      'Nous vous remercions de votre confiance',
    ]);

    doc.save(`devis_${new Date().getFullYear()}-${quote.id}.pdf`);
  }

  generateInvoicePDF(invoice: InvoiceEntity): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    this.addHeader(doc);
    this.addClientInfo(doc, invoice.client);

    // Titre et informations de la facture
    let yPosition = 60;
    const title =
      invoice.type === 'credit_note'
        ? 'NOTE DE CRÉDIT N°: NC-'
        : 'FACTURE N°: F-';
    doc.setFontSize(18);
    doc.setTextColor(0);
    doc.text(`${title}${invoice.invoice_number}`, this.PAGE_MARGIN, yPosition);

    doc.setFontSize(10);
    yPosition += 10;
    doc.text(
      `Date: ${this.formatDateBelgium(invoice.invoice_date)}`,
      this.PAGE_MARGIN,
      yPosition
    );
    if (invoice.service_date) {
      yPosition += 7;
      doc.text(
        `Date de service: ${this.formatDateBelgium(invoice.service_date)}`,
        this.PAGE_MARGIN,
        yPosition
      );
    }

    const finalY = this.addProductsTable(doc, invoice.products);

    // Totaux et conditions
    this.addTotals(doc, invoice, finalY);
    this.addFooter(doc, pageHeight, [
      `Conditions de paiement : ${Math.ceil(
        (new Date(invoice.payment_deadline).getTime() -
          new Date(invoice.invoice_date).getTime()) /
          (1000 * 60 * 60 * 24)
      )} jours`,
      `Date d'émission : ${this.formatDateBelgium(invoice.invoice_date)}`,
      'Nous vous remercions de votre confiance',
    ]);

    const prefix = invoice.type === 'credit_note' ? 'note-credit' : 'facture';
    doc.save(`${prefix}_${invoice.invoice_number}.pdf`);
  }

  private addTotals(doc: jsPDF, document: any, finalY: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(10);
    let yPos = finalY + 10;

    const totals = [
      { label: 'Total HT:', value: document.price_htva },
      { label: 'TVA 6%:', value: document.total_vat_6 },
      { label: 'TVA 21%:', value: document.total_vat_21 },
    ];

    totals.forEach((total) => {
      doc.text(total.label, pageWidth - this.PAGE_MARGIN - 50, yPos, {
        align: 'right',
      });
      doc.text(
        `${Math.abs(total.value).toFixed(2)} €`,
        pageWidth - this.PAGE_MARGIN,
        yPos,
        { align: 'right' }
      );
      yPos += 5;
    });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total TTC:', pageWidth - this.PAGE_MARGIN - 50, yPos + 5, {
      align: 'right',
    });
    doc.text(
      `${Math.abs(document.total).toFixed(2)} €`,
      pageWidth - this.PAGE_MARGIN,
      yPos + 5,
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
