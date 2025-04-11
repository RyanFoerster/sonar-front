import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Beneficiary } from '../entities/beneficiary.entity';

interface BeneficiaryPaginatedResponse {
  items: Beneficiary[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class BeneficiaryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.API_URL}/beneficiaries`;

  getAllBeneficiaries(
    page = 1,
    limit = 10
  ): Observable<BeneficiaryPaginatedResponse> {
    console.log(
      `getAllBeneficiaries: Appel à ${this.apiUrl}?page=${page}&limit=${limit}`
    );
    return this.http
      .get<BeneficiaryPaginatedResponse>(
        `${this.apiUrl}?page=${page}&limit=${limit}`
      )
      .pipe(
        tap((response) =>
          console.log(
            `getAllBeneficiaries réponse: page=${response.page}, totalPages=${response.totalPages}, items=${response.items.length}`
          )
        )
      );
  }

  // Récupérer une page spécifique de bénéficiaires sans charger les autres pages
  getBeneficiariesPage(
    page = 1,
    limit = 10
  ): Observable<BeneficiaryPaginatedResponse> {
    const url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    console.log(`getBeneficiariesPage: Appel à ${url}`);
    return this.http
      .get<BeneficiaryPaginatedResponse>(url)
      .pipe(
        tap((response) =>
          console.log(
            `getBeneficiariesPage réponse: page=${response.page}, totalPages=${response.totalPages}, items=${response.items.length}`
          )
        )
      );
  }

  createBeneficiary(
    beneficiary: Partial<Beneficiary>
  ): Observable<Beneficiary> {
    return this.http.post<Beneficiary>(this.apiUrl, beneficiary);
  }

  searchBeneficiaries(query: string): Observable<Beneficiary[]> {
    return this.http.get<Beneficiary[]>(`${this.apiUrl}/search?query=${query}`);
  }

  updateBeneficiary(
    id: number,
    beneficiary: Partial<Beneficiary>
  ): Observable<Beneficiary> {
    return this.http.put<Beneficiary>(`${this.apiUrl}/${id}`, beneficiary);
  }

  deleteBeneficiary(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
