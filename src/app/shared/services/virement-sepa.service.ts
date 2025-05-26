import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { VirementSepaDto } from '../dtos/virement-sepa.dto';
import { environment } from '../../../environments/environment';
import { VirementSepaEntity } from '../entities/virement-sepa.entity';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VirementSepaService {
  private httpClient: HttpClient = inject(HttpClient);

  createVirementSepa(
    createVirementSepaDto: VirementSepaDto,
    id: number,
    typeOfProjet: string,
    invoice: File | null
  ) {
    const form = new FormData();

    // Ajouter le fichier
    form.append('invoice', invoice!);

    // Ajouter chaque champ non-null du formulaire
    Object.entries(createVirementSepaDto).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        form.append(key, value.toString());
      }
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
  createVirementSepaFromBank(createVirementSepaDto: VirementSepaDto,id: number, typeOfProjet: string) {
    const form = new FormData();

    // Ajouter chaque champ non-null du formulaire
    Object.entries(createVirementSepaDto).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        form.append(key, value.toString());
      }
    });
    return this.httpClient.post<VirementSepaEntity>(
      `${environment.API_URL}/virement-sepa/FromBank`,
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

  rejectVirement(id: number, rejected_reason: string) {
    return this.httpClient.patch(
      `${environment.API_URL}/virement-sepa/${id}/reject`,
      {
        rejected_reason,
      }
    );
  }

  paidVirement(id: number) {
    return this.httpClient.patch(
      `${environment.API_URL}/virement-sepa/${id}/paid`,
      {}
    );
  }

  downloadInvoice(id: number) {
    return this.httpClient.get(
      `${environment.API_URL}/virement-sepa/${id}/invoice`,
      {
        responseType: 'blob',
        observe: 'response',
      }
    );
  }

  initiateTransfers() {
    return this.httpClient.post<{
      success: boolean;
      message: string;
      processedTransfers: number;
    }>(`${environment.API_URL}/virement-sepa/initiate-transfers`, {});
  }

  convertToPdf(formData: FormData): Observable<Blob> {
    return this.httpClient.post(
      `${environment.API_URL}/virement-sepa/convert-pdf`,
      formData,
      {
        responseType: 'blob',
        headers: {
          Accept: 'application/pdf',
        },
      }
    );
  }

  update(virementUpdate: VirementSepaEntity): void {


    this.httpClient.put<VirementSepaEntity>(
      `${environment.API_URL}/virement-sepa/${virementUpdate.id}/update`,
      virementUpdate
    ).subscribe({
      next: (response) => {
        console.log("✅ Virement mis à jour avec succès :", response);
        location.reload(); // ✅ recharge uniquement après succès
      },
      error: (error) => {
        console.error("❌ Erreur lors de la mise à jour du virement :", error);
        alert("Erreur lors de la mise à jour.");
      }
    });
  }






}
