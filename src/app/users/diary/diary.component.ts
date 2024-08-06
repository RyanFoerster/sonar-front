import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
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
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import { CalendarModule } from 'primeng/calendar';
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import { HlmCheckboxComponent } from '@spartan-ng/ui-checkbox-helm';
import { provideIcons } from '@ng-icons/core';
import { lucideUndo2 } from '@ng-icons/lucide';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { BrnMenuTriggerDirective } from '@spartan-ng/ui-menu-brain';
import {
  HlmMenuComponent,
  HlmMenuGroupComponent,
  HlmMenuItemCheckboxDirective,
  HlmMenuItemCheckComponent,
  HlmMenuItemDirective,
  HlmMenuItemIconDirective,
  HlmMenuItemRadioComponent,
  HlmMenuItemRadioDirective,
  HlmMenuItemSubIndicatorComponent,
  HlmMenuLabelComponent,
  HlmMenuSeparatorComponent,
  HlmMenuShortcutComponent,
  HlmSubMenuComponent,
} from '@spartan-ng/ui-menu-helm';

@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [
    BrnMenuTriggerDirective,
    HlmMenuComponent,
    HlmSubMenuComponent,
    HlmMenuItemDirective,
    HlmMenuItemSubIndicatorComponent,
    HlmMenuLabelComponent,
    HlmMenuShortcutComponent,
    HlmMenuSeparatorComponent,
    HlmMenuItemIconDirective,
    HlmMenuItemCheckComponent,
    HlmMenuItemRadioComponent,
    HlmMenuGroupComponent,
    HlmMenuItemRadioDirective,
    HlmMenuItemCheckboxDirective,
    HlmIconComponent,
    HlmCheckboxComponent,
    HlmCaptionComponent,
    HlmTableComponent,
    HlmTdComponent,
    HlmThComponent,
    HlmTrowComponent,
    BrnSelectImports,
    HlmSelectImports,
    HlmButtonDirective,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogFooterComponent,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    HlmInputDirective,
    HlmLabelDirective,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    CalendarModule,
  ],
  providers: [provideIcons({ lucideUndo2 })],
  templateUrl: './diary.component.html',
  styleUrl: './diary.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DiaryComponent {

  date1: Date | undefined;

    date2: Date | undefined;

    date3: Date | undefined;

    protected _invoices = [
      {
        invoice: 'INV001',
        paymentStatus: 'Paid',
        totalAmount: '$250.00',
        paymentMethod: 'Credit Card',
      },
      {
        invoice: 'INV002',
        paymentStatus: 'Pending',
        totalAmount: '$150.00',
        paymentMethod: 'PayPal',
      },
      {
        invoice: 'INV003',
        paymentStatus: 'Unpaid',
        totalAmount: '$350.00',
        paymentMethod: 'Bank Transfer',
      },
    ]  
}
