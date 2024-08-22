import { Injectable, inject } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {InvitationEntity} from "../entities/invitation.entity";

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  private httpClient: HttpClient = inject(HttpClient)
  constructor() { }

  getByUserId() {
    return this.httpClient.get<InvitationEntity[]>(`${environment.API_URL}/invitations`)
  }

  update(id: number, invitation: InvitationEntity) {
    return this.httpClient.patch<InvitationEntity>(`${environment.API_URL}/invitations/${id}`, invitation)
  }


}
