export interface QuoteDto {
  quote_date: Date;

  service_date: Date;

  payment_deadline: number;

  validation_deadline: number;

  isVatIncluded?: boolean;

  main_account_id?: number;

  group_account_id?: number;

  products_id: number[];

  client_id: number;

  comment: string;

  attachment_key?: string[];

  created_by?: string;

  created_by_mail?: string;

  created_by_phone?: string;

  created_by_project_name?: string;
}
