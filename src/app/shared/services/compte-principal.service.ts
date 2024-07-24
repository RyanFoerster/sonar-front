import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PrincipalAccountEntity } from '../entities/principal-account.entity';
import { environments } from '../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class ComptePrincipalService {

  httpClient: HttpClient = inject(HttpClient)

  constructor() {}

  getAllGroupPrincipal(){
    return this.httpClient.get<PrincipalAccountEntity[]>(`${environments.API_URL}/compte-principal`)
  }

  getGroupById(id?: number) {
    return this.httpClient.get<PrincipalAccountEntity>(`${environments.API_URL}/compte-principal/${id}`)
  }
}
