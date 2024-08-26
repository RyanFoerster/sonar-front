import {Component, effect, inject, PLATFORM_ID, signal} from '@angular/core';
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

import {HlmBadgeDirective} from '@spartan-ng/ui-badge-helm';

import {HlmIconComponent, provideIcons} from '@spartan-ng/ui-icon-helm';
import {lucideBell} from '@ng-icons/lucide';
import {DatePipe, JsonPipe, NgClass, NgOptimizedImage} from '@angular/common';
import {HeaderMobileComponent} from "../header-mobile/header-mobile.component";
import {AuthService} from '../shared/services/auth.service';
import {UsersService} from "../shared/services/users.service";
import {UserEntity} from "../shared/entities/user.entity";
import {InvitationService} from "../shared/services/invitation.service";
import {
  BrnPopoverCloseDirective,
  BrnPopoverComponent,
  BrnPopoverContentDirective,
  BrnPopoverTriggerDirective,
} from '@spartan-ng/ui-popover-brain';
import {HlmPopoverCloseDirective, HlmPopoverContentDirective} from '@spartan-ng/ui-popover-helm';
import {BrnSeparatorComponent} from "@spartan-ng/ui-separator-brain";
import {HlmSeparatorDirective} from "@spartan-ng/ui-separator-helm";
import {InvitationEntity} from "../shared/entities/invitation.entity";

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
    HlmBadgeDirective,
    HlmPopoverCloseDirective, HlmPopoverContentDirective,
    BrnPopoverCloseDirective,
    BrnPopoverComponent,
    BrnPopoverContentDirective,
    BrnPopoverTriggerDirective, DatePipe, BrnSeparatorComponent, HlmSeparatorDirective,
  ],
  providers: [provideIcons({lucideBell})],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'

})
export class HeaderComponent {

  authService: AuthService = inject(AuthService)
  usersService: UsersService = inject(UsersService)
  invitationService: InvitationService = inject(InvitationService)
  private readonly platformId = inject(PLATFORM_ID);


  isUserConnected = signal(false)
  connectedUser = signal<UserEntity | null>(null)
  profilePicture = signal<any>('')
  invitations = signal<InvitationEntity[]>([])
  invitationCount = signal(0)


  userConnectedCondition = effect(() => {
    this.isUserConnected.set(this.authService.getToken() !== null)
  }, {
    allowSignalWrites: true
  })

  router: Router = inject(Router)

  constructor() {
    effect(async () => {
      this.connectedUser.set(this.authService.getUser())
      if(this.connectedUser()) {
        this.invitationService.getByUserId().subscribe(data => {
          this.invitations.set(data)
          this.invitationCount.set(data.length)
        })
      }

    }, {
      allowSignalWrites: true
    })
  }


  logout() {
    this.authService.removeToken()
    this.authService.removeUser()
    this.router.navigate(["/login"])
  }

  updateInvitation(invitation: InvitationEntity, status: "accepted" | "refused", ctx: any) {
    invitation.status = status
    this.invitationService.update(invitation.id, invitation).subscribe(() => {
      const newInvitations = this.invitations().filter(invit => invit.id !== invitation.id)
      this.invitations.set(newInvitations)
      this.invitationCount.set(newInvitations.length)
      ctx.close()
    })
  }


}
