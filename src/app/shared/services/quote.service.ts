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
}
