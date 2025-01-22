export interface InvoiceDto {
  credit_note_date?: Date;
  service_date: Date;
  payment_deadline?: number;
  isVatIncluded?: boolean;
  main_account_id?: number;
  group_account_id?: number;
  products_id: number[];
  client_id: number;
  comment?: string;
  type?: 'invoice' | 'credit_note';
}
