import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CompteGroupeEntity } from '../entities/compte-groupe.entity';
import { environment } from '../../../environments/environment';
import { PrincipalAccountEntity } from '../entities/principal-account.entity';
import { GroupProjectDto } from '../dtos/group-project.dto';
import { UpdateUserSecondaryAccountDto } from '../dtos/update-user-secondary-account.dto';
import { UserEntity } from '../entities/user.entity';

@Injectable({
  providedIn: 'root',
})
export class CompteGroupeService {
  httpClient: HttpClient = inject(HttpClient);

  constructor() {}

  getAllGroupAccount() {
    return this.httpClient.get<CompteGroupeEntity[]>(
      `${environment.API_URL}/compte-groupe`
    );
  }

  getGroupById(id?: number) {
    return this.httpClient.get<CompteGroupeEntity>(
      `${environment.API_URL}/compte-groupe/${id}`
    );
  }

  getAllMembers(id: number) {
    return this.httpClient.get<UserEntity[]>(
      `${environment.API_URL}/compte-groupe/${id}/members`
    );
  }

  createGroupeProject(groupProjectDto: GroupProjectDto) {
    return this.httpClient.post(
      `${environment.API_URL}/compte-groupe`,
      groupProjectDto
    );
  }
}
