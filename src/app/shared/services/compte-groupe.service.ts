import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CompteGroupeEntity } from '../entities/compte-groupe.entity';
import { environments } from '../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class CompteGroupeService {

  httpClient: HttpClient = inject(HttpClient)

  constructor() { }

  getAllGroupAccount() {
    return this.httpClient.get<CompteGroupeEntity[]>(`${environments.API_URL}/compte-groupe`)
  }
}
