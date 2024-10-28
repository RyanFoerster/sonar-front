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
    () => this.currentDate.toISOString().split('T')[0],
  );

  protected startDate = computed(() =>
    this.currentDate.toISOString().slice(0, 10),
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

  goBack() {
    this.location.back();
  }

  constructor() {
    this.createQuoteForm = this.formBuilder.group({
      quote_date: [this.formatDate(new Date()), [Validators.required]],
      service_date: [this.formatDate(new Date()), [Validators.required]],
      payment_deadline: ['', [Validators.required]],
      validation_deadline: [this.formatDate(new Date()), [Validators.required]],
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

  // createProduct() {
  //   if (this.createProductForm.valid && this.client()) {
  //     const { vat, ...createProductDto } = this.createProductForm.value;
  //     const productToAdd = { ...this.createProductForm.value };

  //     if (
  //       (this.client()?.country === 'Belgique' ||
  //         this.client()?.country === 'Suisse' ||
  //         this.client()?.country === 'Royaume-Uni') &&
  //       this.client()?.company_number
  //     ) {
  //       if (!this.client()?.company_vat_number) {
  //         if (!vat) {
  //           productToAdd.vat = 0.21;
  //         } else {
  //           productToAdd.vat = 0.06;
  //         }
  //       } else {
  //         productToAdd.vat = 0;
  //       }
  //     } else {
  //       productToAdd.vat = 0;
  //     }

  //     if (this.isTvaIncluded()) {
  //       productToAdd.vat = 0;
  //     }

  //     this.productService
  //       .createProduct(productToAdd)
  //       .pipe(
  //         take(1),
  //         tap((data) => {
  //           this.products().push(data);
  //           this.calculateQuoteAmount(data);

  //           this.createProductForm.reset();
  //           this.createProductForm.get('vat')?.patchValue(false);
  //           this.toggleProductForm();
  //         }),
  //       )
  //       .subscribe();
  //   }
  // }

  createProduct() {
    if (!this.createProductForm.valid || !this.client()) return;

    const { vat, ...productToAdd } = this.createProductForm.value;
    productToAdd.vat = this.calculateVat(vat);
    console.log('productToAdd', productToAdd);
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

  createQuote() {
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
      [this.typeOfProjet() === 'PRINCIPAL'
        ? 'main_account_id'
        : 'group_account_id']: +this.id()!,
      isVatIncluded: this.isTvaIncluded(),
    };

    this.quoteService
      .createQuote(quote)
      .pipe(
        take(1),
        tap(() => this.goBack()),
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
        tap(() => this.goBack()),
      )
      .subscribe();
  }
}
