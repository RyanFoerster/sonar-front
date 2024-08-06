import {AfterViewInit, Component, inject, signal} from '@angular/core';
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {VirementSepaService} from "../../shared/services/virement-sepa.service";
import {VirementSepaEntity} from "../../shared/entities/virement-sepa.entity";
import {map, tap, throwError} from "rxjs";
import {DatePipe, JsonPipe} from "@angular/common";
import {EuroFormatPipe} from "../../shared/pipes/euro-format.pipe";

@Component({
  selector: 'app-sepa-validation',
  standalone: true,
  imports: [
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
  templateUrl: './sepa-validation.component.html',
  styleUrl: './sepa-validation.component.css'
})
export class SepaValidationComponent implements AfterViewInit {

  private virementSepaService: VirementSepaService = inject(VirementSepaService);

  protected virementsSepaInPending = signal<VirementSepaEntity[]>([])
  protected virementsSepaAccepted = signal<VirementSepaEntity[]>([])

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
    {
      invoice: 'INV004',
      paymentStatus: 'Paid',
      totalAmount: '$450.00',
      paymentMethod: 'Credit Card',
    },
    {
      invoice: 'INV005',
      paymentStatus: 'Paid',
      totalAmount: '$550.00',
      paymentMethod: 'PayPal',
    },
    {
      invoice: 'INV006',
      paymentStatus: 'Pending',
      totalAmount: '$200.00',
      paymentMethod: 'Bank Transfer',
    },
    {
      invoice: 'INV007',
      paymentStatus: 'Unpaid',
      totalAmount: '$300.00',
      paymentMethod: 'Credit Card',
    },
  ];

  ngAfterViewInit() {
    this.virementSepaService.getAll().pipe(
      tap(data => {
        console.log(data)
        data.forEach(virement => {
          if (virement.status === "PENDING") {
            console.log(virement)
            this.virementsSepaInPending.update(virements => {
              return [...virements, virement];
            });
          } else if (virement.status === "ACCEPTED") {
            this.virementsSepaAccepted.update(virements => {
              return [...virements, virement];
            });
          }
        });
      }),
      tap(() => console.log(this.virementsSepaInPending()))
    ).subscribe();
  }

  rejectVirement(id: number) {
    this.virementSepaService.rejectVirement(id).subscribe(() => {
      this.virementsSepaInPending.update(virements => {
        return [...virements.filter(virement => virement.id !== id)]
      })
    })
  }

  acceptVirement(id: number) {
    this.virementSepaService.acceptVirement(id).subscribe(() => {

      const virementFinded = this.virementsSepaInPending().find(virement => virement.id === id)

      if(!virementFinded) {
        throw new Error("Une erreur est survenue")
      }

      this.virementsSepaInPending.update(virements => {
        return [...virements.filter(virement => virement.id !== virementFinded.id)]
      })

      this.virementsSepaAccepted.update(virements => [...virements, virementFinded])
    })
  }
}
