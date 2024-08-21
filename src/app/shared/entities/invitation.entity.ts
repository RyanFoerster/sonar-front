import {UserEntity} from "./user.entity";
import {EventEntity} from "./event.entity";

export interface InvitationEntity {
  id: number;

  status: 'invited' | 'accepted' | 'refused';

  event: EventEntity;

  user: UserEntity;

  created_at: Date;

  updated_at: Date;
}
