import {
  Component,
  effect,
  importProvidersFrom,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  BrnSelectComponent,
  BrnSelectContentComponent,
  BrnSelectValueComponent,
} from '@spartan-ng/ui-select-brain';
import { BrnSeparatorComponent } from '@spartan-ng/ui-separator-brain';
import { EuroFormatPipe } from '../../../../../shared/pipes/euro-format.pipe';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmCheckboxComponent } from '@spartan-ng/ui-checkbox-helm';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import {
  HlmSelectContentDirective,
  HlmSelectOptionComponent,
  HlmSelectTriggerComponent,
  HlmSelectValueDirective,
} from '@spartan-ng/ui-select-helm';

import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { PaginatorModule } from 'primeng/paginator';
import {
  DatePipe,
  JsonPipe,
  Location,
  NgClass,
  PercentPipe,
} from '@angular/common';
import { FormGroup, NgModel, ReactiveFormsModule } from '@angular/forms';
import { InvoiceService } from '../../../../../shared/services/invoice.service';
import { InvoiceEntity } from '../../../../../shared/entities/invoice.entity';
import { ClientEntity } from '../../../../../shared/entities/client.entity';
import { tap } from 'rxjs';
import { provideIcons } from '@ng-icons/core';
import {
  lucideAlertTriangle,
  lucideCheck,
  lucideEdit,
  lucideFileDown,
  lucidePlus,
  lucidePlusCircle,
  lucideTrash,
  lucideUndo2,
  lucideXCircle,
} from '@ng-icons/lucide';
import { Router } from '@angular/router';

@Component({
  selector: 'app-credit-note',
  standalone: true,
  imports: [
    BrnSelectComponent,
    BrnSelectContentComponent,
    BrnSelectValueComponent,
    BrnSeparatorComponent,
    EuroFormatPipe,
    HlmButtonDirective,
    HlmCheckboxComponent,
    HlmIconComponent,
    HlmInputDirective,
    HlmLabelDirective,
    HlmSelectContentDirective,
    HlmSelectOptionComponent,
    HlmSelectTriggerComponent,
    HlmSelectValueDirective,
    HlmSeparatorDirective,
    HlmCaptionComponent,
    HlmTableComponent,
    HlmTdComponent,
    HlmThComponent,
    HlmTrowComponent,
    PaginatorModule,
    PercentPipe,
    ReactiveFormsModule,
    DatePipe,
    JsonPipe,
    NgClass,
  ],
  providers: [
    provideIcons({
      lucidePlusCircle,
      lucideTrash,
      lucideEdit,
      lucideFileDown,
      lucidePlus,
      lucideCheck,
      lucideXCircle,
      lucideAlertTriangle,
      lucideUndo2,
    }),
  ],
  templateUrl: './credit-note.component.html',
  styleUrl: './credit-note.component.css',
})
export class CreditNoteComponent {
  invoice_id = input<string>();
  invoice = signal<InvoiceEntity | null>(null);
  client = signal<ClientEntity | null>(null);
  protected remise = signal(0);
  protected totalHtva = signal(0);
  protected tva21 = signal(0);
  protected tva6 = signal(0);
  protected total = signal(0);
  protected totalWithRemise = signal(0);
  protected creditNoteAmount = signal(0);
  protected disabledList = signal<number[]>([]);
  protected isPercentage = signal<Boolean>(false);
  createCreditNoteForm!: FormGroup;

  private invoiceService: InvoiceService = inject(InvoiceService);
  private location: Location = inject(Location);
  private router: Router = inject(Router);

  constructor() {
    effect(
      () => {
        this.invoiceService
          .getInvoiceById(+this.invoice_id()!)
          .pipe(
            tap((data) => {
              this.invoice.set(data);
              this.totalHtva.set(data.price_htva);
              this.tva6.set(data.total_vat_6);
              this.tva21.set(data.total_vat_21);
              this.total.set(data.total);
              this.totalWithRemise.set(data.total);
            }),
          )
          .subscribe();
      },
      {
        allowSignalWrites: true,
      },
    );
  }

  goBack() {
    this.location.back();
  }

  createCreditNote() {
    if (this.remise() > 0) {
      this.creditNoteAmount.set(
        this.invoice()?.total! - this.totalWithRemise(),
      );
    } else {
      this.creditNoteAmount.set(this.invoice()?.total! - this.total());
    }
    this.invoiceService
      .createCreditNote({
        linkedInvoiceId: +this.invoice_id()!,
        creditNoteAmount: this.creditNoteAmount(),
      })
      .subscribe(() => this.goBack());
  }

  addToDisabledList(product_id: number) {
    const idFinded = this.disabledList().find((id) => id === product_id);
    if (idFinded) {
      const filteredList = this.disabledList().filter(
        (id) => id !== product_id,
      );
      this.addPrice(product_id);
      this.disabledList.set(filteredList);
    } else {
      this.disabledList.update((value) => {
        this.removePrice(product_id);
        return [...value, product_id];
      });
    }
  }

  checkDisabled(product_id: number) {
    return this.disabledList().find((id) => id === product_id);
  }

  removePrice(product_id: number) {
    const product = this.invoice()?.products.find(
      (value) => value.id === product_id,
    );
    this.totalHtva.set(this.totalHtva() - product?.price_htva!);

    if (this.totalHtva() === 0) {
      this.tva6.set(0);
      this.tva21.set(0);
      this.total.set(0);
    } else {
      if (product?.vat === 0.06) {
        this.total.set(this.total() - product?.total!);
        this.tva6.set(this.tva6() - product?.tva_amount!);
      }

      if (product?.vat === 0.21) {
        this.total.set(this.total() - product?.total!);
        this.tva21.set(this.tva21() - product?.tva_amount!);
      }
    }
  }

  addPrice(product_id: number) {
    const product = this.invoice()?.products.find(
      (value) => value.id === product_id,
    );
    this.totalHtva.set(this.totalHtva() + product?.price_htva!);

    if (this.totalHtva() === this.invoice()?.price_htva) {
      this.tva6.set(this.invoice()?.total_vat_6!);
      this.tva21.set(this.invoice()?.total_vat_21!);
      this.total.set(this.invoice()?.total!);
    } else {
      if (product?.vat === 0.06) {
        this.total.set(this.total() + product?.total!);
        this.tva6.set(this.tva6() + product?.tva_amount!);
      }

      if (product?.vat === 0.21) {
        this.total.set(this.total() + product?.total!);
        this.tva21.set(this.tva21() + product?.tva_amount!);
      }
    }
  }

  setRemiseToTotal() {
    if (this.remise() > 0) {
      if (!this.isPercentage()) {
        this.totalWithRemise.set(this.total() - this.remise());
      }

      if (this.isPercentage()) {
        this.totalWithRemise.set(
          this.total() - this.total() * (this.remise() / 100),
        );
      }
    } else {
      this.totalWithRemise.set(this.total() + this.remise());
    }
  }

  setRemise(event: any) {
    this.remise.set(event.target.value);
    this.setRemiseToTotal();
  }
}
