import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {CreateUserDto} from "../dtos/create-user.dto";
import {UpdateUserSecondaryAccountDto} from "../dtos/update-user-secondary-account.dto";
import {UserSecondaryAccountEntity} from "../entities/user-secondary-account.entity";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class UserSecondaryAccountService {

  private readonly httpClient: HttpClient = inject(HttpClient);

  constructor() { }

  updateUserSecondaryAccount(id: number, updateUserSecondaryAccountDto: UpdateUserSecondaryAccountDto) {
    return this.httpClient.patch<UserSecondaryAccountEntity>(`${environment.API_URL}/user-secondary-account/${id}`, updateUserSecondaryAccountDto)
  }

  addMemberGroupeProject(updateUserSecondaryAccountDto: UpdateUserSecondaryAccountDto, email: string) {
    return this.httpClient.post(`${environment.API_URL}/user-secondary-account`, updateUserSecondaryAccountDto, {params: {email}})
  }
}
