import {UserEntity} from "./user.entity";

export interface CommentEntity {
  id: number;
  content: string;
  user: UserEntity;
  created_at: Date;
}
