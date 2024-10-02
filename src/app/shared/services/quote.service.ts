import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {QuoteDto} from "../dtos/quote.dto";
import {environment} from "../../../environments/environment";
import {QuoteEntity} from "../entities/quote.entity";

@Injectable({
  providedIn: 'root'
})
export class QuoteService {

  httpClient: HttpClient = inject(HttpClient)

  constructor() { }

  createQuote(quoteDto: QuoteDto) {
    return this.httpClient.post<QuoteEntity>(`${environment.API_URL}/quote`, quoteDto);
  }

  updateQuote(quoteId: string | null, quoteDto: QuoteDto) {
    return this.httpClient.patch<QuoteEntity>(`${environment.API_URL}/quote/${quoteId}`, quoteDto);
  }

  getQuote(quoteId: string | null) {
    return this.httpClient.get<QuoteEntity>(`${environment.API_URL}/quote/${quoteId}`);
  }

  acceptQuoteFromGroup(quoteId: string | null) {
      return this.httpClient.patch<QuoteEntity>(`${environment.API_URL}/quote/${quoteId}/group_acceptance`, {});
  }

  acceptQuoteFromClient(quoteId: string | null) {
    return this.httpClient.patch<QuoteEntity>(`${environment.API_URL}/quote/${quoteId}/order_giver_acceptance`, {});
  }

  rejectQuoteFromGroup(quoteId: string | null) {
    return this.httpClient.patch<QuoteEntity>(`${environment.API_URL}/quote/${quoteId}/group_rejection`, {});
  }

  rejectQuoteFromClient(quoteId: string | null) {
    return this.httpClient.patch<QuoteEntity>(`${environment.API_URL}/quote/${quoteId}/order_giver_rejection`, {});
  }

}
