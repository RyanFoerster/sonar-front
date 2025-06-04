/**
 * Formate un IBAN en ajoutant des espaces tous les 4 caractères
 * @param iban L'IBAN à formater
 * @returns L'IBAN formaté
 */
export function formatIban(iban: string): string {
  if (!iban) return '';

  // Retirer tous les espaces et convertir en majuscules
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();

  // Ajouter un espace tous les 4 caractères
  return cleanIban.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Nettoie un IBAN (retire les espaces)
 * @param iban L'IBAN à nettoyer
 * @returns L'IBAN nettoyé
 */
export function cleanIban(iban: string): string {
  if (!iban) return '';
  return iban.replace(/\s/g, '').toUpperCase();
}

/**
 * Directive pour formater automatiquement l'IBAN dans un input
 */
export function onIbanInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (!input) return;

  const cursorPosition = input.selectionStart || 0;
  const originalLength = input.value.length;

  // Formater la valeur
  const formattedValue = formatIban(input.value);
  input.value = formattedValue;

  // Ajuster la position du curseur
  const lengthDifference = formattedValue.length - originalLength;
  const newCursorPosition = cursorPosition + lengthDifference;

  // Replacer le curseur
  setTimeout(() => {
    input.setSelectionRange(newCursorPosition, newCursorPosition);
  }, 0);
}
