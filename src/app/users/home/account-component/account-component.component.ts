import { Component, input } from '@angular/core';
import { EuroFormatPipe } from '../../../shared/pipes/euro-format.pipe';
import { RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowRight } from '@ng-icons/lucide';

@Component({
  selector: 'app-account-component',
  standalone: true,
  imports: [EuroFormatPipe, RouterLink],
  providers: [provideIcons({ lucideArrowRight })],
  templateUrl: './account-component.component.html',
  styleUrl: './account-component.component.css',
})
export class AccountComponentComponent {
  name = input.required<string>();
  id = input<number>();
  solde = input.required<number>();
  typeOfProjet = input.required<'PRINCIPAL' | 'GROUP'>();
  protected readonly LINK = 'home-group/';
}
