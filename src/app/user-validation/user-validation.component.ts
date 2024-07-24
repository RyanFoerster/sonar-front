import { Component } from '@angular/core';
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';


@Component({
  selector: 'app-user-validation',
  standalone: true,
  imports: [
    HlmCaptionComponent,
    HlmTableComponent,
    HlmTdComponent,
    HlmThComponent,
    HlmTrowComponent,
    HlmButtonDirective
  ],
  templateUrl: './user-validation.component.html',
  styleUrl: './user-validation.component.css'
})
export class UserValidationComponent {
  protected _invoices = [
    {
      invoice: '000001',
      paymentStatus: 'test@test.be',
      totalAmount: 'La folie des concert',
      paymentMethod: 'La folie des concert',
    },
    {
      invoice: '89687585',
      paymentStatus: 'test@test.be',
      totalAmount: 'La croisière samuse',
      paymentMethod: 'La croisière samuse',
    },
    {
      invoice: '97646',
      paymentStatus: 'test@test.be',
      totalAmount: 'cest la fete',
      paymentMethod: 'cest la fete',
    },
  ];

}
