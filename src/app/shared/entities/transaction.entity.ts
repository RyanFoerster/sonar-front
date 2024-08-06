import {CompteGroupeEntity} from "./compte-groupe.entity";
import {PrincipalAccountEntity} from "./principal-account.entity";

export interface TransactionEntity {
  id: number

  communication: string

  amount: number

  senderGroup: CompteGroupeEntity;

  senderPrincipal: PrincipalAccountEntity;

  recipientGroup: CompteGroupeEntity[];

  recipientPrincipal: PrincipalAccountEntity[];

  date: Date
}
