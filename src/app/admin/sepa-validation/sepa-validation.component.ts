/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AfterViewInit,
  Component,
  inject,
  model,
  signal,
  computed,
  effect,
} from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { VirementSepaService } from '../../shared/services/virement-sepa.service';
import { VirementSepaEntity } from '../../shared/entities/virement-sepa.entity';
import { tap } from 'rxjs';
import {DatePipe, NgClass, NgIf} from '@angular/common';
import { EuroFormatPipe } from '../../shared/pipes/euro-format.pipe';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { FormsModule } from '@angular/forms';

import {
  BrnDialogContentDirective,
  BrnDialogTriggerDirective,
} from '@spartan-ng/ui-dialog-brain';
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogDescriptionDirective,
  HlmDialogFooterComponent,
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective,
} from '@spartan-ng/ui-dialog-helm';

import {
  lucideCheckCircle2,
  lucideDownload,
  lucideEye,
  lucideEyeOff,
  lucideXCircle,
  lucideChevronLeft,
  lucideChevronRight,
  lucideX,
  lucideMaximize2,
  lucideInbox, lucidePencil, lucideCheck,
} from '@ng-icons/lucide';
import { provideIcons } from '@ng-icons/core';
import { PdfViewerComponent } from '../../shared/components/pdf-viewer/pdf-viewer.component';


@Component({
  selector: 'app-sepa-validation',
  standalone: true,
  imports: [
    HlmButtonDirective,
    HlmIconComponent,
    DatePipe,
    EuroFormatPipe,
    FormsModule,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogFooterComponent,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    PdfViewerComponent,
    NgIf,
    NgClass,
  ],
  providers: [
    provideIcons({
      lucideDownload,
      lucidePencil,
      lucideEye,
      lucideEyeOff,
      lucideCheck,
      lucideXCircle,
      lucideCheckCircle2,
      lucideChevronLeft,
      lucideChevronRight,
      lucideX,
      lucideMaximize2,
      lucideInbox,
    }),
  ],
  templateUrl: './sepa-validation.component.html',
  styleUrl: './sepa-validation.component.css',
})
export class SepaValidationComponent implements AfterViewInit {

  private virementSepaService: VirementSepaService =
    inject(VirementSepaService);
  private sanitizer = inject(DomSanitizer);
  protected virementsSepaInPending = signal<VirementSepaEntity[]>([]);
  protected virementsSepaAccepted = signal<VirementSepaEntity[]>([]);
  protected currentVirementsIndex = signal(0);
  protected rejectedReason = model<string>('');
  protected currentInvoiceBlob = signal<Blob | null>(null);
  protected isInitiatingTransfers = signal<boolean>(false);
  protected transferStatus = signal<{
    success: boolean;
    message: string;
  } | null>(null);
  isEditing = false;
  editedVirement: VirementSepaEntity | null = null;

  protected currentVirement = computed(() => {
    if (
      this.virementsSepaInPending().length > 0 &&
      this.currentVirementsIndex() < this.virementsSepaInPending().length
    ) {
      return this.virementsSepaInPending()[this.currentVirementsIndex()];
    }
    return null;
  });

  constructor() {
    // Effet pour charger automatiquement la facture lorsque l'index change
    effect(() => {
      const virement = this.currentVirement();
      if (virement && virement.id) {
        this.virementSepaService
          .downloadInvoice(virement.id)
          .subscribe((response) => {
            if (response.body) {
              const blob = new Blob([response.body], {
                type: response.headers.get('content-type') || undefined,
              });
              this.currentInvoiceBlob.set(blob);
            }
          });
      }
    });
  }

  ngAfterViewInit() {
    this.virementSepaService
      .getAll()
      .pipe(
        tap((data) => {
          data.forEach((virement) => {
            if (virement.status === 'PENDING') {
              this.virementsSepaInPending.update((virements) => {
                return [...virements, virement];
              });
            } else if (virement.status === 'ACCEPTED') {
              this.virementsSepaAccepted.update((virements) => {
                return [...virements, virement];
              });
            }
          });
        })
      )
      .subscribe();
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  rejectVirement(id: number) {
    this.virementSepaService
      .rejectVirement(id, this.rejectedReason())
      .subscribe(() => {
        this.virementsSepaInPending.update((virements) => {
          return [...virements.filter((virement) => virement.id !== id)];
        });
      });
  }

  acceptVirement(id: number) {
    this.virementSepaService.acceptVirement(id).subscribe(() => {
      const acceptedVirement = this.virementsSepaInPending().find(
        (virement) => virement.id === id
      );
      if (acceptedVirement) {
        this.virementsSepaInPending.update((virements) => {
          return [...virements.filter((virement) => virement.id !== id)];
        });
        this.virementsSepaAccepted.update((virements) => {
          return [...virements, { ...acceptedVirement, status: 'ACCEPTED' }];
        });
      }
    });
  }

  downloadInvoice(virement: VirementSepaEntity) {
    this.virementSepaService
      .downloadInvoice(virement.id)
      .subscribe((response) => {
        if (response.body) {
          const blob = new Blob([response.body], {
            type: response.headers.get('content-type') || undefined,
          });

          // Stocker le blob pour l'affichage dans le PDF Viewer
          this.currentInvoiceBlob.set(blob);

          // Ouvrir dans un nouvel onglet comme avant
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
        }
      });
  }

  paidVirement(id: number) {
    this.virementSepaService.paidVirement(id).subscribe(() => {
      this.virementsSepaAccepted.update((virements) => {
        return [...virements.filter((virement) => virement.id !== id)];
      });
    });
  }

  protected openDetailedView(virement: VirementSepaEntity) {
    const index = this.virementsSepaInPending().findIndex(
      (v) => v.id === virement.id
    );
    if (index !== -1) {
      this.currentVirementsIndex.set(index);

      // Charger automatiquement la facture pour l'affichage
      if (virement.id) {
        this.virementSepaService
          .downloadInvoice(virement.id)
          .subscribe((response) => {
            if (response.body) {
              const blob = new Blob([response.body], {
                type: response.headers.get('content-type') || undefined,
              });
              this.currentInvoiceBlob.set(blob);
            }
          });
      }
    }
  }

  protected handleRejectVirement(id: number, rejectCtx: any, mainCtx: any) {
    this.rejectVirement(id);
    this.rejectedReason.set('');
    rejectCtx.close();
    if (this.virementsSepaInPending().length <= 1) {
      mainCtx.close();
    }
  }

  protected handleAcceptVirement(id: number, ctx: any) {
    this.acceptVirement(id);
    if (this.virementsSepaInPending().length <= 1) {
      ctx.close();
    }
  }

  protected initiateSepaTransfers() {
    // Mettre à jour l'état de chargement
    this.isInitiatingTransfers.set(true);
    // Réinitialiser le statut précédent
    this.transferStatus.set(null);

    this.virementSepaService.initiateTransfers().subscribe({
      next: (response) => {
        this.isInitiatingTransfers.set(false);

        if (response.success) {
          this.virementsSepaAccepted.update((virements) => {
            return virements.filter(
              (virement) => virement.status !== 'ACCEPTED'
            );
          });

          this.transferStatus.set({
            success: true,
            message: `${response.processedTransfers} virements SEPA ont été initiés avec succès.`,
          });
        } else {
          this.transferStatus.set({
            success: false,
            message:
              "Une erreur est survenue lors de l'initiation des virements SEPA.",
          });
        }
      },
      error: (error) => {
        this.isInitiatingTransfers.set(false);
        console.error("Erreur lors de l'initiation des virements SEPA:", error);

        this.transferStatus.set({
          success: false,
          message:
            "Une erreur est survenue lors de l'initiation des virements SEPA.",
        });
      },
    });
  }

// Active le mode édition pour un virement spécifique
  handleModifieVirement(id: number) {
    this.isEditing = true;
    this.editedVirement = {...this.currentVirement()!}; // clone pour édition sans affecter directement
  }

  // Annule le mode édition
  cancelEdit() {
    this.isEditing = false;
    this.editedVirement = null;
  }

// Valide les modifications apportées au virement
  validateEdit() {
    const confirmation = confirm("Êtes-vous sûr de vouloir valider les modifications ? Si oui, la page sera rechargée pour afficher les changements.");
    if (!confirmation || !this.editedVirement) return;

    // Appel API + reload se fait dans le service
    this.virementSepaService.update(this.editedVirement);
  }
// Bloque le bouton de validation si le formulaire n'est pas valide
  isFormValid(): boolean {
    if (!this.editedVirement) return false;

    const { iban, amount_total, amount_htva, amount_tva, communication, structured_communication } = this.editedVirement;

    return (
      iban?.trim() !== '' &&
      amount_total !== null &&
      amount_htva !== null &&
      amount_tva !== null &&
      communication?.trim() !== '' &&
      structured_communication?.trim() !== ''
    );
  }




}
