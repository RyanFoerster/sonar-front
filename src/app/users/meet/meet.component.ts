import {AfterViewInit, Component, inject, signal, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {DatePipe, JsonPipe} from "@angular/common";
import {EuroFormatPipe} from "../../shared/pipes/euro-format.pipe";
import { BrnDialogContentDirective, BrnDialogTriggerDirective } from '@spartan-ng/ui-dialog-brain';
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogDescriptionDirective,
  HlmDialogFooterComponent,
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective,
} from '@spartan-ng/ui-dialog-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { CalendarModule } from 'primeng/calendar';
import { provideIcons } from '@ng-icons/core';
import { lucideUndo2 } from '@ng-icons/lucide';

@Component({
  selector: 'app-meet',
  standalone: true,
  imports: [
    CalendarModule,
    BrnDialogTriggerDirective,
    BrnDialogContentDirective,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogHeaderComponent,
    HlmDialogFooterComponent,
    HlmDialogTitleDirective,
    HlmDialogDescriptionDirective,
    HlmLabelDirective,
    HlmInputDirective,
    HlmCaptionComponent,
    HlmTableComponent,
    HlmTdComponent,
    HlmThComponent,
    HlmTrowComponent,
    HlmButtonDirective,
    JsonPipe,
    DatePipe,
    EuroFormatPipe,
  ],

  templateUrl: './meet.component.html',
  styleUrl: './meet.component.css',
  providers: [provideIcons({ lucideUndo2 })],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
  
})
export class MeetComponent  {

  date2: Date | undefined;

  date3: Date | undefined;

  protected _invoices = [
    {
      invoice: 'Aussems',
      paymentStatus: 'Manon',
      totalAmount: 'Lundi 03/09/2024 10:50',
      paymentMethod: 'Credit Card',
    },
  ];
}


  

  