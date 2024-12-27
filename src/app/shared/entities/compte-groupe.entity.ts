import { QuoteEntity } from './quote.entity';
import { InvoiceEntity } from './invoice.entity';
import { TransactionEntity } from './transaction.entity';
import { VirementSepaEntity } from './virement-sepa.entity';
import { UserSecondaryAccountEntity } from './user-secondary-account.entity';

export interface CompteGroupeEntity {
  id: number;
  username: string;
  solde: number;
  quote: QuoteEntity[];
  invoice: InvoiceEntity[];
  transactions: TransactionEntity[];
  virementSepa: VirementSepaEntity[];
  userSecondaryAccount?: UserSecondaryAccountEntity[];
}
