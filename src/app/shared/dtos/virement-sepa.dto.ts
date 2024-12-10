export interface VirementSepaDto {
  account_owner: string;

  iban: string;

  amount_htva: number;

  amount_tva: number;

  amount_total: number;

  communication?: string;

  structured_communication?: string;

  invoice: File;
}
