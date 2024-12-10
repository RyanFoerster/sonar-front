import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { VirementSepaDto } from '../dtos/virement-sepa.dto';
import { environment } from '../../../environments/environment';
import { VirementSepaEntity } from '../entities/virement-sepa.entity';

@Injectable({
  providedIn: 'root',
})
export class VirementSepaService {
  private httpClient: HttpClient = inject(HttpClient);

  constructor() {}

  createVirementSepa(
    createVirementSepaDto: VirementSepaDto,
    id: number,
    typeOfProjet: string,
    invoice: File | null
  ) {
    // Créer un FormData pour envoyer à la fois les données du formulaire et le fichier
    const form = new FormData();

    // Ajouter le fichier
    form.append('invoice', invoice!);

    // Ajouter chaque champ du formulaire
    Object.entries(createVirementSepaDto).forEach(([key, value]) => {
      form.append(key, value.toString());
    });
    return this.httpClient.post<VirementSepaEntity>(
      `${environment.API_URL}/virement-sepa`,
      form,
      {
        params: {
          id: id,
          typeOfProjet: typeOfProjet,
        },
      }
    );
  }

  getAll() {
    return this.httpClient.get<VirementSepaEntity[]>(
      `${environment.API_URL}/virement-sepa`
    );
  }

  acceptVirement(id: number) {
    return this.httpClient.patch(
      `${environment.API_URL}/virement-sepa/${id}/accept`,
      {}
    );
  }

  rejectVirement(id: number) {
    return this.httpClient.patch(
      `${environment.API_URL}/virement-sepa/${id}/reject`,
      {}
    );
  }
}
