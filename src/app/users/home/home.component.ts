import {CommonModule, JsonPipe} from '@angular/common';
import {Component, effect, inject, signal, WritableSignal} from '@angular/core';
import { BrnAccordionContentComponent } from '@spartan-ng/ui-accordion-brain';
import {
  HlmAccordionContentDirective,
  HlmAccordionDirective,
  HlmAccordionIconDirective,
  HlmAccordionItemDirective,
  HlmAccordionTriggerDirective,
} from '@spartan-ng/ui-accordion-helm';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { AccordionModule } from 'primeng/accordion';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {AccountComponentComponent} from "./account-component/account-component.component";
import {AuthService} from "../../shared/services/auth.service";
import {UserEntity} from "../../shared/entities/user.entity";
import {UsersService} from "../../shared/services/users.service";
import {tap} from "rxjs";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    BrnAccordionContentComponent,
    HlmAccordionContentDirective,
    HlmAccordionDirective,
    HlmAccordionIconDirective,
    HlmAccordionItemDirective,
    HlmAccordionTriggerDirective,
    HlmIconComponent,
    AccordionModule,
    InputTextModule,
    InputIconModule,
    IconFieldModule,
    HlmButtonDirective,
    AccountComponentComponent,
    JsonPipe,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

    userConnected: WritableSignal<UserEntity | null> = signal(null)
    usersService: UsersService = inject(UsersService)

    constructor() {
      this.usersService.getInfo().pipe(
        tap((data) => this.userConnected.set(data))
      ).subscribe()
    }


}
