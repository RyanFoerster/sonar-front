export interface InvoiceEntity {
  id: number
  invoice_date: Date
  service_date: Date
  price_htva: number
  total_vat_6: number;
  total_vat_21: number;
  total: number
  payment_deadline: number
  status: string
  type: string
  linkedInvoiceId: number
  creditNoteAmount: number
}
