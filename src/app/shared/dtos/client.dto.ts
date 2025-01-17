export interface ClientDto {
  name: string;

  firstname?: string;

  lastname?: string;

  email: string;

  phone: string;

  street: string;

  number: string;

  city: string;

  country: string;

  postalCode: string;

  company_number?: number;

  company_vat_number?: string;

  national_number?: string;

  is_physical_person: boolean;
}
