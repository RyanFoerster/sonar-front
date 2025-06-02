import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TransactionEntity } from '../entities/transaction.entity';
import { environment } from '../../../environments/environment';
import { TransactionDto } from '../dtos/transaction.dto';
import { PaginatedResponse } from '../interfaces/paginated-response.interface';
import {VirementSepaEntity} from "../entities/virement-sepa.entity";

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private httpClient: HttpClient = inject(HttpClient);

  constructor() {}

  createTransaction(createTransactionDto: TransactionDto) {
    return this.httpClient.post<TransactionDto>(
      `${environment.API_URL}/transaction`,
      createTransactionDto
    );
  }

  getRecipientPrincipalTransactionById(
    id: number,
    page: number = 1,
    limit: number = 10
  ) {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.httpClient.get<PaginatedResponse<TransactionEntity>>(
      `${environment.API_URL}/transaction/recipient-principal/${id}`,
      { params }
    );
  }

  getSenderPrincipalTransactionById(
    id: number,
    page: number = 1,
    limit: number = 10
  ) {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.httpClient.get<PaginatedResponse<TransactionEntity>>(
      `${environment.API_URL}/transaction/sender-principal/${id}`,
      { params }
    );
  }

  getRecipientGroupTransactionById(
    id: number,
    page: number = 1,
    limit: number = 10
  ) {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.httpClient.get<PaginatedResponse<TransactionEntity>>(
      `${environment.API_URL}/transaction/recipient-group/${id}`,
      { params }
    );
  }

  getSenderGroupTransactionById(
    id: number,
    page: number = 1,
    limit: number = 10
  ) {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.httpClient.get<PaginatedResponse<TransactionEntity>>(
      `${environment.API_URL}/transaction/sender-group/${id}`,
      { params }
    );
  }





  deleteTransaction(id: number) {
    return this.httpClient.delete(
      `${environment.API_URL}/transaction/${id}`
    );


  }

  getTransactionByInvoiceId(id: number) {
    return this.httpClient.get<TransactionEntity>(
      `${environment.API_URL}/transaction/invoice/${id}`
    );

  }
}
