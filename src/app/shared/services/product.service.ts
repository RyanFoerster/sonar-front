import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ProductDto} from "../dtos/product.dto";
import {environments} from "../../../environments/environments";
import {ProductEntity} from "../entities/product.entity";

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly httpClient: HttpClient = inject(HttpClient);

  constructor() { }

  createProduct(productDto: ProductDto) {
    return this.httpClient.post<ProductEntity>(`${environments.API_URL}/product`, productDto)
  }
}
