import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ClientEntity} from "../entities/client.entity";
import {ClientDto} from "../dtos/client.dto";
import {environments} from "../../../environments/environments";

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  httpClient: HttpClient = inject(HttpClient)


  constructor() { }

  create(clientDto: ClientDto) {
    return this.httpClient.post<ClientEntity>(`${environments.API_URL}/clients`, clientDto)
  }

  getOneById(id: number) {
    return this.httpClient.get<ClientEntity>(`${environments.API_URL}/clients/${id}`)
  }
}
