export interface QuoteDto {
  quote_date: Date;

  service_date: Date;

  payment_deadline: number;

  validation_deadline: number;

  main_account_id?: number;

  group_account_id?: number;

  products_id: number[];

  client_id: number;

  comment: string
}
