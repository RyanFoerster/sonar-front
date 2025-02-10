import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { QuoteDto } from '../dtos/quote.dto';
import { environment } from '../../../environments/environment';
import { QuoteEntity } from '../entities/quote.entity';

@Injectable({
  providedIn: 'root',
})
export class QuoteService {
  httpClient: HttpClient = inject(HttpClient);

  createQuote(quoteDto: QuoteDto, file: File | null) {
    const form = new FormData();

    // Ajouter le fichier seulement s'il existe
    if (file) {
      form.append('attachment', file);
    }

    // Nettoyer et préparer les données
    const cleanQuoteDto = {
      ...quoteDto,
      products_id: Array.isArray(quoteDto.products_id)
        ? quoteDto.products_id
        : [],
    };

    // Convertir les données du DTO en JSON string
    form.append('data', JSON.stringify(cleanQuoteDto));

    // Log pour debug
    console.log('FormData content:');
    form.forEach((value, key) => {
      console.log(`${key}:`, value);
    });

    return this.httpClient.post<QuoteEntity>(
      `${environment.API_URL}/quote`,
      form
    );
  }

  updateQuote(quoteId: string | null, quoteDto: QuoteDto) {
    return this.httpClient.patch<QuoteEntity>(
      `${environment.API_URL}/quote/${quoteId}`,
      quoteDto
    );
  }

  getQuote(quoteId: string | null) {
    return this.httpClient.get<QuoteEntity>(
      `${environment.API_URL}/quote/${quoteId}`
    );
  }

  reportQuoteDate(quoteId: number | null, report_date: Date) {
    return this.httpClient.patch<boolean>(
      `${environment.API_URL}/quote/${quoteId}/report_date`,
      { report_date }
    );
  }

  acceptQuoteFromGroup(quoteId: string | null) {
    return this.httpClient.patch<QuoteEntity>(
      `${environment.API_URL}/quote/${quoteId}/group_acceptance`,
      {}
    );
  }

  acceptQuoteFromClient(quoteId: string | null) {
    return this.httpClient.patch<QuoteEntity>(
      `${environment.API_URL}/quote/${quoteId}/order_giver_acceptance`,
      {}
    );
  }

  rejectQuoteFromGroup(quoteId: string | null) {
    return this.httpClient.patch<QuoteEntity>(
      `${environment.API_URL}/quote/${quoteId}/group_rejection`,
      {}
    );
  }

  rejectQuoteFromClient(quoteId: string | null) {
    return this.httpClient.patch<QuoteEntity>(
      `${environment.API_URL}/quote/${quoteId}/order_giver_rejection`,
      {}
    );
  }
}
