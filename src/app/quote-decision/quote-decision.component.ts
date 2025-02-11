import {
  AfterViewInit,
  Component,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QuoteService } from '../shared/services/quote.service';
import { QuoteEntity } from '../shared/entities/quote.entity';
import { take, tap } from 'rxjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthService } from '../shared/services/auth.service';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { CommonModule, DatePipe } from '@angular/common';
import { provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideCheckCircle,
  lucideX,
  lucideXCircle,
  lucideMailQuestion,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-quote-decision',
  standalone: true,
  imports: [HlmButtonDirective, HlmIconComponent, CommonModule, DatePipe],
  providers: [
    provideIcons({
      lucideCheck,
      lucideX,
      lucideXCircle,
      lucideCheckCircle,
      lucideMailQuestion,
    }),
  ],
  templateUrl: './quote-decision.component.html',
  styleUrl: './quote-decision.component.css',
})
export class QuoteDecisionComponent implements AfterViewInit {
  private quoteService = inject(QuoteService);
  private authService = inject(AuthService);
  private _injector = inject(Injector);

  quoteId: string | null = null;
  quoteStatus: 'pending' | 'accepted' | 'refused' = 'pending';
  quoteFromDB: QuoteEntity | null = null;
  role: string | null = null;
  connectedUser = signal(this.authService.getUser());

  constructor(private route: ActivatedRoute) {
    // Récupérer les paramètres de requête (query parameters)
    this.route.queryParamMap.subscribe((params) => {
      this.quoteId = params.get('quote_id');
      this.role = params.get('role');
    });
  }

  ngAfterViewInit() {
    if (!this.quoteId) return;

    this.quoteService
      .getQuote(this.quoteId)
      .pipe(
        take(1),
        tap((data) => {
          this.quoteFromDB = data;
          console.log('quoteFromDB', this.quoteFromDB);
          this.updateQuoteStatus();
          return data;
        }),
        tap((data) => {
          this.generateQuotePDF(data);
        })
      )
      .subscribe();
  }

  private updateQuoteStatus() {
    if (!this.quoteFromDB) return;

    if (this.quoteFromDB.status === 'refused') {
      this.quoteStatus = 'refused';
      return;
    }

    if (this.quoteFromDB.status === 'accepted') {
      this.quoteStatus = 'accepted';
      return;
    }

    if (
      this.role === 'GROUP' &&
      this.quoteFromDB.group_acceptance === 'accepted'
    ) {
      this.quoteStatus = 'accepted';
      return;
    }

    if (
      this.role === 'CLIENT' &&
      this.quoteFromDB.order_giver_acceptance === 'accepted'
    ) {
      this.quoteStatus = 'accepted';
      return;
    }

    if (
      this.role === 'GROUP' &&
      this.quoteFromDB.group_acceptance === 'refused'
    ) {
      this.quoteStatus = 'refused';
      return;
    }

    if (
      this.role === 'CLIENT' &&
      this.quoteFromDB.order_giver_acceptance === 'refused'
    ) {
      this.quoteStatus = 'refused';
      return;
    }
  }

  canAccess(): boolean {
    if (!this.quoteFromDB || !this.role) return false;

    // Vérifier si l'utilisateur est admin
    if (this.connectedUser()?.role === 'ADMIN') return true;

    // Vérifier si l'utilisateur fait partie du groupe et que c'est une décision de groupe
    // if (
    //   this.role === 'GROUP' &&
    //   this.connectedUser()?.groupId === this.quoteFromDB.
    // ) {
    //   return true;
    // }

    // Vérifier si l'utilisateur est le client et que c'est une décision client
    // if (
    //   this.role === 'CLIENT' &&
    //   this.connectedUser()?.id === this.quoteFromDB.client.id
    // ) {
    //   return true;
    // }

    return true;
  }

  canTakeAction(): boolean {
    if (
      !this.canAccess() ||
      !this.quoteFromDB ||
      this.quoteStatus !== 'pending'
    )
      return false;

    // Vérifier si le devis est déjà accepté ou refusé par le rôle actuel
    if (
      this.role === 'GROUP' &&
      this.quoteFromDB.group_acceptance !== 'pending'
    )
      return false;
    if (
      this.role === 'CLIENT' &&
      this.quoteFromDB.order_giver_acceptance !== 'pending'
    )
      return false;

    return true;
  }

  acceptQuote() {
    if (!this.canTakeAction() || !this.quoteId) return;

    const action$ =
      this.role === 'GROUP'
        ? this.quoteService.acceptQuoteFromGroup(this.quoteId)
        : this.quoteService.acceptQuoteFromClient(this.quoteId);

    action$
      .pipe(
        take(1),
        tap(() => {
          this.quoteStatus = 'accepted';
          if (this.quoteFromDB && this.role === 'GROUP') {
            this.quoteFromDB.group_acceptance = 'accepted';
          } else if (this.quoteFromDB && this.role === 'CLIENT') {
            this.quoteFromDB.order_giver_acceptance = 'accepted';
          }
        })
      )
      .subscribe();
  }

  rejectQuote() {
    if (!this.canTakeAction() || !this.quoteId) return;

    const action$ =
      this.role === 'GROUP'
        ? this.quoteService.rejectQuoteFromGroup(this.quoteId)
        : this.quoteService.rejectQuoteFromClient(this.quoteId);

    action$
      .pipe(
        take(1),
        tap(() => {
          this.quoteStatus = 'refused';
          if (this.quoteFromDB && this.role === 'GROUP') {
            this.quoteFromDB.group_acceptance = 'refused';
          } else if (this.quoteFromDB && this.role === 'CLIENT') {
            this.quoteFromDB.order_giver_acceptance = 'refused';
          }
        })
      )
      .subscribe();
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
      doc.text(`Créé par: ${quote.created_by}`, 10, 40);
      doc.text(`Email: ${quote.created_by_mail}`, 10, 50);
      doc.text(`Téléphone: ${quote.created_by_phone}`, 10, 60);

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

      // Générer l'URL Blob pour le PDF et afficher dans un <iframe> ou <embed>
      const pdfBlobUrl = doc.output('bloburl');

      // Ajouter la prévisualisation dans un élément <iframe> sur la page
      const iframe = document.getElementById('pdfPreview') as HTMLIFrameElement;
      iframe.src = pdfBlobUrl.toString();
    };
  }
}
