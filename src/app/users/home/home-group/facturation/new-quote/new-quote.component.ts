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
  lucideSearch,
  lucideTrash,
  lucideUndo2,
  lucideXCircle,
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
import { take, tap } from 'rxjs';
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
    }),
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
    () => this.currentDate.toISOString().split('T')[0],
  );

  protected startDate = computed(() =>
    this.currentDate.toISOString().slice(0, 10),
  );

  protected clients = signal<ClientEntity[]>([]);
  protected updatedQuote = signal<QuoteEntity | null>(null);

  protected paysEuropeens: string[] = [
    'Albanie',
    'Allemagne',
    'Andorre',
    'Arménie',
    'Autriche',
    'Azerbaïdjan',
    'Belgique',
    'Biélorussie',
    'Bosnie-Herzégovine',
    'Bulgarie',
    'Chypre',
    'Croatie',
    'Danemark',
    'Espagne',
    'Estonie',
    'Finlande',
    'France',
    'Géorgie',
    'Grèce',
    'Hongrie',
    'Irlande',
    'Islande',
    'Italie',
    'Kazakhstan',
    'Kosovo',
    'Lettonie',
    'Liechtenstein',
    'Lituanie',
    'Luxembourg',
    'Macédoine du Nord',
    'Malte',
    'Moldavie',
    'Monaco',
    'Monténégro',
    'Norvège',
    'Pays-Bas',
    'Pologne',
    'Portugal',
    'Roumanie',
    'Royaume-Uni',
    'Russie',
    'Saint-Marin',
    'Serbie',
    'Slovaquie',
    'Slovénie',
    'Suède',
    'Suisse',
    'Tchéquie',
    'Ukraine',
    'Vatican',
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

  goBack() {
    this.location.back();
  }

  constructor() {
    this.createQuoteForm = this.formBuilder.group({
      quote_date: [new Date(), [Validators.required]],
      service_date: [new Date(), [Validators.required]],
      payment_deadline: ['', [Validators.required]],
      validation_deadline: ['', [Validators.required]],
      comment: ['', [Validators.required]],
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
          }),
        )
        .subscribe();
    }
    if (this.updatedQuoteId()) {
      this.quoteService
        .getQuote(this.updatedQuoteId()!)
        .pipe(
          tap((data) => {
            this.updatedQuote.set(data);
            this.isTvaIncluded.set(data.isVatIncluded);
            this.createQuoteForm.patchValue({
              quote_date: data.quote_date,
              service_date: data.service_date,
              payment_deadline: data.payment_deadline,
              validation_deadline: data.validation_deadline,
              comment: data.comment,
            });

            this.products.set(
              data.products.map((product) => {
                return {
                  ...product,
                };
              }),
            );

            this.client.set(data.client);
            this.currentClient.set(data.client);
            this.tva21.set(this.setTva21(this.products()));
            this.tva6.set(this.setTva6(this.products()));
            this.totalHtva.set(
              this.products().reduce((a, b) => a + b.price_htva!, 0),
            );
            this.total.set(this.totalHtva() + this.tva21() + this.tva6());
          }),
        )
        .subscribe();
    }
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

  toggleClientForm() {
    this.isToggleClientForm.set(!this.isToggleClientForm());
  }

  toggleProductForm() {
    this.isToggleProductForm.set(!this.isToggleProductForm());
  }

  toggleEditProductForm() {
    if (this.isTvaIncluded()) {
      this.isTvaIncluded.set(false);
      this.advertiseMessage.set(
        'Pour des questions de simplicité, lors de la modification d\'un service, la case à cocher "Montant TVA comprise" est décochée. Pensez à la remettre à chaque modification de service.',
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
          this.tva6(),
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
        this.products().reduce((a, b) => a + b.price_htva! + b.tva_amount!, 0),
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
    if (this.createClientForm.value.company_number) {
      this.clientService
        .checkBce(this.createClientForm.value.company_number)
        .pipe(
          take(1),
          tap((data) => {
            this.isValidBCENumber.set(data.Vat.isValid);
            this.createClientForm
              .get('company_vat_number')
              ?.patchValue(data.Vat.vatNumber);
            this.createClientForm
              .get('name')
              ?.patchValue(data.Vat.details.name);
            // Extraire les différentes parties de l'adresse
            const addressParts = data.Vat.details.address.split('\n'); // Diviser la chaîne en deux parties : rue + numéro et code postal + ville
            const streetAndNumber = addressParts[0]; // "Rue du Moulin 78"
            const postalAndCity = addressParts[1]; // "4020 Liège"

            // Utiliser une expression régulière pour extraire le numéro et la rue
            const streetMatch = streetAndNumber.match(/^(.+?)\s+(\d+)$/);
            const street = streetMatch[1]; // Rue du Moulin
            const number = streetMatch[2]; // 78

            // Diviser le code postal et la ville
            const postalAndCityParts = postalAndCity.split(' ');
            const postalCode = postalAndCityParts[0]; // 4020
            const city = postalAndCityParts.slice(1).join(' '); // Liège

            this.createClientForm.get('street')?.patchValue(street);
            this.createClientForm.get('number')?.patchValue(number);
            this.createClientForm.get('postalCode')?.patchValue(postalCode);
            this.createClientForm.get('city')?.patchValue(city);
          }),
        )
        .subscribe();
    }
  }

  getIsValidBCENumber() {
    return this.isValidBCENumber();
  }

  createClient() {
    if (this.createClientForm.valid) {
      this.clientService
        .create(this.createClientForm.value as ClientDto)
        .pipe(
          tap(async (data) => {
            this.setClient(data.id);
            if (this.connectedUser()?.role === 'ADMIN') {
              this.clients().push(data);
              this.authService.saveUser(this.connectedUser()!);
            } else {
              this.connectedUser()?.clients.push(data);
              this.authService.saveUser(this.connectedUser()!);
            }
            this.currentClient.set(data);

            this.toggleClientForm();
            this.isPhysicalPerson.set(false);
          }),
        )
        .subscribe();
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

  createProduct() {
    if (this.createProductForm.valid && this.client()) {
      const { vat, ...createProductDto } = this.createProductForm.value;
      const productToAdd = { ...this.createProductForm.value };

      if (
        this.client()?.country === 'Belgique' &&
        this.client()?.company_number
      ) {
        if (!vat) {
          productToAdd.vat = 0.21;
        } else {
          productToAdd.vat = 0.06;
        }
      } else {
        productToAdd.vat = 0;
      }

      if (this.isTvaIncluded()) {
        productToAdd.vat = 0;
      }

      this.productService
        .createProduct(productToAdd)
        .pipe(
          take(1),
          tap((data) => {
            this.products().push(data);
            this.calculateQuoteAmount(data);

            this.createProductForm.reset();
            this.createProductForm.get('vat')?.patchValue(false);
            this.toggleProductForm();
          }),
        )
        .subscribe();
    }
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
    // Filtrer les produits pour exclure celui avec l'ID spécifié
    const updatedProducts = this.products().filter(
      (product) => product.id !== id,
    );
    // Mettre à jour le signal products avec le nouveau tableau
    this.products.set(updatedProducts);

    this.totalHtva.set(this.products().reduce((a, b) => a + b.price_htva!, 0));

    if (updatedProducts.length > 0) {
      for (let product of updatedProducts) {
        if (product.vat === 0.21)
          this.tva21.set(this.setTva21(updatedProducts));
        if (product.vat === 0.06) this.tva6.set(this.setTva6(updatedProducts));
      }
    } else {
      this.tva21.set(0);
      this.tva6.set(0);
    }

    this.total.set(this.totalHtva() + this.tva21() + this.tva6());
    if (this.products().length === 0) {
      this.isTvaIncluded.set(false);
    }
  }

  setTva21(products: ProductEntity[]) {
    const products_tva_21 = products.filter((product) => product.vat === 0.21);
    if (this.isTvaIncluded()) {
      return (
        products_tva_21.reduce((a, b) => a + b.price * b.quantity!, 0) * 0.21
      );
    }

    return products_tva_21.reduce((a, b) => a + b.price_htva!, 0) * 0.21;
  }

  setTva6(products: ProductEntity[]) {
    const products_tva_6 = products.filter((product) => product.vat === 0.06);
    return products_tva_6.reduce((a, b) => a + b.tva_amount!, 0);
  }

  createQuote() {
    if (
      this.createQuoteForm.valid &&
      this.client() &&
      this.products().length > 0
    ) {
      let quote: QuoteDto = this.createQuoteForm.value;
      quote.products_id = [];
      quote.client_id = this.client()?.id!;
      for (const product of this.products()) {
        quote.products_id.push(product.id!);
      }

      if (this.typeOfProjet() === 'PRINCIPAL') {
        quote.main_account_id = +this.id()!;
      } else {
        quote.group_account_id = +this.id()!;
      }

      if (this.isTvaIncluded()) {
        quote.isVatIncluded = true;
      }

      this.quoteService
        .createQuote(quote)
        .pipe(tap(async () => this.goBack()))
        .subscribe();
    }
  }

  updateQuote() {
    if (
      this.createQuoteForm.valid &&
      this.client() &&
      this.products().length > 0
    ) {
      let quote: QuoteDto = this.createQuoteForm.value;
      quote.products_id = [];
      quote.client_id = this.client()?.id!;
      for (const product of this.products()) {
        quote.products_id.push(product.id!);
      }

      if (this.isTvaIncluded()) {
        quote.isVatIncluded = true;
      } else {
        quote.isVatIncluded = false;
      }

      this.quoteService
        .updateQuote(this.updatedQuoteId()!, quote)
        .pipe(tap(async () => this.goBack()))
        .subscribe();
    }
  }
}
