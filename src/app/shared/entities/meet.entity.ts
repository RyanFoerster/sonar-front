import {UserEntity} from "./user.entity";

export interface MeetEntity {
    id: number;
    startDate: Date;
    title: string;
    user: UserEntity[];
}
