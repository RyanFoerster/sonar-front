import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {QuoteEntity} from "../entities/quote.entity";
import {environments} from "../../../environments/environments";
import {InvoiceEntity} from "../entities/invoice.entity";

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {

  private httpClient: HttpClient = inject(HttpClient);

  constructor() {
  }

  createInvoice(quote: QuoteEntity, type: string, account_id: number) {
    return this.httpClient.post<InvoiceEntity>(`${environments.API_URL}/invoice`, {quote}, {
      params: {
        account_id: account_id,
        type: type,
      }
    });
  }
}