import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserAttachment {
  id: number;
  name: string;
  url: string;
  key: string;
  type: string;
  description?: string;
  created_at: Date;
}

@Injectable({
  providedIn: 'root',
})
export class UserAttachmentService {
  private apiUrl = `${environment.API_URL}/user-attachments`;

  constructor(private http: HttpClient) {}

  uploadAttachment(
    file: File,
    description?: string
  ): Observable<UserAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    return this.http.post<UserAttachment>(this.apiUrl, formData);
  }

  getUserAttachments(): Observable<UserAttachment[]> {
    return this.http.get<UserAttachment[]>(this.apiUrl);
  }

  deleteAttachment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  previewAttachment(attachment: UserAttachment): void {
    window.open(attachment.url, '_blank');
  }
}
