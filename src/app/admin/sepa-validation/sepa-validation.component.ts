/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AfterViewInit,
  Component,
  inject,
  model,
  signal,
  computed,
} from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { VirementSepaService } from '../../shared/services/virement-sepa.service';
import { VirementSepaEntity } from '../../shared/entities/virement-sepa.entity';
import { tap } from 'rxjs';
import { DatePipe } from '@angular/common';
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
  lucideInbox,
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
  ],
  providers: [
    provideIcons({
      lucideDownload,
      lucideEye,
      lucideEyeOff,
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

  protected currentVirement = computed(() => {
    const virements = this.virementsSepaInPending();
    const index = this.currentVirementsIndex();
    return virements[index] || null;
  });

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
    this.virementSepaService.initiateTransfers().subscribe({
      next: (response) => {
        if (response.success) {
          this.virementsSepaAccepted.update((virements) => {
            return virements.filter(
              (virement) => virement.status !== 'ACCEPTED'
            );
          });

          alert(
            `${response.processedTransfers} virements SEPA ont été initiés avec succès.`
          );
        } else {
          alert(
            "Une erreur est survenue lors de l'initiation des virements SEPA."
          );
        }
      },
      error: (error) => {
        console.error("Erreur lors de l'initiation des virements SEPA:", error);
        alert(
          "Une erreur est survenue lors de l'initiation des virements SEPA."
        );
      },
    });
  }
}
