import {AfterViewInit, Component, inject, input, signal} from '@angular/core';
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
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
import { HlmCheckboxComponent } from '@spartan-ng/ui-checkbox-helm';
import { BrnSelectImports } from '@spartan-ng/ui-select-brain';
import { HlmSelectImports } from '@spartan-ng/ui-select-helm';
import {CompteGroupeEntity} from "../../../../shared/entities/compte-groupe.entity";
import {PrincipalAccountEntity} from "../../../../shared/entities/principal-account.entity";
import {ComptePrincipalService} from "../../../../shared/services/compte-principal.service";
import {CompteGroupeService} from "../../../../shared/services/compte-groupe.service";
import {HlmSpinnerComponent} from "@spartan-ng/ui-spinner-helm";
import {JsonPipe} from "@angular/common";


@Component({
  selector: 'app-membership',
  standalone: true,
  imports: [
    BrnSelectImports,
    HlmSelectImports,
    HlmCheckboxComponent,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    HlmCaptionComponent,
    HlmTableComponent,
    HlmTdComponent,
    HlmThComponent,
    HlmTrowComponent,
    HlmButtonDirective,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogFooterComponent,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    HlmLabelDirective,
    HlmInputDirective,
    HlmSpinnerComponent,
    JsonPipe,
  ],
  templateUrl: './membership.component.html',
  styleUrl: './membership.component.css'
})
export class MembershipComponent implements AfterViewInit{
  protected id = input()
  protected typeOfProjet = input<string>()
  protected _invoices = [
    {
      invoice: '01-07-2024',
      paymentStatus: 'User',
      totalAmount: '$250.00',
      paymentMethod: 'Credit Card',
    },
    {
      invoice: '01-07-2024',
      paymentStatus: 'User',
      totalAmount: '$150.00',
      paymentMethod: 'PayPal',
    },
    {
      invoice: '01-07-2024',
      paymentStatus: 'User',
      totalAmount: '$350.00',
      paymentMethod: 'Bank Transfer',
    },
    {
      invoice: '01-07-2024',
      paymentStatus: 'User',
      totalAmount: '$450.00',
      paymentMethod: 'Credit Card',
    },
    {
      invoice: '01-07-2024',
      paymentStatus: 'User',
      totalAmount: '$550.00',
      paymentMethod: 'PayPal',
    },
    {
      invoice: '01-07-2024',
      paymentStatus: 'User',
      totalAmount: '$200.00',
      paymentMethod: 'Bank Transfer',
    },
    {
      invoice: '01-07-2024',
      paymentStatus: 'User',
      totalAmount: '$300.00',
      paymentMethod: 'Credit Card',
    },
  ];
  protected account = signal<CompteGroupeEntity | PrincipalAccountEntity | null>(null)

  private readonly principalAccountService: ComptePrincipalService = inject(ComptePrincipalService)
  private readonly groupAccountService: CompteGroupeService = inject(CompteGroupeService)

  ngAfterViewInit() {
    if(this.typeOfProjet() === "PRINCIPAL") {
      this.principalAccountService.getGroupById(+this.id()!).subscribe(account => this.account.set(account))
    } else if(this.typeOfProjet() === "GROUP") {
      this.groupAccountService.getGroupById(+this.id()!).subscribe(account => this.account.set(account))
    }
  }
}
