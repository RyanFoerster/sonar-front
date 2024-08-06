import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function atLeastOneRequired(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const communication = control.get('communication')?.value;
    const structuredCommunication = control.get('structured_communication')?.value;

    // Vérifie si au moins un des deux champs est rempli
    if (!communication && !structuredCommunication) {
      return { atLeastOneRequired: true }; // Indique que la validation a échoué
    }
    return null; // Indique que la validation a réussi
  };
}
