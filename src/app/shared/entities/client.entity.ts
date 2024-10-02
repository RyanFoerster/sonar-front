import {UserEntity} from "./user.entity";
import {QuoteEntity} from "./quote.entity";
import {InvoiceEntity} from "./invoice.entity";

export interface ClientEntity {
  id: number
  name: string
  email: string
  phone: string
  street: string
  number: string
  city: string
  country: string
  postalCode: string
  company_number?: number
  company_vat_number?: string
  national_number: string
  createdAt: Date
  updatedAt: Date
  user: UserEntity
  quote: QuoteEntity
  invoice: InvoiceEntity
}
