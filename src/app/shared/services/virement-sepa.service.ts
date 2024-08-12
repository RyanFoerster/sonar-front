import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {VirementSepaDto} from "../dtos/virement-sepa.dto";
import {environment} from "../../../environments/environment";
import {VirementSepaEntity} from "../entities/virement-sepa.entity";

@Injectable({
  providedIn: 'root'
})
export class VirementSepaService {

  private httpClient: HttpClient = inject(HttpClient);

  constructor() { }

  createVirementSepa(createVirementSepaDto: VirementSepaDto, id: number, typeOfProjet: string) {
    return this.httpClient.post<VirementSepaEntity>(`${environment.API_URL}/virement-sepa`, createVirementSepaDto, {
      params: {
        id: id,
        typeOfProjet: typeOfProjet
      }
    })
  }

  getAll() {
    return this.httpClient.get<VirementSepaEntity[]>(`${environment.API_URL}/virement-sepa`)
  }

  acceptVirement(id: number) {
    return this.httpClient.patch(`${environment.API_URL}/virement-sepa/${id}/accept`, {})
  }

  rejectVirement(id: number) {
    return this.httpClient.patch(`${environment.API_URL}/virement-sepa/${id}/reject`, {})
  }
}
