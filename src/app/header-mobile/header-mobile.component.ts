import { NgClass } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { lucideAlignJustify, lucideX, lucideDownload } from '@ng-icons/lucide';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmIconComponent, provideIcons } from '@spartan-ng/ui-icon-helm';
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
import { Subscription } from 'rxjs';
import { UserEntity } from '../shared/entities/user.entity';
import { AuthService } from '../shared/services/auth.service';
import { PwaService } from '../shared/services/pwa.service';

@Component({
  selector: 'app-header-mobile',
  standalone: true,
  imports: [
    HlmMenuBarComponent,
    HlmIconComponent,
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
    HlmButtonDirective,
    NgClass,
  ],
  templateUrl: './header-mobile.component.html',
  styleUrl: './header-mobile.component.css',
  providers: [provideIcons({ lucideAlignJustify, lucideX, lucideDownload })],
})
export class HeaderMobileComponent implements OnInit, OnDestroy {
  private authService: AuthService = inject(AuthService);
  private pwaService: PwaService = inject(PwaService);
  protected router: Router = inject(Router);
  private subscriptions: Subscription[] = [];

  isToggleMenu = signal(false);
  isUserConnected = signal(false);
  connectedUser = signal<UserEntity | null>(null);
  deferredPrompt = signal<any>(null);

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
      })
    );

    // S'abonner aux changements de l'utilisateur courant
    this.subscriptions.push(
      this.authService.getCurrentUser().subscribe((user) => {
        this.connectedUser.set(user);
      })
    );

    // Écouter l'événement beforeinstallprompt pour la PWA
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt.set(e);
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    // S'assurer que le overflow est réinitialisé lors de la destruction du composant
    document.body.classList.remove('overflow-hidden');
  }

  toggleMenu() {
    this.isToggleMenu.set(!this.isToggleMenu());
    document.body.classList.toggle('overflow-hidden');
  }

  logout() {
    this.authService.logout();
    this.toggleMenu();
  }

  async installPwa() {
    const deferredPrompt = this.deferredPrompt();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        this.deferredPrompt.set(null);
      }
    }
  }

  isPwaInstallable() {
    return this.deferredPrompt() !== null && !this.pwaService.isInstalled();
  }
}
