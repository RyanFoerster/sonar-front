import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { InvoiceEntity } from '../entities/invoice.entity';
import { QuoteEntity } from '../entities/quote.entity';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private readonly httpClient = inject(HttpClient);
  private readonly API_URL = environment.API_URL;

  findAll() {
    return this.httpClient.get<InvoiceEntity[]>(`${this.API_URL}/invoice`);
  }

  getAll(): Observable<InvoiceEntity[]> {
    return this.httpClient.get<InvoiceEntity[]>(`${this.API_URL}/invoice/all`);
  }

  findOne(id: number) {
    return this.httpClient.get<InvoiceEntity>(`${this.API_URL}/invoice/${id}`);
  }

  createInvoice(
    quote: QuoteEntity,
    params: { account_id: number; type: 'PRINCIPAL' | 'GROUP' }
  ): Observable<InvoiceEntity> {
    console.log(quote);
    return this.httpClient.post<InvoiceEntity>(
      `${this.API_URL}/invoice`,
      quote,
      {
        params,
      }
    );
  }
  createInvoiceWithoutQuote(
    quote: QuoteEntity,
    params: { account_id: number; type: 'PRINCIPAL' | 'GROUP' }
  ): Observable<InvoiceEntity> {
    console.log(quote);
    return this.httpClient.post<InvoiceEntity>(
      `${this.API_URL}/invoice/createInvoiceWithoutQuote`,
      quote,
      {
        params,
      }
    );
  }

  createCreditNoteWithoutInvoice(
    creditNoteData: any,
    account_id: number,
    type: 'PRINCIPAL' | 'GROUP'
  ): Observable<InvoiceEntity> {
    return this.httpClient.post<InvoiceEntity>(
      `${this.API_URL}/invoice/credit-note-without-invoice`,
      creditNoteData,
      { params: { account_id, type } }
    );
  }

  createCreditNote(
    creditNoteData: any,
    params: { account_id: number; type: 'PRINCIPAL' | 'GROUP' }
  ): Observable<InvoiceEntity> {
    return this.httpClient.post<InvoiceEntity>(
      `${this.API_URL}/invoice/credit-note`,
      creditNoteData,
      { params }
    );
  }

  getCreditNoteByInvoiceId(invoiceId: number): Observable<InvoiceEntity> {
    return this.httpClient.get<InvoiceEntity>(
      `${this.API_URL}/invoice/credit-note/${invoiceId}`
    );
  }

  update(id: number, invoice: Partial<InvoiceEntity>) {
    return this.httpClient.patch<InvoiceEntity>(
      `${this.API_URL}/invoice/${id}`,
      invoice
    );
  }

  remove(id: number) {
    return this.httpClient.delete<void>(`${this.API_URL}/invoice/${id}`);
  }
}
