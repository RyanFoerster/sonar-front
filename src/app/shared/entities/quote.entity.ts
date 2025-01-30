import { ClientEntity } from './client.entity';
import { ProductEntity } from './product.entity';
import { InvoiceEntity } from './invoice.entity';

export interface QuoteEntity {
  id: number;

  quote_date: Date;
  quote_number: number;
  service_date: Date;
  price_htva: number;
  total_vat_6: number;
  total_vat_21: number;
  total: number;
  payment_deadline: number;
  validation_deadline: Date;
  isVatIncluded: boolean;
  status: string;
  group_acceptance: 'accepted' | 'refused' | 'pending';
  order_giver_acceptance: 'accepted' | 'refused' | 'pending';
  comment: string;
  client: ClientEntity;
  products: ProductEntity[];
  invoice: InvoiceEntity;
}
