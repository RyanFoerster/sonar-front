import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {CreateUserDto} from '../dtos/create-user.dto';
import {environment} from '../../../environments/environment';
import {SignInDto} from '../dtos/sign-in.dto';
import {LoggedUser} from '../entities/logged-user.entity';
import {UserEntity} from "../entities/user.entity";
import {UpdateUserDto} from "../dtos/update-user.dto";

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  httpClient: HttpClient = inject(HttpClient)

  constructor() {

  }

  signUp(createuserDto: CreateUserDto) {
    return this.httpClient.post<boolean>(`${environment.API_URL}/auth/register`, createuserDto)
  }

  signUpFromAdmin(createuserDto: CreateUserDto) {
    return this.httpClient.post<boolean>(`${environment.API_URL}/auth/register-from-admin`, createuserDto)
  }

  signIn(credentials: SignInDto) {
    return this.httpClient.post<LoggedUser>(`${environment.API_URL}/auth/login`, credentials)
  }

  getInfo() {
    return this.httpClient.get<UserEntity>(`${environment.API_URL}/users`)
  }

  update(updteUserDto: UpdateUserDto) {
    return this.httpClient.patch<UserEntity>(`${environment.API_URL}/users`, updteUserDto)
  }


  getAllUsersGroup(id: number) {
    return this.httpClient.get<UserEntity[]>(`${environment.API_URL}/users/groups`, {params: {id}})
  }

  findAll() {
    return this.httpClient.get<UserEntity[]>(`${environment.API_URL}/users/all`)
  }

  findAllPendingUser() {
    return this.httpClient.get<UserEntity[]>(`${environment.API_URL}/users/pending`)
  }

  getProfilePicture(filename: string) {
    return this.httpClient.get(`${environment.API_URL}/users/${filename}`, {responseType: "blob"})
  }

  toggleActiveUser(user: UserEntity) {
    return this.httpClient.patch(`${environment.API_URL}/users/toggleActive`, user)
  }

  deleteUser(id: number) {
    return this.httpClient.delete(`${environment.API_URL}/users/${id}`)
  }
}
