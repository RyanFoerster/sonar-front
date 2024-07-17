import {QuoteEntity} from "./quote.entity";
import {InvoiceEntity} from "./invoice.entity";
import {TransactionEntity} from "./transaction.entity";

export interface CompteGroupeEntity {
  id: number;
  username: string
  solde: number
  quote: QuoteEntity[]
  invoice: InvoiceEntity[]
  transactions: TransactionEntity[]
}
