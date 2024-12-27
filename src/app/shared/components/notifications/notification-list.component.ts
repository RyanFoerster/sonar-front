import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { HlmIconComponent } from '@spartan-ng/ui-icon-helm';
import { provideIcons } from '@ng-icons/core';
import { lucideUsers } from '@ng-icons/lucide';
import { Notification } from '../../services/notification.service';
import { CompteGroupeEntity } from '../../entities/compte-groupe.entity';

interface NotificationWithGroup extends Notification {
  group?: CompteGroupeEntity;
}

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [DatePipe, HlmIconComponent, NgClass],
  providers: [provideIcons({ lucideUsers })],
  templateUrl: './notification-list.component.html',
})
export class NotificationListComponent {
  @Input() notifications: NotificationWithGroup[] = [];
  @Output() accept = new EventEmitter<NotificationWithGroup>();
  @Output() reject = new EventEmitter<NotificationWithGroup>();

  protected onAccept(notification: NotificationWithGroup): void {
    this.accept.emit(notification);
  }

  protected onReject(notification: NotificationWithGroup): void {
    this.reject.emit(notification);
  }
}
