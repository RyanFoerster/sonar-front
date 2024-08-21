import {UserEntity} from "./user.entity";
import {CommentDto} from "./comment.entity";
import {CompteGroupeEntity} from "./compte-groupe.entity";
import {InvitationEntity} from "./invitation.entity";

export interface EventEntity {
  id: number;
  title: string;
  description: string;
  location: string;
  start_time: Date;
  end_time?: Date;
  rendez_vous_date: Date;
  status: "pending" | "confirmed" | "canceled" | "hidden";
  user_status: { user_id: number, status: "accepted" | "refused" }[];
  group: CompteGroupeEntity;
  organisateurs: UserEntity[];
  participants: UserEntity[];
  invitation: InvitationEntity[];
  comments: CommentDto[]

}
