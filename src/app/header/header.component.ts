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
  HlmMenuItemRadioComponent,
  HlmMenuItemRadioDirective,
} from '@spartan-ng/ui-menu-helm';

import { lucideBell } from '@ng-icons/lucide';
import { provideIcons } from '@spartan-ng/ui-icon-helm';

import { Subscription } from 'rxjs';
import { HeaderMobileComponent } from '../header-mobile/header-mobile.component';
import { InvitationEntity } from '../shared/entities/invitation.entity';
import { UserEntity } from '../shared/entities/user.entity';
import { AuthService } from '../shared/services/auth.service';
import { InvitationService } from '../shared/services/invitation.service';
import { UsersService } from '../shared/services/users.service';
import { NotificationsComponent } from '../shared/components/notifications/notifications.component';
import { PwaService } from '../shared/services/pwa.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    HlmButtonDirective,
    RouterLink,
    HlmMenuBarComponent,
    HlmMenuBarItemDirective,
    HlmMenuComponent,
    HlmMenuItemRadioComponent,
    HlmMenuItemRadioDirective,
    BrnMenuTriggerDirective,
    HeaderMobileComponent,
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
  protected pwaService = inject(PwaService);

  isUserConnected = signal(false);
  connectedUser = signal<UserEntity | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  installPwa() {
    this.pwaService.installPwa();
  }
}
