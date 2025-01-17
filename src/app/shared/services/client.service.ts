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

  remove(id: number) {
    return this.httpClient.delete<void>(`${this.API_URL}/clients/${id}`);
  }

  checkBce(companyNumber: string): Observable<any> {
    return this.httpClient.get<any>(
      `${this.API_URL}/clients/check-bce/${companyNumber}`
    );
  }
}
