import {UserEntity} from "./user.entity";
import {CompteGroupeEntity} from "./compte-groupe.entity";

export interface UserSecondaryAccountEntity {
  id: number
  secondary_account_id: number
  group_account: CompteGroupeEntity
  user: UserEntity
  role_agenda: "ADMIN" | "VIEWER" | "NONE";
  role_billing: "ADMIN" | "VIEWER" | "NONE";
  role_treasury: "ADMIN" | "VIEWER" | "NONE";
  role_gestion: "ADMIN" | "VIEWER" | "NONE";
  role_contract: "ADMIN" | "VIEWER" | "NONE";
  role_document: "ADMIN" | "VIEWER" | "NONE";
  created_at: Date;
  updated_at: Date;

}
