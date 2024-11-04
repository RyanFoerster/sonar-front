import { AfterViewInit, Component, inject, input, signal } from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmCheckboxComponent } from '@spartan-ng/ui-checkbox-helm';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import {
  BrnSelectComponent,
  BrnSelectContentComponent,
  BrnSelectValueComponent,
} from '@spartan-ng/ui-select-brain';
import {
  HlmSelectContentDirective,
  HlmSelectOptionComponent,
  HlmSelectTriggerComponent,
  HlmSelectValueDirective,
} from '@spartan-ng/ui-select-helm';
import { BrnSeparatorComponent } from '@spartan-ng/ui-separator-brain';
import { EuroFormatPipe } from '../../../../../shared/pipes/euro-format.pipe';

import {
  DatePipe,
  JsonPipe,
  Location,
  NgClass,
  PercentPipe,
} from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import {
  lucideAlertTriangle,
  lucideCheck,
  lucideChevronsUpDown,
  lucideCornerDownLeft,
  lucideEdit,
  lucideFileDown,
  lucidePlus,
  lucidePlusCircle,
  lucideTrash,
  lucideUndo2,
  lucideXCircle,
} from '@ng-icons/lucide';
import {
  BrnCommandComponent,
  BrnCommandGroupComponent,
  BrnCommandInputDirective,
  BrnCommandItemDirective,
  BrnCommandListComponent,
} from '@spartan-ng/ui-command-brain';
import {
  HlmCommandDirective,
  HlmCommandEmptyDirective,
  HlmCommandGroupDirective,
  HlmCommandInputDirective,
  HlmCommandInputWrapperComponent,
  HlmCommandItemDirective,
  HlmCommandItemIconDirective,
  HlmCommandListDirective,
} from '@spartan-ng/ui-command-helm';
import {
  BrnPopoverComponent,
  BrnPopoverContentDirective,
  BrnPopoverTriggerDirective,
} from '@spartan-ng/ui-popover-brain';
import { HlmPopoverContentDirective } from '@spartan-ng/ui-popover-helm';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import { PaginatorModule } from 'primeng/paginator';
import { take, tap } from 'rxjs';
import { ClientDto } from '../../../../../shared/dtos/client.dto';
import { ClientEntity } from '../../../../../shared/entities/client.entity';
import { InvoiceEntity } from '../../../../../shared/entities/invoice.entity';
import { ProductEntity } from '../../../../../shared/entities/product.entity';
import { UserEntity } from '../../../../../shared/entities/user.entity';
import { AuthService } from '../../../../../shared/services/auth.service';
import { ClientService } from '../../../../../shared/services/client.service';
import { InvoiceService } from '../../../../../shared/services/invoice.service';
import { ProductService } from '../../../../../shared/services/product.service';

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
    HlmCommandDirective,
    HlmCommandEmptyDirective,
    HlmCommandGroupDirective,
    HlmCommandInputDirective,
    HlmCommandInputWrapperComponent,
    HlmCommandItemDirective,
    HlmCommandItemIconDirective,
    HlmCommandListDirective,
    BrnCommandComponent,
    BrnCommandGroupComponent,
    BrnCommandInputDirective,
    BrnCommandItemDirective,
    BrnCommandListComponent,
    BrnPopoverComponent,
    BrnPopoverContentDirective,
    BrnPopoverTriggerDirective,
    HlmPopoverContentDirective,
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
      lucideCornerDownLeft,
      lucideChevronsUpDown,
    }),
    DatePipe,
  ],
  templateUrl: './credit-note.component.html',
  styleUrl: './credit-note.component.css',
})
export class CreditNoteComponent implements AfterViewInit {
  invoice_id = input<string>();
  invoice = signal<InvoiceEntity | null>(null);
  client = signal<ClientEntity | null>(null);
  connectedUser = signal<UserEntity | null>(null);
  protected remise = signal(0);
  protected totalHtva = signal(0);
  protected tva21 = signal(0);
  protected tva6 = signal(0);
  protected total = signal(0);
  protected totalWithRemise = signal(0);
  protected creditNoteAmount = signal(0);
  protected disabledList = signal<number[]>([]);
  protected isPercentage = signal<Boolean>(false);
  public state = signal<'closed' | 'open'>('closed');
  public currentClient = signal<ClientEntity | undefined>(undefined);
  protected clients = signal<ClientEntity[]>([]);
  protected products = signal<ProductEntity[]>([]);
  protected isToggleClientForm = signal(false);
  protected isPhysicalPerson = signal(false);
  protected isValidBCENumber = signal<Boolean | null>(null);
  protected isToggleProductForm = signal(false);
  protected isToggleEditProductForm = signal(false);
  protected idProductToEdit = signal<number | undefined>(undefined);
  protected isTvaIncluded = signal(false);
  protected advertiseMessage = signal<string>('');
  protected isArtisticPerformance = signal(false);

  protected currentDate = signal<Date>(new Date());

  protected createClientForm!: FormGroup;
  protected createCreditNoteForm!: FormGroup;
  protected editProductForm!: FormGroup;
  protected createProductForm!: FormGroup;

  private invoiceService: InvoiceService = inject(InvoiceService);
  private location: Location = inject(Location);
  private authService: AuthService = inject(AuthService);
  private clientService: ClientService = inject(ClientService);
  private productService: ProductService = inject(ProductService);
  private formBuilder: FormBuilder = inject(FormBuilder);
  private datePipe: DatePipe = inject(DatePipe);

  protected paysEuropeens: string[] = [
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

  constructor() {
    this.createCreditNoteForm = this.formBuilder.group({
      quote_date: [this.formatDate(new Date()), [Validators.required]],
    });

    this.createProductForm = this.formBuilder.group({
      description: ['', [Validators.required]],
      price: ['', [Validators.required]],
      vat: [false, [Validators.required]],
      quantity: [1, [Validators.required]],
    });

    this.createClientForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      street: ['', [Validators.required]],
      number: ['', [Validators.required]],
      city: ['', [Validators.required]],
      country: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      company_number: [null],
      company_vat_number: [null],
      national_number: [null],
    });

    this.editProductForm = this.formBuilder.group({
      description: ['', [Validators.required]],
      price: ['', [Validators.required]],
      vat: [false, [Validators.required]],
      quantity: [1, [Validators.required]],
    });
  }

  ngAfterViewInit(): void {
    if (this.invoice_id()) {
      this.invoiceService
        .getInvoiceById(+this.invoice_id()!)
        .pipe(
          take(1),
          tap((data) => {
            this.invoice.set(data);
            this.totalHtva.set(data.price_htva);
            this.tva6.set(data.total_vat_6);
            this.tva21.set(data.total_vat_21);
            this.total.set(data.total);
            this.totalWithRemise.set(data.total);
            this.client.set(data.client);
            this.products.set(data.products);
          }),
        )
        .subscribe();
    } else {
      this.connectedUser.set(this.authService.getUser());

      if (this.connectedUser()?.role === 'ADMIN') {
        this.clientService
          .getAll()
          .pipe(
            take(1),
            tap((data) => {
              this.clients.set(data);
            }),
          )
          .subscribe();
      }
    }
  }

  goBack() {
    this.location.back();
  }

  private formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  stateChanged(state: 'open' | 'closed') {
    this.state.set(state);
  }

  commandSelected(client: ClientEntity) {
    this.state.set('closed');
    if (this.currentClient()?.email === client.email) {
      this.currentClient.set(undefined);
    } else {
      this.currentClient.set(client);
    }
  }

  setClient(id: number) {
    if (!this.client() || this.client()?.id !== id) {
      this.clientService
        .getOneById(id)
        .pipe(
          tap((data) => {
            this.client.set(data);
            this.products.set([]);
            this.tva6.set(0);
            this.tva21.set(0);
            this.totalHtva.set(0);
            this.total.set(0);
          }),
        )
        .subscribe();
    } else {
      this.client.set(null);
    }
  }

  toggleClientForm(isNewClient: boolean = true) {
    if (isNewClient) {
      this.createClientForm.reset();
    } else {
      this.createClientForm.patchValue({
        name: this.currentClient()?.name,
        email: this.currentClient()?.email,
        phone: this.currentClient()?.phone,
        street: this.currentClient()?.street,
        number: this.currentClient()?.number,
        city: this.currentClient()?.city,
        country: this.currentClient()?.country,
        postalCode: this.currentClient()?.postalCode,
        company_number: this.currentClient()?.company_number,
        company_vat_number: this.currentClient()?.company_vat_number,
        national_number: this.currentClient()?.national_number,
      });
    }
    this.isToggleClientForm.set(!this.isToggleClientForm());
  }

  togglePhysicalPerson() {
    this.isPhysicalPerson.set(!this.isPhysicalPerson());
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
        products_ids: this.products().map((product) => product.id!),
      })
      .subscribe(() => this.goBack());
  }

  createCreditNoteWithoutInvoice() {
    console.log(
      'createCreditNoteWithoutInvoice',
      this.createCreditNoteForm.value,
    );

    const creditNoteDto: any = {
      invoice_date: this.createCreditNoteForm.get('quote_date')?.value,
      linkedInvoiceId: null,
      creditNoteAmount: this.total(),
      client_id: this.client()?.id,
      products_id: this.products().map((product) => product.id!),
      main_account_id: this.connectedUser()?.comptePrincipal.id,
    };

    console.log('creditNoteDto', creditNoteDto);

    if (this.createCreditNoteForm.valid) {
      this.invoiceService
        .createCreditNoteWithoutInvoice(creditNoteDto)
        .pipe(
          take(1),
          tap(() => this.goBack()),
        )
        .subscribe();
    }
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

  checkBCE() {
    this.isValidBCENumber.set(null);
    const companyNumber = this.createClientForm.get('company_number')?.value;
    if (!companyNumber) return;

    this.clientService
      .checkBce(companyNumber)
      .pipe(
        take(1),
        tap(({ Vat }) => {
          this.isValidBCENumber.set(Vat.isValid);

          const { vatNumber, details } = Vat;
          const { name, address } = details;

          const [streetAndNumber, postalAndCity] = address.split('\n');
          const [street, number] = this.extractStreetAndNumber(streetAndNumber);
          const [postalCode, ...cityParts] = postalAndCity.split(' ');
          const city = cityParts.join(' ');

          this.createClientForm.patchValue({
            company_vat_number: vatNumber,
            name,
            street,
            number,
            postalCode,
            city,
          });
        }),
      )
      .subscribe();
  }

  private extractStreetAndNumber(streetAndNumber: string): [string, string] {
    const match = streetAndNumber.match(/^(.+?)\s+(\d+)$/);
    return match ? [match[1], match[2]] : [streetAndNumber, ''];
  }

  getIsValidBCENumber() {
    return this.isValidBCENumber();
  }

  createClient() {
    if (this.createClientForm.valid) {
      this.clientService
        .create(this.createClientForm.value as ClientDto)
        .pipe(
          take(1),
          tap((newClient) => {
            this.setClient(newClient.id);

            // Mise à jour de la liste des clients
            const clientList =
              this.connectedUser()?.role === 'ADMIN'
                ? this.clients()
                : this.connectedUser()!.clients;
            const existingIndex = clientList.findIndex(
              (client) => client.id === newClient.id,
            );

            if (existingIndex !== -1) {
              clientList[existingIndex] = newClient;
            } else {
              clientList.push(newClient);
            }

            // Mise à jour du client actuel
            this.currentClient.set(newClient);

            // Réinitialisation du formulaire et des états
            this.createClientForm.reset();
            this.toggleClientForm();
            this.isPhysicalPerson.set(false);

            // Sauvegarde de l'utilisateur connecté
            this.authService.saveUser(this.connectedUser()!);
          }),
        )
        .subscribe();
    }
  }

  createProduct() {
    console.log('createProductValid', this.createProductForm.valid);
    if (!this.createProductForm.valid || !this.client()) return;

    const { vat, ...productToAdd } = this.createProductForm.value;
    productToAdd.vat = this.calculateVat(vat);
    productToAdd.price = -productToAdd.price;
    productToAdd.total = productToAdd.price * productToAdd.quantity;
    productToAdd.total =
      productToAdd.total + productToAdd.total * productToAdd.vat;
    productToAdd;

    if (this.invoice() && this.invoice()?.total! - -productToAdd.total! < 0) {
      console.log('total', this.invoice()?.total! - -productToAdd.total!);
      return;
    }

    this.productService
      .createProduct(productToAdd)
      .pipe(
        take(1),
        tap((newProduct) => {
          this.products.update((products) => [...products, newProduct]);
          this.calculateQuoteAmount(newProduct);
          this.resetProductForm();
        }),
      )
      .subscribe();
  }

  private calculateVat(formVat: boolean): number {
    if (this.isTvaIncluded()) return 0;

    const { country, company_number, company_vat_number } = this.client()!;
    const isEligibleCountry = ['Belgique', 'Suisse', 'Royaume-Uni'].includes(
      country,
    );

    if (isEligibleCountry && company_number) {
      if (!company_vat_number && !isEligibleCountry) {
        return 0; // Client avec numéro d'entreprise et numéro de TVA
      } else {
        return formVat ? 0.06 : 0.21; // Client avec numéro d'entreprise mais sans numéro de TVA
      }
    }

    return 0; // Autres cas (pays non éligible ou pas de numéro d'entreprise)
  }

  private resetProductForm() {
    this.createProductForm.reset();
    this.createProductForm.get('vat')?.patchValue(false);
    this.toggleProductForm();
  }

  calculateQuoteAmount(data: ProductEntity) {
    this.totalHtva.set(this.products().reduce((a, b) => a + b.price_htva!, 0));

    if (data.vat === 0.21) {
      this.tva21.set(this.setTva21(this.products()));
    }

    if (data.vat === 0.06) {
      this.tva6.set(this.setTva6(this.products()));
    }

    this.total.set(this.totalHtva() + this.tva21() + this.tva6());
  }

  editProduct(id: number) {
    if (!this.isToggleEditProductForm()) {
      this.toggleEditProductForm();
      this.idProductToEdit.set(id);
      this.editProductForm.patchValue({
        description: this.products().find((product) => product.id === id)
          ?.description,
        price: this.products().find((product) => product.id === id)?.price,
        quantity: this.products().find((product) => product.id === id)
          ?.quantity,
        vat: this.products().find((product) => product.id === id)?.vat,
      });
    } else {
      this.toggleEditProductForm();
      this.idProductToEdit.set(undefined);
    }
  }

  editProductToDB() {
    if (this.editProductForm.valid) {
      const editProductDto = this.editProductForm.value;
      this.productService
        .update(this.idProductToEdit()!.toString(), editProductDto)
        .pipe(
          take(1),
          tap((data) => {
            this.products().map((product) => {
              if (product.id === this.idProductToEdit()) {
                product.price = data.price;
                product.vat = data.vat;
                product.description = data.description;
                product.quantity = data.quantity;
                product.total = data.total;
                product.price_htva = data.price_htva;
                product.tva_amount = data.tva_amount;
              }
              return product;
            });
            this.calculateQuoteAmount(data);
            this.toggleEditProductForm();
          }),
        )
        .subscribe();
    }
  }

  deleteProduct(id: number) {
    this.products.update((products) => {
      const updatedProducts = products.filter((product) => product.id !== id);

      this.totalHtva.set(
        updatedProducts.reduce((a, b) => a + b.price_htva!, 0),
      );

      if (updatedProducts.length > 0) {
        this.tva21.set(this.setTva21(updatedProducts));
        this.tva6.set(this.setTva6(updatedProducts));
      } else {
        this.tva21.set(0);
        this.tva6.set(0);
        this.isTvaIncluded.set(false);
      }

      this.total.set(this.totalHtva() + this.tva21() + this.tva6());

      return updatedProducts;
    });
  }

  setTva21(products: ProductEntity[]) {
    const products_tva_21 = products.filter((product) => product.vat === 0.21);
    const baseAmount = this.isTvaIncluded()
      ? products_tva_21.reduce((a, b) => a + b.price * b.quantity!, 0)
      : products_tva_21.reduce((a, b) => a + b.price_htva!, 0);
    return baseAmount * 0.21;
  }

  setTva6(products: ProductEntity[]) {
    const products_tva_6 = products.filter((product) => product.vat === 0.06);
    const baseAmount = this.isTvaIncluded()
      ? products_tva_6.reduce((a, b) => a + b.price * b.quantity!, 0)
      : products_tva_6.reduce((a, b) => a + b.price_htva!, 0);
    return baseAmount * 0.06;
  }

  toggleEditProductForm() {
    this.isToggleEditProductForm.set(!this.isToggleEditProductForm());
  }

  toggleProductForm() {
    this.isToggleProductForm.set(!this.isToggleProductForm());
    console.log('isToggleProductForm', this.isToggleProductForm());
  }

  toggleArtisticPerformance() {
    this.isArtisticPerformance.set(!this.isArtisticPerformance());
  }
}
