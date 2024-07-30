import {CompteGroupeEntity} from "../entities/compte-groupe.entity";
import {UserEntity} from "../entities/user.entity";

export interface UpdateUserSecondaryAccountDto {
  user?: UserEntity

  secondary_account_id: number;

  group_account?: CompteGroupeEntity

  role_agenda?: 'ADMIN' | 'VIEWER' | 'NONE';

  role_billing?: 'ADMIN' | 'VIEWER' | 'NONE';

  role_treasury?: 'ADMIN' | 'VIEWER' | 'NONE';

  role_gestion?: 'ADMIN' | 'VIEWER' | 'NONE';

  role_contract?: 'ADMIN' | 'VIEWER' | 'NONE';

  role_document?: 'ADMIN' | 'VIEWER' | 'NONE';
}
