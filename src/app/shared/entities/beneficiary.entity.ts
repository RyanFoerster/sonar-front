import { UserEntity } from './user.entity';

export interface Beneficiary {
  id: number;
  account_owner: string;
  iban: string;
  user: UserEntity;
  created_at: Date;
  updated_at: Date;
}
