import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  template: `
    <object
      [data]="getSafeUrl(pdfUrl)"
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
export class PdfViewerComponent {
  private sanitizer = inject(DomSanitizer);

  @Input({ required: true }) pdfUrl!: string;

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
