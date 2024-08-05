import {AfterViewInit, Component, inject, input, signal} from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
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
import {ComptePrincipalService} from "../../../../shared/services/compte-principal.service";
import {CompteGroupeService} from "../../../../shared/services/compte-groupe.service";
import {PrincipalAccountEntity} from "../../../../shared/entities/principal-account.entity";
import {CompteGroupeEntity} from "../../../../shared/entities/compte-groupe.entity";
import {Router} from "@angular/router";
import {EuroFormatPipe} from "../../../../shared/pipes/euro-format.pipe";
import {TransactionService} from "../../../../shared/services/transaction.service";
import {TransactionEntity} from "../../../../shared/entities/transaction.entity";
import {delay, forkJoin, switchMap, tap} from "rxjs";
import {DatePipe, NgClass} from "@angular/common";
import {HlmIconComponent} from "@spartan-ng/ui-icon-helm";
import {
  HlmAccordionContentDirective,
  HlmAccordionDirective,
  HlmAccordionIconDirective,
  HlmAccordionItemDirective,
  HlmAccordionTriggerDirective,
} from "@spartan-ng/ui-accordion-helm";
import { BrnAccordionContentComponent } from '@spartan-ng/ui-accordion-brain';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {TransactionDto} from "../../../../shared/dtos/transaction.dto";
import {HlmSpinnerComponent} from "@spartan-ng/ui-spinner-helm";


@Component({
  selector: 'app-project-account',
  standalone: true,
  imports: [
    BrnSelectImports,
    HlmSelectImports,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    HlmButtonDirective,
    HlmCaptionComponent,
    HlmTableComponent,
    HlmTdComponent,
    HlmThComponent,
    HlmTrowComponent,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogFooterComponent,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    HlmInputDirective,
    HlmLabelDirective,
    EuroFormatPipe,
    DatePipe,
    HlmIconComponent,
    HlmAccordionTriggerDirective,
    HlmAccordionItemDirective,
    HlmAccordionDirective,
    HlmAccordionIconDirective,
    HlmAccordionContentDirective,
    BrnAccordionContentComponent,
    HlmThComponent,
    HlmThComponent,
    HlmThComponent,
    NgClass,
    ReactiveFormsModule,
    HlmSpinnerComponent
  ],
  templateUrl: './project-account.component.html',
  styleUrl: './project-account.component.css'
})
export class ProjectAccountComponent implements AfterViewInit{
  private principalAccountService: ComptePrincipalService = inject(ComptePrincipalService)
  private groupAccountService: CompteGroupeService = inject(CompteGroupeService)
  private transactionService: TransactionService = inject(TransactionService)
  private formBuilder: FormBuilder = inject(FormBuilder)
  private router: Router = inject(Router)

  protected id = input<string>()
  protected typeOfProjet = input<string>()

  protected isSpinner = signal(false)
  protected accountPrincipal = signal<PrincipalAccountEntity  | undefined>(undefined)
  protected accountGroup = signal<CompteGroupeEntity  | undefined>(undefined)
  protected transactionRecipient = signal<TransactionEntity[] | undefined>(undefined)
  protected transactionSender = signal<TransactionEntity[] | undefined>(undefined)
  protected principalAccounts = signal<PrincipalAccountEntity[] | undefined>(undefined)
  protected groupAccounts = signal<CompteGroupeEntity[] | undefined>(undefined)

  protected transactionForm!: FormGroup

  constructor() {

    this.transactionForm = this.formBuilder.group({
      communication: ['', [Validators.required]],
      amount: ['', [Validators.required]],
      recipientGroup: ['', []],
      recipientPrincipal: ['', []],
    })
  }

  async ngAfterViewInit() {
    await this.fetchTransaction()
  }

  getAllPrincipalAccount() {
    this.principalAccountService.getAllGroupPrincipal().subscribe(data => this.principalAccounts.set(data))
  }

  getAllGroupAccount() {
    this.groupAccountService.getAllGroupAccount().subscribe(data => this.groupAccounts.set(data))
  }

  fetchAllAccount() {
    this.getAllPrincipalAccount()
    this.getAllGroupAccount()
  }

  sendTransaction(ctx: any) {
    if(this.transactionForm.valid) {
      let transactionDto: TransactionDto = {...this.transactionForm.value}
      if(this.accountPrincipal()) {
        transactionDto.senderPrincipal = this.accountPrincipal()?.id
      } else {
        transactionDto.senderGroup = this.accountGroup()?.id
      }

      if(transactionDto.recipientGroup?.length === 0 && transactionDto.recipientPrincipal?.length === 0) {
        throw new Error("Aucun destinataire")
      }

      this.transactionService.createTransaction(transactionDto).pipe(
        tap(async () => {
          ctx.close()
          await this.fetchTransaction()
          this.isSpinner.set(true)
        }),
        delay(1000),
        tap(() => this.isSpinner.set(false))
      ).subscribe()
    }
  }

  async fetchTransaction() {
    if (this.typeOfProjet() === "PRINCIPAL") {
      this.principalAccountService.getGroupById(+this.id()!)
        .pipe(
          switchMap(data => {
            this.accountPrincipal.set(data);

            return forkJoin({
              recipientTransactions: this.transactionService.getRecipientPrincipalTransactionById(this.accountPrincipal()?.id!),
              senderTransactions: this.transactionService.getSenderPrincipalTransactionById(this.accountPrincipal()?.id!)
            });
          })
        )
        .subscribe(
          ({ recipientTransactions, senderTransactions }) => {
            this.transactionRecipient.set(recipientTransactions);

            this.transactionSender.set(senderTransactions);
          },
          error => {
            console.error('Erreur lors de la récupération des données :', error);
          }
        );
    } else if(this.typeOfProjet() === "GROUP") {
      this.groupAccountService.getGroupById(+this.id()!)
        .pipe(
          switchMap(data => {
            this.accountGroup.set(data);

            return forkJoin({
              recipientTransactions: this.transactionService.getRecipientGroupTransactionById(this.accountGroup()?.id!),
              senderTransactions: this.transactionService.getSenderGroupTransactionById(this.accountGroup()?.id!)
            });
          })
        )
        .subscribe(
          ({ recipientTransactions, senderTransactions }) => {
            console.log(recipientTransactions)
            console.log(senderTransactions)
            this.transactionRecipient.set(recipientTransactions);

            this.transactionSender.set(senderTransactions);
          },
          error => {
            console.error('Erreur lors de la récupération des données :', error);
          }
        );

    } else {
      this.router.navigate(['/home'])
    }
  }
}
