import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {TransactionEntity} from "../entities/transaction.entity";
import {environment} from "../../../environments/environment";
import {TransactionDto} from "../dtos/transaction.dto";

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private httpClient: HttpClient = inject(HttpClient);

  constructor() { }

  createTransaction(createTransactionDto: TransactionDto) {
    return this.httpClient.post<TransactionDto>(`${environment.API_URL}/transaction`, createTransactionDto)
  }

  getRecipientPrincipalTransactionById(id: number) {
    return this.httpClient.get<TransactionEntity[]>(`${environment.API_URL}/transaction/recipient-principal/${id}`)
  }

  getSenderPrincipalTransactionById(id: number) {
    return this.httpClient.get<TransactionEntity[]>(`${environment.API_URL}/transaction/sender-principal/${id}`)
  }

  getRecipientGroupTransactionById(id: number) {
    return this.httpClient.get<TransactionEntity[]>(`${environment.API_URL}/transaction/recipient-group/${id}`)
  }

  getSenderGroupTransactionById(id: number) {
    return this.httpClient.get<TransactionEntity[]>(`${environment.API_URL}/transaction/sender-group/${id}`)
  }
}
