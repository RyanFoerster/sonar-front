import { Component } from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';

@Component({
  selector: 'app-creating-new-users',
  standalone: true,
  imports: [
    HlmInputDirective,
    HlmButtonDirective,
  ],
  templateUrl: './creating-new-users.component.html',
  styleUrl: './creating-new-users.component.css'
})
export class CreatingNewUsersComponent {

}
