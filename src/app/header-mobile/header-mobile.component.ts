import { Component, inject, signal } from '@angular/core';
import { HlmMenuBarComponent } from "../../../components/ui-menu-helm/src/lib/hlm-menu-bar.component";
import { HlmIconComponent, provideIcons } from '@spartan-ng/ui-icon-helm';
import { lucideAlignJustify, lucideX } from '@ng-icons/lucide';
import { HlmMenuBarItemDirective, HlmMenuComponent, HlmMenuGroupComponent, HlmMenuItemCheckComponent, HlmMenuItemCheckboxDirective, HlmMenuItemDirective, HlmMenuItemIconDirective, HlmMenuItemRadioComponent, HlmMenuItemRadioDirective, HlmMenuItemSubIndicatorComponent, HlmMenuLabelComponent, HlmMenuSeparatorComponent, HlmMenuShortcutComponent, HlmSubMenuComponent } from '@spartan-ng/ui-menu-helm';
import { BrnMenuTriggerDirective } from '@spartan-ng/ui-menu-brain';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { AuthService } from '../shared/services/auth.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-header-mobile',
  standalone: true,
  imports: [
    HlmMenuBarComponent,
    HlmIconComponent,
    HlmMenuBarComponent,
    HlmMenuBarItemDirective,
    HlmMenuComponent,
    HlmMenuGroupComponent,
    HlmMenuItemCheckboxDirective,
    HlmMenuItemCheckComponent,
    HlmMenuItemDirective,
    HlmMenuItemIconDirective,
    HlmMenuItemRadioComponent,
    HlmMenuItemRadioDirective,
    HlmMenuItemSubIndicatorComponent,
    HlmMenuLabelComponent,
    HlmMenuSeparatorComponent,
    HlmMenuShortcutComponent,
    HlmSubMenuComponent,
    BrnMenuTriggerDirective,
    HlmButtonDirective
  ],
  templateUrl: './header-mobile.component.html',
  styleUrl: './header-mobile.component.css',
  providers: [provideIcons({lucideAlignJustify, lucideX})]
})
export class HeaderMobileComponent {

  isToggleMenu = signal(false)
  authService: AuthService = inject(AuthService)
  router: Router = inject(Router)

  toggleMenu() {
    this.isToggleMenu.set(!this.isToggleMenu())
    document.body.classList.toggle('overflow-hidden')
  }

  logout() {
    this.authService.removeToken()
    this.toggleMenu()
    this.router.navigate(["/login"])
  }

}
