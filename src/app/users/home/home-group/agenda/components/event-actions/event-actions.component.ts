import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  Event,
  EventStatus,
  InvitationStatus,
} from '../../../../../../shared/models/event.model';

@Component({
  selector: 'app-event-actions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Boutons d'action avec scroll horizontal sur mobile -->
    <div
      class="flex gap-2 p-4 md:px-6 md:py-4 border-b border-gray-200 overflow-x-auto"
    >
      <!-- Boutons pour les organisateurs OU administrateurs - Visibles quel que soit le statut de l'événement (sauf annulé) -->
      <ng-container
        *ngIf="hasManagementRights && event?.status !== EventStatus.CANCELLED"
      >
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 hover:bg-green-700 text-white transition"
          (click)="onUpdateStatus(EventStatus.CONFIRMED)"
          [class.opacity-50]="event?.status === EventStatus.CONFIRMED"
          [disabled]="event?.status === EventStatus.CONFIRMED"
        >
          Confirmer
        </button>
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-md bg-yellow-600 hover:bg-yellow-700 text-white transition"
          (click)="onUpdateStatus(EventStatus.PENDING)"
          [class.opacity-50]="event?.status === EventStatus.PENDING"
          [disabled]="event?.status === EventStatus.PENDING"
        >
          En attente
        </button>
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 hover:bg-red-700 text-white transition"
          (click)="onUpdateStatus(EventStatus.CANCELLED)"
        >
          Annuler
        </button>
      </ng-container>

      <!-- Boutons pour les invités - Visibles sauf si l'événement est annulé -->
      <ng-container
        *ngIf="isCurrentUserInvited && event?.status !== EventStatus.CANCELLED"
      >
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 hover:bg-green-700 text-white transition"
          (click)="onRespondToInvitation(InvitationStatus.ACCEPTED)"
          [class.opacity-50]="
            currentUserInvitationStatus === InvitationStatus.ACCEPTED
          "
          [disabled]="currentUserInvitationStatus === InvitationStatus.ACCEPTED"
        >
          Accepter
        </button>
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 hover:bg-red-700 text-white transition"
          (click)="onRespondToInvitation(InvitationStatus.DECLINED)"
          [class.opacity-50]="
            currentUserInvitationStatus === InvitationStatus.DECLINED
          "
          [disabled]="currentUserInvitationStatus === InvitationStatus.DECLINED"
        >
          Refuser
        </button>
      </ng-container>

      <!-- Message quand l'événement est annulé pour les participants -->
      <ng-container
        *ngIf="isCurrentUserInvited && event?.status === EventStatus.CANCELLED"
      >
        <div
          class="px-3 py-1.5 text-xs font-medium rounded-md bg-red-50 text-red-700"
        >
          Cet événement a été annulé
        </div>
      </ng-container>

      <!-- Boutons réservés aux administrateurs de l'agenda -->
      <ng-container *ngIf="hasManagementRights">
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
          (click)="onInviteParticipants()"
        >
          Invitation(s)
        </button>
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
          (click)="onDuplicateEvent()"
        >
          Dupliquer
        </button>
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
          (click)="onEditEvent()"
        >
          Modifier
        </button>
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
          (click)="onSendReminders()"
        >
          Envoyer un rappel
        </button>
        <button
          class="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
          (click)="onDeleteEvent()"
        >
          Mémo
        </button>
      </ng-container>

      <!-- Bouton pour ajouter l'événement à Google Calendar - Visible pour tous les utilisateurs -->
      <button
        class="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1"
        (click)="onAddToGoogleCalendar()"
        [class.bg-blue-500]="isEventInGoogleCalendar"
        [class.hover:bg-blue-600]="isEventInGoogleCalendar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path
            *ngIf="!isEventInGoogleCalendar"
            d="M8.5 10c-.276 0-.5-.224-.5-.5v-2h-2c-.276 0-.5-.224-.5-.5s.224-.5.5-.5h2v-2c0-.276.224-.5.5-.5s.5.224.5.5v2h2c.276 0 .5.224.5.5s-.224.5-.5.5h-2v2c0 .276-.224.5-.5.5z"
          />
          <path
            *ngIf="isEventInGoogleCalendar"
            d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"
          />
          <path
            d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0ZM1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Z"
          />
        </svg>
        <span>{{
          isEventInGoogleCalendar ? 'Synchronisé' : 'Google Calendar'
        }}</span>
      </button>
    </div>
  `,
})
export class EventActionsComponent {
  @Input() event: Event | null = null;
  @Input() hasManagementRights = false;
  @Input() isCurrentUserInvited = false;
  @Input() currentUserInvitationStatus: InvitationStatus | null = null;
  @Input() isEventInGoogleCalendar = false;

  @Output() updateStatus = new EventEmitter<EventStatus>();
  @Output() respondToInvitation = new EventEmitter<InvitationStatus>();
  @Output() inviteParticipants = new EventEmitter<void>();
  @Output() duplicateEvent = new EventEmitter<void>();
  @Output() editEvent = new EventEmitter<void>();
  @Output() sendReminders = new EventEmitter<void>();
  @Output() deleteEvent = new EventEmitter<void>();
  @Output() addToGoogleCalendar = new EventEmitter<void>();

  // Pour accéder aux enums dans le template
  EventStatus = EventStatus;
  InvitationStatus = InvitationStatus;

  onUpdateStatus(status: EventStatus): void {
    this.updateStatus.emit(status);
  }

  onRespondToInvitation(status: InvitationStatus): void {
    this.respondToInvitation.emit(status);
  }

  onInviteParticipants(): void {
    this.inviteParticipants.emit();
  }

  onDuplicateEvent(): void {
    this.duplicateEvent.emit();
  }

  onEditEvent(): void {
    this.editEvent.emit();
  }

  onSendReminders(): void {
    this.sendReminders.emit();
  }

  onDeleteEvent(): void {
    this.deleteEvent.emit();
  }

  onAddToGoogleCalendar(): void {
    this.addToGoogleCalendar.emit();
  }
}
