import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
  OnChanges,
  SimpleChanges,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  template: `
    <object
      [data]="getSafeUrl(pdfSrc())"
      type="application/pdf"
      class="w-full h-full min-h-[calc(100vh-8rem)] rounded-lg shadow-inner"
    >
      <p class="text-sm text-gray-500 text-center">
        Impossible de charger le PDF
      </p>
    </object>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PdfViewerComponent implements OnChanges {
  private sanitizer = inject(DomSanitizer);

  @Input({ required: true }) pdfUrl!: string;
  @Input() pdfBlob?: Blob;

  protected pdfSrc = signal<string>('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pdfBlob'] && this.pdfBlob) {
      // Si un blob est fourni, créer une URL à partir du blob
      const url = window.URL.createObjectURL(this.pdfBlob);
      this.pdfSrc.set(url);
    } else if (changes['pdfUrl'] && this.pdfUrl) {
      // Sinon utiliser l'URL fournie
      this.pdfSrc.set(this.pdfUrl);
    }
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
