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
import { take, tap, finalize } from 'rxjs';
import { AuthService } from '../shared/services/auth.service';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { CommonModule, DatePipe } from '@angular/common';
import { provideIcons } from '@ng-icons/core';
import { FormsModule } from '@angular/forms';
import {
  lucideCheck,
  lucideCheckCircle,
  lucideX,
  lucideXCircle,
  lucideMailQuestion,
  lucideFileText,
  lucideDownload,
  lucideUndo2,
} from '@ng-icons/lucide';
import { lastValueFrom } from 'rxjs';
import { PdfGeneratorService } from '../shared/services/pdf-generator.service';

@Component({
  selector: 'app-quote-decision',
  standalone: true,
  imports: [
    HlmButtonDirective,
    HlmIconComponent,
    CommonModule,
    DatePipe,
    FormsModule,
  ],
  providers: [
    provideIcons({
      lucideCheck,
      lucideX,
      lucideXCircle,
      lucideCheckCircle,
      lucideMailQuestion,
      lucideFileText,
      lucideDownload,
      lucideUndo2,
    }),
  ],
  templateUrl: './quote-decision.component.html',
  styleUrl: './quote-decision.component.css',
})
export class QuoteDecisionComponent implements AfterViewInit {
  private quoteService = inject(QuoteService);
  private authService = inject(AuthService);
  private pdfGenerator = inject(PdfGeneratorService);
  private _injector = inject(Injector);

  quoteId: string | null = null;
  quoteStatus: 'pending' | 'accepted' | 'refused' = 'pending';
  quoteFromDB: QuoteEntity | null = null;
  role: string | null = null;
  connectedUser = signal(this.authService.getUser());
  termsAccepted = false;
  attachmentsAccepted = false;
  isLoadingPdf = false;
  isAccepting = false;
  isRejecting = false;
  isCancelingRejection = false;

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
          this.updateQuoteStatus();

          // Initialiser attachmentsAccepted à true s'il n'y a pas de pièces jointes
          if (!data.attachment_url || data.attachment_url.length === 0) {
            this.attachmentsAccepted = true;
          }

          return data;
        }),
        tap((data) => {
          setTimeout(() => {
            this.generateQuotePDF(data);
          }, 100);
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

    // Vérifier si l'autre partie a déjà refusé le devis
    if (
      this.role === 'GROUP' &&
      this.quoteFromDB.order_giver_acceptance === 'refused'
    )
      return false;
    if (
      this.role === 'CLIENT' &&
      this.quoteFromDB.group_acceptance === 'refused'
    )
      return false;

    return true;
  }

  acceptQuote() {
    if (!this.canTakeAction() || !this.quoteId) return;

    this.isAccepting = true;

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
        }),
        finalize(() => {
          this.isAccepting = false;
        })
      )
      .subscribe();
  }

  rejectQuote() {
    if (!this.canTakeAction() || !this.quoteId) return;

    this.isRejecting = true;

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
        }),
        finalize(() => {
          this.isRejecting = false;
        })
      )
      .subscribe();
  }

  cancelRejection() {
    if (!this.quoteId || !this.quoteFromDB) return;

    // Vérifier que le devis est bien refusé par le rôle actuel
    if (
      (this.role === 'GROUP' &&
        this.quoteFromDB.group_acceptance !== 'refused') ||
      (this.role === 'CLIENT' &&
        this.quoteFromDB.order_giver_acceptance !== 'refused')
    ) {
      return;
    }

    this.isCancelingRejection = true;

    const action$ =
      this.role === 'GROUP'
        ? this.quoteService.cancelRejectionFromGroup(this.quoteId)
        : this.quoteService.cancelRejectionFromClient(this.quoteId);

    action$
      .pipe(
        take(1),
        tap(() => {
          this.quoteStatus = 'pending';
          if (this.quoteFromDB && this.role === 'GROUP') {
            this.quoteFromDB.group_acceptance = 'pending';
          } else if (this.quoteFromDB && this.role === 'CLIENT') {
            this.quoteFromDB.order_giver_acceptance = 'pending';
          }
        }),
        finalize(() => {
          this.isCancelingRejection = false;
        })
      )
      .subscribe();
  }

  generateQuotePDF(quote: QuoteEntity) {
    if (!quote) {
      console.error('Pas de devis fourni pour la génération du PDF');
      return;
    }

    this.isLoadingPdf = true;

    try {
      const doc = this.pdfGenerator.previewQuotePDF(quote);

      // Rechercher l'iframe avec un maximum de 5 tentatives
      let attempts = 0;
      const maxAttempts = 5;
      const findAndUpdateIframe = () => {
        const iframe = document.getElementById(
          'pdfPreview'
        ) as HTMLIFrameElement;

        if (iframe) {
          try {
            const blob = doc.output('blob');
            const blobUrl = URL.createObjectURL(blob);
            iframe.src = blobUrl;
            this.isLoadingPdf = false;
          } catch (error) {
            console.error('Erreur lors de la création du blob:', error);
            this.isLoadingPdf = false;
          }
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(findAndUpdateIframe, 100);
        } else {
          console.error(
            "L'élément iframe 'pdfPreview' n'a pas été trouvé après plusieurs tentatives"
          );
          this.isLoadingPdf = false;
        }
      };

      findAndUpdateIframe();
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      this.isLoadingPdf = false;
    }
  }

  getAttachments(): { url: string; name: string }[] {
    if (!this.quoteFromDB) return [];

    const attachments: { url: string; name: string }[] = [];

    if (
      this.quoteFromDB.attachment_url &&
      this.quoteFromDB.attachment_url.length > 0
    ) {
      this.quoteFromDB.attachment_url.forEach((url) => {
        attachments.push({
          url: url,
          name: this.getAttachmentFileName(url),
        });
      });
    }

    return attachments;
  }

  getAttachmentFileName(url: string): string {
    try {
      const decodedUrl = decodeURIComponent(url);
      const urlParts = decodedUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      // Supprimer les paramètres d'URL potentiels
      return fileName.split('?')[0];
    } catch {
      return 'Pièce jointe';
    }
  }

  getS3KeyFromUrl(url: string): string {
    try {
      // L'URL est de la forme: https://sonar-artists-files.s3.eu-central-1.amazonaws.com/KEY
      const decodedUrl = decodeURIComponent(url);
      const match = decodedUrl.match(/amazonaws\.com\/(.*?)(\?|$)/);
      return match ? match[1] : '';
    } catch {
      return '';
    }
  }

  async downloadAttachment(url: string) {
    if (!url) {
      console.error("URL d'attachement manquante");
      return;
    }

    const s3Key = this.getS3KeyFromUrl(url);
    if (!s3Key) {
      console.error("Impossible d'extraire la clé S3 de l'URL");
      return;
    }

    try {
      const response = await lastValueFrom(
        this.quoteService.downloadAttachment(s3Key)
      );

      if (!response) {
        console.error('Réponse vide du serveur');
        return;
      }

      const fileName = this.getAttachmentFileName(url);

      // Créer un lien temporaire pour le téléchargement
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(response);
      link.download = fileName;

      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Nettoyer
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  }

  isRefusedByOtherParty(): boolean {
    if (!this.quoteFromDB || !this.role) return false;

    if (
      this.role === 'GROUP' &&
      this.quoteFromDB.order_giver_acceptance === 'refused'
    ) {
      return true;
    }

    if (
      this.role === 'CLIENT' &&
      this.quoteFromDB.group_acceptance === 'refused'
    ) {
      return true;
    }

    return false;
  }
}
