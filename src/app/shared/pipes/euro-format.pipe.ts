import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'euroFormat',
  standalone: true
})
export class EuroFormatPipe implements PipeTransform {

  transform(value: number): string {
    return this.formatNumber(value) + ' €';
  }

  private formatNumber(value: number): string {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

}
