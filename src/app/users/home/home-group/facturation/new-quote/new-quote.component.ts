import {AfterViewInit, Component, effect, inject, input, signal} from '@angular/core';
import {HlmInputDirective} from '@spartan-ng/ui-input-helm';
import {HlmLabelDirective} from "@spartan-ng/ui-label-helm";
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import {HlmSeparatorDirective} from '@spartan-ng/ui-separator-helm';
import {BrnSeparatorComponent} from '@spartan-ng/ui-separator-brain';
import {BrnSelectImports} from '@spartan-ng/ui-select-brain';
import {HlmSelectImports} from '@spartan-ng/ui-select-helm';
import {HlmButtonDirective} from "@spartan-ng/ui-button-helm";
import {HlmIconComponent} from "@spartan-ng/ui-icon-helm";
import {provideIcons} from "@ng-icons/core";
import {
  lucideAlertTriangle,
  lucideCheck, lucideCornerDownLeft,
  lucideEdit,
  lucideFileDown,
  lucidePlus,
  lucidePlusCircle,
  lucideTrash, lucideUndo2,
  lucideXCircle
} from "@ng-icons/lucide";
import {EuroFormatPipe} from "../../../../../shared/pipes/euro-format.pipe";
import {BrnDialogContentDirective, BrnDialogTriggerDirective} from '@spartan-ng/ui-dialog-brain';
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogDescriptionDirective,
  HlmDialogFooterComponent,
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective,
} from '@spartan-ng/ui-dialog-helm';
import {ClientEntity} from "../../../../../shared/entities/client.entity";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgClass, PercentPipe} from "@angular/common";
import {ClientService} from "../../../../../shared/services/client.service";
import {ClientDto} from "../../../../../shared/dtos/client.dto";
import {tap} from "rxjs";
import {UserEntity} from "../../../../../shared/entities/user.entity";
import {UsersService} from "../../../../../shared/services/users.service";
import {
  HlmAlertDescriptionDirective,
  HlmAlertDirective,
  HlmAlertIconDirective,
  HlmAlertTitleDirective
} from "@spartan-ng/ui-alert-helm";
import {HlmCheckboxComponent} from "@spartan-ng/ui-checkbox-helm";
import {ProductService} from "../../../../../shared/services/product.service";
import {ProductEntity} from "../../../../../shared/entities/product.entity";
import {QuoteDto} from "../../../../../shared/dtos/quote.dto";
import {QuoteService} from "../../../../../shared/services/quote.service";
import {Router} from "@angular/router";
import { Location } from '@angular/common';
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
  ],
  providers: [provideIcons({
    lucidePlusCircle,
    lucideTrash,
    lucideEdit,
    lucideFileDown,
    lucidePlus,
    lucideCheck,
    lucideXCircle,
    lucideAlertTriangle,
    lucideUndo2,
    lucideCornerDownLeft
  })],
  templateUrl: './new-quote.component.html',
  styleUrl: './new-quote.component.css'
})
export class NewQuoteComponent implements AfterViewInit {

  private formBuilder: FormBuilder = inject(FormBuilder)
  private clientService: ClientService = inject(ClientService)
  private usersService: UsersService = inject(UsersService);
  private productService: ProductService = inject(ProductService)
  private quoteService: QuoteService = inject(QuoteService)
  private location: Location = inject(Location)

  protected client = signal<ClientEntity | null>(null)
  protected connectedUser = signal<UserEntity | null>(null)
  protected products = signal<ProductEntity[]>([])
  protected totalHtva = signal(0)
  protected tva21 = signal(0)
  protected tva6 = signal(0)
  protected total = signal(0)
  protected id = input<number>()
  protected typeOfProjet = input<string>()

  protected isToggleClientForm = signal(false)
  protected isToggleProductForm = signal(false)
  protected isArtisticPerformance = signal(false)

  protected createQuoteForm!: FormGroup
  protected createClientForm!: FormGroup
  protected createProductForm!: FormGroup

  goBack() {
    this.location.back()
  }

  constructor() {

    this.createQuoteForm = this.formBuilder.group({
      quote_date: [new Date(), [Validators.required]],
      service_date: [new Date(), [Validators.required]],
      payment_deadline: ['', [Validators.required]],
      validation_deadline: ['', [Validators.required]],
    })

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
    })

    this.createProductForm = this.formBuilder.group({
      description: ['', [Validators.required]],
      price: ['', [Validators.required]],
      vat: [false, [Validators.required]],
      quantity: [1, [Validators.required]],
    })



  }

  async ngAfterViewInit() {
    await this.getConnectedUser()

  }

  async getConnectedUser() {
    this.usersService.getInfo().pipe(
      tap((data) => this.connectedUser.set(data))
    ).subscribe()
  }

  toggleClientForm() {
    this.isToggleClientForm.set(!this.isToggleClientForm());
  }

  toggleProductForm() {
    this.isToggleProductForm.set(!this.isToggleProductForm());
  }

  toggleArtisticPerformance() {
    this.isArtisticPerformance.set(!this.isArtisticPerformance());
    console.log(this.isArtisticPerformance())
  }

  createClient() {
    if (this.createClientForm.valid) {
      this.clientService.create(this.createClientForm.value as ClientDto).pipe(
        tap(async data => {
          await this.getConnectedUser()
          this.toggleClientForm()
        })
      ).subscribe()
    }
  }

  setClient(id: number) {
    this.clientService.getOneById(id).pipe(
      tap((data) => {
        this.client.set(data)
        this.products.set([])
        this.tva6.set(0)
        this.tva21.set(0)
        this.totalHtva.set(0)
        this.total.set(0)
      })
    ).subscribe()
  }

  createProduct() {
    if (this.createProductForm.valid && this.client()) {
      const {vat, ...createProductDto} = this.createProductForm.value
      const productToAdd = {...this.createProductForm.value}

      if (this.client()?.country === "Belgique" && this.client()?.company_number) {
        if (!vat) {
          productToAdd.vat = 0.21
        } else {
          productToAdd.vat = 0.06
        }
      } else {
        productToAdd.vat = 0
      }



      this.productService.createProduct(productToAdd).pipe(
        tap((data) => {
          this.products().push(data)
          this.totalHtva.set(this.products().reduce((a, b) => a + b.price_htva!, 0))

          if (data.vat === 0.21) {
            this.tva21.set(this.setTva21(this.products()))
          }

          if (data.vat === 0.06) {
            this.tva6.set(this.setTva6(this.products()))
          }

          this.total.set(this.totalHtva() + this.tva21() + this.tva6())

          this.createProductForm.reset()
          this.createProductForm.get('vat')?.patchValue(false)
          this.toggleProductForm()
        })
      ).subscribe()
    }
  }

  deleteProduct(id: number) {
    // Filtrer les produits pour exclure celui avec l'ID spécifié
    const updatedProducts = this.products().filter((product) => product.id !== id);
    // Mettre à jour le signal products avec le nouveau tableau
    this.products.set(updatedProducts);

    this.totalHtva.set(this.products().reduce((a, b) => a + b.price_htva!, 0))

    if (updatedProducts.length > 0) {
      for (let product of updatedProducts) {
        if (product.vat === 0.21) this.tva21.set(this.setTva21(updatedProducts))
        if (product.vat === 0.06) this.tva6.set(this.setTva6(updatedProducts))

      }
    } else {
      this.tva21.set(0)
      this.tva6.set(0)
    }


    this.total.set(this.totalHtva() + this.tva21() + this.tva6())


  }

  setTva21(products: ProductEntity[]) {
    const products_tva_21 = products.filter((product) => product.vat === 0.21)
    return products_tva_21.reduce((a, b) => a + b.tva_amount!, 0)
  }

  setTva6(products: ProductEntity[]) {
    const products_tva_6 = products.filter((product) => product.vat === 0.06)
    return products_tva_6.reduce((a, b) => a + b.tva_amount!, 0)
  }

  createQuote() {

    if (this.createQuoteForm.valid && this.client() && this.products().length > 0) {
      let quote: QuoteDto = this.createQuoteForm.value
      quote.products_id = []
      quote.client_id = this.client()?.id!
      for (const product of this.products()) {
        quote.products_id.push(product.id!)
      }


      if(this.typeOfProjet() === 'PRINCIPAL') {
        quote.main_account_id = +this.id()!
      } else {
        quote.group_account_id = +this.id()!
      }



      this.quoteService.createQuote(quote).pipe(
        tap(async () => this.goBack())
      ).subscribe()

    }

  }

}
