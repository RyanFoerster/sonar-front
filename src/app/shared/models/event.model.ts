export enum EventStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

export interface InvitedPerson {
  personId: number | string;
  status: InvitationStatus;
  isExternal?: boolean;
  email?: string;
  name?: string;
}

export interface Event {
  id?: string;
  title: string;
  description?: string;
  location?: string;
  startDateTime: string | Date;
  endDateTime: string | Date;
  meetupDateTime: string | Date;
  status: EventStatus;
  cancellationReason?: string;
  invitedPeople: InvitedPerson[];
  groupId: number;
  organizers: number[];
  participants: number[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  meetupDateTime: string;
  status?: EventStatus;
  cancellationReason?: string;
  invitedPeople?: InvitedPerson[];
  groupId?: number;
  organizers: number[];
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  location?: string;
  startDateTime?: string;
  endDateTime?: string;
  meetupDateTime?: string;
  status?: EventStatus;
  cancellationReason?: string;
  invitedPeople?: InvitedPerson[];
  organizers?: number[];
  participants?: number[];
}

export interface DuplicateEventRequest {
  eventId?: string;
  startDateTime?: string;
  endDateTime?: string;
  meetupDateTime?: string;
}

export interface SendReminderRequest {
  eventId?: string;
  recipientIds: (number | string)[];
}
