import {Component} from '@angular/core';
import {HlmInputDirective} from '@spartan-ng/ui-input-helm';
import {HlmLabelDirective} from "@spartan-ng/ui-label-helm";
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import {HlmSeparatorDirective} from '@spartan-ng/ui-separator-helm';
import {BrnSeparatorComponent} from '@spartan-ng/ui-separator-brain';
import {BrnSelectImports} from '@spartan-ng/ui-select-brain';
import {HlmSelectImports} from '@spartan-ng/ui-select-helm';
import {HlmButtonDirective} from "@spartan-ng/ui-button-helm";
import {HlmIconComponent} from "@spartan-ng/ui-icon-helm";
import {provideIcons} from "@ng-icons/core";
import {
  lucideCheck,
  lucideEdit,
  lucideFileDown,
  lucidePlus,
  lucidePlusCircle,
  lucideTrash,
  lucideXCircle
} from "@ng-icons/lucide";
import {EuroFormatPipe} from "../../../../../shared/pipes/euro-format.pipe";
import {BrnDialogContentDirective, BrnDialogTriggerDirective} from '@spartan-ng/ui-dialog-brain';
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogDescriptionDirective,
  HlmDialogFooterComponent,
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective,
} from '@spartan-ng/ui-dialog-helm';

@Component({
  selector: 'app-new-quote',
  standalone: true,
  imports: [
    HlmInputDirective,
    HlmLabelDirective,
    HlmSeparatorDirective,
    BrnSeparatorComponent,
    BrnSelectImports,
    HlmSelectImports,
    HlmButtonDirective,
    HlmIconComponent,
    HlmCaptionComponent,
    HlmTableComponent,
    HlmTdComponent,
    HlmThComponent,
    HlmTrowComponent,
    EuroFormatPipe,
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
    HlmButtonDirective,
  ],
  providers: [provideIcons({lucidePlusCircle, lucideTrash, lucideEdit, lucideFileDown, lucidePlus, lucideCheck, lucideXCircle})],
  templateUrl: './new-quote.component.html',
  styleUrl: './new-quote.component.css'
})
export class NewQuoteComponent {

}
