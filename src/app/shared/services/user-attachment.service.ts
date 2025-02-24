import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProjectAttachment {
  id: number;
  name: string;
  url: string;
  key: string;
  type: string;
  description?: string;
  created_at: Date;
  compte_principal_id?: number;
  compte_groupe_id?: number;
}

export type ProjectType = 'principal' | 'groupe';

@Injectable({
  providedIn: 'root',
})
export class ProjectAttachmentService {
  private apiUrl = `${environment.API_URL}/project-attachments`;

  constructor(private http: HttpClient) {}

  uploadAttachment(
    file: File,
    projectType: ProjectType,
    projectId: number,
    description?: string
  ): Observable<ProjectAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectType', projectType);
    formData.append('projectId', projectId.toString());
    if (description) {
      formData.append('description', description);
    }
    return this.http.post<ProjectAttachment>(this.apiUrl, formData);
  }

  getProjectAttachments(
    projectType: ProjectType,
    projectId: number
  ): Observable<ProjectAttachment[]> {
    const params = new HttpParams()
      .set('projectType', projectType)
      .set('projectId', projectId.toString());

    return this.http.get<ProjectAttachment[]>(this.apiUrl, { params });
  }

  deleteAttachment(
    id: number,
    projectType: ProjectType,
    projectId: number
  ): Observable<void> {
    const params = new HttpParams()
      .set('projectType', projectType)
      .set('projectId', projectId.toString());

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { params });
  }

  previewAttachment(attachment: ProjectAttachment): void {
    if (attachment?.url) {
      window.open(attachment.url, '_blank');
    }
  }

  getAttachment(id: number): Observable<ProjectAttachment> {
    return this.http.get<ProjectAttachment>(`${this.apiUrl}/${id}`);
  }

  downloadAttachment(
    id: number,
    projectType: ProjectType,
    projectId: number
  ): Observable<Blob> {
    const params = new HttpParams()
      .set('projectType', projectType)
      .set('projectId', projectId.toString());

    return this.http.get(`${this.apiUrl}/${id}/download`, {
      params,
      responseType: 'blob',
    });
  }
}
