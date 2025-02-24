import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { QuoteDto } from '../dtos/quote.dto';
import { environment } from '../../../environments/environment';
import { QuoteEntity } from '../entities/quote.entity';
import { tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class QuoteService {
  httpClient: HttpClient = inject(HttpClient);

  createQuote(quoteDto: QuoteDto, files: File[]) {
    const form = new FormData();

    // Ajouter les fichiers s'ils existent
    if (files && files.length > 0) {
      files.forEach((file) => {
        form.append('attachments', file);
      });
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

    return this.httpClient.post<boolean>(`${environment.API_URL}/quote`, form);
  }

  updateQuote(quoteId: string | null, quoteDto: QuoteDto, files: File[]) {
    const form = new FormData();

    // Ajouter les fichiers s'ils existent
    if (files && files.length > 0) {
      files.forEach((file) => {
        form.append('attachments', file);
      });
    }

    const cleanQuoteDto = {
      ...quoteDto,
      products_id: Array.isArray(quoteDto.products_id)
        ? quoteDto.products_id
        : [],
    };

    // Convertir les données du DTO en JSON string
    form.append('data', JSON.stringify(cleanQuoteDto));

    return this.httpClient.post<QuoteEntity>(
      `${environment.API_URL}/quote/${quoteId}/update`,
      form
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

  downloadAttachment(attachmentKey: string) {
    console.log('Service - Téléchargement de la clé:', attachmentKey);
    return this.httpClient
      .get(
        `${environment.API_URL}/quote/attachment/${encodeURIComponent(
          attachmentKey
        )}`,
        {
          responseType: 'blob',
          observe: 'response',
          headers: {
            Accept: 'application/octet-stream',
          },
        }
      )
      .pipe(
        tap((response) => {
          console.log('Service - Headers reçus:', response.headers);
          console.log(
            'Service - Content-Type:',
            response.headers.get('Content-Type')
          );
          console.log(
            'Service - Content-Disposition:',
            response.headers.get('Content-Disposition')
          );
        }),
        map((response) => response.body as Blob)
      );
  }
}
