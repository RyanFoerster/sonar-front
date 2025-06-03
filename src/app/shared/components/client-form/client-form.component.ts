import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ClientEntity } from '../../entities/client.entity';
import { ClientService } from '../../services/client.service';
import { AuthService } from '../../services/auth.service';
import { take, tap } from 'rxjs';
import { toast } from 'ngx-sonner';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmCheckboxComponent } from '@spartan-ng/ui-checkbox-helm';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    HlmButtonDirective,
    HlmCheckboxComponent,
    HlmIconComponent,
    HlmInputDirective,
    HlmLabelDirective,
    BrnSelectImports,
    HlmSelectImports,
    NgClass,
  ],
  templateUrl: './client-form.component.html',
})
export class ClientFormComponent {
  @Input() client: ClientEntity | null = null;
  @Output() closeForm = new EventEmitter<void>();
  @Output() clientCreated = new EventEmitter<ClientEntity>();
  @Output() clientUpdated = new EventEmitter<ClientEntity>();

  private formBuilder: FormBuilder = inject(FormBuilder);
  private clientService: ClientService = inject(ClientService);
  private authService: AuthService = inject(AuthService);

  protected isValidBCENumber = signal<boolean | null>(null);
  protected isPhysicalPerson = signal<boolean>(false);
  protected connectedUser = signal<any>(null);

  protected createClientForm!: FormGroup;

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
    this.initForm();
    this.getConnectedUser();
  }

  private initForm() {
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

    this.createClientForm
      .get('is_info_pending')
      ?.valueChanges.subscribe((isPending) => {
        this.toggleClientFieldsValidation(isPending);
      });

    if (this.client) {
      this.patchFormWithClientData();
    }
  }

  private patchFormWithClientData() {
    if (!this.client) return;

    const isPhysical = this.client.is_physical_person || false;
    this.isPhysicalPerson.set(isPhysical);

    if (isPhysical) {
      this.createClientForm.patchValue({
        firstname: this.client.firstname,
        lastname: this.client.lastname,
        name: `${this.client.firstname} ${this.client.lastname}`.trim(),
        email: this.client.email,
        phone: this.client.phone,
        street: this.client.street,
        number: this.client.number,
        city: this.client.city,
        country: this.client.country,
        postalCode: this.client.postalCode,
        national_number: this.client.national_number,
        is_physical_person: true,
        is_info_pending: this.client.is_info_pending,
        default_payment_deadline: this.client.default_payment_deadline || 10,
      });
    } else {
      this.createClientForm.patchValue({
        name: this.client.name,
        email: this.client.email,
        phone: this.client.phone,
        street: this.client.street,
        number: this.client.number,
        city: this.client.city,
        country: this.client.country,
        postalCode: this.client.postalCode,
        company_number: this.client.company_number,
        company_vat_number: this.client.company_vat_number,
        is_physical_person: false,
        is_info_pending: this.client.is_info_pending,
        default_payment_deadline: this.client.default_payment_deadline || 10,
      });
    }
  }

  async getConnectedUser() {
    this.connectedUser.set(this.authService.getUser());
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

    this.createClientForm.get('name')?.updateValueAndValidity();
    this.createClientForm.get('firstname')?.updateValueAndValidity();
    this.createClientForm.get('lastname')?.updateValueAndValidity();
    this.createClientForm.get('company_number')?.updateValueAndValidity();
    this.createClientForm.get('company_vat_number')?.updateValueAndValidity();
  }

  checkBCE() {
    this.isValidBCENumber.set(null);
    const companyNumber = this.createClientForm.get('company_number')?.value;
    if (!companyNumber) return;

    const formattedCompanyNumber = companyNumber
      .replace(/\s+/g, '')
      .replace(/\./g, '');

    this.clientService
      .checkBce(formattedCompanyNumber)
      .pipe(
        take(1),
        tap((data) => {
          this.isValidBCENumber.set(data ? true : false);

          if (data) {
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
          }
        }),
      )
      .subscribe();
  }

  getIsValidBCENumber() {
    return this.isValidBCENumber();
  }

  onSubmit() {
    if (this.createClientForm.invalid) {
      this.createClientForm.markAllAsTouched();
      toast.error('Veuillez corriger les erreurs dans le formulaire client.');
      return;
    }

    const clientData = this.createClientForm.value;
    const userId = this.connectedUser()?.id;

    if (!userId) {
      toast.error('Erreur: Utilisateur non connecté.');
      return;
    }

    let dataToSend: Partial<ClientEntity> = {};
    if (clientData.is_info_pending) {
      dataToSend = {
        email: clientData.email,
        is_info_pending: true,
        country: clientData.country,
        is_physical_person: clientData.is_physical_person,
      };
    } else {
      dataToSend = clientData;
    }

    if (clientData.is_physical_person) {
      clientData.name = `${clientData.firstname} ${clientData.lastname}`.trim();
    }

    if (this.client) {
      // Update
      this.clientService
        .update(this.client.id, dataToSend)
        .pipe(take(1))
        .subscribe({
          next: (updatedClient) => {
            this.clientUpdated.emit(updatedClient);
            this.closeForm.emit();
            toast.success('Client mis à jour avec succès');
          },
          error: (error) => {
            console.error('Erreur lors de la mise à jour du client:', error);
            toast.error('Erreur lors de la mise à jour du client');
          },
        });
    } else {
      // Create
      this.clientService
        .create(dataToSend)
        .pipe(take(1))
        .subscribe({
          next: (newClient) => {
            this.clientCreated.emit(newClient);
            this.closeForm.emit();
            toast.success('Client créé avec succès');
          },
          error: (error) => {
            console.error('Erreur lors de la création du client:', error);
            toast.error('Erreur lors de la création du client');
          },
        });
    }
  }

  formatNationalNumber(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      formatted += digits[i];
      if (i === 1 || i === 3) formatted += '.';
      if (i === 5) formatted += '-';
      if (i === 8) formatted += '.';
    }
    return formatted;
  }

  onNationalNumberInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value;
    const selectionStart = input.selectionStart || 0;

    let digitCount = 0;
    for (let i = 0; i < selectionStart; i++) {
      if (/\d/.test(rawValue[i])) digitCount++;
    }

    const digits = rawValue.replace(/\D/g, '').slice(0, 11);
    const newFormatted = this.formatNationalNumber(digits);

    let newCursor = 0,
      count = 0;
    for (let i = 0; i < newFormatted.length && count < digitCount; i++) {
      if (/\d/.test(newFormatted[i])) count++;
      newCursor = i + 1;
    }

    this.createClientForm
      .get('national_number')
      ?.setValue(digits, { emitEvent: false });
    input.value = newFormatted;

    setTimeout(() => {
      input.setSelectionRange(newCursor, newCursor);
    }, 0);
  }

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

    if (isPending) {
      fieldsToToggle.forEach((fieldName) => {
        this.createClientForm.get(fieldName)?.clearValidators();
        this.createClientForm.get(fieldName)?.disable();
        this.createClientForm.get(fieldName)?.updateValueAndValidity();
      });
      emailControl?.setValidators([Validators.required, Validators.email]);
      emailControl?.enable();
      emailControl?.updateValueAndValidity();
    } else {
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
      emailControl?.enable();

      const deadlineControl = this.createClientForm.get(
        'default_payment_deadline',
      );
      const min = this.connectedUser()?.role === 'ADMIN' ? 1 : 10;
      const max = this.connectedUser()?.role === 'ADMIN' ? null : 30;
      const validators = [Validators.required];
      validators.push(Validators.min(min));
      if (max !== null) validators.push(Validators.max(max));
      deadlineControl?.setValidators(validators);

      fieldsToToggle.forEach((fieldName) => {
        this.createClientForm.get(fieldName)?.enable();
        this.createClientForm.get(fieldName)?.updateValueAndValidity();
      });
      emailControl?.updateValueAndValidity();
      deadlineControl?.updateValueAndValidity();
    }
  }
}
