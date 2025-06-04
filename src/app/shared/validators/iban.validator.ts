import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validateur pour l'IBAN selon les standards internationaux
 * @returns ValidatorFn
 */
export function ibanValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null; // Ne valide pas si le champ est vide (utilisez Validators.required pour ça)
    }

    // Nettoyer l'IBAN (retirer les espaces)
    const cleanIban = value.replace(/\s/g, '').toUpperCase();

    // Vérifier la longueur minimale et maximale
    if (cleanIban.length < 15 || cleanIban.length > 34) {
      return {
        iban: { message: "L'IBAN doit contenir entre 15 et 34 caractères" },
      };
    }

    // Vérifier le format (2 lettres + 2 chiffres + alphanumériques)
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/;
    if (!ibanRegex.test(cleanIban)) {
      return { iban: { message: "Format d'IBAN invalide" } };
    }

    // Vérifier la longueur spécifique par pays
    const countryCode = cleanIban.substring(0, 2);
    const countryLengths: { [key: string]: number } = {
      AD: 24,
      AE: 23,
      AL: 28,
      AT: 20,
      AZ: 28,
      BA: 20,
      BE: 16,
      BG: 22,
      BH: 22,
      BR: 29,
      BY: 28,
      CH: 21,
      CR: 22,
      CY: 28,
      CZ: 24,
      DE: 22,
      DK: 18,
      DO: 28,
      EE: 20,
      EG: 29,
      ES: 24,
      FI: 18,
      FO: 18,
      FR: 27,
      GB: 22,
      GE: 22,
      GI: 23,
      GL: 18,
      GR: 27,
      GT: 28,
      HR: 21,
      HU: 28,
      IE: 22,
      IL: 23,
      IS: 26,
      IT: 27,
      JO: 30,
      KW: 30,
      KZ: 20,
      LB: 28,
      LC: 32,
      LI: 21,
      LT: 20,
      LU: 20,
      LV: 21,
      MC: 27,
      MD: 24,
      ME: 22,
      MK: 19,
      MR: 27,
      MT: 31,
      MU: 30,
      NL: 18,
      NO: 15,
      PK: 24,
      PL: 28,
      PS: 29,
      PT: 25,
      QA: 29,
      RO: 24,
      RS: 22,
      SA: 24,
      SE: 24,
      SI: 19,
      SK: 24,
      SM: 27,
      TN: 24,
      TR: 26,
      UA: 29,
      VG: 24,
      XK: 20,
    };

    const expectedLength = countryLengths[countryCode];
    if (expectedLength && cleanIban.length !== expectedLength) {
      return {
        iban: {
          message: `L'IBAN ${countryCode} doit contenir ${expectedLength} caractères`,
        },
      };
    }

    // Vérification du checksum modulo 97
    if (!validateIbanChecksum(cleanIban)) {
      return { iban: { message: 'IBAN invalide (erreur de contrôle)' } };
    }

    return null;
  };
}

/**
 * Valide le checksum de l'IBAN selon l'algorithme modulo 97
 */
function validateIbanChecksum(iban: string): boolean {
  // Déplacer les 4 premiers caractères à la fin
  const rearranged = iban.substring(4) + iban.substring(0, 4);

  // Remplacer les lettres par leur valeur numérique (A=10, B=11, etc.)
  let numericString = '';
  for (const char of rearranged) {
    if (char >= 'A' && char <= 'Z') {
      numericString += (char.charCodeAt(0) - 'A'.charCodeAt(0) + 10).toString();
    } else {
      numericString += char;
    }
  }

  // Calculer le modulo 97
  return mod97(numericString) === 1;
}

/**
 * Calcule le modulo 97 pour les grandes chaînes numériques
 */
function mod97(numericString: string): number {
  let remainder = 0;
  for (let i = 0; i < numericString.length; i++) {
    remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
  }
  return remainder;
}
