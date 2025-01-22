import { ClientEntity } from './client.entity';
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
  linkedInvoiceId: number;
  creditNoteAmount: number;
  client: ClientEntity;
  products: ProductEntity[];
}
