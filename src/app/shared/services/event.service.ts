import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {EventDto} from "../dtos/event.dto";
import {EventEntity} from "../entities/event.entity";
import {InvitationEntity} from "../entities/invitation.entity";
import {CommentDto} from "../dtos/comment.dto";
import {CommentEntity} from "../entities/comment.entity";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private httpClient: HttpClient = inject(HttpClient);

  constructor() {
  }

  create(event: EventDto, group_id: number) {
    return this.httpClient.post<EventEntity>(`${environment.API_URL}/events`, event, {params: {group_id}});
  }

  getEventsByGroupId(group_id: number) {
    return this.httpClient.get<EventEntity[]>(`${environment.API_URL}/events`
      , {params: {group_id}});
  }

  cancel(id: number, reason: string) {
    return this.httpClient.patch<EventEntity>(`${environment.API_URL}/events/${id}/cancel`, {reason});
  }

  hide(id: number, reason: string) {
    return this.httpClient.patch<EventEntity>(`${environment.API_URL}/events/${id}/hide`, {reason});
  }

  confirm(id: number, event: EventEntity) {
    return this.httpClient.patch<EventEntity>(`${environment.API_URL}/events/${id}/confirm`, event);

  }

  userStatus(id: number, user_id: number, status: "accepted" | "refused") {
    return this.httpClient.patch<EventEntity>(`${environment.API_URL}/events/${id}/userStatus`, {user_id, status});
  }

  invite({eventId, userId}: { eventId: number, userId: number }) {
    return this.httpClient.post<InvitationEntity>(`${environment.API_URL}/invitations`, {eventId, userId});

  }

  update(id: number, eventDto: EventDto) {
    return this.httpClient.patch<EventEntity>(`${environment.API_URL}/events/${id}`, eventDto);
  }

  createComment(commentDto: CommentDto) {
    return this.httpClient.post<CommentEntity>(`${environment.API_URL}/comments`, commentDto);
  }
}
