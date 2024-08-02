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
    const formatter = new Intl.NumberFormat('de-DE', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return formatter.format(value);
  }

}
