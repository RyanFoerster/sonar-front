import {QuoteEntity} from "./quote.entity";

export interface ProductEntity {
  id?: number;

  description: string;

  price: number;

  price_htva?: number;

  quantity: number;

  vat: number;

  tva_amount?: number;

  total?: number;

}
