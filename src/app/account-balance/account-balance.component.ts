import { Component } from '@angular/core';
import {CurrencyPipe, NgIf} from "@angular/common";
import {PontoService} from "../shared/services/ponto.service";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-account-balance',
  standalone: true,
  imports: [
    NgIf,
    CurrencyPipe
  ],
  templateUrl: './account-balance.component.html',
  styleUrl: './account-balance.component.css'
})
export class AccountBalanceComponent {
  balance: number | null = null;
  accessToken: string | null = null;

  constructor(private pontoService: PontoService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      if (code) {
        this.pontoService.handleCallback(code);
      }
    });

    this.accessToken = this.pontoService['accessToken'];

    if (this.accessToken) {
      this.pontoService.getAccountBalance().subscribe(data => {
        this.balance = data.accounts[0].balance;  // Assumes balance is found here; adjust based on actual API response.
      });
    }
  }

  connectPonto() {
    this.pontoService.redirectToPonto();
  }
}
