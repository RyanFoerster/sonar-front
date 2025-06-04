import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
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

interface CountryRule {
  pattern: string;
  errorMessage: string;
  placeholder?: string;
  prefix?: string;
  validator?: ValidatorFn;
}

interface CountryRules {
  postalCode: CountryRule;
  phone: CountryRule;
  vat: CountryRule;
  company?: CountryRule;
  nationalNumber?: CountryRule;
}

interface CountryRulesMap {
  [key: string]: CountryRules;
}

interface NationalNumberValidators {
  [key: string]: ValidatorFn;
}

interface PhoneValidators {
  [key: string]: ValidatorFn;
}

interface PostalCodeValidators {
  [key: string]: ValidatorFn;
}

interface VatValidators {
  [key: string]: ValidatorFn;
}

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
export class ClientFormComponent implements OnInit {
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
    'Slovénie',
    'Slovaquie',
    'Suède',
    'Suisse',
    'Royaume-Uni',
  ];

  protected countryRules = signal<CountryRulesMap>({
    Allemagne: {
      postalCode: {
        pattern: '^[0-9]{5}$',
        errorMessage: 'Le code postal allemand doit contenir 5 chiffres',
        placeholder: '10115',
      },
      phone: {
        pattern: '^(\\+49|0)\\s*[1-9][0-9\\s]{8,14}$',
        errorMessage:
          'Le numéro de téléphone allemand doit être au format +49... ou 0...',
        placeholder: '+49 XXX XXXXXXX',
        prefix: '+49',
      },
      vat: {
        pattern: '^DE[0-9]{9}$',
        errorMessage:
          'Le numéro de TVA allemand doit être au format DE + 9 chiffres',
        placeholder: '123456789',
        prefix: 'DE',
      },
      company: {
        pattern: '^[0-9]{9}$',
        errorMessage:
          "Le numéro d'entreprise allemand doit contenir 9 chiffres",
        placeholder: '123456789',
      },
      nationalNumber: {
        pattern: '^[0-9]{11}$',
        errorMessage:
          "Le numéro d'identification allemand (Steuer-ID) doit contenir 11 chiffres",
        placeholder: 'XXXXXXXXXXX',
      },
    },
    Autriche: {
      postalCode: {
        pattern: '^[0-9]{4}$',
        errorMessage: 'Le code postal autrichien doit contenir 4 chiffres',
        placeholder: '1010',
      },
      phone: {
        pattern: '^(\\+43|0)[1-9][0-9]{8,11}$',
        errorMessage:
          'Le numéro de téléphone autrichien doit être au format +43... ou 0...',
        placeholder: '+43 XXX XXX XXX',
        prefix: '+43',
      },
      vat: {
        pattern: '^ATU[0-9]{8}$',
        errorMessage:
          'Le numéro de TVA autrichien doit être au format ATU + 8 chiffres',
        placeholder: 'ATU12345678',
        prefix: 'ATU',
      },
    },
    Belgique: {
      postalCode: {
        pattern: '^[1-9][0-9]{3}$',
        errorMessage: 'Le code postal belge doit contenir 4 chiffres',
        placeholder: '1000',
      },
      phone: {
        pattern: '^(\\+32\\s?|0)(?:[1-9]|4[789])[0-9\\s]{7,9}$',
        errorMessage:
          'Le numéro de téléphone belge doit être au format +32... ou 0...',
        placeholder: '+32 XXX XX XX XX',
        prefix: '+32',
      },
      vat: {
        pattern: '^[0-9]{10}$',
        errorMessage: 'Le numéro de TVA belge doit contenir 10 chiffres',
        placeholder: '0123456789',
        prefix: 'BE',
      },
      company: {
        pattern: '^[0-9]{10}$',
        errorMessage: "Le numéro d'entreprise belge doit contenir 10 chiffres",
        placeholder: '0123456789',
      },
      nationalNumber: {
        pattern: '^[0-9]{2}[.][0-9]{2}[.][0-9]{2}[-][0-9]{3}[.][0-9]{2}$',
        errorMessage:
          'Le numéro national belge doit être au format YY.MM.DD-XXX.XX',
        placeholder: '00.00.00-000.00',
      },
    },
    Bulgarie: {
      postalCode: {
        pattern: '^[0-9]{4}$',
        errorMessage: 'Le code postal bulgare doit contenir 4 chiffres',
        placeholder: '1000',
      },
      phone: {
        pattern: '^(\\+359|0)[1-9][0-9]{8}$',
        errorMessage:
          'Le numéro de téléphone bulgare doit être au format +359... ou 0...',
        placeholder: '+359 XX XXX XXX',
        prefix: '+359',
      },
      vat: {
        pattern: '^BG[0-9]{9,10}$',
        errorMessage:
          'Le numéro de TVA bulgare doit être au format BG + 9 ou 10 chiffres',
        placeholder: 'BG123456789',
        prefix: 'BG',
      },
    },
    Chypre: {
      postalCode: {
        pattern: '^[0-9]{4}$',
        errorMessage: 'Le code postal chypriote doit contenir 4 chiffres',
        placeholder: '1000',
      },
      phone: {
        pattern: '^(\\+357|0)[1-9][0-9]{7}$',
        errorMessage:
          'Le numéro de téléphone chypriote doit être au format +357... ou 0...',
        placeholder: '+357 XX XX XX XX',
        prefix: '+357',
      },
      vat: {
        pattern: '^CY[0-9]{8}[A-Z]$',
        errorMessage:
          'Le numéro de TVA chypriote doit être au format CY + 8 chiffres + 1 lettre',
        placeholder: 'CY12345678X',
        prefix: 'CY',
      },
    },
    Croatie: {
      postalCode: {
        pattern: '^[0-9]{5}$',
        errorMessage: 'Le code postal croate doit contenir 5 chiffres',
        placeholder: '10000',
      },
      phone: {
        pattern: '^(\\+385|0)[1-9][0-9]{8}$',
        errorMessage:
          'Le numéro de téléphone croate doit être au format +385... ou 0...',
        placeholder: '+385 XX XXX XXX',
        prefix: '+385',
      },
      vat: {
        pattern: '^HR[0-9]{11}$',
        errorMessage:
          'Le numéro de TVA croate doit être au format HR + 11 chiffres',
        placeholder: 'HR12345678901',
        prefix: 'HR',
      },
    },
    Danemark: {
      postalCode: {
        pattern: '^[0-9]{4}$',
        errorMessage: 'Le code postal danois doit contenir 4 chiffres',
        placeholder: '1000',
      },
      phone: {
        pattern: '^(\\+45|0)[1-9][0-9]{7}$',
        errorMessage:
          'Le numéro de téléphone danois doit être au format +45... ou 0...',
        placeholder: '+45 XX XX XX XX',
        prefix: '+45',
      },
      vat: {
        pattern: '^DK[0-9]{8}$',
        errorMessage:
          'Le numéro de TVA danois doit être au format DK + 8 chiffres',
        placeholder: 'DK12345678',
        prefix: 'DK',
      },
    },
    Espagne: {
      postalCode: {
        pattern: '^[0-9]{5}$',
        errorMessage: 'Le code postal espagnol doit contenir 5 chiffres',
        placeholder: '28001',
      },
      phone: {
        pattern: '^(\\+34|0)[6789][0-9]{8}$',
        errorMessage:
          'Le numéro de téléphone espagnol doit être au format +34... ou 0...',
        placeholder: '+34 XXX XXX XXX',
        prefix: '+34',
      },
      vat: {
        pattern: '^ES[A-Z0-9][0-9]{7}[A-Z0-9]$',
        errorMessage:
          'Le numéro de TVA espagnol doit être au format ES + 9 caractères',
        placeholder: 'ESX1234567X',
        prefix: 'ES',
      },
      nationalNumber: {
        pattern: '^[0-9]{8}[A-Z]$',
        errorMessage:
          "Le DNI espagnol doit contenir 8 chiffres suivis d'une lettre",
        placeholder: '12345678X',
      },
    },
    Estonie: {
      postalCode: {
        pattern: '^[0-9]{5}$',
        errorMessage: 'Le code postal estonien doit contenir 5 chiffres',
        placeholder: '10000',
      },
      phone: {
        pattern: '^(\\+372|0)[1-9][0-9]{6,7}$',
        errorMessage:
          'Le numéro de téléphone estonien doit être au format +372... ou 0...',
        placeholder: '+372 XXX XXXX',
        prefix: '+372',
      },
      vat: {
        pattern: '^EE[0-9]{9}$',
        errorMessage:
          'Le numéro de TVA estonien doit être au format EE + 9 chiffres',
        placeholder: 'EE123456789',
        prefix: 'EE',
      },
    },
    Finlande: {
      postalCode: {
        pattern: '^[0-9]{5}$',
        errorMessage: 'Le code postal finlandais doit contenir 5 chiffres',
        placeholder: '00100',
      },
      phone: {
        pattern: '^(\\+358|0)[1-9][0-9]{8}$',
        errorMessage:
          'Le numéro de téléphone finlandais doit être au format +358... ou 0...',
        placeholder: '+358 XX XXX XXX',
        prefix: '+358',
      },
      vat: {
        pattern: '^FI[0-9]{8}$',
        errorMessage:
          'Le numéro de TVA finlandais doit être au format FI + 8 chiffres',
        placeholder: 'FI12345678',
        prefix: 'FI',
      },
    },
    France: {
      postalCode: {
        pattern: '^[0-9]{5}$',
        errorMessage: 'Le code postal français doit contenir 5 chiffres',
        placeholder: '75001',
      },
      phone: {
        pattern: '^(\\+33\\s?|0)[1-9](?:\\s?\\d{2}){4}$',
        errorMessage:
          'Le numéro de téléphone français doit commencer par +33 ou 0, suivi de 9 chiffres',
        placeholder: '+33 6 12 34 56 78',
        prefix: '+33',
      },
      vat: {
        pattern: '^[0-9]{11}$',
        errorMessage: 'Le numéro de TVA français doit contenir 11 chiffres',
        placeholder: '12345678901',
        prefix: 'FR',
      },
      company: {
        pattern: '^[0-9]{14}$',
        errorMessage: 'Le numéro SIRET doit contenir 14 chiffres',
        placeholder: 'SIRET (14 chiffres)',
      },
      nationalNumber: {
        pattern: '^[123][0-9]{2}[0-9]{2}[0-9]{2}[0-9]{3}[0-9]{3}[0-9]{2}$',
        errorMessage:
          'Le numéro de sécurité sociale français doit contenir 15 chiffres',
        placeholder: '1 ou 2 + AA MM DD XXX XXX XX',
      },
    },
    Grèce: {
      postalCode: {
        pattern: '^[0-9]{5}$',
        errorMessage: 'Le code postal grec doit contenir 5 chiffres',
        placeholder: '10000',
      },
      phone: {
        pattern: '^(\\+30|0)[1-9][0-9]{9}$',
        errorMessage:
          'Le numéro de téléphone grec doit être au format +30... ou 0...',
        placeholder: '+30 XXX XXX XXXX',
        prefix: '+30',
      },
      vat: {
        pattern: '^EL[0-9]{9}$',
        errorMessage:
          'Le numéro de TVA grec doit être au format EL + 9 chiffres',
        placeholder: 'EL123456789',
        prefix: 'EL',
      },
    },
    Hongrie: {
      postalCode: {
        pattern: '^[0-9]{4}$',
        errorMessage: 'Le code postal hongrois doit contenir 4 chiffres',
        placeholder: '1000',
      },
      phone: {
        pattern: '^(\\+36|0)[1-9][0-9]{8}$',
        errorMessage:
          'Le numéro de téléphone hongrois doit être au format +36... ou 0...',
        placeholder: '+36 XX XXX XXXX',
        prefix: '+36',
      },
      vat: {
        pattern: '^HU[0-9]{8}$',
        errorMessage:
          'Le numéro de TVA hongrois doit être au format HU + 8 chiffres',
        placeholder: 'HU12345678',
        prefix: 'HU',
      },
    },
    Irlande: {
      postalCode: {
        pattern: '^[A-Z0-9]{3}[ ]?[A-Z0-9]{4}$',
        errorMessage:
          'Le code postal irlandais doit être au format Eircode (ex: A65 F4E2)',
        placeholder: 'A65 F4E2',
      },
      phone: {
        pattern: '^(\\+353|0)[1-9][0-9]{8}$',
        errorMessage:
          'Le numéro de téléphone irlandais doit être au format +353... ou 0...',
        placeholder: '+353 XX XXX XXXX',
        prefix: '+353',
      },
      vat: {
        pattern: '^IE[0-9][A-Z0-9\\+\\*][0-9]{5}[A-Z]$',
        errorMessage:
          'Le numéro de TVA irlandais doit être au format IE + 8 caractères',
        placeholder: 'IE1234567X',
        prefix: 'IE',
      },
      nationalNumber: {
        pattern: '^[0-9]{7}[A-W]{1,2}$',
        errorMessage:
          'Le PPS irlandais doit contenir 7 chiffres suivis de 1 ou 2 lettres',
        placeholder: '1234567X',
      },
    },
    Italie: {
      postalCode: {
        pattern: '^[0-9]{5}$',
        errorMessage: 'Le code postal italien doit contenir 5 chiffres',
        placeholder: '00100',
      },
      phone: {
        pattern: '^(\\+39|0)[0-9]{9,10}$',
        errorMessage:
          'Le numéro de téléphone italien doit être au format +39... ou 0...',
        placeholder: '+39 XXX XXX XXX',
        prefix: '+39',
      },
      vat: {
        pattern: '^IT[0-9]{11}$',
        errorMessage:
          'Le numéro de TVA italien doit être au format IT + 11 chiffres',
        placeholder: 'IT12345678901',
        prefix: 'IT',
      },
      nationalNumber: {
        pattern: '^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$',
        errorMessage:
          'Le code fiscal italien doit être au format XXXXXX00X00X000X',
        placeholder: 'RSSMRA80A01H501S',
      },
    },
    Luxembourg: {
      postalCode: {
        pattern: '^[0-9]{4}$',
        errorMessage: 'Le code postal luxembourgeois doit contenir 4 chiffres',
        placeholder: '2001',
      },
      phone: {
        pattern: '^(\\+352|0)\\s*[1-9][0-9\\s]{8,11}$',
        errorMessage:
          'Le numéro de téléphone luxembourgeois doit être au format +352... ou 0...',
        placeholder: '+352 XXX XXX XXX',
        prefix: '+352',
      },
      vat: {
        pattern: '^[0-9]{8}$',
        errorMessage:
          'Le numéro de TVA luxembourgeois doit contenir 8 chiffres',
        placeholder: '12345678',
      },
      nationalNumber: {
        pattern: '^[0-9]{13}$',
        errorMessage:
          "Le numéro d'identification luxembourgeois doit contenir 13 chiffres",
        placeholder: 'AAAA MM DD XXX XX',
      },
    },
    'Pays-Bas': {
      postalCode: {
        pattern: '^[1-9][0-9]{3}[ ]?[A-Z]{2}$',
        errorMessage: 'Le code postal néerlandais doit être au format 1234 AB',
        placeholder: '1234 AB',
      },
      phone: {
        pattern: '^(\\+31|0)\\s*[1-9](?:\\s*\\d{2}){4}$',
        errorMessage:
          'Le numéro de téléphone néerlandais doit être au format +31... ou 0...',
        placeholder: '+31 XX XXX XXXX',
        prefix: '+31',
      },
      vat: {
        pattern: '^[0-9]{9}B[0-9]{2}$',
        errorMessage:
          'Le numéro de TVA néerlandais doit contenir 9 chiffres + B + 2 chiffres',
        placeholder: '123456789B12',
      },
      nationalNumber: {
        pattern: '^[0-9]{9}$',
        errorMessage:
          'Le BSN (Burgerservicenummer) néerlandais doit contenir 9 chiffres',
        placeholder: 'XXXXXXXXX',
      },
    },
    Pologne: {
      postalCode: {
        pattern: '^[0-9]{2}-[0-9]{3}$',
        errorMessage: 'Le code postal polonais doit être au format XX-XXX',
        placeholder: '00-000',
      },
      phone: {
        pattern: '^(\\+48|0)[1-9][0-9]{8}$',
        errorMessage:
          'Le numéro de téléphone polonais doit être au format +48... ou 0...',
        placeholder: '+48 XXX XXX XXX',
        prefix: '+48',
      },
      vat: {
        pattern: '^PL[0-9]{10}$',
        errorMessage:
          'Le numéro de TVA polonais doit être au format PL + 10 chiffres',
        placeholder: 'PL1234567890',
        prefix: 'PL',
      },
    },
    Portugal: {
      postalCode: {
        pattern: '^[0-9]{4}-[0-9]{3}$',
        errorMessage: 'Le code postal portugais doit être au format XXXX-XXX',
        placeholder: '1000-100',
      },
      phone: {
        pattern: '^(\\+351|0)[1-9][0-9]{8}$',
        errorMessage:
          'Le numéro de téléphone portugais doit être au format +351... ou 0...',
        placeholder: '+351 XXX XXX XXX',
        prefix: '+351',
      },
      vat: {
        pattern: '^PT[0-9]{9}$',
        errorMessage:
          'Le numéro de TVA portugais doit être au format PT + 9 chiffres',
        placeholder: 'PT123456789',
        prefix: 'PT',
      },
      nationalNumber: {
        pattern: '^[0-9]{9}$',
        errorMessage: 'Le NIF portugais doit contenir 9 chiffres',
        placeholder: 'XXXXXXXXX',
      },
    },
    'République tchèque': {
      postalCode: {
        pattern: '^[0-9]{3}[ ]?[0-9]{2}$',
        errorMessage: 'Le code postal tchèque doit être au format XXX XX',
        placeholder: '100 00',
      },
      phone: {
        pattern: '^(\\+420|0)[1-9][0-9]{8}$',
        errorMessage:
          'Le numéro de téléphone tchèque doit être au format +420... ou 0...',
        placeholder: '+420 XXX XXX XXX',
        prefix: '+420',
      },
      vat: {
        pattern: '^CZ[0-9]{8,10}$',
        errorMessage:
          'Le numéro de TVA tchèque doit être au format CZ + 8-10 chiffres',
        placeholder: 'CZ12345678',
        prefix: 'CZ',
      },
    },
    'Royaume-Uni': {
      postalCode: {
        pattern: '^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$',
        errorMessage:
          'Le code postal britannique doit être au format correct (ex: SW1A 1AA)',
        placeholder: 'SW1A 1AA',
      },
      phone: {
        pattern: '^(\\+44|0)[1-9][0-9]{9}$',
        errorMessage:
          'Le numéro de téléphone britannique doit être au format +44... ou 0...',
        placeholder: '+44 XXXX XXXXXX',
        prefix: '+44',
      },
      vat: {
        pattern: '^GB[0-9]{9}$',
        errorMessage:
          'Le numéro de TVA britannique doit être au format GB + 9 chiffres',
        placeholder: 'GB123456789',
        prefix: 'GB',
      },
      nationalNumber: {
        pattern: '^[A-Z]{2}[0-9]{6}[A-Z]$',
        errorMessage: 'Le NIN britannique doit être au format XX999999X',
        placeholder: 'AB123456C',
      },
    },
    Suède: {
      postalCode: {
        pattern: '^[0-9]{3}[ ]?[0-9]{2}$',
        errorMessage: 'Le code postal suédois doit être au format XXX XX',
        placeholder: '100 00',
      },
      phone: {
        pattern: '^(\\+46|0)[1-9][0-9]{8}$',
        errorMessage:
          'Le numéro de téléphone suédois doit être au format +46... ou 0...',
        placeholder: '+46 XX XXX XXXX',
        prefix: '+46',
      },
      vat: {
        pattern: '^SE[0-9]{12}$',
        errorMessage:
          'Le numéro de TVA suédois doit être au format SE + 12 chiffres',
        placeholder: 'SE123456789012',
        prefix: 'SE',
      },
      nationalNumber: {
        pattern: '^[0-9]{6}[-][0-9]{4}$',
        errorMessage: 'Le personnummer suédois doit être au format YYMMDD-XXXX',
        placeholder: '000000-0000',
      },
    },
    Suisse: {
      postalCode: {
        pattern: '^[0-9]{4}$',
        errorMessage: 'Le code postal suisse doit contenir 4 chiffres',
        placeholder: '1000',
      },
      phone: {
        pattern: '^(\\+41|0)\\s*[1-9][0-9\\s]{8,11}$',
        errorMessage:
          'Le numéro de téléphone suisse doit être au format +41... ou 0...',
        placeholder: '+41 XX XXX XXXX',
        prefix: '+41',
      },
      vat: {
        pattern: '^[0-9]{9}$',
        errorMessage: 'Le numéro de TVA suisse doit contenir 9 chiffres',
        placeholder: '123456789',
      },
      nationalNumber: {
        pattern: '^756[.][0-9]{4}[.][0-9]{4}[.][0-9]{2}$',
        errorMessage:
          'Le numéro AVS suisse doit être au format 756.XXXX.XXXX.XX',
        placeholder: '756.XXXX.XXXX.XX',
      },
    },
  });

  private defaultRules: CountryRules = {
    postalCode: {
      pattern: '^[0-9]{4,10}$',
      errorMessage: 'Le code postal doit contenir entre 4 et 10 caractères',
      placeholder: 'Code postal',
    },
    phone: {
      pattern: '^\\+?[0-9]{8,15}$',
      errorMessage:
        'Le numéro de téléphone doit être au format international (+) ou local',
      placeholder: '+XX XXX XXX XXX',
    },
    vat: {
      pattern: '^[A-Z]{2}[0-9A-Z]{2,12}$',
      errorMessage:
        'Le numéro de TVA doit commencer par le code pays (2 lettres) suivi de 2 à 12 caractères',
      placeholder: 'Numéro de TVA',
    },
  };

  private nationalNumberValidators: NationalNumberValidators = {
    Belgique: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.replace(/[^0-9]/g, '');

      // Vérification de la longueur
      if (value.length !== 11) return { invalidLength: true };

      // Extraction des composants de la date
      const year = parseInt(value.substr(0, 2));
      const month = parseInt(value.substr(2, 2));
      const day = parseInt(value.substr(4, 2));

      // Vérification de la date
      const fullYear = year < 50 ? 2000 + year : 1900 + year;
      const date = new Date(fullYear, month - 1, day);
      if (date.getMonth() !== month - 1 || date.getDate() !== day) {
        return { invalidDate: true };
      }

      // Vérification du modulo 97 (gestion des personnes nées après 2000)
      const check = parseInt(value.substr(9, 2));
      const base9digits = parseInt(value.substr(0, 9));

      // Test 1: avec les 9 premiers chiffres (pour les personnes nées avant 2000)
      let mod97 = base9digits % 97;
      let expectedCheck = mod97 === 0 ? 97 : 97 - mod97;

      if (check === expectedCheck) {
        return null; // Valide
      }

      // Test 2: avec "2" + 9 premiers chiffres (pour les personnes nées après 2000)
      const base2000 = parseInt('2' + value.substr(0, 9));
      mod97 = base2000 % 97;
      expectedCheck = mod97 === 0 ? 97 : 97 - mod97;

      if (check === expectedCheck) {
        return null; // Valide
      }

      return { invalidChecksum: true };
    },

    France: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.replace(/[^0-9]/g, '');

      if (value.length !== 15) return { invalidLength: true };

      // Vérification du sexe (1 ou 2)
      const sex = parseInt(value[0]);
      if (sex !== 1 && sex !== 2) return { invalidSex: true };

      // Vérification de la date
      const year = parseInt(value.substr(1, 2));
      const month = parseInt(value.substr(3, 2));
      const dept = value.substr(5, 2);

      if (month < 1 || month > 12) return { invalidMonth: true };
      if (!/^([0-9]{2}|2[AB])$/.test(dept)) return { invalidDepartment: true };

      // Vérification de la clé
      const num = parseInt(value.substr(0, 13));
      const key = parseInt(value.substr(13, 2));
      const expectedKey = 97 - (num % 97);

      if (key !== expectedKey) return { invalidChecksum: true };

      return null;
    },

    Luxembourg: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.replace(/[^0-9]/g, '');

      if (value.length !== 13) return { invalidLength: true };

      // Vérification de la date
      const year = parseInt(value.substr(0, 4));
      const month = parseInt(value.substr(4, 2));
      const day = parseInt(value.substr(6, 2));

      const date = new Date(year, month - 1, day);
      if (date.getMonth() !== month - 1 || date.getDate() !== day) {
        return { invalidDate: true };
      }

      return null;
    },

    'Pays-Bas': (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.replace(/[^0-9]/g, '');

      if (value.length !== 9) return { invalidLength: true };

      // Algorithme "11-proef" pour le BSN
      let sum = 0;
      for (let i = 0; i < 8; i++) {
        sum += parseInt(value[i]) * (9 - i);
      }
      sum -= parseInt(value[8]);

      if (sum % 11 !== 0) return { invalidChecksum: true };

      return null;
    },

    Espagne: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toUpperCase();

      if (!/^[0-9]{8}[A-Z]$/.test(value)) return { invalidFormat: true };

      const number = parseInt(value.substr(0, 8));
      const letter = value[8];
      const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
      const expectedLetter = letters[number % 23];

      if (letter !== expectedLetter) return { invalidChecksum: true };

      return null;
    },

    Italie: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toUpperCase();

      if (!/^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/.test(value)) {
        return { invalidFormat: true };
      }

      // Vérification du mois (A-P pour 1-12)
      const monthLetter = value[8];
      const validMonths = 'ABCDEHLMPRST';
      if (!validMonths.includes(monthLetter)) return { invalidMonth: true };

      // Vérification du jour (01-31 + 40 pour les femmes)
      const day = parseInt(value.substr(9, 2));
      if ((day < 1 || day > 31) && (day < 41 || day > 71))
        return { invalidDay: true };

      return null;
    },

    Suède: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.replace(/[^0-9]/g, '');

      if (value.length !== 10) return { invalidLength: true };

      // Vérification de la date
      const year = parseInt(value.substr(0, 2));
      const month = parseInt(value.substr(2, 2));
      const day = parseInt(value.substr(4, 2));

      if (month < 1 || month > 12) return { invalidMonth: true };
      if (day < 1 || day > 31) return { invalidDay: true };

      // Algorithme de Luhn pour la vérification
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        let digit = parseInt(value[i]);
        if (i % 2 === 0) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
      }

      const check = parseInt(value[9]);
      const expectedCheck = (10 - (sum % 10)) % 10;

      if (check !== expectedCheck) return { invalidChecksum: true };

      return null;
    },
  };

  private phoneValidators: PhoneValidators = {
    Belgique: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      // Formater automatiquement le numéro avec espaces
      const value = this.formatPhoneNumber(control.value, 'Belgique');
      if (value !== control.value) {
        control.setValue(value, { emitEvent: false });
      }

      // Nettoyer le numéro pour la validation
      const cleaned = value.replace(/\s/g, '');

      // Si le numéro est trop court, ne pas valider tout de suite
      if (cleaned.length < 3) return null;

      // Vérifier le format international (+32)
      if (cleaned.startsWith('+32')) {
        // Enlever le préfixe pour la validation
        const numberWithoutPrefix = cleaned.substring(3);

        // Si le numéro commence par 0 après +32, l'enlever
        const finalNumber = numberWithoutPrefix.startsWith('0')
          ? numberWithoutPrefix.substring(1)
          : numberWithoutPrefix;

        // Vérifier la longueur exacte (9 chiffres après +32)
        if (finalNumber.length !== 9) {
          return {
            invalidLength: true,
            currentLength: finalNumber.length,
            requiredLength: 9,
          };
        }

        // Vérifier le premier chiffre
        const firstDigit = finalNumber[0];
        if (
          !['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(firstDigit)
        ) {
          return { invalidFirstDigit: true };
        }

        // Si c'est un mobile (commence par 4), vérifier le deuxième chiffre
        if (
          firstDigit === '4' &&
          !['6', '7', '8', '9'].includes(finalNumber[1])
        ) {
          return { invalidMobilePrefix: true };
        }

        // Vérifier le format national (0)
      } else if (cleaned.startsWith('0')) {
        const numberWithoutZero = cleaned.substring(1);

        // Vérifier la longueur exacte (10 chiffres au total, donc 9 après le 0)
        if (numberWithoutZero.length !== 9) {
          return {
            invalidLength: true,
            currentLength: numberWithoutZero.length,
            requiredLength: 9,
          };
        }

        // Vérifier le premier chiffre après le 0
        const firstDigit = numberWithoutZero[0];
        if (
          !['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(firstDigit)
        ) {
          return { invalidFirstDigit: true };
        }

        // Si c'est un mobile (commence par 4), vérifier le deuxième chiffre
        if (
          firstDigit === '4' &&
          !['6', '7', '8', '9'].includes(numberWithoutZero[1])
        ) {
          return { invalidMobilePrefix: true };
        }
      } else {
        return { invalidPrefix: true };
      }

      return null;
    },
    // ... autres validateurs ...
  };

  private postalCodeValidators: PostalCodeValidators = {
    France: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.replace(/\s/g, '');

      // Vérification du format (5 chiffres)
      if (!/^\d{5}$/.test(value)) {
        return { invalidFormat: true };
      }

      // Vérification des départements valides
      const dept = value.substring(0, 2);
      const validDepts = [
        ...Array.from({ length: 95 }, (_, i) => String(i + 1).padStart(2, '0')),
        '2A',
        '2B',
        '97',
        '98',
      ];

      if (!validDepts.includes(dept)) {
        return { invalidDepartment: true };
      }

      return null;
    },

    Belgique: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.replace(/\s/g, '');

      // Vérification du format (4 chiffres)
      if (!/^\d{4}$/.test(value)) {
        return { invalidFormat: true };
      }

      // Vérification de la plage valide (1000-9999)
      const numValue = parseInt(value);
      if (numValue < 1000 || numValue > 9999) {
        return { invalidRange: true };
      }

      return null;
    },

    Luxembourg: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.replace(/\s/g, '');

      // Vérification du format (4 chiffres)
      if (!/^\d{4}$/.test(value)) {
        return { invalidFormat: true };
      }

      // Vérification de la plage valide (L-1000 à L-9999)
      const numValue = parseInt(value);
      if (numValue < 1000 || numValue > 9999) {
        return { invalidRange: true };
      }

      return null;
    },

    Suisse: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.replace(/\s/g, '');

      // Vérification du format (4 chiffres)
      if (!/^\d{4}$/.test(value)) {
        return { invalidFormat: true };
      }

      // Vérification de la plage valide (1000-9999)
      const numValue = parseInt(value);
      if (numValue < 1000 || numValue > 9999) {
        return { invalidRange: true };
      }

      return null;
    },
  };

  private vatValidators: VatValidators = {
    Allemagne: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // Exactement 9 chiffres
      if (!/^\d{9}$/.test(value)) {
        return { invalidLength: true };
      }

      // Algorithme de validation allemand
      let sum = 0;
      let product = 10;

      for (let i = 0; i < 8; i++) {
        sum = (parseInt(value[i]) + product) % 10;
        if (sum === 0) sum = 10;
        product = (2 * sum) % 11;
      }

      const checkDigit = (11 - product) % 10;
      if (parseInt(value[8]) !== checkDigit) {
        return { invalidChecksum: true };
      }

      return null;
    },

    Autriche: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // Exactement 8 chiffres
      if (!/^\d{8}$/.test(value)) {
        return { invalidLength: true };
      }

      // Vérification du premier chiffre (doit être entre 1 et 9)
      if (value[0] === '0') {
        return { invalidFirstDigit: true };
      }

      return null;
    },

    Belgique: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // Exactement 10 chiffres
      if (!/^\d{10}$/.test(value)) {
        return { invalidLength: true };
      }

      const base = parseInt(value.slice(0, 8));
      const check = parseInt(value.slice(8, 10));
      const expectedCheck = 97 - (base % 97);

      if (check !== expectedCheck) {
        return { invalidChecksum: true };
      }

      return null;
    },

    Bulgarie: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // Exactement 9 ou 10 chiffres
      if (!/^\d{9}$/.test(value) && !/^\d{10}$/.test(value)) {
        return { invalidLength: true };
      }

      // Pour 9 chiffres
      if (value.length === 9) {
        let sum = 0;
        for (let i = 0; i < 8; i++) {
          sum += parseInt(value[i]) * (i + 1);
        }
        const check = sum % 11;
        if (check === 10) {
          sum = 0;
          for (let i = 0; i < 8; i++) {
            sum += parseInt(value[i]) * (i + 3);
          }
          if ((sum % 11) % 10 !== parseInt(value[8])) {
            return { invalidChecksum: true };
          }
        } else if (check !== parseInt(value[8])) {
          return { invalidChecksum: true };
        }
      }

      return null;
    },

    Chypre: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // 8 chiffres + 1 lettre
      if (!/^\d{8}[A-Z]$/.test(value)) {
        return { invalidFormat: true };
      }

      return null;
    },

    Croatie: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // 11 chiffres
      if (!/^\d{11}$/.test(value)) {
        return { invalidLength: true };
      }

      // Modulo 11
      let sum = 0;
      for (let i = 0; i < 10; i++) {
        sum += parseInt(value[i]) * (i + 1);
      }
      const check = sum % 11;
      if (check === 10 || check !== parseInt(value[10])) {
        return { invalidChecksum: true };
      }

      return null;
    },

    Danemark: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // 8 chiffres
      if (!/^\d{8}$/.test(value)) {
        return { invalidLength: true };
      }

      // Modulo 11
      let sum = 0;
      const weights = [2, 7, 6, 5, 4, 3, 2, 1];
      for (let i = 0; i < 8; i++) {
        sum += parseInt(value[i]) * weights[i];
      }
      if (sum % 11 !== 0) {
        return { invalidChecksum: true };
      }

      return null;
    },

    Espagne: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // Format: 8 caractères + 1 caractère de contrôle
      if (!/^[A-Z0-9][0-9]{7}[A-Z0-9]$/.test(value)) {
        return { invalidFormat: true };
      }

      return null;
    },

    Estonie: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // 9 chiffres
      if (!/^\d{9}$/.test(value)) {
        return { invalidLength: true };
      }

      return null;
    },

    Finlande: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // 8 chiffres
      if (!/^\d{8}$/.test(value)) {
        return { invalidLength: true };
      }

      return null;
    },

    France: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // Exactement 11 chiffres
      if (!/^\d{11}$/.test(value)) {
        return { invalidLength: true };
      }

      // Validation du SIREN (9 premiers chiffres)
      const siren = value.slice(0, 9);
      let sum = 0;
      for (let i = 0; i < siren.length; i++) {
        let digit = parseInt(siren[i]);
        if (i % 2 === 0) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
      }
      if (sum % 10 !== 0) {
        return { invalidSiren: true };
      }

      // Validation des deux derniers chiffres (clé TVA)
      const key = parseInt(value.slice(9, 11));
      if (key < 1 || key > 94) {
        return { invalidKey: true };
      }

      return null;
    },

    Grèce: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // 9 chiffres
      if (!/^\d{9}$/.test(value)) {
        return { invalidLength: true };
      }

      return null;
    },

    Hongrie: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // 8 chiffres
      if (!/^\d{8}$/.test(value)) {
        return { invalidLength: true };
      }

      return null;
    },

    Irlande: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // Format: 7 chiffres + 1 ou 2 lettres
      if (!/^\d{7}[A-Z]{1,2}$/.test(value)) {
        return { invalidFormat: true };
      }

      return null;
    },

    Italie: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // 11 chiffres
      if (!/^\d{11}$/.test(value)) {
        return { invalidLength: true };
      }

      return null;
    },

    Luxembourg: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // 8 chiffres
      if (!/^\d{8}$/.test(value)) {
        return { invalidLength: true };
      }

      // Les deux premiers chiffres doivent être entre 10 et 99
      const prefix = parseInt(value.slice(0, 2));
      if (prefix < 10 || prefix > 99) {
        return { invalidPrefix: true };
      }

      return null;
    },

    'Pays-Bas': (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // Format: 9 chiffres + B + 2 chiffres
      if (!/^\d{9}B\d{2}$/.test(value)) {
        return { invalidFormat: true };
      }

      // Vérification RSIN/BSN
      const rsin = value.slice(0, 9);
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(rsin[i]) * (9 - i);
      }
      if (sum % 11 !== 0) {
        return { invalidRsin: true };
      }

      return null;
    },

    Pologne: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // 10 chiffres
      if (!/^\d{10}$/.test(value)) {
        return { invalidLength: true };
      }

      // Algorithme de validation polonais
      const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
      let sum = 0;
      for (let i = 0; i < 9; i++) {
        sum += parseInt(value[i]) * weights[i];
      }
      const check = sum % 11;
      if (check === 10 || check !== parseInt(value[9])) {
        return { invalidChecksum: true };
      }

      return null;
    },

    Portugal: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // 9 chiffres
      if (!/^\d{9}$/.test(value)) {
        return { invalidLength: true };
      }

      // Algorithme de validation portugais
      let sum = 0;
      for (let i = 0; i < 8; i++) {
        sum += parseInt(value[i]) * (9 - i);
      }
      const check = 11 - (sum % 11);
      if (check === 10 || check === 11) {
        if (parseInt(value[8]) !== 0) {
          return { invalidChecksum: true };
        }
      } else if (parseInt(value[8]) !== check) {
        return { invalidChecksum: true };
      }

      return null;
    },

    'République tchèque': (
      control: AbstractControl,
    ): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // 8 à 10 chiffres
      if (!/^\d{8,10}$/.test(value)) {
        return { invalidLength: true };
      }

      return null;
    },

    'Royaume-Uni': (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // 9 chiffres
      if (!/^\d{9}$/.test(value)) {
        return { invalidLength: true };
      }

      // Les deux premiers chiffres doivent être différents de 00
      if (value.slice(0, 2) === '00') {
        return { invalidPrefix: true };
      }

      return null;
    },

    Suède: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // 12 chiffres
      if (!/^\d{12}$/.test(value)) {
        return { invalidLength: true };
      }

      return null;
    },

    Suisse: (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const value = control.value.toString().replace(/\s/g, '');

      // 9 chiffres
      if (!/^\d{9}$/.test(value)) {
        return { invalidLength: true };
      }

      // Vérification du format IDE
      const firstDigits = parseInt(value.slice(0, 3));
      if (firstDigits < 100 || firstDigits > 999) {
        return { invalidPrefix: true };
      }

      return null;
    },
  };

  constructor() {
    this.initForm();
    this.getConnectedUser();
  }

  ngOnInit() {
    this.initForm();
    this.setupCountryValidation();
    this.setupRealtimeValidation();
  }

  private initForm() {
    this.createClientForm = this.formBuilder.group({
      name: [''], // Pas de validator par défaut, sera ajouté selon le type
      firstname: [''],
      lastname: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]], // Simplified: updateValidatorsForCountry will add specific validator
      street: ['', [Validators.required]],
      number: ['', [Validators.required]],
      city: ['', [Validators.required]],
      country: ['Belgique', [Validators.required]],
      postalCode: ['', [Validators.required]], // Simplified: updateValidatorsForCountry will add specific validator
      company_number: [null],
      company_vat_number: [null],
      national_number: [null],
      is_physical_person: [false],
      default_payment_deadline: [
        10,
        [Validators.required, Validators.min(10), Validators.max(30)],
      ],
      is_info_pending: [false],
    });

    const defaultCountry =
      this.createClientForm.get('country')?.value || 'Belgique';
    this.updateValidatorsForCountry(defaultCountry);

    // Patch des données AVANT de créer l'abonnement
    if (this.client) {
      this.patchFormWithClientData();
    }

    // Appliquer les validateurs selon l'état initial de isPhysicalPerson
    this.applyValidatorsBasedOnPersonType();

    // Créer l'abonnement APRÈS le patch pour éviter la boucle infinie
    this.createClientForm
      .get('is_info_pending')
      ?.valueChanges.subscribe((isPending) => {
        this.toggleClientFieldsValidation(isPending);
      });
  }

  private applyValidatorsBasedOnPersonType() {
    if (this.isPhysicalPerson()) {
      // Personne physique: firstname et lastname requis, name pas requis
      this.createClientForm.get('name')?.clearValidators();
      this.createClientForm
        .get('firstname')
        ?.setValidators([Validators.required]);
      this.createClientForm
        .get('lastname')
        ?.setValidators([Validators.required]);
      // Champs entreprise pas requis pour personne physique
      this.createClientForm.get('company_number')?.clearValidators();
      this.createClientForm.get('company_vat_number')?.clearValidators();
    } else {
      // Entreprise: name requis, firstname et lastname pas requis
      this.createClientForm.get('name')?.setValidators([Validators.required]);
      this.createClientForm.get('firstname')?.clearValidators();
      this.createClientForm.get('lastname')?.clearValidators();
      // Pour les entreprises, company_vat_number peut être requis selon le pays
      // mais on ne le met pas requis par défaut ici, updateValidatorsForCountry s'en occupera
    }

    // Mettre à jour la validité
    this.createClientForm
      .get('name')
      ?.updateValueAndValidity({ emitEvent: false });
    this.createClientForm
      .get('firstname')
      ?.updateValueAndValidity({ emitEvent: false });
    this.createClientForm
      .get('lastname')
      ?.updateValueAndValidity({ emitEvent: false });
    this.createClientForm
      .get('company_number')
      ?.updateValueAndValidity({ emitEvent: false });
    this.createClientForm
      .get('company_vat_number')
      ?.updateValueAndValidity({ emitEvent: false });
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

    // Appliquer les validateurs selon le nouveau type
    this.applyValidatorsBasedOnPersonType();

    if (this.isPhysicalPerson()) {
      // Nettoyer les champs entreprise
      this.createClientForm.patchValue({
        name: '',
        company_number: null,
        company_vat_number: null,
      });
    } else {
      // Nettoyer les champs personne physique
      this.createClientForm.patchValue({
        firstname: '',
        lastname: '',
      });
    }
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

    const clientData = { ...this.createClientForm.value };
    const userId = this.connectedUser()?.id;

    if (!userId) {
      toast.error('Erreur: Utilisateur non connecté.');
      return;
    }

    // Conversion et validation des valeurs numériques
    const deadline = parseInt(clientData.default_payment_deadline, 10);
    if (isNaN(deadline) || deadline < 1) {
      toast.error('Erreur: Délai de paiement invalide.');
      return;
    }
    clientData.default_payment_deadline = deadline;

    // Nettoyage des valeurs nulles/undefined pour éviter les erreurs de base de données
    Object.keys(clientData).forEach((key) => {
      if (
        clientData[key] === null ||
        clientData[key] === undefined ||
        clientData[key] === ''
      ) {
        if (
          ['company_number', 'company_vat_number', 'national_number'].includes(
            key,
          )
        ) {
          clientData[key] = null;
        }
      }
    });

    let dataToSend: Partial<ClientEntity> = {};
    if (clientData.is_info_pending) {
      dataToSend = {
        email: clientData.email,
        is_info_pending: true,
        country: clientData.country,
        is_physical_person: clientData.is_physical_person,
        default_payment_deadline: clientData.default_payment_deadline,
      };
    } else {
      dataToSend = clientData;
    }

    if (clientData.is_physical_person) {
      clientData.name = `${clientData.firstname} ${clientData.lastname}`.trim();
    }
    if (clientData.is_physical_person) {
      const firstname = clientData.firstname || 'A compléter par le client';
      const lastname = clientData.lastname || 'A compléter par le client';
      clientData.name = `${firstname}`.trim();
    }

    if (this.client) {
      // Vérification de l'ID du client
      if (!this.client.id) {
        toast.error(
          'Erreur: Impossible de mettre à jour le client (ID manquant)',
        );
        return;
      }

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
          error: () => {
            toast.error('Erreur lors de la mise à jour du client');
          },
        });
    } else {
      // Create
      this.clientService
        .create(dataToSend)
        .pipe(take(1))
        .subscribe({
          next: (createdClient) => {
            this.clientCreated.emit(createdClient);
            this.closeForm.emit();
            toast.success('Client créé avec succès');
          },
          error: () => {
            toast.error('Erreur lors de la création du client');
          },
        });
    }
  }

  formatNationalNumber(value: string): string {
    const country = this.createClientForm.get('country')?.value;
    const rules = this.countryRules()[country];

    if (!rules?.nationalNumber) return value;

    const digits = value.replace(/\D/g, '');

    switch (country) {
      case 'Belgique':
        let formatted = '';
        for (let i = 0; i < digits.length && i < 11; i++) {
          formatted += digits[i];
          if (i === 1 || i === 3) formatted += '.';
          if (i === 5) formatted += '-';
          if (i === 8) formatted += '.';
        }
        return formatted;

      case 'France':
        return digits.replace(
          /(\d{1})(\d{2})(\d{2})(\d{2})(\d{3})(\d{3})(\d{2})/,
          '$1 $2 $3 $4 $5 $6 $7',
        );

      case 'Suisse':
        return digits.replace(/(\d{3})(\d{4})(\d{4})(\d{2})/, '$1.$2.$3.$4');

      case 'Suède':
        return digits.replace(/(\d{6})(\d{4})/, '$1-$2');

      default:
        return value;
    }
  }

  onNationalNumberInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value;
    const country = this.createClientForm.get('country')?.value;
    const rules = this.countryRules()[country];

    if (!rules?.nationalNumber) return;

    const formatted = this.formatNationalNumber(rawValue);
    this.createClientForm
      .get('national_number')
      ?.setValue(formatted, { emitEvent: false });
    input.value = formatted;

    // Positionner le curseur après le dernier caractère
    setTimeout(() => {
      const pos = formatted.length;
      input.setSelectionRange(pos, pos);
    }, 0);
  }

  getNationalNumberPlaceholder(): string {
    const country = this.createClientForm.get('country')?.value;
    const rules = this.countryRules()[country];
    return rules?.nationalNumber?.placeholder || '';
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
        const control = this.createClientForm.get(fieldName);
        if (control) {
          control.clearValidators();
          control.disable();
          control.updateValueAndValidity({ emitEvent: false }); // Ajout de emitEvent: false
        }
      });
      emailControl?.setValidators([Validators.required, Validators.email]);
      emailControl?.enable();
      emailControl?.updateValueAndValidity({ emitEvent: false }); // Ajout de emitEvent: false
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
        const control = this.createClientForm.get(fieldName);
        if (control) {
          control.enable();
          control.updateValueAndValidity({ emitEvent: false }); // Ajout de emitEvent: false
        }
      });
      emailControl?.updateValueAndValidity({ emitEvent: false }); // Ajout de emitEvent: false
      deadlineControl?.updateValueAndValidity({ emitEvent: false }); // Ajout de emitEvent: false

      // Réappliquer les validateurs spécifiques au pays après réactivation
      const currentCountry =
        this.createClientForm.get('country')?.value || 'Belgique';
      this.updateValidatorsForCountry(currentCountry);
    }
  }

  private setupCountryValidation() {
    // Écouter les changements de pays
    this.createClientForm
      .get('country')
      ?.valueChanges.subscribe((selectedCountry) => {
        this.updateValidatorsForCountry(selectedCountry);
        this.updateFieldsForCountry(selectedCountry);

        // Ajouter la validation du numéro national
        const nationalNumberControl =
          this.createClientForm.get('national_number');
        if (
          nationalNumberControl &&
          this.nationalNumberValidators[selectedCountry]
        ) {
          nationalNumberControl.setValidators([
            this.nationalNumberValidators[selectedCountry],
          ]);
          nationalNumberControl.updateValueAndValidity({ emitEvent: false });
        }

        // Suppression de l'appel qui peut créer des boucles :
        // this.validateAllFormFields();
      });
  }

  private updateFieldsForCountry(country: string) {
    const rules = this.countryRules()[country];
    if (!rules) return;

    // Mise à jour du préfixe téléphonique
    const phoneControl = this.createClientForm.get('phone');
    if (phoneControl) {
      const currentValue = phoneControl.value || '';
      const currentPrefix = this.extractPrefix(currentValue);

      // Vérifier si le champ ne contient que le préfixe (+ éventuellement des espaces)
      const valueWithoutPrefix = currentPrefix
        ? currentValue.replace(currentPrefix, '').trim()
        : currentValue.trim();

      const hasOnlyPrefix = !valueWithoutPrefix || valueWithoutPrefix === '';

      // Si le champ est vide, ajouter le nouveau préfixe
      if (!currentValue && rules.phone.prefix) {
        phoneControl.setValue(rules.phone.prefix + ' ', { emitEvent: false });
      }
      // Si le champ ne contient que le préfixe, le remplacer par le nouveau
      else if (hasOnlyPrefix && currentPrefix && rules.phone.prefix) {
        phoneControl.setValue(rules.phone.prefix + ' ', { emitEvent: false });
      }
      // Si le champ contient un vrai numéro, ne pas le changer
      // (on laisse l'utilisateur gérer manuellement)
    }
  }

  // Méthode pour extraire le préfixe d'un numéro de téléphone
  private extractPrefix(phoneNumber: string): string | null {
    if (!phoneNumber) return null;

    // Rechercher les préfixes communs (+XX, +XXX)
    const prefixMatch = phoneNumber.match(/^\+\d{2,3}/);
    if (prefixMatch) {
      return prefixMatch[0];
    }

    return null;
  }

  private updateValidatorsForCountry(country: string) {
    const rules = this.countryRules()[country] || this.defaultRules;

    if (rules) {
      // Mise à jour des validateurs pour le code postal
      const postalCodeControl = this.createClientForm.get('postalCode');
      if (postalCodeControl) {
        const postalCodeValidators = [Validators.required];
        if (this.postalCodeValidators[country]) {
          postalCodeValidators.push(this.postalCodeValidators[country]);
        } else {
          postalCodeValidators.push(
            Validators.pattern(rules.postalCode.pattern),
          );
        }
        postalCodeControl.setValidators(postalCodeValidators);
        postalCodeControl.updateValueAndValidity({
          onlySelf: true,
          emitEvent: true,
        });
      }

      // Mise à jour des validateurs pour le téléphone
      const phoneControl = this.createClientForm.get('phone');
      if (phoneControl) {
        const phoneValidators = [Validators.required];
        if (this.phoneValidators[country]) {
          phoneValidators.push(this.phoneValidators[country]);
        } else {
          phoneValidators.push(Validators.pattern(rules.phone.pattern));
        }
        phoneControl.setValidators(phoneValidators);
        phoneControl.updateValueAndValidity({
          onlySelf: true,
          emitEvent: true,
        });
      }

      // Mise à jour des validateurs pour la TVA
      const vatControl = this.createClientForm.get('company_vat_number');
      if (vatControl && !this.isPhysicalPerson()) {
        const vatValidators = [Validators.required];
        if (this.vatValidators[country]) {
          vatValidators.push(this.vatValidators[country]);
        }
        vatControl.setValidators(vatValidators);
        vatControl.updateValueAndValidity({ onlySelf: true, emitEvent: true });
      }

      // Mise à jour des validateurs pour le numéro national
      const nationalNumberControl =
        this.createClientForm.get('national_number');
      if (nationalNumberControl && this.nationalNumberValidators[country]) {
        nationalNumberControl.setValidators([
          this.nationalNumberValidators[country],
        ]);
        nationalNumberControl.updateValueAndValidity({
          onlySelf: true,
          emitEvent: true,
        });
      }
    }
  }

  // Méthode pour obtenir le message d'erreur approprié
  getErrorMessage(controlName: string): string {
    const control = this.createClientForm.get(controlName);
    if (!control || !control.errors) return '';

    const country = this.createClientForm.get('country')?.value;
    const rules = this.countryRules()[country] || this.defaultRules;

    if (controlName === 'national_number') {
      if (control.errors['invalidLength']) {
        return 'Longueur incorrecte du numéro';
      }
      if (control.errors['invalidDate']) {
        return 'Date de naissance invalide';
      }
      if (control.errors['invalidChecksum']) {
        return 'Numéro de contrôle invalide';
      }
      if (control.errors['invalidSex']) {
        return 'Code de sexe invalide';
      }
      if (control.errors['invalidMonth']) {
        return 'Mois invalide';
      }
      if (control.errors['invalidDay']) {
        return 'Jour invalide';
      }
      if (control.errors['invalidDepartment']) {
        return 'Code département invalide';
      }
      if (control.errors['invalidFormat']) {
        return 'Format invalide';
      }
    }

    if (control.errors['required']) {
      return 'Ce champ est requis';
    }

    if (control.errors['pattern']) {
      switch (controlName) {
        case 'postalCode':
          return rules.postalCode.errorMessage;
        case 'phone':
          return rules.phone.errorMessage;
        case 'company_vat_number':
          return rules.vat.errorMessage;
        default:
          return 'Format invalide';
      }
    }

    if (control.errors['email']) {
      return "Format d'email invalide";
    }

    if (controlName === 'company_vat_number') {
      if (control.errors['invalidLength']) {
        switch (country) {
          case 'France':
            return 'Le numéro de TVA doit contenir exactement 11 chiffres';
          case 'Belgique':
            return 'Le numéro de TVA doit contenir exactement 10 chiffres';
          case 'Allemagne':
            return 'Le numéro de TVA doit contenir exactement 9 chiffres';
          // ... autres pays ...
          default:
            return 'Longueur du numéro de TVA invalide';
        }
      }
      if (control.errors['invalidKey']) {
        return 'Clé de TVA invalide';
      }
      // ... autres messages d'erreur existants ...
    }

    if (controlName === 'phone') {
      if (country === 'Belgique') {
        if (control.errors['invalidPrefix']) {
          return 'Le numéro doit commencer par +32 ou 0';
        }
        if (control.errors['invalidLength']) {
          const current = control.errors['currentLength'] || 0;
          const required = control.errors['requiredLength'] || 9;
          return `Le numéro doit contenir exactement ${required} chiffres après le préfixe (actuellement: ${current})`;
        }
        if (control.errors['invalidFirstDigit']) {
          return 'Le premier chiffre après le préfixe doit être entre 1 et 9';
        }
        if (control.errors['invalidMobilePrefix']) {
          return 'Les numéros mobiles doivent commencer par 46, 47, 48 ou 49';
        }
      }
      // ... autres messages d'erreur existants ...
    }

    return 'Champ invalide';
  }

  // Méthode pour obtenir la liste des champs invalides
  getInvalidFieldsMessage(): string {
    if (this.createClientForm.valid) return '';

    const invalidFields: string[] = [];
    const fieldLabels: { [key: string]: string } = {
      name: this.isPhysicalPerson() ? 'Nom complet' : "Nom de l'entreprise",
      firstname: 'Prénom',
      lastname: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      street: 'Rue',
      number: 'Numéro',
      city: 'Ville',
      postalCode: 'Code postal',
      company_vat_number: 'Numéro de TVA',
      national_number: 'Numéro national',
      default_payment_deadline: 'Délai de paiement',
    };

    Object.keys(this.createClientForm.controls).forEach((key) => {
      const control = this.createClientForm.get(key);
      if (control && control.invalid && fieldLabels[key]) {
        invalidFields.push(fieldLabels[key]);
      }
    });

    if (invalidFields.length === 0) return '';

    return `Veuillez corriger : ${invalidFields.join(', ')}`;
  }

  getPlaceholder(fieldName: keyof CountryRules): string {
    const country = this.createClientForm.get('country')?.value;
    const rules = this.countryRules()[country] || this.defaultRules;
    return (
      rules[fieldName]?.placeholder ||
      this.defaultRules[fieldName]?.placeholder ||
      ''
    );
  }

  getPrefix(fieldName: keyof CountryRules): string {
    const country = this.createClientForm.get('country')?.value;
    const rules = this.countryRules()[country];
    return rules?.[fieldName]?.prefix || '';
  }

  // Méthode pour formater les numéros de téléphone
  private formatPhoneNumber(value: string, country: string): string {
    // Supprimer tous les espaces existants
    let cleaned = value.replace(/\s/g, '');

    // Si le numéro est vide, retourner tel quel
    if (!cleaned) return value;

    switch (country) {
      case 'Belgique':
        if (cleaned.startsWith('+32')) {
          // Enlever le 0 après +32 s'il existe
          if (cleaned.charAt(3) === '0') {
            cleaned = cleaned.slice(0, 3) + cleaned.slice(4);
          }

          // S'assurer qu'il y a assez de chiffres pour le formatage
          if (cleaned.length < 4) return cleaned;

          // Format belge: +324 91 33 51 50
          const rest = cleaned.slice(3);
          if (rest.length <= 1) {
            return `${cleaned.slice(0, 3)}${rest}`;
          } else if (rest.length <= 3) {
            return `${cleaned.slice(0, 4)} ${rest.slice(1)}`;
          } else if (rest.length <= 5) {
            return `${cleaned.slice(0, 4)} ${rest.slice(1, 3)} ${rest.slice(3)}`;
          } else if (rest.length <= 7) {
            return `${cleaned.slice(0, 4)} ${rest.slice(1, 3)} ${rest.slice(3, 5)} ${rest.slice(5)}`;
          } else {
            return `${cleaned.slice(0, 4)} ${rest.slice(1, 3)} ${rest.slice(3, 5)} ${rest.slice(5, 7)} ${rest.slice(7)}`;
          }
        } else if (cleaned.startsWith('0')) {
          // Format national: 0491 33 51 50
          if (cleaned.length <= 4) {
            return cleaned;
          } else if (cleaned.length <= 6) {
            return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
          } else if (cleaned.length <= 8) {
            return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6)}`;
          } else {
            return cleaned.replace(
              /(\d{4})(\d{2})(\d{2})(\d{2})/,
              '$1 $2 $3 $4',
            );
          }
        }
        break;

      // ... autres cas existants ...
    }

    return cleaned;
  }

  private setupRealtimeValidation() {
    // Écouter les changements du champ téléphone
    this.createClientForm.get('phone')?.valueChanges.subscribe((value) => {
      if (value) {
        const country =
          this.createClientForm.get('country')?.value || 'Belgique';
        const formattedValue = this.formatPhoneNumber(value, country);
        if (formattedValue !== value) {
          this.createClientForm
            .get('phone')
            ?.setValue(formattedValue, { emitEvent: false });
        }
        // Forcer la validation après formatage
        setTimeout(() => {
          this.createClientForm
            .get('phone')
            ?.updateValueAndValidity({ onlySelf: true, emitEvent: true });
        }, 0);
      }
    });

    // Écouter les changements du champ code postal
    this.createClientForm.get('postalCode')?.valueChanges.subscribe(() => {
      setTimeout(() => {
        this.createClientForm
          .get('postalCode')
          ?.updateValueAndValidity({ onlySelf: true, emitEvent: true });
      }, 0);
    });

    // Écouter les changements du champ TVA
    this.createClientForm
      .get('company_vat_number')
      ?.valueChanges.subscribe(() => {
        setTimeout(() => {
          this.createClientForm
            .get('company_vat_number')
            ?.updateValueAndValidity({ onlySelf: true, emitEvent: true });
        }, 0);
      });

    // Écouter les changements du champ numéro national
    this.createClientForm
      .get('national_number')
      ?.valueChanges.subscribe((value) => {
        if (value) {
          const formatted = this.formatNationalNumber(value);
          if (formatted !== value) {
            this.createClientForm
              .get('national_number')
              ?.setValue(formatted, { emitEvent: false });
          }
          setTimeout(() => {
            this.createClientForm
              .get('national_number')
              ?.updateValueAndValidity({ onlySelf: true, emitEvent: true });
          }, 0);
        }
      });
  }
}
