import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { QuoteEntity } from '../entities/quote.entity';
import { InvoiceEntity } from '../entities/invoice.entity';
import { environment } from '../../../environments/environment';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private httpClient: HttpClient = inject(HttpClient);

  constructor() {}

  createInvoice(quote: QuoteEntity, type: string, account_id: number) {
    return this.httpClient.post<InvoiceEntity>(
      `${environment.API_URL}/invoice`,
      { quote },
      {
        params: {
          account_id: account_id,
          type: type,
        },
      },
    );
  }

  getInvoiceById(id: number) {
    return this.httpClient.get<InvoiceEntity>(
      `${environment.API_URL}/invoice/${id}`,
    );
  }

  createCreditNote({
    linkedInvoiceId,
    creditNoteAmount,
  }: {
    linkedInvoiceId: number;
    creditNoteAmount: number;
  }) {
    return this.httpClient.post<InvoiceEntity>(
      `${environment.API_URL}/invoice/credit-note`,
      {
        linkedInvoiceId,
        creditNoteAmount,
      },
    );
  }

  createCreditNoteWithoutInvoice(creditNote: any) {
    return this.httpClient.post<InvoiceEntity>(
      `${environment.API_URL}/invoice/credit-note-without-invoice`,
      creditNote,
    );
  }

  getCreditNoteByInvoiceId(invoice_id: number) {
    return this.httpClient.get<InvoiceEntity>(
      `${environment.API_URL}/invoice/credit-note/${invoice_id}`,
    );
  }

  getAll() {
    return this.httpClient.get<InvoiceEntity[]>(
      `${environment.API_URL}/invoice`,
    );
  }

  downloadInvoice(invoice_id: number) {
    return this.httpClient.get(
      `${environment.API_URL}/invoice/download/${invoice_id}`,
    );
  }
}
