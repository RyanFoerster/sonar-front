import { PrincipalAccountEntity } from './principal-account.entity';
import { UserSecondaryAccountEntity } from './user-secondary-account.entity';
import { ClientEntity } from './client.entity';

export interface UserEntity {
  id: number;
  username: string;
  email: string;
  name: string;
  firstName: string;
  numeroNational: string;
  telephone: string;
  iban: string;
  isActive: boolean;
  role: string;
  address: string;
  profilePicture: string;
  monthly_billing: boolean;
  googleId?: string | null;
  comptePrincipal: PrincipalAccountEntity;
  userSecondaryAccounts: UserSecondaryAccountEntity[];
  clients: ClientEntity[];
}
