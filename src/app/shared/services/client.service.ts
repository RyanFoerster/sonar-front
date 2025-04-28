import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ClientEntity } from '../entities/client.entity';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private readonly httpClient = inject(HttpClient);
  private readonly API_URL = environment.API_URL;

  findAll() {
    return this.httpClient.get<ClientEntity[]>(`${this.API_URL}/clients`);
  }

  getAll() {
    return this.httpClient.get<ClientEntity[]>(`${this.API_URL}/clients`);
  }

  findOne(id: number) {
    return this.httpClient.get<ClientEntity>(`${this.API_URL}/clients/${id}`);
  }

  getOneById(id: number) {
    return this.httpClient.get<ClientEntity>(`${this.API_URL}/clients/${id}`);
  }

  create(client: Partial<ClientEntity>) {
    return this.httpClient.post<ClientEntity>(
      `${this.API_URL}/clients`,
      client
    );
  }

  update(id: number, client: Partial<ClientEntity>) {
    return this.httpClient.patch<ClientEntity>(
      `${this.API_URL}/clients/${id}`,
      client
    );
  }

  updateDetails(id: number, clientData: Partial<ClientEntity>) {
    return this.httpClient.patch<ClientEntity>(
      `${this.API_URL}/clients/update-details/${id}`,
      clientData
    );
  }

  remove(id: number) {
    return this.httpClient.delete<void>(`${this.API_URL}/clients/${id}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checkBce(companyNumber: string): Observable<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.httpClient.get<any>(
      `${this.API_URL}/clients/bce/${companyNumber}`
    );
  }
}
