import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateEventRequest,
  DuplicateEventRequest,
  Event,
  InvitedPerson,
  SendReminderRequest,
  UpdateEventRequest,
} from '../shared/models/event.model';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private apiUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les événements d'un groupe
   */
  getEventsByGroup(groupId: number): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/groups/${groupId}/events`);
  }

  /**
   * Récupère tous les événements d'un utilisateur (où il est invité ou organisateur)
   */
  getUserEvents(userId: number): Observable<Event[]> {
    return this.http.get<Event[]>(
      `${this.apiUrl}/groups/user/${userId}/events`
    );
  }

  /**
   * Récupère un événement par son ID
   */
  getEventById(groupId: number, eventId: string): Observable<Event> {
    return this.http.get<Event>(
      `${this.apiUrl}/groups/${groupId}/events/${eventId}`
    );
  }

  /**
   * Crée un nouvel événement
   */
  createEvent(groupId: number, event: CreateEventRequest): Observable<Event> {
    return this.http.post<Event>(
      `${this.apiUrl}/groups/${groupId}/events`,
      event
    );
  }

  /**
   * Met à jour un événement existant
   */
  updateEvent(
    groupId: number,
    eventId: string,
    event: UpdateEventRequest
  ): Observable<Event> {
    return this.http.patch<Event>(
      `${this.apiUrl}/groups/${groupId}/events/${eventId}`,
      event
    );
  }

  /**
   * Supprime un événement
   */
  deleteEvent(groupId: number, eventId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/groups/${groupId}/events/${eventId}`
    );
  }

  /**
   * Duplique un événement
   */
  duplicateEvent(
    groupId: number,
    eventId: string,
    data: DuplicateEventRequest
  ): Observable<Event> {
    return this.http.post<Event>(
      `${this.apiUrl}/groups/${groupId}/events/${eventId}/duplicate`,
      data
    );
  }

  /**
   * Envoie des rappels aux invités sélectionnés
   */
  sendReminders(
    groupId: number,
    eventId: string,
    recipients: SendReminderRequest
  ): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/groups/${groupId}/events/${eventId}/reminders`,
      recipients
    );
  }

  /**
   * Récupère la liste des participants avec leur statut
   */
  getParticipants(
    groupId: number,
    eventId: string
  ): Observable<InvitedPerson[]> {
    return this.http.get<InvitedPerson[]>(
      `${this.apiUrl}/groups/${groupId}/events/${eventId}/participants`
    );
  }

  /**
   * Répond à une invitation
   *
   * Note: Cette méthode ne fonctionne pas correctement car l'URL ne correspond pas
   * à la route définie dans le backend. Utilisez HttpClient directement avec
   * l'URL ${apiUrl}/groups/events/${eventId}/response?personId=${personId} à la place.
   */
  respondToInvitation(
    eventId: string,
    personId: string,
    status: string
  ): Observable<Event> {
    return this.http.post<Event>(
      `${this.apiUrl}/groups/events/${eventId}/response?personId=${personId}`,
      { status }
    );
  }
}
