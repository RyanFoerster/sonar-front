export type NotificationData = Record<
  string,
  string | number | boolean | Date | undefined | null
>;

export class NotificationEntity {
  id!: number;
  userId!: number;
  type!: string;
  title!: string;
  message!: string;
  isRead!: boolean;
  data?: NotificationData;
  createdAt!: Date;
  updatedAt!: Date;
}
