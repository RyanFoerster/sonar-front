import { ClientEntity } from './client.entity';
import { CompteGroupeEntity } from './compte-groupe.entity';
import { PrincipalAccountEntity } from './principal-account.entity';
import { ProductEntity } from './product.entity';

export interface InvoiceEntity {
  id: number;
  invoice_date: Date;
  invoice_number: number;
  service_date: Date;
  price_htva: number;
  total_vat_6: number;
  total_vat_21: number;
  total: number;
  payment_deadline: Date;
  status: string;
  type: string;
  comment: string;
  linkedInvoiceId: number;
  creditNoteAmount: number;
  client: ClientEntity;
  products: ProductEntity[];
  main_account: PrincipalAccountEntity;
  group_account: CompteGroupeEntity;
  reminder_level: number;
}
