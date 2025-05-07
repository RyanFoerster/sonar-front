import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  inject,
  signal,
  computed,
  input,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Location, DatePipe, NgClass } from '@angular/common';
import { firstValueFrom, take, tap } from 'rxjs';
import { toast } from 'ngx-sonner';
import { ClientEntity } from '../../../../../shared/entities/client.entity';
import { ProductEntity } from '../../../../../shared/entities/product.entity';
import { QuoteEntity } from '../../../../../shared/entities/quote.entity';
import { ClientService } from '../../../../../shared/services/client.service';
import { ProductService } from '../../../../../shared/services/product.service';
import { QuoteService } from '../../../../../shared/services/quote.service';
import { AuthService } from '../../../../../shared/services/auth.service';
import {
  ProjectAttachment,
  ProjectAttachmentService,
} from '../../../../../shared/services/user-attachment.service';
import { UserEntity } from '../../../../../shared/entities/user.entity';
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
  lucideUpload,
  lucideLoader,
  lucideFolder,
  lucideFileText,
  lucideSave,
  lucideFiles,
  lucideEye,
  lucideInfo,
} from '@ng-icons/lucide';

import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmCheckboxComponent } from '@spartan-ng/ui-checkbox-helm';

import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';

import { HlmToasterComponent } from '@spartan-ng/ui-sonner-helm';

import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';

import { EuroFormatPipe } from '../../../../../shared/pipes/euro-format.pipe';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { QuoteDto } from '../../../../../shared/dtos/quote.dto';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-new-quote',
  standalone: true,
  imports: [
    HlmInputDirective,
    HlmLabelDirective,
    BrnSelectImports,
    HlmSelectImports,
    HlmButtonDirective,
    HlmIconComponent,
    EuroFormatPipe,

    HlmLabelDirective,
    HlmInputDirective,
    HlmButtonDirective,
    HlmIconComponent,
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    HlmCheckboxComponent,
    HlmIconComponent,
    HlmIconComponent,
    HlmIconComponent,
    DatePipe,
    HlmToasterComponent,
    QuillModule,
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
      lucideUpload,
      lucideLoader,
      lucideFolder,
      lucideFileText,
      lucideSave,
      lucideFiles,
      lucideEye,
      lucideInfo,
    }),
    DatePipe,
  ],
  templateUrl: './new-quote.component.html',
  styleUrl: './new-quote.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewQuoteComponent implements AfterViewInit {
  private formBuilder: FormBuilder = inject(FormBuilder);
  private clientService: ClientService = inject(ClientService);
  private productService: ProductService = inject(ProductService);
  private quoteService: QuoteService = inject(QuoteService);
  private location: Location = inject(Location);
  private authService: AuthService = inject(AuthService);
  private datePipe: DatePipe = inject(DatePipe);
  private userAttachmentService: ProjectAttachmentService = inject(
    ProjectAttachmentService
  );
  private changeDetectorRef: ChangeDetectorRef = inject(ChangeDetectorRef);

  protected client = signal<ClientEntity | null>(null);
  protected connectedUser = signal<UserEntity | null>(null);
  protected products = signal<ProductEntity[]>([]);
  protected totalHtva = signal(0);
  protected tva21 = signal(0);
  protected tva6 = signal(0);
  protected total = signal(0);
  protected isValidBCENumber = signal<boolean | null>(null);
  protected isUpdating = signal(false);
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
  protected isTva0 = signal(false);
  protected isLoadingQuote = signal(false);
  protected isDoubleValidation = signal(true);
  protected showDoubleValidationWarningModal = signal(false);

  // Ajout du signal pour la modale de confirmation d'édition de produit
  protected showEditProductConfirmationModal = signal(false);

  protected createQuoteForm!: FormGroup;
  protected createClientForm!: FormGroup;
  protected createProductForm!: FormGroup;
  protected editProductForm!: FormGroup;
  protected searchForm!: FormGroup;

  protected isClientSelectOpen = signal(false);
  protected selectedClient = signal<ClientEntity | null>(null);
  protected filteredClients = signal<ClientEntity[]>([]);

  protected searchControl = new FormControl('');

  protected modifiedProducts = signal<ProductEntity[]>([]);

  protected file = signal<File[]>([]);
  protected selectedFiles: File[] = [];
  protected existingAttachments = signal<{ url: string; name: string }[]>([]);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  isDragging = false;
  selectedFile: File | null = null;

  protected userAttachments = signal<ProjectAttachment[]>([]);
  protected selectedAttachments = signal<ProjectAttachment[]>([]);
  protected selectedAttachment = signal<ProjectAttachment | null>(null);
  protected showAttachmentModal = signal(false);

  // Configuration personnalisée pour Quill
  quillModules = {
    toolbar: [
      ['link'], // Uniquement le bouton pour les liens
    ],
  };

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.filterClients(value || '');
      });

    this.createQuoteForm = this.formBuilder.group({
      quote_date: [
        this.datePipe.transform(this.currentDate, 'yyyy-MM-dd'),
        Validators.required,
      ],
      service_date: ['', Validators.required],
      payment_deadline: [10, [Validators.required]],
      validation_deadline: [
        this.datePipe.transform(
          new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000),
          'yyyy-MM-dd'
        ),
        Validators.required,
      ],
      client_id: ['', Validators.required],
      products: [[]],
      vat_included: [false],
      type_of_project: [''],
      comment: ['', [Validators.maxLength(2000)]],
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
      default_payment_deadline: [10, [Validators.min(10), Validators.max(30)]],
      is_info_pending: [false],
    });
    console.log(
      'Form after init, is_physical_person:',
      this.createClientForm.get('is_physical_person')?.value
    );

    this.createClientForm
      .get('is_info_pending')
      ?.valueChanges.subscribe((isPending) => {
        this.toggleClientFieldsValidation(isPending);
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

    this.userAttachmentService = inject(ProjectAttachmentService);
  }

  async ngAfterViewInit() {
    await this.getConnectedUser();

    // Adapter les validateurs pour le délai de paiement par défaut en fonction du rôle
    const deadlineControl = this.createClientForm.get(
      'default_payment_deadline'
    );
    if (deadlineControl) {
      if (this.connectedUser()?.role === 'ADMIN') {
        // Pour les admins: minimum 1 jour, pas de max
        deadlineControl.setValidators([Validators.required, Validators.min(1)]);
      } else {
        // Pour les autres: min 10, max 30
        deadlineControl.setValidators([
          Validators.required,
          Validators.min(10),
          Validators.max(30),
        ]);
      }
      deadlineControl.updateValueAndValidity(); // Mettre à jour la validité
    }

    // --- AJOUT : Adapter les validateurs pour le délai de paiement du DEVIS ---
    const quotePaymentDeadlineControl =
      this.createQuoteForm.get('payment_deadline');
    if (quotePaymentDeadlineControl) {
      if (this.connectedUser()?.role !== 'ADMIN') {
        // Pour les non-admins: ajouter min 10, max 30
        quotePaymentDeadlineControl.addValidators([
          Validators.min(10),
          Validators.max(30),
        ]);
      } else {
        // Pour les admins: s'assurer que min et max sont retirés s'ils existaient
        quotePaymentDeadlineControl.removeValidators([
          Validators.min(10),
          Validators.max(30),
        ]);
        // Optionnel: ajouter un min(1) si nécessaire pour les admins
        // quotePaymentDeadlineControl.addValidators(Validators.min(1));
      }
      quotePaymentDeadlineControl.updateValueAndValidity(); // Mettre à jour la validité
    }
    // --- FIN AJOUT ---

    await this.loadUserAttachments();

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
      this.isLoadingQuote.set(true);
      try {
        const quote = (await firstValueFrom(
          this.quoteService.getQuote(this.updatedQuoteId()!)
        )) as QuoteEntity;
        this.updatedQuote.set(quote);

        // Initialiser les pièces jointes existantes
        if (quote.attachment_url && Array.isArray(quote.attachment_url)) {
          const attachments = quote.attachment_url.map((url: string) => ({
            url,
            name: this.extractFileNameFromUrl(url),
          }));
          this.existingAttachments.set(attachments);
        }

        this.client.set(quote.client);
        this.products.set(quote.products);
        this.isTvaIncluded.set(quote.isVatIncluded);

        // Formater les dates avant de les assigner au formulaire
        this.createQuoteForm.patchValue({
          quote_date: this.formatDate(new Date(quote.quote_date)),
          service_date: this.formatDate(new Date(quote.service_date)),
          payment_deadline: quote.payment_deadline,
          validation_deadline: this.formatDate(
            new Date(quote.validation_deadline)
          ),
          comment: quote.comment,
        });

        this.calculateTotals();
        this.isLoadingQuote.set(false);
      } catch (error) {
        console.error('Erreur lors de la récupération du devis:', error);
        this.isLoadingQuote.set(false);
      }
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

  toggleDoubleValidation(event: MouseEvent) {
    const currentState = this.isDoubleValidation();
    console.log(`Click event on checkbox. Current state: ${currentState}`);

    if (currentState) {
      // Currently checked, attempt to uncheck
      console.log('Preventing default uncheck, showing modal.');
      event.preventDefault(); // Empêche le changement visuel immédiat
      this.showDoubleValidationWarningModal.set(true);
    } else {
      // Currently unchecked, attempt to check
      console.log('Allowing check, setting state to true.');
      this.isDoubleValidation.set(true);
      // Laisser le comportement par défaut cocher la case
    }
  }

  confirmDoubleValidationChange() {
    console.log('Confirming uncheck.');
    this.isDoubleValidation.set(false);
    this.showDoubleValidationWarningModal.set(false);
  }

  cancelDoubleValidationChange() {
    console.log('Cancelling uncheck. State remains true.');
    this.showDoubleValidationWarningModal.set(false);
    // Pas besoin de changer l'état ou de forcer la détection,
    // car le décochage initial a été empêché par preventDefault.
  }

  toggleClientForm(isNewClient: boolean) {
    if (isNewClient) {
      this.createClientForm.reset();
      this.createClientForm.patchValue({
        is_physical_person: false,
        is_info_pending: false, // Explicite après reset
      });
      this.isPhysicalPerson.set(false);
      this.createClientForm.patchValue({
        country: 'Belgique',
        is_physical_person: false,
        is_info_pending: false, // Redondant mais sûr
      });
    } else {
      if (this.client()) {
        const currentClient = this.client()!;
        const isPhysical = currentClient.is_physical_person || false;
        const isInfoPending = currentClient.is_info_pending || false;
        this.isPhysicalPerson.set(isPhysical);
        // Note: Il n'y a pas de signal dédié pour isInfoPending dans le code actuel pour le .set()

        const defaultDeadline = currentClient.default_payment_deadline ?? 10;

        if (isPhysical) {
          this.createClientForm.patchValue({
            firstname: currentClient.firstname,
            lastname: currentClient.lastname,
            name: `${currentClient.firstname} ${currentClient.lastname}`.trim(),
            email: currentClient.email,
            phone: currentClient.phone,
            street: currentClient.street,
            number: currentClient.number,
            city: currentClient.city,
            country: currentClient.country,
            postalCode: currentClient.postalCode,
            national_number: currentClient.national_number,
            is_physical_person: true,
            is_info_pending: isInfoPending, // Ajouté
            default_payment_deadline: defaultDeadline,
          });
        } else {
          this.createClientForm.patchValue({
            name: currentClient.name,
            email: currentClient.email,
            phone: currentClient.phone,
            street: currentClient.street,
            number: currentClient.number,
            city: currentClient.city,
            country: currentClient.country,
            postalCode: currentClient.postalCode,
            company_number: currentClient.company_number,
            company_vat_number: currentClient.company_vat_number,
            is_physical_person: false,
            is_info_pending: isInfoPending, // Ajouté
            default_payment_deadline: defaultDeadline,
          });
        }
      } else {
        this.createClientForm.reset();
        this.createClientForm.patchValue({
          is_physical_person: false,
          is_info_pending: false, // Explicite après reset
        });
        this.isPhysicalPerson.set(false);
        this.createClientForm.patchValue({
          country: 'Belgique',
          default_payment_deadline: 10,
          is_physical_person: false,
          is_info_pending: false, // Ajouté
        });
      }
    }
    this.isToggleClientForm.set(!this.isToggleClientForm());
    console.log(
      'Form after toggleClientForm, is_physical_person:',
      this.createClientForm.get('is_physical_person')?.value
    );
    console.log(
      'Form after toggleClientForm, is_info_pending:',
      this.createClientForm.get('is_info_pending')?.value
    ); // Log pour is_info_pending
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
    this.createClientForm.patchValue({
      is_physical_person: this.isPhysicalPerson(),
    });

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
    console.log(
      'Form after togglePhysicalPerson, is_physical_person:',
      this.createClientForm.get('is_physical_person')?.value
    );
  }

  async toggleTvaIncluded() {
    this.isTvaIncluded.set(!this.isTvaIncluded());
    this.checkTvaIncluded();
  }

  toggleTva0() {
    this.isTva0.set(!this.isTva0());
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
      // Si TVA incluse, on recalcule les montants HTVA
      this.products.update((products) => {
        return products.map((product) => {
          const priceWithVAT = product.price * product.quantity;
          const vatRate = product.vat;
          const priceHTVA = priceWithVAT / (1 + vatRate);
          const tvaAmount = priceWithVAT - priceHTVA;

          return {
            ...product,
            price_htva: priceHTVA,
            tva_amount: tvaAmount,
            total: priceWithVAT,
          };
        });
      });
    } else {
      // Si TVA non incluse, on recalcule les montants avec TVA
      this.products.update((products) => {
        return products.map((product) => {
          const priceHTVA = product.price * product.quantity;
          const tvaAmount = priceHTVA * product.vat;
          const total = priceHTVA + tvaAmount;

          return {
            ...product,
            price_htva: priceHTVA,
            tva_amount: tvaAmount,
            total: total,
          };
        });
      });
    }

    // Recalculer les totaux
    this.calculateTotals();

    // Mettre à jour les produits modifiés
    for (const product of this.products()) {
      const existingIndex = this.modifiedProducts().findIndex(
        (p) => p.id === product.id
      );
      if (existingIndex !== -1) {
        this.modifiedProducts.update((products) => {
          products[existingIndex] = product;
          return [...products];
        });
      } else {
        this.modifiedProducts.update((products) => [...products, product]);
      }
    }
  }

  checkBCE() {
    this.isValidBCENumber.set(null);
    const companyNumber = this.createClientForm.get('company_number')?.value;
    if (!companyNumber) return;

    // Supprime les espaces et les points dans le numéro de TVA
    const formattedCompanyNumber = companyNumber
      .replace(/\s+/g, '')
      .replace(/\./g, '');

    this.clientService
      .checkBce(formattedCompanyNumber)
      .pipe(
        take(1),
        tap((data) => {
          this.isValidBCENumber.set(data ? true : false);

          const { entrepriseName, street, addressNumber, postalCode, city } =
            data;

          this.createClientForm.patchValue({
            company_vat_number: formattedCompanyNumber,
            name: entrepriseName,
            street,
            number: addressNumber,
            postalCode,
            city,
          });
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
    if (this.createClientForm.invalid) {
      this.createClientForm.markAllAsTouched();
      toast.error('Veuillez corriger les erreurs dans le formulaire client.');
      return;
    }

    console.log('createClient', this.createClientForm.value);

    const clientData = this.createClientForm.value;
    const userId = this.connectedUser()?.id;

    if (!userId) {
      toast.error('Erreur: Utilisateur non connecté.');
      return;
    }

    // Si is_info_pending, ne garder que l'email et le flag
    let dataToSend: Partial<ClientEntity> = {};
    if (clientData.is_info_pending) {
      dataToSend = {
        email: clientData.email,
        is_info_pending: true,
        country: clientData.country, // Garder le pays sélectionné
        is_physical_person: clientData.is_physical_person, // Garder le type
      };
    } else {
      dataToSend = clientData;
      console.log('dataToSend', dataToSend);
    }

    this.clientService
      .create(dataToSend as Partial<ClientEntity>)
      .pipe(take(1))
      .subscribe({
        next: (newClient: ClientEntity) => {
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
          this.clients.set(clientList);

          // Mise à jour du client actuel
          this.currentClient.set(newClient);
          this.client.set(newClient);

          // Réinitialisation du formulaire et des états
          console.log(
            'Form BEFORE partial reset in createClient, is_physical_person:',
            this.createClientForm.get('is_physical_person')?.value
          );
          this.createClientForm.reset({
            country: 'Belgique',
            default_payment_deadline: 10,
            is_physical_person: false, // Assurer la réinitialisation explicite
            is_info_pending: false, // Assurer la réinitialisation explicite
          });
          console.log(
            'Form AFTER partial reset in createClient, is_physical_person:',
            this.createClientForm.get('is_physical_person')?.value
          );
          console.log(
            'Form AFTER partial reset in createClient, is_info_pending:',
            this.createClientForm.get('is_info_pending')?.value
          ); // Log pour is_info_pending
          this.toggleClientForm(false);
          console.log(
            'Form AFTER toggleClientForm in createClient, is_physical_person:',
            this.createClientForm.get('is_physical_person')?.value
          );
          this.isPhysicalPerson.set(false);

          // Sauvegarde de l'utilisateur connecté
          this.authService.setUser(this.connectedUser()!);
          toast.success('Client créé avec succès');
        },
        error: (error: unknown) => {
          console.error('Erreur lors de la création du client:', error);
          toast.error('Erreur lors de la création du client');
        },
      });
  }

  updateClient() {
    if (this.createClientForm.valid && this.client()) {
      const formData = { ...this.createClientForm.value };

      // Si c'est une personne physique, on combine firstname et lastname pour le name
      if (this.isPhysicalPerson()) {
        formData.name = `${formData.firstname} ${formData.lastname}`.trim();
        formData.is_physical_person = true;
      } else {
        formData.is_physical_person = false;
      }

      this.clientService
        .update(this.client()!.id, formData)
        .pipe(
          take(1),
          tap(() => {
            // Mettre à jour le client dans la liste
            const updatedClient = { ...this.client(), ...formData };
            const clientList =
              this.connectedUser()?.role === 'ADMIN'
                ? this.clients()
                : this.connectedUser()!.clients;
            const existingIndex = clientList.findIndex(
              (client) => client.id === updatedClient.id
            );

            if (existingIndex !== -1) {
              clientList[existingIndex] = updatedClient;
            }
            this.clients.set(clientList);

            // Mise à jour du client actuel
            this.currentClient.set(updatedClient);
            this.client.set(updatedClient);

            // Mettre à jour aussi le délai de paiement du formulaire de devis
            const paymentDeadline =
              updatedClient.default_payment_deadline ?? 10;
            this.createQuoteForm.patchValue({
              payment_deadline: paymentDeadline,
            });

            // Réinitialisation du formulaire et des états
            this.createClientForm.reset({
              country: 'Belgique',
              default_payment_deadline: 10,
              is_physical_person: false, // Assurer la réinitialisation explicite
              is_info_pending: false, // Assurer la réinitialisation explicite
            });
            this.toggleClientForm(false);
            this.isPhysicalPerson.set(false);

            // Notification de succès
            toast.success('Client mis à jour avec succès');
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
          // Pré-remplir le délai de paiement du devis avec celui du client, sinon 10 jours
          const paymentDeadline = data.default_payment_deadline ?? 10;
          this.createQuoteForm.patchValue({
            payment_deadline: paymentDeadline,
          });
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
      vat: this.isTva0() ? 0 : formValues.vat ? 0.06 : 0.21,
    };

    // Calcul des montants en fonction de isTvaIncluded
    let price_htva, tva_amount, total;

    if (this.isTva0()) {
      price_htva = productToAdd.price * productToAdd.quantity;
      tva_amount = 0;
      total = price_htva;
    } else if (this.isTvaIncluded()) {
      // Si TVA incluse, on recalcule les montants HTVA
      const priceWithVAT = productToAdd.price * productToAdd.quantity;
      const vatRate = productToAdd.vat;
      price_htva = priceWithVAT / (1 + vatRate);
      tva_amount = priceWithVAT - price_htva;
      total = priceWithVAT;
    } else {
      // Si TVA non incluse, on recalcule les montants avec TVA
      price_htva = productToAdd.price * productToAdd.quantity;
      tva_amount = price_htva * productToAdd.vat;
      total = price_htva + tva_amount;
    }

    const completeProduct = {
      ...productToAdd,
      price_htva,
      tva_amount,
      total,
    };

    console.log('Creating product with TVA included:', this.isTvaIncluded());
    console.log('Product data:', completeProduct);

    this.productService
      .createProduct(completeProduct)
      .pipe(
        take(1),
        tap((newProduct) => {
          console.log('Product created:', newProduct);
          const currentProducts = this.products();
          this.products.set([...currentProducts, newProduct]);
          this.calculateTotals();
          this.createProductForm.reset();
          this.createProductForm.patchValue({ quantity: 1, vat: false });
          this.toggleProductForm();
          this.isTva0.set(false);
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
      const productData = {
        description,
        price: +price,
        quantity: +quantity,
        vat: vat ? 0.06 : 0.21,
      };

      // Calcul des montants
      const price_htva = productData.price * productData.quantity;
      const tva_amount = price_htva * productData.vat;
      const total = price_htva + tva_amount;

      const updatedProduct = {
        ...productData,
        price_htva,
        tva_amount,
        total,
      };

      this.productService
        .update(
          this.idProductToEdit()?.toString() || '',
          updatedProduct,
          this.isTvaIncluded()
        )
        .pipe(take(1))
        .subscribe({
          next: (product) => {
            // Stocker le produit modifié dans notre liste temporaire
            const existingIndex = this.modifiedProducts().findIndex(
              (p) => p.id === product.id
            );
            if (existingIndex !== -1) {
              this.modifiedProducts.update((products) => {
                products[existingIndex] = product;
                return [...products];
              });
            } else {
              this.modifiedProducts.update((products) => [
                ...products,
                product,
              ]);
            }

            // Mettre à jour l'affichage
            const index = this.products().findIndex((p) => p.id === product.id);
            if (index !== -1) {
              this.products.update((products) => {
                products[index] = product;
                return [...products];
              });
            }

            this.calculateTotals();
            this.toggleEditProductForm();
            this.editProductForm.reset();
          },
          error: (error) => {
            console.error('Error updating product:', error);
          },
        });
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
    const baseAmount = products_tva_21.reduce((a, b) => a + b.price_htva!, 0);
    return baseAmount * 0.21;
  }

  setTva6(products: ProductEntity[]) {
    const products_tva_6 = products.filter((product) => product.vat === 0.06);
    const baseAmount = products_tva_6.reduce((a, b) => a + b.price_htva!, 0);
    return baseAmount * 0.06;
  }

  private getAllAttachmentKeys(): string[] {
    const keys: string[] = [];

    // Ajouter les clés des pièces jointes sélectionnées
    this.selectedAttachments().forEach((attachment) => {
      if (attachment.key) {
        keys.push(attachment.key);
      }
    });

    // Ajouter les clés des fichiers uploadés
    if (this.selectedFiles.length > 0) {
      this.selectedFiles.forEach((file) => {
        const key = `uploads/${file.name}`;
        keys.push(key);
      });
    }

    return keys;
  }

  createQuote() {
    if (this.createQuoteForm.valid) {
      const quote = {
        ...this.createQuoteForm.value,
        products_id: this.products().map((product) => product.id!),
        client_id: this.client()!.id,
        isVatIncluded: this.isTvaIncluded(),
        total: this.total(),
        tva21: this.tva21(),
        tva6: this.tva6(),
        totalHtva: this.totalHtva(),
        attachment_keys: this.getAllAttachmentKeys(),
      };

      // Ajouter l'ID du compte en fonction du type de projet
      if (this.typeOfProjet() === 'PRINCIPAL') {
        quote.main_account_id = this.id();
      } else {
        quote.group_account_id = this.id();
      }

      console.log('Fichiers à envoyer:', this.selectedFiles);

      this.quoteService
        .createQuote(quote, this.selectedFiles, this.isDoubleValidation())
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.isLoadingQuote.set(false);
            this.location.back();
          },
          error: (error: Error) => {
            this.isLoadingQuote.set(false);
            console.error('Error creating quote:', error);
            toast.error('Erreur lors de la création du devis');
          },
        });
    } else {
      this.isLoadingQuote.set(false);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      let hasInvalidFile = false;
      Array.from(files).forEach((file) => {
        if (this.isValidPdfFile(file)) {
          this.handleFile(file);
        } else {
          hasInvalidFile = true;
        }
      });

      if (hasInvalidFile) {
        toast.error('Seuls les fichiers PDF sont acceptés');
      }
    }
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files && files.length > 0) {
      let hasInvalidFile = false;
      Array.from(files).forEach((file) => {
        if (this.isValidPdfFile(file)) {
          this.handleFile(file);
        } else {
          hasInvalidFile = true;
        }
      });

      if (hasInvalidFile) {
        toast.error('Seuls les fichiers PDF sont acceptés');
        input.value = '';
      }
    }
  }

  private handleFile(file: File) {
    if (!this.isValidPdfFile(file)) {
      console.error(
        'Format de fichier non valide. Seuls les fichiers PDF sont acceptés.'
      );
      return;
    }
    this.selectedFiles.push(file);
    this.file.update((files) => [...files, file]);
  }

  private isValidPdfFile(file: File): boolean {
    return file.type === 'application/pdf';
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.file.update((files) => files.filter((_, i) => i !== index));
    if (this.selectedFiles.length === 0 && this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  removeAllFiles() {
    this.selectedFiles = [];
    this.file.set([]);
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  async updateQuote() {
    this.isLoadingQuote.set(true);

    if (!this.client() || !this.updatedQuoteId()) {
      this.isLoadingQuote.set(false);
      return;
    }

    // Logs pour vérifier quelle propriété n'est pas valid dans mon formulaire
    // Vérifier la validité de chaque contrôle du formulaire
    Object.keys(this.createQuoteForm.controls).forEach((key) => {
      const control = this.createQuoteForm.get(key);
      console.log(
        `Contrôle ${key}: valeur = ${control?.value}, valide = ${control?.valid}, erreurs = `,
        control?.errors
      );
    });

    // Afficher l'état global du formulaire
    console.log(`Formulaire complet valide: ${this.createQuoteForm.valid}`);
    console.log(`Valeurs du formulaire:`, this.createQuoteForm.value);

    const quoteDto: QuoteDto = {
      quote_date: new Date(this.createQuoteForm.get('quote_date')?.value),
      service_date: new Date(this.createQuoteForm.get('service_date')?.value),
      payment_deadline: this.createQuoteForm.get('payment_deadline')?.value,
      validation_deadline: new Date(
        this.createQuoteForm.get('validation_deadline')?.value
      ),
      client_id: this.client()!.id,
      products_id: this.products().map((product) => product.id!),
      isVatIncluded: this.isTvaIncluded(),
      comment: this.createQuoteForm.get('comment')?.value || '',
      attachment_keys: [
        ...this.existingAttachments().map((attachment) =>
          this.extractS3KeyFromUrl(attachment.url)
        ),
        ...this.selectedFiles.map(
          (file) => `quote/${this.updatedQuoteId()}/${file.name}`
        ),
      ],
    };

    console.log('Fichiers à envoyer pour mise à jour:', this.selectedFiles);

    try {
      await firstValueFrom(
        this.quoteService.updateQuote(
          this.updatedQuoteId() || '',
          quoteDto,
          this.selectedFiles,
          this.isDoubleValidation()
        )
      );
      this.isLoadingQuote.set(false);
      this.goBack();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du devis:', error);
      this.isLoadingQuote.set(false);
      toast.error('Erreur lors de la mise à jour du devis');
    }
  }

  toggleClientSelect() {
    this.isClientSelectOpen.set(!this.isClientSelectOpen());
    if (this.isClientSelectOpen()) {
      this.filterClients('');
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

  updateValidationDeadline(event: Event) {
    const quoteDate = new Date((event.target as HTMLInputElement).value);
    const validationDate = new Date(quoteDate);
    validationDate.setDate(validationDate.getDate() + 10);
    this.createQuoteForm.patchValue({
      validation_deadline: this.formatDate(validationDate),
    });
  }

  async loadUserAttachments() {
    const projectId = this.id();
    if (!projectId) return;

    if (this.typeOfProjet() === 'PRINCIPAL') {
      this.userAttachmentService
        .getProjectAttachments('principal', projectId)
        .pipe(
          take(1),
          tap((attachments: ProjectAttachment[]) => {
            this.userAttachments.set(attachments);
          })
        )
        .subscribe();
    } else {
      this.userAttachmentService
        .getProjectAttachments('groupe', projectId)
        .pipe(
          take(1),
          tap((attachments: ProjectAttachment[]) => {
            this.userAttachments.set(attachments);
          })
        )
        .subscribe();
    }
  }

  selectUserAttachment(attachment: ProjectAttachment) {
    const currentSelected = this.selectedAttachments();
    const index = currentSelected.findIndex((a) => a.id === attachment.id);

    if (index === -1) {
      // Ajouter à la sélection
      this.selectedAttachments.update((attachments) => [
        ...attachments,
        attachment,
      ]);
    } else {
      // Retirer de la sélection
      this.selectedAttachments.update((attachments) =>
        attachments.filter((a) => a.id !== attachment.id)
      );
    }
  }

  isAttachmentSelected(attachment: ProjectAttachment): boolean {
    return this.selectedAttachments().some((a) => a.id === attachment.id);
  }

  addSelectedAttachmentsToQuote() {
    const projectId = this.id();
    if (!projectId) {
      toast.error('ID du projet non trouvé');
      return;
    }

    if (this.selectedAttachments().length === 0) {
      toast.error('Aucune pièce jointe sélectionnée');
      return;
    }

    const projectType =
      this.typeOfProjet() === 'PRINCIPAL' ? 'principal' : 'groupe';
    let hasError = false;

    // Traiter chaque pièce jointe individuellement
    const downloadPromises = this.selectedAttachments().map((attachment) => {
      return new Promise<void>((resolve) => {
        this.userAttachmentService
          .downloadAttachment(attachment.id, projectType, projectId)
          .subscribe({
            next: (blob) => {
              // Vérifier si le fichier existe déjà dans selectedFiles
              const fileExists = this.selectedFiles.some(
                (file) => file.name === attachment.name
              );

              if (!fileExists) {
                const file = new File([blob], attachment.name, {
                  type: 'application/pdf',
                });
                this.selectedFiles.push(file);
                this.file.set(this.selectedFiles);
              }
              resolve();
            },
            error: (error) => {
              console.error(
                `Erreur lors du téléchargement de ${attachment.name}:`,
                error
              );
              hasError = true;
              toast.error(
                `Impossible de récupérer le fichier ${attachment.name}`
              );
              resolve(); // On résout quand même pour continuer avec les autres fichiers
            },
          });
      });
    });

    // Attendre que tous les téléchargements soient terminés
    Promise.all(downloadPromises)
      .then(() => {
        if (!hasError) {
          toast.success('Pièces jointes ajoutées avec succès');
        }
        // Fermer la modal et réinitialiser la sélection même en cas d'erreur partielle
        this.showAttachmentModal.set(false);
        this.selectedAttachments.set([]);
      })
      .catch((error) => {
        console.error('Erreur lors du traitement des pièces jointes:', error);
        toast.error(
          'Une erreur est survenue lors du traitement des pièces jointes'
        );
      });
  }

  async saveAsAttachment(fileToSave: File) {
    const projectId = this.id();
    if (!projectId) return;

    // Vérifier si un fichier avec le même nom existe déjà
    const existingAttachment = this.userAttachments().find(
      (attachment) => attachment.name === fileToSave.name
    );

    if (existingAttachment) {
      toast.error('Un fichier avec ce nom existe déjà dans vos pièces jointes');
      return;
    }

    const description = await this.openDescriptionDialog();
    if (description !== null) {
      const projectType =
        this.typeOfProjet() === 'PRINCIPAL' ? 'principal' : 'groupe';

      this.userAttachmentService
        .uploadAttachment(fileToSave, projectType, projectId, description)
        .pipe(
          take(1),
          tap((attachment) => {
            // Ajouter le nouveau fichier à userAttachments
            this.userAttachments.update((attachments) => [
              ...attachments,
              attachment,
            ]);

            // Ne pas retirer le fichier de selectedFiles
            // Mettre à jour le signal file pour refléter le statut actuel
            this.file.set([...this.selectedFiles]);

            toast.success('Pièce jointe sauvegardée avec succès');
          })
        )
        .subscribe({
          error: (error) => {
            console.error('Erreur lors de la sauvegarde:', error);
            toast.error('Erreur lors de la sauvegarde de la pièce jointe');
          },
        });
    }
  }

  async openDescriptionDialog(): Promise<string | null> {
    return new Promise((resolve) => {
      const description = prompt(
        'Description de la pièce jointe (optionnel):',
        ''
      );
      resolve(description);
    });
  }

  async deleteAttachment(id: number, event: Event) {
    event.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer cette pièce jointe ?')) {
      const projectId = this.id();
      if (!projectId) return;

      const projectType =
        this.typeOfProjet() === 'PRINCIPAL' ? 'principal' : 'groupe';

      this.userAttachmentService
        .deleteAttachment(id, projectType, projectId)
        .pipe(
          take(1),
          tap(() => {
            this.userAttachments.update((attachments) =>
              attachments.filter((a) => a.id !== id)
            );
            if (this.selectedAttachment()?.id === id) {
              this.selectedAttachment.set(null);
              this.selectedFile = null;
              this.file.set([]);
            }
          })
        )
        .subscribe();
    }
  }

  async previewAttachment(attachment: ProjectAttachment, event: Event) {
    event.stopPropagation();
    this.userAttachmentService.previewAttachment(attachment);
  }

  private extractFileNameFromUrl(url: string | string[]): string {
    if (Array.isArray(url)) {
      return url.length > 0 ? this.extractFileNameFromUrl(url[0]) : '';
    }
    const decodedUrl = decodeURIComponent(url);
    const parts = decodedUrl.split('/');
    return parts[parts.length - 1];
  }

  private extractS3KeyFromUrl(url: string | string[]): string {
    if (Array.isArray(url)) {
      return url.length > 0 ? this.extractS3KeyFromUrl(url[0]) : '';
    }
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1);
    } catch (error) {
      console.error("Erreur lors de l'extraction de la clé S3:", error);
      return '';
    }
  }

  toggleAttachmentModal() {
    this.showAttachmentModal.set(!this.showAttachmentModal());
  }

  isFileAlreadySaved(fileName: string): boolean {
    return this.userAttachments().some(
      (attachment) => attachment.name === fileName
    );
  }

  removeExistingAttachment(attachment: { url: string; name: string }) {
    this.existingAttachments.update((attachments) =>
      attachments.filter((a) => a.url !== attachment.url)
    );
  }

  // Fonction pour vérifier qu'au moins une pièce jointe est séléctionnée
  // lorsqu'il y a au moins un produit avec une tva à 0
  isAtLeastOneAttachmentSelected(): boolean {
    // Vérifie s'il existe au moins un produit avec TVA 0% dans le signal products()
    const requiresAttachment = this.products().some(
      (product) => product.vat === 0
    );

    if (requiresAttachment) {
      // Si la TVA 0% existe, vérifie si au moins un nouveau fichier (selectedFiles)
      // OU une pièce jointe existante (existingAttachments()) est sélectionné pour le devis
      const hasSelectedNewFiles = this.selectedFiles.length > 0;
      const hasSelectedExistingAttachments =
        this.existingAttachments().length > 0;
      return hasSelectedNewFiles || hasSelectedExistingAttachments;
    } else {
      // Si aucun produit n'a de TVA 0%, la condition de pièce jointe n'est pas requise par cette règle.
      // La fonction retourne true, et la désactivation du bouton dépendra uniquement de la validité du formulaire.
      return true;
    }
  }

  // Nouvelle méthode pour gérer la validation dynamique
  private toggleClientFieldsValidation(isPending: boolean): void {
    const fieldsToToggle = [
      'name',
      'firstname',
      'lastname',
      'phone',
      'street',
      'number',
      'city',
      'postalCode',
      'company_number',
      'company_vat_number',
      'national_number',
      'default_payment_deadline',
    ];
    const emailControl = this.createClientForm.get('email');
    // Le champ 'country' n'est pas désactivé par is_info_pending

    if (isPending) {
      fieldsToToggle.forEach((fieldName) => {
        this.createClientForm.get(fieldName)?.clearValidators();
        this.createClientForm.get(fieldName)?.disable(); // Désactiver le champ
        this.createClientForm.get(fieldName)?.updateValueAndValidity();
      });
      // Assurer que l'email reste requis et activé
      emailControl?.setValidators([Validators.required, Validators.email]);
      emailControl?.enable(); // S'assurer qu'il est activé
      emailControl?.updateValueAndValidity();
    } else {
      // Rétablir les validateurs et activer les champs
      // Exemple pour 'name' si c'est une entreprise :
      if (!this.isPhysicalPerson()) {
        this.createClientForm.get('name')?.setValidators([Validators.required]);
      } else {
        this.createClientForm
          .get('firstname')
          ?.setValidators([Validators.required]);
        this.createClientForm
          .get('lastname')
          ?.setValidators([Validators.required]);
      }
      this.createClientForm.get('phone')?.setValidators([Validators.required]);
      this.createClientForm.get('street')?.setValidators([Validators.required]);
      this.createClientForm.get('number')?.setValidators([Validators.required]);
      this.createClientForm.get('city')?.setValidators([Validators.required]);
      this.createClientForm
        .get('postalCode')
        ?.setValidators([Validators.required]);
      emailControl?.setValidators([Validators.required, Validators.email]);
      emailControl?.enable(); // S'assurer qu'il est activé

      const deadlineControl = this.createClientForm.get(
        'default_payment_deadline'
      );
      const min = this.connectedUser()?.role === 'ADMIN' ? 1 : 10; // Correction: min 1 pour ADMIN
      const max = this.connectedUser()?.role === 'ADMIN' ? null : 30;
      const validators = [Validators.required];
      validators.push(Validators.min(min)); // Toujours un min
      if (max !== null) validators.push(Validators.max(max));
      deadlineControl?.setValidators(validators);

      // Activer tous les champs et mettre à jour leur validité
      fieldsToToggle.forEach((fieldName) => {
        this.createClientForm.get(fieldName)?.enable(); // Activer le champ
        this.createClientForm.get(fieldName)?.updateValueAndValidity();
      });
      emailControl?.updateValueAndValidity();
      deadlineControl?.updateValueAndValidity();
    }
  }

  // Nouvelle fonction pour ouvrir la modale de confirmation
  openEditProductConfirmation() {
    if (this.editProductForm.valid) {
      this.showEditProductConfirmationModal.set(true);
    }
  }

  // Fonction appelée lors de la confirmation dans la modale
  confirmEditProduct() {
    this.editProductToDB(); // Appelle la logique originale de mise à jour
    this.showEditProductConfirmationModal.set(false); // Ferme la modale
  }

  // Fonction pour annuler depuis la modale
  cancelEditProduct() {
    this.showEditProductConfirmationModal.set(false); // Ferme la modale
  }
}
