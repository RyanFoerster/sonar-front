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

    return this.httpClient.post<boolean>(`${environment.API_URL}/quote`, form);
  }

  updateQuote(quoteId: string | null, quoteDto: QuoteDto, file: File | null) {
    const form = new FormData();

    console.log('QuoteDto:', quoteDto);
    console.log('File reçu:', file);

    // Ajouter le fichier seulement s'il existe
    if (file) {
      console.log(
        'Ajout du fichier au FormData:',
        file.name,
        file.type,
        file.size
      );
      form.append('attachment', file, file.name);
    }

    const cleanQuoteDto = {
      ...quoteDto,
      products_id: Array.isArray(quoteDto.products_id)
        ? quoteDto.products_id
        : [],
    };

    // Convertir les données du DTO en JSON string
    form.append('data', JSON.stringify(cleanQuoteDto));

    // Log du contenu du FormData
    console.log('Contenu du FormData:');
    form.forEach((value, key) => {
      if (value instanceof File) {
        console.log(
          `${key}: File[name=${value.name}, type=${value.type}, size=${value.size}]`
        );
      } else {
        console.log(`${key}:`, value);
      }
    });

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
