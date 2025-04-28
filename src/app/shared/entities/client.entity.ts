import { UserEntity } from './user.entity';
import { QuoteEntity } from './quote.entity';
import { InvoiceEntity } from './invoice.entity';

export interface ClientEntity {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  street: string;
  number: string;
  city: string;
  country: string;
  postalCode: string;
  company_number?: number;
  company_vat_number?: string;
  national_number: string;
  is_physical_person: boolean;
  is_info_pending: boolean;
  default_payment_deadline?: number;
  createdAt: Date;
  updatedAt: Date;
  user: UserEntity;
  quote: QuoteEntity;
  invoice: InvoiceEntity;
}
