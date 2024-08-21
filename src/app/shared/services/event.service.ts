import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {EventDto} from "../dtos/event.dto";
import {EventEntity} from "../entities/event.entity";

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private httpClient: HttpClient = inject(HttpClient);

  constructor() {
  }

  create(event: EventDto, group_id: number) {
    return this.httpClient.post<EventEntity>('http://localhost:3000/events', event, {params: {group_id}});
  }

  getEventsByGroupId(group_id: number) {
    return this.httpClient.get<EventEntity[]>('http://localhost:3000/events', {params: {group_id}});
  }

  cancel(id: number, reason: string) {
    return this.httpClient.patch<EventEntity>(`http://localhost:3000/events/${id}/cancel`, {reason});
  }

  hide(id: number, reason: string) {
    return this.httpClient.patch<EventEntity>(`http://localhost:3000/events/${id}/hide`, {reason});
  }

  confirm(id: number, event: EventEntity) {
    return this.httpClient.patch<EventEntity>(`http://localhost:3000/events/${id}/confirm`, event);

  }

  userStatus(id: number, user_id: number, status: "accepted" | "refused") {
    return this.httpClient.patch<EventEntity>(`http://localhost:3000/events/${id}/userStatus`, {user_id, status});
  }
}
