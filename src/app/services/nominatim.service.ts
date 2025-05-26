import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  address?: {
    city?: string;
    country?: string;
    country_code?: string;
    county?: string;
    postcode?: string;
    road?: string;
    state?: string;
    suburb?: string;
    house_number?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class NominatimService {
  private readonly API_URL = 'https://nominatim.openstreetmap.org';

  constructor(private http: HttpClient) {}

  /**
   * Recherche des lieux basés sur un texte de recherche
   * @param searchText Le texte à rechercher
   * @param limit Nombre de résultats à retourner (défaut: 5)
   * @returns Liste des lieux trouvés
   */
  searchPlaces(searchText: string, limit = 5): Observable<NominatimResult[]> {
    if (!searchText || searchText.trim().length < 3) {
      return of([]);
    }

    const params = new HttpParams()
      .set('q', searchText)
      .set('format', 'json')
      .set('addressdetails', '1')
      .set('limit', limit.toString())
      .set('accept-language', 'fr');

    return this.http
      .get<NominatimResult[]>(`${this.API_URL}/search`, { params })
      .pipe(
        tap(() => console.log('Recherche de lieux effectuée')),
        catchError((error) => {
          console.error('Erreur lors de la recherche de lieux', error);
          return of([]);
        })
      );
  }

  /**
   * Obtient des détails sur un lieu en fonction de ses coordonnées
   * @param lat Latitude
   * @param lon Longitude
   * @returns Détails du lieu
   */
  getPlaceDetails(lat: string, lon: string): Observable<NominatimResult> {
    const params = new HttpParams()
      .set('lat', lat)
      .set('lon', lon)
      .set('format', 'json')
      .set('addressdetails', '1')
      .set('accept-language', 'fr');

    return this.http
      .get<NominatimResult>(`${this.API_URL}/reverse`, { params })
      .pipe(
        tap(() => console.log('Détails du lieu récupérés')),
        catchError((error) => {
          console.error(
            'Erreur lors de la récupération des détails du lieu',
            error
          );
          throw error;
        })
      );
  }
}
