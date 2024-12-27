import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PrincipalAccountEntity } from '../entities/principal-account.entity';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ComptePrincipalService {
  httpClient: HttpClient = inject(HttpClient);

  constructor() {}

  getAllGroupPrincipal() {
    return this.httpClient.get<PrincipalAccountEntity[]>(
      `${environment.API_URL}/compte-principal`
    );
  }

  getGroupById(id?: number) {
    return this.httpClient.get<PrincipalAccountEntity>(
      `${environment.API_URL}/compte-principal/${id}`
    );
  }

  getAllMembers(id: number) {
    return this.httpClient.get<any[]>(
      `${environment.API_URL}/compte-principal/${id}/members`
    );
  }
}
