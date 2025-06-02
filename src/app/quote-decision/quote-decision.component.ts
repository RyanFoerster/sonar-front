import {
  AfterViewInit,
  Component,
  inject,
  Injector,
  signal,
  OnInit,
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
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import {
  lucideCheck,
  lucideCheckCircle,
  lucideX,
  lucideXCircle,
  lucideMailQuestion,
  lucideFileText,
  lucideDownload,
  lucideUndo2,
  lucideLoader,
  lucideAlertCircle,
} from '@ng-icons/lucide';
import { lastValueFrom } from 'rxjs';
import { PdfGeneratorService } from '../shared/services/pdf-generator.service';
import { FormGroup } from '@angular/forms';
import { ClientService } from '../shared/services/client.service';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { HlmCheckboxComponent } from '@spartan-ng/ui-checkbox-helm';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';
import { toast } from 'ngx-sonner';
import { HttpErrorResponse } from '@angular/common/http';
import { ClientEntity } from '../shared/entities/client.entity';

@Component({
  selector: 'app-quote-decision',
  standalone: true,
  imports: [
    HlmButtonDirective,
    HlmIconComponent,
    CommonModule,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    HlmInputDirective,
    HlmLabelDirective,
    HlmCheckboxComponent,
    BrnSelectImports,
    HlmSelectImports,
    HlmToasterComponent,
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
      lucideLoader,
      lucideAlertCircle,
    }),
  ],
  templateUrl: './quote-decision.component.html',
  styleUrl: './quote-decision.component.css',
})
export class QuoteDecisionComponent implements AfterViewInit, OnInit {
  private quoteService = inject(QuoteService);
  private authService = inject(AuthService);
  private pdfGenerator = inject(PdfGeneratorService);
  private _injector = inject(Injector);
  private formBuilder = inject(FormBuilder);
  private clientService = inject(ClientService);

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
  isClientInfoRequired = signal(false);
  isSubmittingClientInfo = signal(false);
  clientInfoForm!: FormGroup;
  isPhysicalPerson = signal(false);
  paysEuropeens: string[] = [
    'Allemagne',
    'Autriche',
    'Belgique',
    'Bulgarie',
    'Chypre',
    'Croatie',
    'Danemark',
    'Espagne',
    'Estonie',
    'Finlande',
    'Grèce',
    'Hongrie',
    'Irlande',
    'Italie',
    'Lettonie',
    'Lituanie',
    'Luxembourg',
    'Malte',
    'Pays-Bas',
    'Pologne',
    'Portugal',
    'République tchèque',
    'Roumanie',
    'Slovénie',
    'Slovaquie',
    'Suède',
    'Suisse',
    'Royaume-Uni',
  ];

  constructor(private route: ActivatedRoute) {
    this.route.queryParamMap.subscribe((params) => {
      this.quoteId = params.get('quote_id');
      this.role = params.get('role');
    });
  }

  ngOnInit(): void {
    this.clientInfoForm = this.formBuilder.group({
      country: ['Belgique', Validators.required],
      is_physical_person: [false],
      company_number: [null],
      company_vat_number: [null],
      name: [null],
      national_number: [null],
      firstname: [null],
      lastname: [null],
      email: [
        { value: null, disabled: true },
        [Validators.required, Validators.email],
      ],
      phone: [null, Validators.required],
      street: [null, Validators.required],
      number: [null, Validators.required],
      city: [null, Validators.required],
      postalCode: [null, Validators.required],

    });
    this.updateClientFormValidators();
  }

  private updateClientFormValidators(): void {
    const isPhysical = this.clientInfoForm.get('is_physical_person')?.value;
    const nameControl = this.clientInfoForm.get('name');
    const firstnameControl = this.clientInfoForm.get('firstname');
    const lastnameControl = this.clientInfoForm.get('lastname');

    if (isPhysical) {
      nameControl?.clearValidators();
      firstnameControl?.setValidators([Validators.required]);
      lastnameControl?.setValidators([Validators.required]);
    } else {
      nameControl?.setValidators([Validators.required]);
      firstnameControl?.clearValidators();
      lastnameControl?.clearValidators();
    }
    nameControl?.updateValueAndValidity();
    firstnameControl?.updateValueAndValidity();
    lastnameControl?.updateValueAndValidity();
  }

  togglePhysicalPerson(): void {
    this.isPhysicalPerson.set(!this.isPhysicalPerson());
    this.clientInfoForm.patchValue({
      is_physical_person: this.isPhysicalPerson(),
    });
    this.updateClientFormValidators();
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

          console.log('[QuoteDecision] Data reçue du backend:', data);
          this.isClientInfoRequired.set(data.client_info_required);
          console.log(
            '[QuoteDecision] Signal isClientInfoRequired mis à :',
            this.isClientInfoRequired()
          );

          if (this.isClientInfoRequired()) {
            this.clientInfoForm.patchValue({ email: data.client.email });
            this.isPhysicalPerson.set(data.client.is_physical_person);
            this.clientInfoForm.patchValue({
              is_physical_person: data.client.is_physical_person,
            });
            this.updateClientFormValidators();
          } else {
            if (!data.attachment_url || data.attachment_url.length === 0) {
              this.attachmentsAccepted = true;
            }
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

    if (this.connectedUser()?.role === 'ADMIN') return true;

    return true;
  }

  canTakeAction(): boolean {
    if (
      !this.canAccess() ||
      !this.quoteFromDB ||
      this.quoteStatus !== 'pending'
    )
      return false;

    if (this.role === 'CLIENT' && this.isClientInfoRequired()) {
      return false;
    }

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
      return fileName.split('?')[0];
    } catch {
      return 'Pièce jointe';
    }
  }

  getS3KeyFromUrl(url: string): string {
    try {
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

  submitClientInfo() {
    console.log('[QuoteDecision] Appel de submitClientInfo');
    console.log(
      '[QuoteDecision] Validité formulaire:',
      this.clientInfoForm.valid
    );
    console.log(
      '[QuoteDecision] Erreurs formulaire:',
      this.clientInfoForm.errors
    );
    console.log(
      '[QuoteDecision] Valeurs formulaire:',
      this.clientInfoForm.getRawValue()
    );

    if (this.clientInfoForm.invalid) {
      this.clientInfoForm.markAllAsTouched();
      console.error('[QuoteDecision] Formulaire invalide détecté');
      toast.error('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }

    console.log(
      '[QuoteDecision] Vérification quoteFromDB et quoteId:',
      this.quoteFromDB?.client?.id,
      this.quoteId
    );
    if (!this.quoteFromDB?.client?.id || !this.quoteId) {
      console.error('[QuoteDecision] ID client ou ID devis manquant');
      toast.error(
        'Erreur: Impossible de trouver les informations nécessaires.'
      );
      return;
    }

    this.isSubmittingClientInfo.set(true);
    const clientId = this.quoteFromDB.client.id;
    const updateData = { ...this.clientInfoForm.getRawValue() };

    console.log(
      '[QuoteDecision] Appel API updateDetails pour client:',
      clientId
    );
    this.clientService
      .updateDetails(clientId, updateData)
      .pipe(
        take(1),
        finalize(() => {
          console.log('[QuoteDecision] Finalize updateDetails');
          this.isSubmittingClientInfo.set(false);
        })
      )
      .subscribe({
        next: (updatedClient: ClientEntity) => {
          console.log('[QuoteDecision] Succès updateDetails:', updatedClient);
          if (this.quoteFromDB) {
            this.quoteFromDB.client = updatedClient;
          }
          console.log(
            '[QuoteDecision] Appel API markClientInfoAsProvided pour devis:',
            this.quoteId
          );
          this.quoteService
            .markClientInfoAsProvided(this.quoteId!)
            .pipe(take(1))
            .subscribe({
              next: (updatedQuote: QuoteEntity) => {
                console.log(
                  '[QuoteDecision] Succès markClientInfoAsProvided:',
                  updatedQuote
                );
                this.quoteFromDB = updatedQuote;
                this.isClientInfoRequired.set(false);
                console.log(
                  '[QuoteDecision] Signal isClientInfoRequired mis à false après succès'
                );
                toast.success('Informations enregistrées avec succès.');
              },
              error: (err: unknown | HttpErrorResponse) => {
                console.error(
                  '[QuoteDecision] Erreur markClientInfoAsProvided:',
                  err
                );
                const message =
                  err instanceof HttpErrorResponse && err.error?.message
                    ? err.error.message
                    : 'Erreur lors de la mise à jour du statut du devis.';
                toast.error(message);
              },
            });
        },
        error: (error: unknown | HttpErrorResponse) => {
          console.error('[QuoteDecision] Erreur updateDetails:', error);
          const message =
            error instanceof HttpErrorResponse && error.error?.message
              ? error.error.message
              : 'Erreur lors de la mise à jour des informations client.';
          toast.error(message);
        },
      });
  }
  formatNationalNumber(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      formatted += digits[i];
      if (i === 1 || i === 3) formatted += '.';
      if (i === 5) formatted += '-';
      if (i === 8) formatted += '.';
    }
    return formatted;
  }

  onNationalNumberInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value;
    const selectionStart = input.selectionStart || 0;

    // Compte le nombre de chiffres avant le curseur
    let digitCount = 0;
    for (let i = 0; i < selectionStart; i++) {
      if (/\d/.test(rawValue[i])) digitCount++;
    }

    // Récupère uniquement les chiffres
    const digits = rawValue.replace(/\D/g, '').slice(0, 11);

    // Formate la nouvelle valeur
    const newFormatted = this.formatNationalNumber(digits);

    // Calcule la nouvelle position du curseur après formatage
    let newCursor = 0, count = 0;
    for (let i = 0; i < newFormatted.length && count < digitCount; i++) {
      if (/\d/.test(newFormatted[i])) count++;
      newCursor = i + 1;
    }

    // Met à jour la valeur brute dans le formulaire
    this.clientInfoForm.get('national_number')?.setValue(digits, { emitEvent: false });
    input.value = newFormatted;

    // Replace le curseur à la bonne position
    setTimeout(() => {
      input.setSelectionRange(newCursor, newCursor);
    }, 0);
  }
}
