import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PrincipalAccountEntity } from '../entities/principal-account.entity';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ComptePrincipalService {
  httpClient: HttpClient = inject(HttpClient);

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

  getGroupByIdWithRelations(id?: number) {
    return this.httpClient.get<PrincipalAccountEntity>(
      `${environment.API_URL}/compte-principal/${id}/relations`
    );
  }

  getAllMembers(id: number) {
    return this.httpClient.get<any[]>(
      `${environment.API_URL}/compte-principal/${id}/members`
    );
  }

  updateGroupCommission(projectId: number, commission: any) {
    return this.httpClient.put(
      `${environment.API_URL}/compte-principal/${projectId}/commission`,
      { commission }
    );

  }

  getCommisionAccount() {
    return this.httpClient.get<any>(
      `${environment.API_URL}/compte-principal/commission`
    );

  }
}
