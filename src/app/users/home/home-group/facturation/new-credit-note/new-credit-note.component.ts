import { DatePipe, NgClass, Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmCheckboxComponent } from '@spartan-ng/ui-checkbox-helm';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import {
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import { debounceTime, distinctUntilChanged, take, tap } from 'rxjs';
import { ClientEntity } from '../../../../../shared/entities/client.entity';
import { ProductEntity } from '../../../../../shared/entities/product.entity';
import { EuroFormatPipe } from '../../../../../shared/pipes/euro-format.pipe';
import { ClientService } from '../../../../../shared/services/client.service';
import { InvoiceService } from '../../../../../shared/services/invoice.service';
import { ProductService } from '../../../../../shared/services/product.service';
import { provideIcons } from '@ng-icons/core';
import {
  lucideAlertTriangle,
  lucideChevronDown,
  lucideChevronUp,
  lucideCornerDownLeft,
  lucideFileDown,
  lucidePlusCircle,
  lucideSearch,
  lucideUsers,
  lucideX,
} from '@ng-icons/lucide';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-new-credit-note',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HlmButtonDirective,
    HlmIconComponent,
    HlmInputDirective,
    HlmCheckboxComponent,
    BrnSelectImports,
    HlmSelectImports,
    HlmTableComponent,
    HlmTrowComponent,
    HlmThComponent,
    HlmTdComponent,
    EuroFormatPipe,
    DatePipe,
    NgClass,
  ],
  providers: [
    DatePipe,
    provideIcons({
      lucideUsers,
      lucideChevronDown,
      lucidePlusCircle,
      lucideAlertTriangle,
      lucideFileDown,
      lucideCornerDownLeft,
      lucideSearch,
      lucideChevronUp,
      lucideX,
    }),
  ],
  templateUrl: './new-credit-note.component.html',
})
export class NewCreditNoteComponent {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly clientService = inject(ClientService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly productService = inject(ProductService);
  private readonly location = inject(Location);
  // Client management
  allClients = signal<ClientEntity[]>([]);
  filteredClients = signal<ClientEntity[]>([]);
  selectedClient = signal<ClientEntity | null>(null);
  client = signal<ClientEntity | null>(null);
  isClientSelectOpen = signal<boolean>(false);
  isToggleClientForm = signal<boolean>(false);
  searchControl = new FormControl('');

  // Product management
  products = signal<ProductEntity[]>([]);
  isToggleProductForm = signal<boolean>(false);

  // Forms
  createCreditNoteForm = this.fb.group({
    client_id: [null as number | null, Validators.required],
    credit_note_date: [
      new Date().toISOString().split('T')[0],
      Validators.required,
    ],
    service_date: [new Date().toISOString().split('T')[0], Validators.required],
  });

  createProductForm = this.fb.group({
    description: ['', Validators.required],
    price: [0, [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    vat: [false],
  });

  currentDate = new Date();

  notPastDate() {
    return new Date().toISOString().split('T')[0];
  }

  // Computed values
  totalHtva = computed(() => {
    return -Math.abs(
      this.products().reduce((acc, product) => acc + product.price_htva!, 0)
    );
  });

  tva21 = computed(() => {
    return -Math.abs(
      this.products()
        .filter((product) => product.vat === 0.21)
        .reduce(
          (acc, product) => acc + (product.total! - product.price_htva!),
          0
        )
    );
  });

  tva6 = computed(() => {
    return -Math.abs(
      this.products()
        .filter((product) => product.vat === 0.06)
        .reduce(
          (acc, product) => acc + (product.total! - product.price_htva!),
          0
        )
    );
  });

  total = computed(() => {
    return -Math.abs(
      this.products().reduce((acc, product) => acc + product.total!, 0)
    );
  });

  constructor() {
    this.initializeClients();
    this.setupSearchSubscription();
  }

  private initializeClients() {
    this.clientService
      .getAll()
      .pipe(
        take(1),
        tap((clients) => {
          this.allClients.set(clients);
          this.filteredClients.set(clients);
        })
      )
      .subscribe();
  }

  private setupSearchSubscription() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        if (!value) {
          this.filteredClients.set(this.allClients());
          return;
        }

        const searchValue = value.toLowerCase();
        this.filteredClients.set(
          this.allClients().filter(
            (client) =>
              client.name.toLowerCase().includes(searchValue) ||
              client.email.toLowerCase().includes(searchValue) ||
              client.company_vat_number?.toLowerCase().includes(searchValue)
          )
        );
      });
  }

  toggleClientSelect() {
    this.isClientSelectOpen.set(!this.isClientSelectOpen());
  }

  selectClient(client: ClientEntity) {
    this.selectedClient.set(client);
    this.client.set(client);
    this.createCreditNoteForm.patchValue({ client_id: client.id });
    this.isClientSelectOpen.set(false);
  }

  setClient(client: ClientEntity | null) {
    this.client.set(client);
    this.selectedClient.set(client);
    if (client) {
      this.createCreditNoteForm.patchValue({ client_id: client.id });
    } else {
      this.createCreditNoteForm.patchValue({ client_id: null });
    }
  }

  toggleClientForm() {
    this.isToggleClientForm.set(!this.isToggleClientForm());
  }

  toggleProductForm() {
    this.isToggleProductForm.set(!this.isToggleProductForm());
    if (!this.isToggleProductForm()) {
      this.createProductForm.reset({
        quantity: 1,
        vat: false,
      });
    }
  }

  toggleArtisticPerformance() {
    const currentValue = this.createProductForm.get('vat')?.value;
    this.createProductForm.patchValue({ vat: !currentValue });
  }

  createProduct() {
    if (this.createProductForm.valid) {
      const formValue = this.createProductForm.getRawValue();

      // S'assurer que les valeurs ne sont pas null
      const price = Math.abs(formValue.price || 0);
      const quantity = formValue.quantity || 0;
      const vat = formValue.vat ? 6 : 21;

      const price_htva = -price;
      const total = price_htva * quantity * (1 + vat / 100);

      const product: Partial<ProductEntity> = {
        description: formValue.description || '',
        price: price_htva,
        price_htva,
        quantity,
        vat,
        total,
      };

      this.products.update((products) => [
        ...products,
        product as ProductEntity,
      ]);
      this.createProductForm.reset();
      this.toggleProductForm();
    }
  }

  deleteProduct(index: number) {
    this.products.update((products) => products.filter((_, i) => i !== index));
  }

  createCreditNote() {
    if (this.createCreditNoteForm.invalid || !this.products().length) return;

    const formData = this.createCreditNoteForm.getRawValue();

    const creditNoteData = {
      client_id: this.client()?.id,
      products: this.products().map((product) => ({
        description: product.description,
        price_htva: product.price_htva,
        quantity: product.quantity,
        vat: product.vat,
        total: product.total,
      })),
      credit_note_date: formData.credit_note_date,
      service_date: formData.service_date,
      status: 'credit_note' as const,
    };

    console.log('Données de la note de crédit:', creditNoteData);

    this.invoiceService
      .createCreditNoteWithoutInvoice(creditNoteData)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          console.log('Note de crédit créée avec succès:', response);
          this.goBack();
        },
        error: (err: Error) => {
          console.error(
            'Erreur lors de la création de la note de crédit:',
            err
          );
        },
      });
  }

  goBack() {
    this.location.back();
  }
}
