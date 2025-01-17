import { DatePipe, Location, NgClass, PercentPipe } from '@angular/common';
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
import {
  HlmAlertDescriptionDirective,
  HlmAlertDirective,
  HlmAlertIconDirective,
  HlmAlertTitleDirective,
} from '@spartan-ng/ui-alert-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmCheckboxComponent } from '@spartan-ng/ui-checkbox-helm';
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
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import {
  BrnPopoverComponent,
  BrnPopoverContentDirective,
  BrnPopoverTriggerDirective,
} from '@spartan-ng/ui-popover-brain';
import { HlmPopoverContentDirective } from '@spartan-ng/ui-popover-helm';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import { BrnSeparatorComponent } from '@spartan-ng/ui-separator-brain';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import { take, tap, catchError, throwError } from 'rxjs';
import { ClientDto } from '../../../../../shared/dtos/client.dto';
import { QuoteDto } from '../../../../../shared/dtos/quote.dto';
import { ClientEntity } from '../../../../../shared/entities/client.entity';
import { ProductEntity } from '../../../../../shared/entities/product.entity';
import { QuoteEntity } from '../../../../../shared/entities/quote.entity';
import { UserEntity } from '../../../../../shared/entities/user.entity';
import { EuroFormatPipe } from '../../../../../shared/pipes/euro-format.pipe';
import { AuthService } from '../../../../../shared/services/auth.service';
import { ClientService } from '../../../../../shared/services/client.service';
import { ProductService } from '../../../../../shared/services/product.service';
import { QuoteService } from '../../../../../shared/services/quote.service';
import { UsersService } from '../../../../../shared/services/users.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
@Component({
  selector: 'app-new-quote',
  standalone: true,
  imports: [
    HlmInputDirective,
    HlmLabelDirective,
    HlmSeparatorDirective,
    BrnSeparatorComponent,
    BrnSelectImports,
    HlmSelectImports,
    HlmButtonDirective,
    HlmIconComponent,
    HlmCaptionComponent,
    HlmTableComponent,
    HlmTdComponent,
    HlmThComponent,
    HlmTrowComponent,
    EuroFormatPipe,
    BrnDialogTriggerDirective,
    BrnDialogContentDirective,

    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogHeaderComponent,
    HlmDialogFooterComponent,
    HlmDialogTitleDirective,
    HlmDialogDescriptionDirective,

    HlmLabelDirective,
    HlmInputDirective,
    HlmButtonDirective,
    HlmAlertDirective,
    HlmAlertDescriptionDirective,
    HlmAlertIconDirective,
    HlmAlertTitleDirective,
    HlmIconComponent,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    HlmCheckboxComponent,
    PercentPipe,
    HlmIconComponent,
    HlmIconComponent,
    HlmIconComponent,
    HlmTableComponent,
    HlmTrowComponent,
    HlmThComponent,
    HlmTrowComponent,
    HlmThComponent,
    BrnCommandComponent,
    BrnCommandGroupComponent,
    BrnCommandInputDirective,
    BrnCommandItemDirective,
    BrnCommandListComponent,
    BrnPopoverComponent,
    BrnPopoverContentDirective,
    BrnPopoverTriggerDirective,
    HlmCommandDirective,
    HlmCommandEmptyDirective,
    HlmCommandGroupDirective,
    HlmCommandInputDirective,
    HlmCommandInputWrapperComponent,
    HlmCommandItemDirective,
    HlmCommandItemIconDirective,
    HlmCommandListDirective,
    HlmPopoverContentDirective,
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
  templateUrl: './new-quote.component.html',
  styleUrl: './new-quote.component.css',
})
export class NewQuoteComponent implements AfterViewInit {
  private formBuilder: FormBuilder = inject(FormBuilder);
  private clientService: ClientService = inject(ClientService);
  private usersService: UsersService = inject(UsersService);
  private productService: ProductService = inject(ProductService);
  private quoteService: QuoteService = inject(QuoteService);
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
  protected isValidBCENumber = signal<Boolean | null>(null);
  public state = signal<'closed' | 'open'>('closed');
  public currentClient = signal<ClientEntity | undefined>(undefined);
  protected idProductToEdit = signal<number | undefined>(undefined);
  protected advertiseMessage = signal<string>('');
  protected id = input<number>();
  protected typeOfProjet = input<string>();
  protected updatedQuoteId = input<string>();
  protected currentDate = new Date();

  protected notPastDate = computed(
    () => this.currentDate.toISOString().split('T')[0]
  );

  protected startDate = computed(() =>
    this.currentDate.toISOString().slice(0, 10)
  );

  protected clients = signal<ClientEntity[]>([]);
  protected updatedQuote = signal<QuoteEntity | null>(null);

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

  protected isToggleClientForm = signal(false);
  protected isToggleProductForm = signal(false);
  protected isToggleEditProductForm = signal(false);
  protected isArtisticPerformance = signal(false);
  protected isPhysicalPerson = signal(false);
  protected isTvaIncluded = signal(false);

  protected createQuoteForm!: FormGroup;
  protected createClientForm!: FormGroup;
  protected createProductForm!: FormGroup;
  protected editProductForm!: FormGroup;
  protected searchForm!: FormGroup;

  protected isClientSelectOpen = signal(false);
  protected selectedClient = signal<ClientEntity | null>(null);
  protected filteredClients = signal<ClientEntity[]>([]);
  protected searchControl = new FormControl('');

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.filterClients(value || '');
      });

    this.createQuoteForm = this.formBuilder.group({
      quote_date: ['', Validators.required],
      service_date: ['', Validators.required],
      payment_deadline: [
        10,
        [Validators.required, Validators.min(10), Validators.max(30)],
      ],
      validation_deadline: ['', Validators.required],
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
      country: ['', [Validators.required]],
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

    if (this.updatedQuoteId()) {
      this.quoteService
        .getQuote(this.updatedQuoteId()!)
        .pipe(
          tap((data) => {
            this.updatedQuote.set(data);
            this.isTvaIncluded.set(data.isVatIncluded);
            this.createQuoteForm.patchValue({
              quote_date: this.formatDate(data.quote_date),
              service_date: this.formatDate(data.service_date),
              payment_deadline: data.payment_deadline,
              validation_deadline: this.formatDate(data.validation_deadline),
              comment: data.comment,
            });

            this.products.set(
              data.products.map((product) => {
                return {
                  ...product,
                };
              })
            );

            this.client.set(data.client);
            this.currentClient.set(data.client);
            this.tva21.set(this.setTva21(this.products()));
            this.tva6.set(this.setTva6(this.products()));
            this.totalHtva.set(
              this.products().reduce((a, b) => a + b.price_htva!, 0)
            );
            this.total.set(this.totalHtva() + this.tva21() + this.tva6());
          })
        )
        .subscribe();
    }
  }

  private formatDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  // formatDateToISO(date: Date): string {
  //   const year = date.getUTCFullYear();
  //   const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() retourne un index commençant à 0
  //   const day = date.getDate().toString().padStart(2, '0');
  //   return `${year}-${month}-${day}`;
  // }

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
    if (this.updatedQuote()) {
      this.updatedQuote()!.isVatIncluded = this.isTvaIncluded();
    }
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
          .update(product.id?.toString()!, product)
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
          .update(product.id?.toString()!, product)
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

  getIsValidBCENumber() {
    return this.isValidBCENumber();
  }

  createClient() {
    if (this.createClientForm.valid) {
      const formData = { ...this.createClientForm.value };

      // Si c'est une personne physique, on combine firstname et lastname pour le name
      if (this.isPhysicalPerson()) {
        formData.name = `${formData.firstname} ${formData.lastname}`.trim();
        formData.is_physical_person = true;
      } else {
        formData.is_physical_person = false;
      }

      this.clientService
        .create(formData)
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
              (client) => client.id === newClient.id
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
            this.authService.setUser(this.connectedUser()!);
          })
        )
        .subscribe();
    }
  }

  setClient(clientId: number | null) {
    if (clientId === null) {
      this.client.set(null);
      this.selectedClient.set(null);
      this.createQuoteForm.patchValue({ client_id: '' });
      return;
    }
    this.clientService
      .getOneById(clientId)
      .pipe(
        tap((data) => {
          this.client.set(data);
          this.createQuoteForm.patchValue({ client_id: data.id });
          this.products.set([]);
          this.tva6.set(0);
          this.tva21.set(0);
          this.totalHtva.set(0);
          this.total.set(0);
        })
      )
      .subscribe();
  }

  createProduct() {
    if (!this.createProductForm.valid || !this.client()) return;

    const formValues = this.createProductForm.value;
    const productToAdd = {
      description: formValues.description,
      price: +formValues.price,
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
        })
      )
      .subscribe();
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

  calculateTotals() {
    this.totalHtva.set(this.products().reduce((a, b) => a + b.price_htva!, 0));
    this.tva21.set(this.setTva21(this.products()));
    this.tva6.set(this.setTva6(this.products()));
    this.total.set(this.totalHtva() + this.tva21() + this.tva6());
  }

  deleteProduct(id: number) {
    this.products.update((products) => {
      const updatedProducts = products.filter((product) => product.id !== id);

      this.totalHtva.set(
        updatedProducts.reduce((a, b) => a + b.price_htva!, 0)
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

  createQuote() {
    console.log('Tentative de création du devis');
    console.log('Form valide:', this.createQuoteForm.valid);
    console.log('Client présent:', !!this.client());
    console.log('Nombre de produits:', this.products().length);

    // Vérification détaillée de chaque champ du formulaire
    const formControls = this.createQuoteForm.controls;
    Object.keys(formControls).forEach((key) => {
      const control = formControls[key];
      console.log(`Champ ${key}:`, {
        valeur: control.value,
        valide: control.valid,
        erreurs: control.errors,
        pristine: control.pristine,
        touched: control.touched,
      });
    });

    if (
      !this.createQuoteForm.valid ||
      !this.client() ||
      this.products().length === 0
    ) {
      console.log('Validation échouée');
      return;
    }

    const quote: QuoteDto = {
      ...this.createQuoteForm.value,
      products_id: this.products().map((product) => product.id!),
      client_id: this.client()!.id,
      [this.typeOfProjet() === 'PRINCIPAL'
        ? 'main_account_id'
        : 'group_account_id']: +this.id()!,
      isVatIncluded: this.isTvaIncluded(),
    };

    console.log('DTO du devis:', quote);

    this.quoteService
      .createQuote(quote)
      .pipe(
        take(1),
        tap((response) => {
          console.log("Réponse de l'API:", response);
          this.goBack();
        }),
        catchError((error) => {
          console.error('Erreur lors de la création du devis:', error);
          return throwError(() => error);
        })
      )
      .subscribe();
  }

  updateQuote() {
    if (
      !this.createQuoteForm.valid ||
      !this.client() ||
      this.products().length === 0
    ) {
      return;
    }

    const quote: QuoteDto = {
      ...this.createQuoteForm.value,
      products_id: this.products().map((product) => product.id!),
      client_id: this.client()!.id,
      isVatIncluded: this.isTvaIncluded(),
    };

    this.quoteService
      .updateQuote(this.updatedQuoteId()!, quote)
      .pipe(
        take(1),
        tap(() => this.goBack())
      )
      .subscribe();
  }

  toggleClientSelect() {
    this.isClientSelectOpen.set(!this.isClientSelectOpen());
    if (this.isClientSelectOpen()) {
      this.filterClients();
      // Fermer le select quand on clique en dehors
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

  filterClients(search: string = '') {
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

  updateValidationDeadline(event: any) {
    const quoteDate = new Date(event.target.value);
    const validationDate = new Date(quoteDate);
    validationDate.setDate(validationDate.getDate() + 10);
    this.createQuoteForm.patchValue({
      validation_deadline: this.formatDate(validationDate),
    });
  }
}
