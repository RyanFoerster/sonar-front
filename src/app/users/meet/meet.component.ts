import {Component, CUSTOM_ELEMENTS_SCHEMA, effect, inject, signal} from '@angular/core';
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
import {BrnDialogContentDirective, BrnDialogTriggerDirective} from '@spartan-ng/ui-dialog-brain';
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogDescriptionDirective,
  HlmDialogFooterComponent,
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective,
} from '@spartan-ng/ui-dialog-helm';
import {HlmInputDirective} from '@spartan-ng/ui-input-helm';
import {HlmLabelDirective} from '@spartan-ng/ui-label-helm';
import {CalendarModule} from 'primeng/calendar';
import {provideIcons} from '@ng-icons/core';
import {lucideUndo2} from '@ng-icons/lucide';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {MeetDto} from "../../shared/dtos/meet.dto";
import {MeetService} from '../../shared/services/meet.service';
import {MeetEntity} from "../../shared/entities/meet.entity";
import {
  BrnPopoverCloseDirective,
  BrnPopoverComponent,
  BrnPopoverContentDirective,
  BrnPopoverTriggerDirective,
} from '@spartan-ng/ui-popover-brain';
import {HlmPopoverCloseDirective, HlmPopoverContentDirective} from '@spartan-ng/ui-popover-helm';

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
    ReactiveFormsModule,
    BrnPopoverCloseDirective,
    BrnPopoverComponent,
    BrnPopoverContentDirective,
    BrnPopoverTriggerDirective,
    HlmPopoverCloseDirective, HlmPopoverContentDirective
  ],

  templateUrl: './meet.component.html',
  styleUrl: './meet.component.css',
  providers: [provideIcons({lucideUndo2})],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]

})
export class MeetComponent {

  protected meets = signal<MeetEntity[]>([])

  createMeetForm: FormGroup

  private formBuilder: FormBuilder = inject(FormBuilder)
  private meetService: MeetService = inject(MeetService)

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

  constructor() {
    this.createMeetForm = this.formBuilder.group({
      startDate: ['', Validators.required],
      title: ['', Validators.required],
    })

    effect(() => {
      this.meetService.getAll().subscribe(meets => {
        const meetsInFuture = meets.filter(meet => new Date(meet.startDate).getTime() > new Date().getTime())
        this.meets.set(meetsInFuture);
        this.meets().sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      })
    });
  }

  createMeet(ctx: any) {
    if (this.createMeetForm.valid) {
      const meetDto: MeetDto = {
        startDate: this.createMeetForm.value.startDate,
        title: this.createMeetForm.value.title,
      }
      this.meetService.create(meetDto).subscribe(meet => {
        this.meets.set([...this.meets(), meet]);
        this.meets().sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        this.createMeetForm.reset();
        ctx.close();
      })
    }

  }
}




