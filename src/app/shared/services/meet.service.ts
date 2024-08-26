import { Injectable, inject } from '@angular/core';
import {MeetDto} from "../dtos/meet.dto";
import { HttpClient } from '@angular/common/http';
import {MeetEntity} from "../entities/meet.entity";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class MeetService {

  private http: HttpClient = inject(HttpClient)
  constructor() { }

  create(meetDto: MeetDto) {
    return this.http.post<MeetEntity>( `${environment.API_URL}/meet`, meetDto)
  }

  getAll() {
    return this.http.get<MeetEntity[]>(`${environment.API_URL}/meet`)
  }

  registerToMeet(meet: MeetEntity) {
    return this.http.put<boolean>(`${environment.API_URL}/meet/register`, meet)
  }
}
