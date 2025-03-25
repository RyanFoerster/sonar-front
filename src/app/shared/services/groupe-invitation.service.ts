import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { GroupeInvitation } from '../entities/groupe-invitation.entity';

@Injectable({
  providedIn: 'root',
})
export class GroupeInvitationService {
  private httpClient = inject(HttpClient);
  private authService = inject(AuthService);

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders()
      .set(
        'apikey',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluZnBscXNjaWZubmpmYmF0c2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMwNTA3MjcsImV4cCI6MjAzODYyNjcyN30.jINf2PmZklBFMcSjHeO0c2GY3nGRdwQ4YSA4T5bJxok'
      )
      .set('Authorization', `Bearer ${token}`);
  }

  /**
   * Récupère toutes les invitations en attente pour l'utilisateur connecté
   * @param options Options pour contrôler les relations chargées
   */
  getPendingInvitations(options?: {
    excludeRelations?: boolean;
  }): Observable<GroupeInvitation[]> {
    let params = new HttpParams();

    // Si excludeRelations est vrai, on ajoute un paramètre à la requête
    if (options?.excludeRelations) {
      params = params.set('excludeRelations', 'true');
    }

    return this.httpClient.get<GroupeInvitation[]>(
      `${environment.API_URL}/groupe-invitation/pending`,
      {
        headers: this.getHeaders(),
        params,
      }
    );
  }

  /**
   * Répond à une invitation (accepter ou refuser)
   * @param invitationId ID de l'invitation
   * @param accept true pour accepter, false pour refuser
   * @param options Options pour contrôler les relations chargées
   */
  respondToInvitation(
    invitationId: number,
    accept: boolean,
    options?: { excludeRelations?: boolean }
  ): Observable<GroupeInvitation> {
    let params = new HttpParams();

    // Si excludeRelations est vrai, on ajoute un paramètre à la requête
    if (options?.excludeRelations) {
      params = params.set('excludeRelations', 'true');
    }

    const responseData = { accept, message: '' };

    return this.httpClient.patch<GroupeInvitation>(
      `${environment.API_URL}/groupe-invitation/${invitationId}/respond`,
      responseData,
      {
        headers: this.getHeaders(),
        params,
      }
    );
  }
}
