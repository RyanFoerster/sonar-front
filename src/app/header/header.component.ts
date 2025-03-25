import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
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
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { HeaderMobileComponent } from '../header-mobile/header-mobile.component';
import { UserEntity } from '../shared/entities/user.entity';
import { PwaService } from '../shared/services/pwa.service';
import { NotificationManagerComponent } from '../components/notification-manager/notification-manager.component';

import { lucideBell } from '@ng-icons/lucide';
import { provideIcons } from '@spartan-ng/ui-icon-helm';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HlmButtonDirective,
    RouterLink,
    HlmMenuBarComponent,
    HlmMenuBarItemDirective,
    HlmMenuComponent,
    HlmMenuItemRadioComponent,
    HlmMenuItemRadioDirective,
    BrnMenuTriggerDirective,
    HeaderMobileComponent,
    NotificationManagerComponent,
  ],
  providers: [provideIcons({ lucideBell })],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService: AuthService = inject(AuthService);
  protected router: Router = inject(Router);
  protected pwaService = inject(PwaService);

  isUserConnected = signal(false);
  connectedUser = signal<UserEntity | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profilePicture = signal<any>('');

  private subscriptions: Subscription[] = [];

  ngOnInit() {
    // Initialiser l'état au démarrage
    this.isUserConnected.set(this.authService.isAuthenticated());
    const initialUser = this.authService.getUser();
    if (initialUser) {
      this.connectedUser.set(initialUser);
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
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private resetUserData() {
    this.connectedUser.set(null);
    this.isUserConnected.set(false);
  }

  logout() {
    this.authService.logout();
  }

  installPwa() {
    this.pwaService.installPwa();
  }
}
