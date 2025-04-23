import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CompteGroupeEntity } from '../entities/compte-groupe.entity';
import { environment } from '../../../environments/environment';
import { GroupProjectDto } from '../dtos/group-project.dto';
// import { UserEntity } from '../entities/user.entity'; // Supprimé car plus utilisé
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { UserSecondaryAccountEntity } from '../entities/user-secondary-account.entity';

interface GroupInvitationDto {
  secondary_account_id: number;
  invitedUserId: number;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CompteGroupeService {
  httpClient: HttpClient = inject(HttpClient);
  private authService = inject(AuthService);
  private userSecondaryAccountApiUrl = `${environment.API_URL}/user-secondary-account`;

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders()
      .set(
        'apikey',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluZnBscXNjaWZubmpmYmF0c2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMwNTA3MjcsImV4cCI6MjAzODYyNjcyN30.jINf2PmZklBFMcSjHeO0c2GY3nGRdwQ4YSA4T5bJxok'
      )
      .set('Authorization', `Bearer ${token}`);
  }

  getAllGroupAccount() {
    return this.httpClient.get<CompteGroupeEntity[]>(
      `${environment.API_URL}/compte-groupe`,
      { headers: this.getHeaders() }
    );
  }

  getGroupById(id?: number) {
    return this.httpClient.get<CompteGroupeEntity>(
      `${environment.API_URL}/compte-groupe/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getGroupByUser(id: number) {
    return this.httpClient.get<CompteGroupeEntity[]>(
      `${environment.API_URL}/compte-groupe/user/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getAllMembers(id: number): Observable<UserSecondaryAccountEntity[]> {
    return this.httpClient.get<UserSecondaryAccountEntity[]>(
      `${environment.API_URL}/compte-groupe/${id}/members`,
      { headers: this.getHeaders() }
    );
  }

  createGroupeProject(groupProjectDto: GroupProjectDto) {
    return this.httpClient.post(
      `${environment.API_URL}/compte-groupe`,
      groupProjectDto,
      { headers: this.getHeaders() }
    );
  }

  updateGroupName(id: number, username: string) {
    return this.httpClient.patch<CompteGroupeEntity>(
      `${environment.API_URL}/compte-groupe/${id}`,
      { username },
      { headers: this.getHeaders() }
    );
  }

  getById(id: number): Observable<CompteGroupeEntity> {
    return this.httpClient.get<CompteGroupeEntity>(
      `${environment.API_URL}/compte-groupe/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Invite un utilisateur à rejoindre un groupe
   * @param invitation Données de l'invitation
   * @returns Observable avec les détails de l'invitation
   */
  inviteUserToGroup(
    invitation: GroupInvitationDto
  ): Observable<UserSecondaryAccountEntity> {
    return this.httpClient.post<UserSecondaryAccountEntity>(
      `${environment.API_URL}/groupe-invitation/invite`,
      invitation,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Permet à l'utilisateur connecté de quitter un groupe
   * @param groupId ID du groupe à quitter
   * @returns Observable avec un message de confirmation
   */
  leaveGroup(groupId: number): Observable<{ message: string }> {
    return this.httpClient.delete<{ message: string }>(
      `${this.userSecondaryAccountApiUrl}/groups/${groupId}/leave`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Permet à un administrateur du groupe de retirer un membre
   * @param groupId ID du groupe
   * @param memberId ID de l'utilisateur à retirer
   * @returns Observable avec un message de confirmation
   */
  removeMember(
    groupId: number,
    memberId: number
  ): Observable<{ message: string }> {
    return this.httpClient.delete<{ message: string }>(
      `${this.userSecondaryAccountApiUrl}/groups/${groupId}/members/${memberId}`,
      { headers: this.getHeaders() }
    );
  }
}
