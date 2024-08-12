import {AfterViewInit, Component, effect, inject, PLATFORM_ID, signal} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {BrnMenuTriggerDirective} from '@spartan-ng/ui-menu-brain';
import {
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
} from '@spartan-ng/ui-menu-helm';

import {HlmIconComponent, provideIcons} from '@spartan-ng/ui-icon-helm';
import {lucideBell} from '@ng-icons/lucide';
import {isPlatformBrowser, JsonPipe, NgClass, NgOptimizedImage} from '@angular/common';
import {HeaderMobileComponent} from "../header-mobile/header-mobile.component";
import {AuthService} from '../shared/services/auth.service';
import {UsersService} from "../shared/services/users.service";
import {UserEntity} from "../shared/entities/user.entity";

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    HlmButtonDirective,
    RouterLink,
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
    HlmIconComponent,
    NgClass,
    HeaderMobileComponent,
    NgOptimizedImage,
    JsonPipe,
  ],
  providers: [provideIcons({lucideBell})],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'

})
export class HeaderComponent implements AfterViewInit {

  authService: AuthService = inject(AuthService)
  usersService: UsersService = inject(UsersService)
  private readonly platformId = inject(PLATFORM_ID);


  isUserConnected = signal(false)
  connectedUser = signal<UserEntity | undefined>(undefined)
  profilePicture = signal<any>('')
  userConnectedCondition = effect(() => {
    this.isUserConnected.set(this.authService.getToken() !== null)
  }, {
    allowSignalWrites: true
  })

  router: Router = inject(Router)

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      if (localStorage.getItem("user")) {
        this.connectedUser.set(JSON.parse(localStorage.getItem("user") ?? "{}"))
      }
    }
  }


  logout() {
    this.authService.removeToken()
    this.authService.removeUser()
    this.router.navigate(["/login"])
  }

}
