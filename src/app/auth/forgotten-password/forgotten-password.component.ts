import { Component } from '@angular/core';
import { HlmInputDirective } from '@spartan-ng/ui-input-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
@Component({
  selector: 'app-forgotten-password',
  standalone: true,
  imports: [
    HlmButtonDirective,
    HlmInputDirective
  ],
  templateUrl: './forgotten-password.component.html',
  styleUrl: './forgotten-password.component.css'
})
export class ForgottenPasswordComponent {

}
