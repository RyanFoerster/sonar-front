import {PrincipalAccountEntity} from "./principal-account.entity";
import {UserSecondaryAccountEntity} from "./user-secondary-account.entity";
import {ClientEntity} from "./client.entity";
import {VirementSepaEntity} from "./virement-sepa.entity";

export interface UserEntity {
  id: number
  username: string
  email: string
  name: string
  firstName: string
  numeroNational: string
  telephone: string
  iban: string
  isActive: boolean
  role: string
  address: string
  profilePicture: string
  comptePrincipal: PrincipalAccountEntity
  userSecondaryAccounts: UserSecondaryAccountEntity[]
  clients: ClientEntity[]
}
