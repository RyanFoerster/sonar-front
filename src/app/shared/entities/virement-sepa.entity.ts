import {PrincipalAccountEntity} from "./principal-account.entity";
import {CompteGroupeEntity} from "./compte-groupe.entity";

export interface VirementSepaEntity {
  id: number;

  account_owner: string

  iban: string

  amount_htva: number

  amount_tva: number

  amount_total: number

  communication?: string

  structured_communication?: string

  comptePrincipal?: PrincipalAccountEntity

  compteGroupe?: CompteGroupeEntity

  status: "PENDING" | "REJECTED" | "ACCEPTED"

  projet_username: string

  created_at: Date
}
