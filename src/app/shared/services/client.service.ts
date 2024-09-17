import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ClientEntity} from "../entities/client.entity";
import {ClientDto} from "../dtos/client.dto";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  httpClient: HttpClient = inject(HttpClient)


  constructor() { }

  create(clientDto: ClientDto) {
    return this.httpClient.post<ClientEntity>(`${environment.API_URL}/clients`, clientDto)
  }

  getOneById(id: number) {
    return this.httpClient.get<ClientEntity>(`${environment.API_URL}/clients/${id}`)
  }

  getAll() {
    return this.httpClient.get<ClientEntity[]>(`${environment.API_URL}/clients`)
  }

  checkBce(vat: string) {
    return this.httpClient.get<any>(`${environment.API_URL}/clients/bce/${vat}`)
  }
}
