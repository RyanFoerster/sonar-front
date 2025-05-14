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
import { DatePipe, CommonModule } from '@angular/common';
import { EuroFormatPipe } from '../../shared/pipes/euro-format.pipe';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { FormsModule } from '@angular/forms';

import {
  BrnDialogComponent,
  BrnDialogContentDirective,
  BrnDialogTriggerDirective,
  BrnDialogCloseDirective,
} from '@spartan-ng/ui-dialog-brain';
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogDescriptionDirective,
  HlmDialogFooterComponent,
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective,
} from '@spartan-ng/ui-dialog-helm';
import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';

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
  lucideArrowUpDown,
  lucideSend,
  lucideLoader2,
  lucideSearch,
  lucideFileText,
} from '@ng-icons/lucide';
import { provideIcons } from '@ng-icons/core';
import { PdfViewerComponent } from '../../shared/components/pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-sepa-validation',
  standalone: true,
  imports: [
    CommonModule,
    HlmButtonDirective,
    HlmIconComponent,
    DatePipe,
    EuroFormatPipe,
    FormsModule,
    BrnDialogComponent,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    BrnDialogCloseDirective,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogFooterComponent,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    PdfViewerComponent,
    HlmToasterComponent,
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
      lucideArrowUpDown,
      lucideSend,
      lucideLoader2,
      lucideSearch,
      lucideFileText,
    }),
  ],
  templateUrl: './sepa-validation.component.html',
  styleUrl: './sepa-validation.component.css',
})
export class SepaValidationComponent implements AfterViewInit {
  private virementSepaService: VirementSepaService =
    inject(VirementSepaService);
  private sanitizer = inject(DomSanitizer);
  protected allVirements = signal<VirementSepaEntity[]>([]);
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

  // Pagination and sorting for virementsSepaInPending
  protected currentPagePending = signal(1);
  protected itemsPerPagePending = signal(10); // Ou toute autre valeur par défaut
  protected sortFieldPending = signal<keyof VirementSepaEntity | null>(
    'created_at'
  );
  protected sortOrderPending = signal<'asc' | 'desc'>('desc');

  // Pagination and sorting for allVirements
  protected currentPageAll = signal(1);
  protected itemsPerPageAll = signal(10);
  protected sortFieldAll = signal<keyof VirementSepaEntity | null>(
    'created_at'
  );
  protected sortOrderAll = signal<'asc' | 'desc'>('desc');
  protected searchTermAll = signal<string>('');

  protected sortedVirementsSepaInPending = computed(() => {
    const virements = [...this.virementsSepaInPending()];
    const field = this.sortFieldPending();
    const order = this.sortOrderPending();

    if (field) {
      virements.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];

        if (valA instanceof Date && valB instanceof Date) {
          return order === 'asc'
            ? valA.getTime() - valB.getTime()
            : valB.getTime() - valA.getTime();
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
          return order === 'asc' ? valA - valB : valB - valA;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return order === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return 0;
      });
    }
    return virements;
  });

  protected paginatedVirementsSepaInPending = computed(() => {
    const sorted = this.sortedVirementsSepaInPending();
    const startIndex =
      (this.currentPagePending() - 1) * this.itemsPerPagePending();
    return sorted.slice(startIndex, startIndex + this.itemsPerPagePending());
  });

  protected totalPagesPending = computed(() => {
    return Math.ceil(
      this.virementsSepaInPending().length / this.itemsPerPagePending()
    );
  });

  protected currentVirement = computed(() => {
    if (
      this.virementsSepaInPending().length > 0 &&
      this.currentVirementsIndex() < this.virementsSepaInPending().length
    ) {
      return this.virementsSepaInPending()[this.currentVirementsIndex()];
    }
    return null;
  });

  protected sortedAllVirements = computed(() => {
    const virements = [...this.allVirements()];
    const field = this.sortFieldAll();
    const order = this.sortOrderAll();

    if (field) {
      virements.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];

        if (valA instanceof Date && valB instanceof Date) {
          return order === 'asc'
            ? valA.getTime() - valB.getTime()
            : valB.getTime() - valA.getTime();
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
          return order === 'asc' ? valA - valB : valB - valA;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return order === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return 0;
      });
    }
    return virements;
  });

  protected filteredAllVirements = computed(() => {
    const term = this.searchTermAll().toLowerCase();
    if (!term) {
      return this.sortedAllVirements();
    }
    return this.sortedAllVirements().filter(
      (virement) =>
        virement.projet_username.toLowerCase().includes(term) ||
        virement.account_owner.toLowerCase().includes(term) ||
        virement.iban.toLowerCase().includes(term)
    );
  });

  protected paginatedAllVirements = computed(() => {
    const filtered = this.filteredAllVirements();
    const startIndex = (this.currentPageAll() - 1) * this.itemsPerPageAll();
    return filtered.slice(startIndex, startIndex + this.itemsPerPageAll());
  });

  protected totalPagesAll = computed(() => {
    return Math.ceil(
      this.filteredAllVirements().length / this.itemsPerPageAll()
    );
  });

  protected currentInvoicePdfUrl = computed<string | null>(() => {
    const blob = this.currentInvoiceBlob();
    if (blob) {
      const unsafeUrl = URL.createObjectURL(blob);
      // TODO: Consider revoking this URL when the blob is no longer needed / component is destroyed
      return unsafeUrl;
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
          // Initial sort for allVirements by creation date descending
          const sortedData = [...data].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );

          sortedData.forEach((virement) => {
            this.allVirements.update((virements) => {
              // Correctly add to allVirements without re-sorting here, initial sort is enough
              return [...virements, virement];
            });
            if (virement.status === 'PENDING') {
              this.virementsSepaInPending.update((virements) => {
                // Garder le tri par défaut ici si nécessaire ou appliquer un tri initial
                const updatedVirements = [...virements, virement];
                updatedVirements.sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                );
                return updatedVirements;
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
          return virements.filter((virement) => virement.id !== id);
        });
        // Recalculer la page actuelle si la page devient vide
        if (
          this.paginatedVirementsSepaInPending().length === 0 &&
          this.currentPagePending() > 1
        ) {
          this.currentPagePending.set(this.currentPagePending() - 1);
        }
      });
  }

  acceptVirement(id: number) {
    this.virementSepaService.acceptVirement(id).subscribe(() => {
      const acceptedVirement = this.virementsSepaInPending().find(
        (virement) => virement.id === id
      );
      if (acceptedVirement) {
        this.virementsSepaInPending.update((virements) => {
          return virements.filter((virement) => virement.id !== id);
        });
        this.virementsSepaAccepted.update((virements) => {
          return [...virements, { ...acceptedVirement, status: 'ACCEPTED' }];
        });
        // Recalculer la page actuelle si la page devient vide
        if (
          this.paginatedVirementsSepaInPending().length === 0 &&
          this.currentPagePending() > 1
        ) {
          this.currentPagePending.set(this.currentPagePending() - 1);
        }
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
    // S'assurer que si la liste paginée est vide et que ce n'est pas la première page, on recule.
    if (
      this.paginatedVirementsSepaInPending().length === 0 &&
      this.currentPagePending() > 1 &&
      this.virementsSepaInPending().length > 0
    ) {
      this.currentPagePending.set(this.currentPagePending() - 1);
    } else if (this.virementsSepaInPending().length === 0) {
      // Si la liste est complètement vide
      mainCtx.close(); // Assurez-vous que mainCtx est défini ici
    }
  }

  protected handleAcceptVirement(id: number, ctx: any) {
    this.acceptVirement(id);
    if (this.virementsSepaInPending().length <= 1) {
      ctx.close();
    }
    // S'assurer que si la liste paginée est vide et que ce n'est pas la première page, on recule.
    if (
      this.paginatedVirementsSepaInPending().length === 0 &&
      this.currentPagePending() > 1 &&
      this.virementsSepaInPending().length > 0
    ) {
      this.currentPagePending.set(this.currentPagePending() - 1);
    } else if (this.virementsSepaInPending().length === 0) {
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

  // Methods for pagination and sorting virementsSepaInPending
  protected sortByPending(field: keyof VirementSepaEntity) {
    if (this.sortFieldPending() === field) {
      this.sortOrderPending.set(
        this.sortOrderPending() === 'asc' ? 'desc' : 'asc'
      );
    } else {
      this.sortFieldPending.set(field);
      this.sortOrderPending.set('asc');
    }
    this.currentPagePending.set(1); // Reset to first page on sort
  }

  protected onPageChangePending(page: number) {
    if (page >= 1 && page <= this.totalPagesPending()) {
      this.currentPagePending.set(page);
    }
  }

  protected getVisiblePagesPending(): (number | 'ellipsis')[] {
    const total = this.totalPagesPending();
    const current = this.currentPagePending();
    const delta = 2;
    const range: (number | 'ellipsis')[] = [];

    if (total <= 1) {
      return [];
    }

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) {
      range.unshift('ellipsis');
    }
    if (current + delta < total - 1) {
      range.push('ellipsis');
    }

    range.unshift(1);
    if (total > 1) {
      range.push(total);
    }

    // Remove duplicate 'ellipsis' if they are adjacent to 1 or total
    const finalRange: (number | 'ellipsis')[] = [];
    for (let i = 0; i < range.length; i++) {
      const currentItem = range[i];
      if (currentItem === 'ellipsis') {
        // if the ellipsis is next to 1 and range[i-1] is 1, or next to total and range[i+1] is total
        if (
          (i > 0 && range[i - 1] === 1 && current <= delta + 2) ||
          (i < range.length - 1 &&
            range[i + 1] === total &&
            current >= total - delta - 1)
        ) {
          // Check if it makes sense to show all numbers instead of ellipsis
          if (total <= 2 * delta + 3) {
            // 1 ... 2 3 4 ... 5 (delta = 1, total = 5) => 1 2 3 4 5
            // if total is small enough, just show all numbers
          } else {
            // continue; // This was commented out, should it be here?
          }
        }
      }
      // Avoid adding 'ellipsis' if it means only one number is hidden
      if (
        currentItem === 'ellipsis' &&
        i > 0 &&
        i < range.length - 1 &&
        typeof range[i - 1] === 'number' &&
        typeof range[i + 1] === 'number' &&
        (range[i + 1] as number) - (range[i - 1] as number) <= 2
      ) {
        if ((range[i + 1] as number) - (range[i - 1] as number) === 2) {
          finalRange.push((range[i - 1] as number) + 1);
        }
        continue;
      }

      if (
        finalRange.length === 0 ||
        finalRange[finalRange.length - 1] !== currentItem ||
        currentItem !== 'ellipsis'
      ) {
        finalRange.push(currentItem);
      }
    }
    // Ensure that '1' and 'total' are not 'ellipsis' and are correctly placed
    if (finalRange[0] === 'ellipsis' && total > 1) finalRange[0] = 1;
    if (finalRange[finalRange.length - 1] === 'ellipsis' && total > 1)
      finalRange[finalRange.length - 1] = total;

    // Remove 'ellipsis' if it's the only element or if all pages are shown
    if (finalRange.length === 1 && finalRange[0] === 'ellipsis') return [];
    if (total <= 2 * delta + 3) {
      // Heuristic: if few pages, show all
      return Array.from({ length: total }, (_, k) => k + 1);
    }

    return finalRange.filter(
      (item, index, self) =>
        item !== 'ellipsis' || (index > 0 && self[index - 1] !== 'ellipsis')
    );
  }

  // Methods for pagination and sorting allVirements
  protected sortByAll(field: keyof VirementSepaEntity) {
    if (this.sortFieldAll() === field) {
      this.sortOrderAll.set(this.sortOrderAll() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortFieldAll.set(field);
      this.sortOrderAll.set('asc');
    }
    this.currentPageAll.set(1); // Reset to first page on sort
  }

  protected onPageChangeAll(page: number) {
    if (page >= 1 && page <= this.totalPagesAll()) {
      this.currentPageAll.set(page);
    }
  }

  protected getVisiblePagesAll(): (number | 'ellipsis')[] {
    const total = this.totalPagesAll();
    const current = this.currentPageAll();
    const delta = 2;
    const range: (number | 'ellipsis')[] = [];

    if (total <= 1) {
      return [];
    }

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(total - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) {
      range.unshift('ellipsis');
    }
    if (current + delta < total - 1) {
      range.push('ellipsis');
    }

    range.unshift(1);
    if (total > 1) {
      range.push(total);
    }

    const finalRange: (number | 'ellipsis')[] = [];
    for (let i = 0; i < range.length; i++) {
      const currentItem = range[i];
      if (currentItem === 'ellipsis') {
        if (
          (i > 0 && range[i - 1] === 1 && current <= delta + 2) ||
          (i < range.length - 1 &&
            range[i + 1] === total &&
            current >= total - delta - 1)
        ) {
          // Bloc intentionnellement vide, la logique est de ne rien faire de spécial ici si les conditions sont remplies
          // pour l'instant, ou d'affiner plus tard si nécessaire pour les cas limites d'ellipsis.
        }
      }
      if (
        currentItem === 'ellipsis' &&
        i > 0 &&
        i < range.length - 1 &&
        typeof range[i - 1] === 'number' &&
        typeof range[i + 1] === 'number' &&
        (range[i + 1] as number) - (range[i - 1] as number) <= 2
      ) {
        if ((range[i + 1] as number) - (range[i - 1] as number) === 2) {
          finalRange.push((range[i - 1] as number) + 1);
        }
        continue;
      }

      if (
        finalRange.length === 0 ||
        finalRange[finalRange.length - 1] !== currentItem ||
        currentItem !== 'ellipsis'
      ) {
        finalRange.push(currentItem);
      }
    }
    if (finalRange[0] === 'ellipsis' && total > 1) finalRange[0] = 1;
    if (finalRange[finalRange.length - 1] === 'ellipsis' && total > 1)
      finalRange[finalRange.length - 1] = total;

    if (finalRange.length === 1 && finalRange[0] === 'ellipsis') return [];
    if (total <= 2 * delta + 3) {
      return Array.from({ length: total }, (_, k) => k + 1);
    }

    return finalRange.filter(
      (item, index, self) =>
        item !== 'ellipsis' || (index > 0 && self[index - 1] !== 'ellipsis')
    );
  }

  protected onSearchAllChanged(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    this.searchTermAll.set(inputElement.value);
    this.currentPageAll.set(1); // Reset to first page on search
  }

  protected getStatusLabel(status: VirementSepaEntity['status']): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Accepté';
      case 'REJECTED':
        return 'Rejeté';
      case 'PAID':
        return 'Payé';
      default:
        return status;
    }
  }

  protected getStatusClasses(status: VirementSepaEntity['status']): string {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'PAID':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }
}
