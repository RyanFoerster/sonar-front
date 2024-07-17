import {UserEntity} from "./user.entity";

export interface LoggedUser {
  access_token: string
  user: UserEntity
}
