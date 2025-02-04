import { DatePipe, Location, NgClass } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import {
  lucideAlertCircle,
  lucideAlertTriangle,
  lucideCheck,
  lucideChevronsUpDown,
  lucideCornerDownLeft,
  lucideEdit,
  lucideFileDown,
  lucidePlus,
  lucidePlusCircle,
  lucideSearch,
  lucideTrash,
  lucideUndo2,
  lucideUsers,
  lucideX,
  lucideXCircle,
  lucideChevronUp,
  lucideChevronDown,
} from '@ng-icons/lucide';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmCheckboxComponent } from '@spartan-ng/ui-checkbox-helm';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import { ClientService } from '../../../../../shared/services/client.service';
import { ProductService } from '../../../../../shared/services/product.service';
import { InvoiceService } from '../../../../../shared/services/invoice.service';
import { AuthService } from '../../../../../shared/services/auth.service';
import { ClientEntity } from '../../../../../shared/entities/client.entity';
import { ProductEntity } from '../../../../../shared/entities/product.entity';
import { UserEntity } from '../../../../../shared/entities/user.entity';
import {
  debounceTime,
  distinctUntilChanged,
  take,
  tap,
  catchError,
} from 'rxjs/operators';
import { throwError } from 'rxjs';
import { EuroFormatPipe } from '../../../../../shared/pipes/euro-format.pipe';
import { UsersService } from '../../../../../shared/services/users.service';
import { InvoiceEntity } from '../../../../../shared/entities/invoice.entity';

@Component({
  selector: 'app-new-credit-note',
  standalone: true,
  imports: [
    HlmInputDirective,
    HlmLabelDirective,
    BrnSelectImports,
    HlmSelectImports,
    HlmButtonDirective,
    HlmIconComponent,
    HlmCheckboxComponent,
    EuroFormatPipe,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    DatePipe,
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
      lucideSearch,
      lucideChevronsUpDown,
      lucideAlertCircle,
      lucideUsers,
      lucideX,
      lucideChevronUp,
      lucideChevronDown,
    }),
    DatePipe,
  ],
  templateUrl: './new-credit-note.component.html',
  styleUrl: './new-credit-note.component.css',
})
export class NewCreditNoteComponent implements AfterViewInit {
  private formBuilder: FormBuilder = inject(FormBuilder);
  private clientService: ClientService = inject(ClientService);
  private usersService: UsersService = inject(UsersService);
  private productService: ProductService = inject(ProductService);
  private invoiceService: InvoiceService = inject(InvoiceService);
  private location: Location = inject(Location);
  private authService: AuthService = inject(AuthService);
  private datePipe: DatePipe = inject(DatePipe);

  protected client = signal<ClientEntity | null>(null);
  protected connectedUser = signal<UserEntity | null>(null);
  protected products = signal<ProductEntity[]>([]);
  protected totalHtva = signal(0);
  protected tva21 = signal(0);
  protected tva6 = signal(0);
  protected total = signal(0);
  protected isValidBCENumber = signal<boolean | null>(null);
  public state = signal<'closed' | 'open'>('closed');
  public currentClient = signal<ClientEntity | undefined>(undefined);
  protected idProductToEdit = signal<number | undefined>(undefined);
  protected advertiseMessage = signal<string>('');
  protected id = input<number>();
  protected typeOfProjet = input<string>();
  protected currentDate = new Date();
  protected invoiceId = input<string>();

  protected notPastDate = computed(
    () => this.currentDate.toISOString().split('T')[0]
  );

  protected startDate = computed(() =>
    this.currentDate.toISOString().slice(0, 10)
  );

  protected clients = signal<ClientEntity[]>([]);
  protected existingInvoice = signal<InvoiceEntity | null>(null);

  protected isToggleClientForm = signal(false);
  protected isToggleProductForm = signal(false);
  protected isToggleEditProductForm = signal(false);
  protected isArtisticPerformance = signal(false);
  protected isPhysicalPerson = signal(false);
  protected isTvaIncluded = signal(false);

  protected createCreditNoteForm!: FormGroup;
  protected createClientForm!: FormGroup;
  protected createProductForm!: FormGroup;
  protected editProductForm!: FormGroup;
  protected searchForm!: FormGroup;

  protected isClientSelectOpen = signal(false);
  protected selectedClient = signal<ClientEntity | null>(null);
  protected filteredClients = signal<ClientEntity[]>([]);
  protected searchControl = new FormControl('');

  protected paysEuropeens = [
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
    'France',
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
    'Slovaquie',
    'Slovénie',
    'Suède',
  ];

  protected originalInvoiceTotal = signal(0);
  protected isFromOriginalInvoice = signal<Set<number>>(new Set());

  protected canAddNewProduct = computed(() => {
    if (!this.existingInvoice()) return true;
    return this.total() > 0;
  });

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.filterClients(value || '');
      });

    this.createCreditNoteForm = this.formBuilder.group({
      credit_note_date: ['', Validators.required],
      service_date: ['', Validators.required],
      client_id: ['', Validators.required],
      products: [[]],
      vat_included: [false],
      type_of_project: [''],
      comment: [''],
    });

    this.createClientForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      firstname: [''],
      lastname: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      street: ['', [Validators.required]],
      number: ['', [Validators.required]],
      city: ['', [Validators.required]],
      country: ['Belgique', [Validators.required]],
      postalCode: ['', [Validators.required]],
      company_number: [null],
      company_vat_number: [null],
      national_number: [null],
      is_physical_person: [false],
    });

    this.createProductForm = this.formBuilder.group({
      description: ['', [Validators.required]],
      price: ['', [Validators.required]],
      vat: [false, [Validators.required]],
      quantity: [1, [Validators.required]],
    });

    this.editProductForm = this.formBuilder.group({
      description: ['', [Validators.required]],
      price: ['', [Validators.required]],
      vat: [false, [Validators.required]],
      quantity: [1, [Validators.required]],
    });
  }

  async ngAfterViewInit() {
    await this.getConnectedUser();

    if (this.invoiceId()) {
      this.invoiceService
        .findOne(+this.invoiceId()!)
        .pipe(
          take(1),
          tap((invoice: InvoiceEntity) => {
            this.existingInvoice.set(invoice);
            this.originalInvoiceTotal.set(invoice.total);
            this.createCreditNoteForm.patchValue({
              credit_note_date: this.formatDate(new Date()),
              service_date: this.formatDate(new Date(invoice.service_date)),
              client_id: invoice.client.id,
              type_of_project: this.typeOfProjet(),
            });
            this.setClient(invoice.client.id);

            const createProductPromises = invoice.products.map((product) => {
              const productToAdd = {
                description: product.description,
                price: product.price,
                quantity: product.quantity,
                vat: product.vat,
              };
              return this.productService
                .createProduct(productToAdd)
                .pipe(take(1))
                .toPromise();
            });

            Promise.all(createProductPromises).then((newProducts) => {
              const validProducts = newProducts.filter(
                (product): product is ProductEntity => product !== undefined
              );
              const originalProductIds = new Set(
                validProducts.map((p) => p.id!)
              );
              this.isFromOriginalInvoice.set(originalProductIds);
              this.products.set(validProducts);
              this.calculateTotals();
            });
          })
        )
        .subscribe();
    }

    this.createClientForm.patchValue({
      country: 'Belgique',
    });

    if (this.connectedUser()?.role === 'ADMIN') {
      this.clientService
        .getAll()
        .pipe(
          take(1),
          tap((data) => {
            this.clients.set(data);
            this.filteredClients.set(data);
          })
        )
        .subscribe();
    } else if (this.connectedUser()?.clients) {
      this.filteredClients.set(this.connectedUser()?.clients || []);
    }
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

  async getConnectedUser() {
    this.connectedUser.set(this.authService.getUser());
  }

  toggleClientForm(isNewClient: boolean) {
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

  toggleProductForm() {
    this.isToggleProductForm.set(!this.isToggleProductForm());
  }

  toggleEditProductForm() {
    if (this.isTvaIncluded()) {
      this.isTvaIncluded.set(false);
      this.advertiseMessage.set(
        'Pour des questions de simplicité, lors de la modification d\'un service, la case à cocher "Montant TVA comprise" est décochée. Pensez à la remettre à chaque modification de service.'
      );
      this.setQuoteVatIncluded();
      this.checkTvaIncluded();
    }
    this.isToggleEditProductForm.set(!this.isToggleEditProductForm());
  }

  toggleArtisticPerformance() {
    this.isArtisticPerformance.set(!this.isArtisticPerformance());
  }

  togglePhysicalPerson() {
    this.isPhysicalPerson.set(!this.isPhysicalPerson());

    if (this.isPhysicalPerson()) {
      this.createClientForm.get('name')?.clearValidators();
      this.createClientForm
        .get('firstname')
        ?.setValidators([Validators.required]);
      this.createClientForm
        .get('lastname')
        ?.setValidators([Validators.required]);
      this.createClientForm.get('company_number')?.clearValidators();
      this.createClientForm.get('company_vat_number')?.clearValidators();
      this.createClientForm.patchValue({
        name: '',
        company_number: null,
        company_vat_number: null,
      });
    } else {
      this.createClientForm.get('name')?.setValidators([Validators.required]);
      this.createClientForm.get('firstname')?.clearValidators();
      this.createClientForm.get('lastname')?.clearValidators();
      this.createClientForm.patchValue({
        firstname: '',
        lastname: '',
      });
    }

    // Update form validation
    this.createClientForm.get('name')?.updateValueAndValidity();
    this.createClientForm.get('firstname')?.updateValueAndValidity();
    this.createClientForm.get('lastname')?.updateValueAndValidity();
    this.createClientForm.get('company_number')?.updateValueAndValidity();
    this.createClientForm.get('company_vat_number')?.updateValueAndValidity();
  }

  async toggleTvaIncluded() {
    this.isTvaIncluded.set(!this.isTvaIncluded());
    this.checkTvaIncluded();
  }

  setTvaIncluded() {
    return this.isTvaIncluded();
  }

  setQuoteVatIncluded() {
    // Not needed for credit notes
  }

  checkTvaIncluded() {
    if (this.isTvaIncluded()) {
      this.totalHtva.set(
        this.products().reduce((a, b) => a + b.price_htva!, 0) -
          this.tva21() -
          this.tva6()
      );
      this.total.set(this.totalHtva() + this.tva21() + this.tva6());
      this.products().forEach((product) => {
        const priceHTVA = product.price_htva!;
        product.total = priceHTVA;
        product.price_htva = priceHTVA - product.tva_amount!;
      });
      for (const product of this.products()) {
        this.productService
          .update(product.id!.toString(), product)
          .pipe(take(1))
          .subscribe();
      }
    } else {
      this.totalHtva.set(
        this.products().reduce((a, b) => a + b.price_htva! + b.tva_amount!, 0)
      );
      this.total.set(this.totalHtva() + this.tva21() + this.tva6());
      this.products().forEach((product) => {
        const priceTOTAL = product.total!;
        product.total = priceTOTAL + product.tva_amount!;
        product.price_htva = priceTOTAL;
      });
      for (const product of this.products()) {
        this.productService
          .update(product.id!.toString(), product)
          .pipe(take(1))
          .subscribe();
      }
    }
  }

  checkBCE() {
    this.isValidBCENumber.set(null);
    const companyNumber = this.createClientForm.get('company_number')?.value;
    if (!companyNumber) return;

    this.clientService
      .checkBce(companyNumber)
      .pipe(
        take(1),
        tap(({ vat }) => {
          if (vat.isValid) {
            this.isValidBCENumber.set(vat.isValid);

            const { vatNumber, details } = vat;
            const { name, address } = details;

            const [streetAndNumber, postalAndCity] = address.split('\n');
            const [street, number] =
              this.extractStreetAndNumber(streetAndNumber);
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
          }
        })
      )
      .subscribe();
  }

  private extractStreetAndNumber(streetAndNumber: string): [string, string] {
    const match = streetAndNumber.match(/^(.+?)\s+(\d+)$/);
    return match ? [match[1], match[2]] : [streetAndNumber, ''];
  }

  setClient(clientId: number | null) {
    if (clientId === null) {
      this.client.set(null);
      this.selectedClient.set(null);
      this.createCreditNoteForm.patchValue({ client_id: '' });
      return;
    }
    this.clientService
      .getOneById(clientId)
      .pipe(
        tap((data) => {
          this.client.set(data);
          this.createCreditNoteForm.patchValue({ client_id: data.id });
          this.products.set([]);
          this.tva6.set(0);
          this.tva21.set(0);
          this.totalHtva.set(0);
          this.total.set(0);
        })
      )
      .subscribe();
  }

  protected isValidCreditNoteAmount(newProductPrice: number): boolean {
    if (!this.existingInvoice()) return true;

    const currentTotal = this.total();
    const newTotal =
      currentTotal -
      newProductPrice *
        (1 +
          (this.isTvaIncluded()
            ? 0
            : this.createProductForm.get('vat')?.value
            ? 0.06
            : 0.21));
    return newTotal >= 0;
  }

  createProduct() {
    if (!this.createProductForm.valid || !this.client()) return;

    const formValues = this.createProductForm.value;
    const productPrice = +formValues.price * +formValues.quantity;

    if (!this.isValidCreditNoteAmount(productPrice)) {
      this.advertiseMessage.set(
        'Le montant total de la note de crédit ne peut pas être négatif.'
      );
      return;
    }

    const productToAdd = {
      description: formValues.description,
      price: this.existingInvoice()
        ? -Math.abs(formValues.price)
        : +formValues.price,
      quantity: +formValues.quantity,
      vat: formValues.vat ? 0.06 : 0.21,
    };

    this.productService
      .createProduct(productToAdd)
      .pipe(
        take(1),
        tap((newProduct) => {
          const currentProducts = this.products();
          this.products.set([...currentProducts, newProduct]);
          this.calculateTotals();
          this.createProductForm.reset();
          this.createProductForm.patchValue({ quantity: 1, vat: false });
          this.toggleProductForm();
          this.advertiseMessage.set('');
        })
      )
      .subscribe();
  }

  calculateTotals() {
    let totalHT = 0;
    for (const product of this.products()) {
      const price = this.isFromOriginalInvoice().has(product.id!)
        ? Math.abs(product.price_htva!)
        : product.price_htva!;
      totalHT += price;
    }

    this.totalHtva.set(totalHT);
    this.tva21.set(this.setTva21(this.products()));
    this.tva6.set(this.setTva6(this.products()));
    this.total.set(this.totalHtva() + this.tva21() + this.tva6());
  }

  editProduct(id: number) {
    if (!this.isToggleEditProductForm()) {
      this.toggleEditProductForm();
      this.idProductToEdit.set(id);
      const product = this.products().find((product) => product.id === id);
      this.editProductForm.patchValue({
        description: product?.description,
        price: product?.price,
        quantity: product?.quantity,
        vat: product?.vat === 0.06,
      });
    } else {
      this.toggleEditProductForm();
      this.idProductToEdit.set(undefined);
    }
  }

  editProductToDB() {
    if (this.editProductForm.valid) {
      const { description, price, quantity, vat } = this.editProductForm.value;
      const editProductDto = {
        description,
        price: +price,
        quantity: +quantity,
        vat: vat ? 0.06 : 0.21,
      };

      this.productService
        .update(this.idProductToEdit()!.toString(), editProductDto)
        .pipe(
          take(1),
          tap((data) => {
            const updatedProducts = this.products().map((product) => {
              if (product.id === this.idProductToEdit()) {
                return data;
              }
              return product;
            });

            this.products.set(updatedProducts);
            this.calculateTotals();
            this.toggleEditProductForm();
          })
        )
        .subscribe();
    }
  }

  deleteProduct(id: number) {
    const updatedProducts = this.products().filter(
      (product) => product.id !== id
    );
    this.products.set(updatedProducts);
    this.calculateTotals();
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

  createCreditNote() {
    if (
      !this.createCreditNoteForm.valid ||
      !this.client() ||
      this.products().length === 0
    ) {
      return;
    }

    const creditNote = {
      ...this.createCreditNoteForm.value,
      products_id: this.products().map((product) => product.id!),
      client_id: this.client()!.id,
      [this.typeOfProjet() === 'PRINCIPAL'
        ? 'main_account_id'
        : 'group_account_id']: +this.id()!,
      isVatIncluded: this.isTvaIncluded(),
      type: 'credit_note',
    };

    // Si on a une facture existante, on ajoute son ID
    if (this.existingInvoice()) {
      creditNote.linkedInvoiceId = this.existingInvoice()!.id;
    }

    const serviceToCall = this.existingInvoice()
      ? this.invoiceService.createCreditNote(
          {
            ...creditNote,
            products_ids: creditNote.products_id,
          },
          {
            account_id: +this.id()!,
            type: this.typeOfProjet() as 'PRINCIPAL' | 'GROUP',
          }
        )
      : this.invoiceService.createCreditNoteWithoutInvoice(
          creditNote,
          +this.id()!,
          this.typeOfProjet() as 'PRINCIPAL' | 'GROUP'
        );

    serviceToCall
      .pipe(
        take(1),
        tap(() => {
          this.goBack();
        }),
        catchError((error) => {
          console.error(
            'Erreur lors de la création de la note de crédit:',
            error
          );
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  toggleClientSelect() {
    this.isClientSelectOpen.set(!this.isClientSelectOpen());
    if (this.isClientSelectOpen()) {
      this.filterClients('');
      setTimeout(() => {
        document.addEventListener('click', this.handleClickOutside);
      });
    } else {
      document.removeEventListener('click', this.handleClickOutside);
    }
  }

  private handleClickOutside = (event: MouseEvent) => {
    const select = document.querySelector('.client-select');
    if (select && !select.contains(event.target as Node)) {
      this.isClientSelectOpen.set(false);
      document.removeEventListener('click', this.handleClickOutside);
    }
  };

  filterClients(search: string) {
    const searchValue = search.toLowerCase().trim();
    const allClients =
      this.connectedUser()?.role === 'ADMIN'
        ? this.clients()
        : this.connectedUser()?.clients || [];

    if (!searchValue) {
      this.filteredClients.set(allClients);
      return;
    }

    const filtered = allClients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchValue) ||
        client.email.toLowerCase().includes(searchValue) ||
        (client.company_vat_number &&
          client.company_vat_number.toLowerCase().includes(searchValue))
    );

    this.filteredClients.set(filtered);
  }

  selectClient(client: ClientEntity) {
    this.selectedClient.set(client);
    this.setClient(client.id);
    this.isClientSelectOpen.set(false);
  }

  goBack() {
    this.location.back();
  }

  submitCreateClientForm() {
    if (this.createClientForm.valid) {
      const clientData = {
        ...this.createClientForm.value,
        is_physical_person: this.isPhysicalPerson(),
      };

      if (this.isPhysicalPerson()) {
        clientData.name = `${clientData.firstname} ${clientData.lastname}`;
      }

      this.clientService
        .create(clientData)
        .pipe(
          take(1),
          tap((newClient) => {
            this.setClient(newClient.id);
            this.toggleClientForm(false);
          })
        )
        .subscribe();
    }
  }
}
