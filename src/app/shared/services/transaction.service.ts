import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {TransactionEntity} from "../entities/transaction.entity";
import {environments} from "../../../environments/environments";
import {TransactionDto} from "../dtos/transaction.dto";

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private httpClient: HttpClient = inject(HttpClient);

  constructor() { }

  createTransaction(createTransactionDto: TransactionDto) {
    return this.httpClient.post<TransactionDto>(`${environments.API_URL}/transaction`, createTransactionDto)
  }

  getRecipientPrincipalTransactionById(id: number) {
    return this.httpClient.get<TransactionEntity[]>(`${environments.API_URL}/transaction/recipient-principal/${id}`)
  }

  getSenderPrincipalTransactionById(id: number) {
    return this.httpClient.get<TransactionEntity[]>(`${environments.API_URL}/transaction/sender-principal/${id}`)

  }
}
