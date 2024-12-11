import { AfterViewInit, Component, inject, model, signal } from '@angular/core';
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { VirementSepaService } from '../../shared/services/virement-sepa.service';
import { VirementSepaEntity } from '../../shared/entities/virement-sepa.entity';
import { map, tap, throwError } from 'rxjs';
import { DatePipe, JsonPipe } from '@angular/common';
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
} from '@ng-icons/lucide';
import { provideIcons } from '@ng-icons/core';

@Component({
  selector: 'app-sepa-validation',
  standalone: true,
  imports: [
    HlmCaptionComponent,
    HlmTableComponent,
    HlmTdComponent,
    HlmThComponent,
    HlmTrowComponent,
    HlmButtonDirective,
    HlmIconComponent,
    JsonPipe,
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
  ],
  providers: [
    provideIcons({
      lucideDownload,
      lucideEye,
      lucideEyeOff,
      lucideXCircle,
      lucideCheckCircle2,
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
  protected selectedVirementId = signal<number | null>(null);

  protected rejectedReason = model<string>('');

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
      const virementFinded = this.virementsSepaInPending().find(
        (virement) => virement.id === id
      );

      if (!virementFinded) {
        throw new Error('Une erreur est survenue');
      }

      this.virementsSepaInPending.update((virements) => {
        return [
          ...virements.filter((virement) => virement.id !== virementFinded.id),
        ];
      });

      this.virementsSepaAccepted.update((virements) => [
        ...virements,
        virementFinded,
      ]);
    });
  }

  togglePdfViewer(virement: VirementSepaEntity) {
    if (this.selectedVirementId() === virement.id) {
      this.selectedVirementId.set(null);
    } else {
      this.selectedVirementId.set(virement.id);
    }
  }

  isPdfVisible(virementId: number): boolean {
    return this.selectedVirementId() === virementId;
  }

  getSafeUrl(url: string | undefined): SafeResourceUrl | null {
    if (!url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  setRejectedReason(reason: any) {
    console.log(reason);
  }
}
