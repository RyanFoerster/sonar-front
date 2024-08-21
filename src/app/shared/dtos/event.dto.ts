export interface EventDto {
  title: string;
  description: string;
  location: string;
  start_time: Date;
  end_time?: Date;
  rendez_vous_date: Date;
  organisateurs_ids: number[];
  participants_ids: number[];
  invitations_ids: number[];
}
