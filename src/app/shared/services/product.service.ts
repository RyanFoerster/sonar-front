import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProductDto } from '../dtos/product.dto';
import { environment } from '../../../environments/environment';
import { ProductEntity } from '../entities/product.entity';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly httpClient: HttpClient = inject(HttpClient);

  createProduct(productDto: ProductDto) {
    return this.httpClient.post<ProductEntity>(
      `${environment.API_URL}/product`,
      productDto
    );
  }

  update(product_id: string, productDto: ProductDto, tvaIncluded: boolean) {
    return this.httpClient.put<ProductEntity>(
      `${environment.API_URL}/product/update/${product_id}?tvaIncluded=${tvaIncluded}`,
      { ...productDto, shouldSave: false }
    );
  }

  saveProduct(product_id: string, productDto: ProductDto) {
    return this.httpClient.put<ProductEntity>(
      `${environment.API_URL}/product/save/${product_id}`,
      productDto
    );
  }
}
