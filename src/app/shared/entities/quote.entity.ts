export interface QuoteEntity {
  id: number
  quote_date: Date
  service_date: Date
  price_htva: number
  total_vat_6: number
  total_vat_21: number
  total: number
  payment_deadline: number
  status: string
  group_acceptance: boolean
  order_giver_acceptance: boolean;
}
