import { Injectable, inject, signal } from '@angular/core';
import { Platform } from '@angular/cdk/platform';

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  private platform = inject(Platform);
  private deferredPrompt: any;

  canInstall = signal(false);

  constructor() {
    if (this.platform.isBrowser) {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        this.canInstall.set(true);
      });
    }
  }

  async installPwa() {
    if (!this.deferredPrompt) {
      return;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      this.canInstall.set(false);
    }

    this.deferredPrompt = null;
  }

  isInstalled(): boolean {
    // Vérifier si l'application est déjà installée
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://')
    );
  }
}
