import {UserEntity} from "./user.entity";

export interface CommentDto {
  id: number;
  content: string;
  user: UserEntity;
}
