import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { BrnMenuTriggerDirective } from '@spartan-ng/ui-menu-brain';
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

import { HlmBadgeDirective } from '@spartan-ng/ui-badge-helm';

import { DatePipe, JsonPipe, NgClass, NgOptimizedImage } from '@angular/common';
import { lucideBell } from '@ng-icons/lucide';
import { HlmIconComponent, provideIcons } from '@spartan-ng/ui-icon-helm';
import {
  BrnPopoverCloseDirective,
  BrnPopoverComponent,
  BrnPopoverContentDirective,
  BrnPopoverTriggerDirective,
} from '@spartan-ng/ui-popover-brain';
import {
  HlmPopoverCloseDirective,
  HlmPopoverContentDirective,
} from '@spartan-ng/ui-popover-helm';
import { BrnSeparatorComponent } from '@spartan-ng/ui-separator-brain';
import { HlmSeparatorDirective } from '@spartan-ng/ui-separator-helm';
import { Subscription } from 'rxjs';
import { HeaderMobileComponent } from '../header-mobile/header-mobile.component';
import { InvitationEntity } from '../shared/entities/invitation.entity';
import { UserEntity } from '../shared/entities/user.entity';
import { AuthService } from '../shared/services/auth.service';
import { InvitationService } from '../shared/services/invitation.service';
import { UsersService } from '../shared/services/users.service';
import { NotificationsComponent } from '../shared/components/notifications/notifications.component';

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
    HlmPopoverCloseDirective,
    HlmPopoverContentDirective,
    BrnPopoverCloseDirective,
    BrnPopoverComponent,
    BrnPopoverContentDirective,
    BrnPopoverTriggerDirective,
    DatePipe,
    BrnSeparatorComponent,
    HlmSeparatorDirective,
    NotificationsComponent,
  ],
  providers: [provideIcons({ lucideBell })],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService: AuthService = inject(AuthService);
  private usersService: UsersService = inject(UsersService);
  private invitationService: InvitationService = inject(InvitationService);
  private readonly platformId = inject(PLATFORM_ID);
  protected router: Router = inject(Router);

  isUserConnected = signal(false);
  connectedUser = signal<UserEntity | null>(null);
  profilePicture = signal<any>('');
  invitations = signal<InvitationEntity[]>([]);
  invitationCount = signal(0);

  private subscriptions: Subscription[] = [];

  ngOnInit() {
    // Initialiser l'état au démarrage
    this.isUserConnected.set(this.authService.isAuthenticated());
    const initialUser = this.authService.getUser();
    if (initialUser) {
      this.connectedUser.set(initialUser);
      this.loadInvitations();
    }

    // S'abonner aux changements d'état d'authentification
    this.subscriptions.push(
      this.authService.getAuthState().subscribe((isAuthenticated) => {
        this.isUserConnected.set(isAuthenticated);
        if (!isAuthenticated) {
          this.resetUserData();
        }
      })
    );

    // S'abonner aux changements de l'utilisateur courant
    this.subscriptions.push(
      this.authService.getCurrentUser().subscribe((user) => {
        this.connectedUser.set(user);
        if (user) {
          this.loadInvitations();
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private loadInvitations() {
    if (this.isUserConnected()) {
      this.invitationService.getByUserId().subscribe({
        next: (data) => {
          this.invitations.set(data);
          this.invitationCount.set(data.length);
        },
        error: () => {
          this.invitations.set([]);
          this.invitationCount.set(0);
        },
      });
    }
  }

  private resetUserData() {
    this.connectedUser.set(null);
    this.invitations.set([]);
    this.invitationCount.set(0);
    this.isUserConnected.set(false);
  }

  logout() {
    this.authService.logout();
  }

  updateInvitation(
    invitation: InvitationEntity,
    status: 'accepted' | 'refused',
    ctx: any
  ) {
    invitation.status = status;
    this.invitationService.update(invitation.id, invitation).subscribe({
      next: () => {
        const newInvitations = this.invitations().filter(
          (invit) => invit.id !== invitation.id
        );
        this.invitations.set(newInvitations);
        this.invitationCount.set(newInvitations.length);
        ctx.close();
      },
      error: () => {
        // Gérer l'erreur si nécessaire
        ctx.close();
      },
    });
  }
}
