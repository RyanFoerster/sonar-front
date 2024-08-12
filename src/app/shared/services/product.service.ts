import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ProductDto} from "../dtos/product.dto";
import {environment} from "../../../environments/environment";
import {ProductEntity} from "../entities/product.entity";

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly httpClient: HttpClient = inject(HttpClient);

  constructor() { }

  createProduct(productDto: ProductDto) {
    return this.httpClient.post<ProductEntity>(`${environment.API_URL}/product`, productDto)
  }
}
