import {ClientEntity} from "./client.entity";
import {ProductEntity} from "./product.entity";
import {InvoiceEntity} from "./invoice.entity";

export interface QuoteEntity {
  id: number
  quote_date: Date
  service_date: Date
  price_htva: number
  total_vat_6: number
  total_vat_21: number
  total: number
  payment_deadline: number
  validation_deadline: Date
  isVatIncluded: boolean
  status: string
  group_acceptance: "accepted" | "rejected" | "pending"
  order_giver_acceptance: "accepted" | "rejected" | "pending"
  comment: string
  client: ClientEntity
  products: ProductEntity[]
  invoice: InvoiceEntity
}
