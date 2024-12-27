import { QuoteEntity } from './quote.entity';
import { InvoiceEntity } from './invoice.entity';
import { TransactionEntity } from './transaction.entity';
import { VirementSepaEntity } from './virement-sepa.entity';
import { UserEntity } from './user.entity';

export interface PrincipalAccountEntity {
  id: number;
  username: string;
  solde: number;
  quote: QuoteEntity[];
  invoice: InvoiceEntity[];
  transactions: TransactionEntity[];
  virementSepa: VirementSepaEntity[];
  user?: UserEntity;
}
