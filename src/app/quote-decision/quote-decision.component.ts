import {AfterViewInit, Component, inject, Injector, signal, WritableSignal} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {QuoteService} from "../shared/services/quote.service";
import {QuoteEntity} from "../shared/entities/quote.entity";
import {takeUntilDestroyed, toSignal} from "@angular/core/rxjs-interop";
import {switchMap, take, tap} from "rxjs";
import {jsPDF} from "jspdf";
import autoTable from "jspdf-autotable";
import {AuthService} from "../shared/services/auth.service";
import {HlmButtonDirective} from "@spartan-ng/ui-button-helm";

@Component({
  selector: 'app-quote-decision',
  standalone: true,
  imports: [
    HlmButtonDirective
  ],
  templateUrl: './quote-decision.component.html',
  styleUrl: './quote-decision.component.css'
})
export class QuoteDecisionComponent implements AfterViewInit {

  private quoteService = inject(QuoteService);
  private authService = inject(AuthService);
  private _injector = inject(Injector);

  quoteId: string | null = null;
  quoteStatus: string | null = "pending";
  quoteFromDB: QuoteEntity | null = null;
  role: string | null = null;
  connectedUser = signal(this.authService.getUser());

  constructor(private route: ActivatedRoute) {
    // Récupérer les paramètres de requête (query parameters)
    this.route.queryParamMap.subscribe(async params => {
      this.quoteId = params.get('quote_id');
      this.role = params.get('role');

      // Assurer que quoteId existe avant de faire l'appel au service

    });


  }

  ngAfterViewInit() {
    this.quoteService.getQuote(this.quoteId).pipe(
      take(1),
      tap(data => {
        this.quoteFromDB = data
        if (this.quoteFromDB?.status === 'rejected') {
          this.quoteStatus = 'rejected';
        }

        if (this.quoteFromDB?.status === 'accepted') {
          this.quoteStatus = 'accepted';
        }

        if (this.role === 'GROUP' && this.quoteFromDB?.group_acceptance === 'accepted') {
          this.quoteStatus = 'accepted';
        }

        if (this.role === 'CLIENT' && this.quoteFromDB?.order_giver_acceptance === 'accepted') {
          this.quoteStatus = 'accepted';
        }
        return data
      }),
      tap(data => {
        this.generateQuotePDF(data); // Générer le PDF avec les données reçues
      })
    ).subscribe();


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

      // Générer l'URL Blob pour le PDF et afficher dans un <iframe> ou <embed>
      const pdfBlobUrl = doc.output('bloburl');

      // Ajouter la prévisualisation dans un élément <iframe> sur la page
      const iframe = document.getElementById('pdfPreview') as HTMLIFrameElement;
      iframe.src = pdfBlobUrl.toString();
    };
  }

  acceptQuote() {
    if (this.role === 'GROUP') {
      this.quoteService.acceptQuoteFromGroup(this.quoteId).pipe(
        take(1),
        tap(() => {
          this.quoteStatus = 'accepted';
        })
      ).subscribe();
    } else if (this.role === 'CLIENT') {
      this.quoteService.acceptQuoteFromClient(this.quoteId).pipe(
        take(1),
        tap(() => {
          this.quoteStatus = 'accepted';
        })
      ).subscribe();
    }
  }

  rejectQuote() {
    if (this.role === 'GROUP') {
      this.quoteService.rejectQuoteFromGroup(this.quoteId).pipe(
        take(1),
        tap(() => {
          this.quoteStatus = 'rejected';
        })
      ).subscribe();
    } else if (this.role === 'CLIENT') {
      this.quoteService.rejectQuoteFromClient(this.quoteId).pipe(
        take(1),
        tap(() => {
          this.quoteStatus = 'rejected';
        })
      ).subscribe();
    }
  }


}
