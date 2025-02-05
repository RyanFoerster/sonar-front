import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Beneficiary } from '../entities/beneficiary.entity';

@Injectable({
  providedIn: 'root',
})
export class BeneficiaryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.API_URL}/beneficiaries`;

  getAllBeneficiaries(): Observable<{ items: Beneficiary[] }> {
    return this.http.get<{ items: Beneficiary[] }>(this.apiUrl);
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
