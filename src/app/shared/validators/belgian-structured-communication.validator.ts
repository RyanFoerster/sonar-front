import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Validateur pour la communication structurée belge
 * Format attendu : +++123/4567/89012+++ ou 123/4567/89012
 * @returns ValidatorFn
 */
export function belgianStructuredCommunicationValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null; // Ne valide pas si le champ est vide
    }

    // Nettoyer la valeur (retirer les espaces)
    const cleanValue = value.replace(/\s/g, '');

    // Vérifier le format avec ou sans +++
    const withPlusRegex = /^\+{3}\d{3}\/\d{4}\/\d{5}\+{3}$/;
    const withoutPlusRegex = /^\d{3}\/\d{4}\/\d{5}$/;

    let numbers = '';

    if (withPlusRegex.test(cleanValue)) {
      // Format avec +++
      numbers = cleanValue
        .substring(3, cleanValue.length - 3)
        .replace(/\//g, '');
    } else if (withoutPlusRegex.test(cleanValue)) {
      // Format sans +++
      numbers = cleanValue.replace(/\//g, '');
    } else {
      return {
        belgianStructuredCommunication: {
          message:
            'Format invalide. Format attendu : +++123/4567/89012+++ ou 123/4567/89012',
        },
      };
    }

    // Vérifier que nous avons exactement 12 chiffres
    if (numbers.length !== 12 || !/^\d{12}$/.test(numbers)) {
      return {
        belgianStructuredCommunication: {
          message:
            'La communication structurée doit contenir exactement 12 chiffres',
        },
      };
    }

    // Validation du modulo 97
    if (!validateBelgianStructuredCommunicationChecksum(numbers)) {
      return {
        belgianStructuredCommunication: {
          message:
            'Communication structurée invalide (erreur de contrôle modulo 97)',
        },
      };
    }

    return null;
  };
}

/**
 * Valide le checksum de la communication structurée belge
 * Les 10 premiers chiffres + modulo 97 des 10 premiers chiffres = les 2 derniers chiffres
 */
function validateBelgianStructuredCommunicationChecksum(
  numbers: string,
): boolean {
  if (numbers.length !== 12) {
    return false;
  }

  // Extraire les 10 premiers chiffres et les 2 derniers
  const baseNumber = numbers.substring(0, 10);
  const checkDigits = parseInt(numbers.substring(10, 12));

  // Calculer le modulo 97 des 10 premiers chiffres
  const baseNumberInt = parseInt(baseNumber);
  let modulo = baseNumberInt % 97;

  // Si le modulo est 0, il devient 97
  if (modulo === 0) {
    modulo = 97;
  }

  return modulo === checkDigits;
}

/**
 * Générateur de communication structurée belge valide
 * @param baseNumber Numéro de base (10 chiffres maximum)
 * @returns Communication structurée formatée
 */
export function generateBelgianStructuredCommunication(
  baseNumber: string,
): string {
  // S'assurer que nous avons exactement 10 chiffres
  const paddedBase = baseNumber.padStart(10, '0').substring(0, 10);

  // Calculer le modulo 97
  const baseNumberInt = parseInt(paddedBase);
  let modulo = baseNumberInt % 97;

  if (modulo === 0) {
    modulo = 97;
  }

  // Formater le modulo sur 2 chiffres
  const checkDigits = modulo.toString().padStart(2, '0');

  // Construire la communication structurée complète
  const fullNumber = paddedBase + checkDigits;

  // Formater avec les barres obliques et les +
  return `+++${fullNumber.substring(0, 3)}/${fullNumber.substring(3, 7)}/${fullNumber.substring(7, 12)}+++`;
}
