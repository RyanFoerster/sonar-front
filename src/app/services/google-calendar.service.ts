import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  GoogleCalendar,
  GoogleCalendarList,
  GoogleEvent,
  GoogleEventList,
  CalendarCreateData,
  EventCreateData,
} from '../shared/models/google-calendar.model';

// Interface pour le résultat de liaison avec Google
interface GoogleLinkResult {
  success: boolean;
  message: string;
  user?: {
    id: number;
    email: string;
    googleLinked: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class GoogleCalendarService {
  private apiUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  /**
   * Obtient l'URL pour lier un compte Google
   */
  getGoogleAuthUrl(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.apiUrl}/auth/google/link`);
  }

  /**
   * Lie un compte Google en utilisant le code d'autorisation
   */
  linkGoogleAccount(code: string): Observable<GoogleLinkResult> {
    return this.http.post<GoogleLinkResult>(`${this.apiUrl}/auth/google/link`, {
      code,
    });
  }

  /**
   * Vérifie si le compte est lié à Google
   */
  checkGoogleLinkStatus(): Observable<{ linked: boolean }> {
    return this.http.get<{ linked: boolean }>(
      `${this.apiUrl}/auth/google/status`
    );
  }

  /**
   * Supprime la liaison avec Google
   */
  unlinkGoogleAccount(): Observable<GoogleLinkResult> {
    return this.http.delete<GoogleLinkResult>(
      `${this.apiUrl}/auth/google/unlink`
    );
  }

  /**
   * Récupère les calendriers de l'utilisateur
   */
  getCalendars(): Observable<GoogleCalendarList> {
    return this.http.get<GoogleCalendarList>(
      `${this.apiUrl}/google-calendar/calendars`
    );
  }

  /**
   * Récupère les événements d'un calendrier
   */
  getCalendarEvents(calendarId: string): Observable<GoogleEventList> {
    return this.http.get<GoogleEventList>(
      `${this.apiUrl}/google-calendar/calendars/${calendarId}/events`
    );
  }

  /**
   * Crée un nouveau calendrier
   */
  createCalendar(calendarData: CalendarCreateData): Observable<GoogleCalendar> {
    return this.http.post<GoogleCalendar>(
      `${this.apiUrl}/google-calendar/calendars`,
      calendarData
    );
  }

  /**
   * Crée un nouvel événement dans un calendrier
   */
  createEvent(
    calendarId: string,
    eventData: EventCreateData
  ): Observable<GoogleEvent> {
    return this.http.post<GoogleEvent>(
      `${this.apiUrl}/google-calendar/calendars/${calendarId}/events`,
      eventData
    );
  }

  /**
   * Met à jour un événement existant dans un calendrier
   */
  updateEvent(
    calendarId: string,
    eventId: string,
    eventData: EventCreateData
  ): Observable<GoogleEvent> {
    return this.http.patch<GoogleEvent>(
      `${this.apiUrl}/google-calendar/calendars/${calendarId}/events/${eventId}`,
      eventData
    );
  }

  /**
   * Récupère un événement spécifique
   */
  getEvent(calendarId: string, eventId: string): Observable<GoogleEvent> {
    return this.http.get<GoogleEvent>(
      `${this.apiUrl}/google-calendar/calendars/${calendarId}/events/${eventId}`
    );
  }
}
