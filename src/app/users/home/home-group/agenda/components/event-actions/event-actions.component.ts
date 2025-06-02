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
    <!-- Boutons d'action avec organisation par catégories -->
    <div class="border-b border-gray-200 bg-white">
      <div class="p-4 md:px-6 md:py-4">
        <!-- Section statuts - toujours visible en premier si on a les droits -->
        <div
          *ngIf="hasManagementRights && event?.status !== EventStatus.CANCELLED"
          class="flex flex-wrap gap-2 mb-3 pb-3 border-b border-gray-100"
        >
          <span
            class="text-xs font-semibold text-gray-500 uppercase tracking-wide w-full mb-1"
            >Statut</span
          >
          <button
            class="flex-1 min-w-0 px-3 py-2 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
            (click)="onUpdateStatus(EventStatus.CONFIRMED)"
            [class.opacity-50]="event?.status === EventStatus.CONFIRMED"
            [disabled]="event?.status === EventStatus.CONFIRMED"
          >
            ✓ Confirmer
          </button>
          <button
            class="flex-1 min-w-0 px-3 py-2 text-xs font-medium rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white transition-colors"
            (click)="onUpdateStatus(EventStatus.PENDING)"
            [class.opacity-50]="event?.status === EventStatus.PENDING"
            [disabled]="event?.status === EventStatus.PENDING"
          >
            ⏳ En attente
          </button>
          <button
            class="flex-1 min-w-0 px-3 py-2 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
            (click)="onUpdateStatus(EventStatus.CANCELLED)"
          >
            ✕ Annuler
          </button>
        </div>

        <!-- Section réponse invitation - visible pour les invités -->
        <div
          *ngIf="
            isCurrentUserInvited && event?.status !== EventStatus.CANCELLED
          "
          class="flex gap-2 mb-3 pb-3 border-b border-gray-100"
        >
          <span
            class="text-xs font-semibold text-gray-500 uppercase tracking-wide w-full mb-1"
            >Votre réponse</span
          >
          <button
            class="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
            (click)="onRespondToInvitation(InvitationStatus.ACCEPTED)"
            [class.opacity-50]="
              currentUserInvitationStatus === InvitationStatus.ACCEPTED
            "
            [disabled]="
              currentUserInvitationStatus === InvitationStatus.ACCEPTED
            "
          >
            ✓ Accepter
          </button>
          <button
            class="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
            (click)="onRespondToInvitation(InvitationStatus.DECLINED)"
            [class.opacity-50]="
              currentUserInvitationStatus === InvitationStatus.DECLINED
            "
            [disabled]="
              currentUserInvitationStatus === InvitationStatus.DECLINED
            "
          >
            ✕ Refuser
          </button>
        </div>

        <!-- Message quand l'événement est annulé -->
        <div
          *ngIf="
            isCurrentUserInvited && event?.status === EventStatus.CANCELLED
          "
          class="mb-3 pb-3 border-b border-gray-100"
        >
          <div
            class="px-3 py-2 text-xs font-medium rounded-lg bg-red-50 text-red-700 text-center"
          >
            ⚠️ Cet événement a été annulé
          </div>
        </div>

        <!-- Section actions de gestion - pour les admins -->
        <div *ngIf="hasManagementRights" class="space-y-3">
          <span
            class="text-xs font-semibold text-gray-500 uppercase tracking-wide block"
            >Actions</span
          >

          <!-- Première ligne : actions principales -->
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            <button
              class="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
              (click)="onInviteParticipants()"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                <path
                  d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 9a5 5 0 0 0-5 5h10a5 5 0 0 0-5-5ZM12.5 6a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 1 0v1h1Z"
                />
              </svg>
              Inviter
            </button>
            <button
              class="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
              (click)="onEditEvent()"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                <path
                  d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L10.5 8.5 8 11l-3-3 2.5-2.5L12.146.146ZM4.5 9.5l3 3L8 14H3a1 1 0 0 1-1-1V9.5Z"
                />
              </svg>
              Modifier
            </button>
            <button
              class="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors"
              (click)="onDuplicateEvent()"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                <path
                  d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1Z"
                />
                <path
                  d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3Zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3Z"
                />
              </svg>
              Dupliquer
            </button>
          </div>

          <!-- Deuxième ligne : notifications et danger -->
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            <button
              class="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors"
              (click)="onSendReminders()"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                <path
                  d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5Z"
                />
                <path
                  d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
              Rappel
            </button>
            <button
              class="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
              (click)="onSendMemo()"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                <path
                  d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12ZM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2Z"
                />
              </svg>
              Mémo
            </button>
            <button
              class="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
              (click)="onDeleteEvent()"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                <path
                  d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"
                />
                <path
                  d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"
                />
              </svg>
              Supprimer
            </button>
          </div>
        </div>

        <!-- Section Google Calendar - pour tous -->
        <div class="mt-3 pt-3 border-t border-gray-100">
          <button
            class="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            (click)="onAddToGoogleCalendar()"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
              <path
                d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"
              />
            </svg>
            <span>Ajouter à Google Calendar</span>
          </button>
        </div>
      </div>
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
  @Output() sendMemo = new EventEmitter<void>();
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

  onSendMemo(): void {
    this.sendMemo.emit();
  }

  onDeleteEvent(): void {
    this.deleteEvent.emit();
  }

  onAddToGoogleCalendar(): void {
    this.addToGoogleCalendar.emit();
  }
}
