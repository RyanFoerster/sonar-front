import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {CreateUserDto} from '../dtos/create-user.dto';
import {environments} from '../../../environments/environments';
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
    return this.httpClient.post<boolean>(`${environments.API_URL}/auth/register`, createuserDto)
  }

  signUpFromAdmin(createuserDto: CreateUserDto) {
    return this.httpClient.post<boolean>(`${environments.API_URL}/auth/register-from-admin`, createuserDto)
  }

  signIn(credentials: SignInDto) {
    return this.httpClient.post<LoggedUser>(`${environments.API_URL}/auth/login`, credentials)
  }

  getInfo() {
    return this.httpClient.get<UserEntity>(`${environments.API_URL}/users`)
  }

  update(updteUserDto: UpdateUserDto) {
    return this.httpClient.patch<UserEntity>(`${environments.API_URL}/users`, updteUserDto)
  }


  getAllUsersGroup(id: number) {
    return this.httpClient.get<UserEntity[]>(`${environments.API_URL}/users/groups`, {params: {id}})
  }

  findAll() {
    return this.httpClient.get<UserEntity[]>(`${environments.API_URL}/users/all`)
  }

  findAllPendingUser() {
    return this.httpClient.get<UserEntity[]>(`${environments.API_URL}/users/pending`)
  }

  getProfilePicture(filename: string) {
    return this.httpClient.get(`${environments.API_URL}/users/${filename}`, {responseType: "blob"})
  }

  toggleActiveUser(user: UserEntity) {
    return this.httpClient.patch(`${environments.API_URL}/users/toggleActive`, user)
  }

  deleteUser(id: number) {
    return this.httpClient.delete(`${environments.API_URL}/users/${id}`)
  }
}
