import { CompteGroupeEntity } from './compte-groupe.entity';
import { UserEntity } from './user.entity';

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export class GroupeInvitation {
  id!: number;
  invitedUser!: UserEntity;
  invitedUserId!: number;
  group!: CompteGroupeEntity;
  groupId!: number;
  status!: InvitationStatus;
  message?: string;
  isNotified!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
