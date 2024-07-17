import {Component, input} from '@angular/core';
import {CurrencyPipe} from "@angular/common";
import {EuroFormatPipe} from "../../../shared/pipes/euro-format.pipe";

@Component({
  selector: 'app-account-component',
  standalone: true,
  imports: [
    CurrencyPipe,
    EuroFormatPipe
  ],
  templateUrl: './account-component.component.html',
  styleUrl: './account-component.component.css'
})
export class AccountComponentComponent {
    name = input.required<string>()
    id = input<number>()
    solde = input.required<number>()
}
