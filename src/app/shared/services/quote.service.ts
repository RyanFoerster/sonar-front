import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { QuoteDto } from '../dtos/quote.dto';
import { environment } from '../../../environments/environment';
import { QuoteEntity } from '../entities/quote.entity';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class QuoteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.API_URL}/quote`;

  createQuote(quoteDto: QuoteDto, files: File[], isDoubleValidation: boolean) {
    const form = new FormData();

    // Ajouter les fichiers s'ils existent
    if (files && files.length > 0) {
      console.log(`Ajout de ${files.length} fichiers au FormData`);
      files.forEach((file, index) => {
        console.log(`Fichier ${index + 1}:`, file.name, file.type, file.size);
        form.append('attachments', file);
      });
    } else {
      console.log('Aucun fichier à ajouter au FormData');
    }

    // Vérifier si les fichiers ont été correctement ajoutés
    console.log('Vérification du FormData:');
    console.log('Nombre de fichiers:', files.length);
    // FormData.get() ne retourne que le premier fichier, donc ce log n'est pas très utile
    const firstAttachment = form.get('attachments');
    console.log('Premier attachement:', firstAttachment);

    // Nettoyer et préparer les données
    const cleanQuoteDto = {
      ...quoteDto,
      products_id: Array.isArray(quoteDto.products_id)
        ? quoteDto.products_id
        : [],
    };

    // Convertir les données du DTO en JSON string
    form.append('data', JSON.stringify(cleanQuoteDto));

    return this.http.post<boolean>(`${this.apiUrl}`, form, {
      params: {
        isDoubleValidation,
      },
    });
  }

  updateQuote(
    quoteId: string | null,
    quoteDto: QuoteDto,
    files: File[],
    isDoubleValidation: boolean
  ) {
    const form = new FormData();

    // Ajouter les fichiers s'ils existent
    if (files && files.length > 0) {
      console.log(`Mise à jour: Ajout de ${files.length} fichiers au FormData`);
      files.forEach((file, index) => {
        console.log(`Fichier ${index + 1}:`, file.name, file.type, file.size);
        form.append('attachments', file);
      });
    } else {
      console.log('Mise à jour: Aucun fichier à ajouter au FormData');
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

    return this.http.post<QuoteEntity>(
      `${this.apiUrl}/${quoteId}/update`,
      form,
      {
        params: {
          isDoubleValidation,
        },
      }
    );
  }

  getQuote(quoteId: string | null) {
    return this.http.get<QuoteEntity>(`${this.apiUrl}/${quoteId}`);
  }

  reportQuoteDate(quoteId: number | null, report_date: Date) {
    return this.http.patch<boolean>(`${this.apiUrl}/${quoteId}/report_date`, {
      report_date,
    });
  }

  acceptQuoteFromGroup(quoteId: string | null) {
    return this.http.patch<QuoteEntity>(
      `${this.apiUrl}/${quoteId}/group_acceptance`,
      {}
    );
  }

  acceptQuoteFromClient(quoteId: string | null) {
    return this.http.patch<QuoteEntity>(
      `${this.apiUrl}/${quoteId}/order_giver_acceptance`,
      {}
    );
  }

  rejectQuoteFromGroup(quoteId: string | null) {
    return this.http.patch<QuoteEntity>(
      `${this.apiUrl}/${quoteId}/group_rejection`,
      {}
    );
  }

  rejectQuoteFromClient(quoteId: string | null) {
    return this.http.patch<QuoteEntity>(
      `${this.apiUrl}/${quoteId}/order_giver_rejection`,
      {}
    );
  }

  cancelRejectionFromGroup(quoteId: string | null) {
    return this.http.patch<QuoteEntity>(
      `${this.apiUrl}/${quoteId}/group_rejection_cancel`,
      {}
    );
  }

  cancelRejectionFromClient(quoteId: string | null) {
    return this.http.patch<QuoteEntity>(
      `${this.apiUrl}/${quoteId}/order_giver_rejection_cancel`,
      {}
    );
  }

  // Nouvelle méthode pour marquer les infos comme fournies
  markClientInfoAsProvided(quoteId: string) {
    // Le endpoint doit correspondre à celui défini dans le backend (QuoteController)
    // pour la méthode `markClientInfoAsProvided`.
    // Exemple: 'quote/mark-info-provided/:id' ou similaire.
    // *** AJUSTER LE PATH DE L'API ICI ***
    return this.http.patch<QuoteEntity>(
      `${this.apiUrl}/mark-info-provided/${quoteId}`, // !! Endpoint hypothétique !!
      {}
    );
  }

  downloadAttachment(attachmentKey: string) {
    return this.http
      .get(`${this.apiUrl}/attachment/${encodeURIComponent(attachmentKey)}`, {
        responseType: 'blob',
        observe: 'response',
        headers: {
          Accept: 'application/octet-stream',
        },
      })
      .pipe(map((response) => response.body as Blob));
  }

  getAllAdmin(): Observable<QuoteEntity[]> {
    return this.http.get<QuoteEntity[]>(`${this.apiUrl}/all-admin`);
  }

  getById(id: number): Observable<QuoteEntity> {
    return this.http.get<QuoteEntity>(`${this.apiUrl}/${id}`);
  }

  acceptQuoteGroupe($id: number) {
    return this.http.patch<QuoteEntity>(
      `${this.apiUrl}/${$id}/group_acceptance`,

      {}
    );

  }
}
