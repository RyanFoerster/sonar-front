import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {QuoteDto} from "../dtos/quote.dto";
import {environments} from "../../../environments/environments";
import {QuoteEntity} from "../entities/quote.entity";

@Injectable({
  providedIn: 'root'
})
export class QuoteService {

  httpClient: HttpClient = inject(HttpClient)

  constructor() { }

  createQuote(quoteDto: QuoteDto) {
    return this.httpClient.post<QuoteEntity>(`${environments.API_URL}/quote`, quoteDto);
  }
}
