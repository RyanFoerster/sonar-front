export interface ProductDto {
  description: string;

  price: number;

  vat: number;

  quantity: number;

  price_htva?: number;

  tva_amount?: number;

  total?: number;
}
