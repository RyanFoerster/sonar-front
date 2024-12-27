import { Component } from '@angular/core';
import { NotificationsComponent } from '../notifications/notifications.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NotificationsComponent],
  template: `
    <div class="flex items-center gap-4">
      <app-notifications />
    </div>
  `,
})
export class HeaderComponent {}
