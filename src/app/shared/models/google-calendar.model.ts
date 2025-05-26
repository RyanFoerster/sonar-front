export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  accessRole: string;
  primary?: boolean;
  backgroundColor?: string;
}

export interface GoogleCalendarList {
  kind: string;
  etag: string;
  nextSyncToken?: string;
  items: GoogleCalendar[];
}

export interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  status: string;
  created: string;
  updated: string;
  organizer?: {
    id?: string;
    email: string;
    displayName?: string;
    self?: boolean;
  };
}

export interface GoogleEventList {
  kind: string;
  etag: string;
  summary: string;
  description?: string;
  updated: string;
  timeZone: string;
  accessRole: string;
  nextSyncToken?: string;
  items: GoogleEvent[];
}

export interface CalendarCreateData {
  summary: string;
  description?: string;
  timeZone?: string;
}

export interface EventCreateData {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: {
    email: string;
    displayName?: string;
    optional?: boolean;
  }[];
  reminders?: {
    useDefault: boolean;
    overrides?: {
      method: string;
      minutes: number;
    }[];
  };
}
