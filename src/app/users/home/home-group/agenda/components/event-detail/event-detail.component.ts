import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  Event,
  EventStatus,
  InvitationStatus,
  InvitedPerson,
} from '../../../../../../shared/models/event.model';
import { UserEntity } from '../../../../../../shared/entities/user.entity';
import { EventActionsComponent } from '../event-actions/event-actions.component';
import { EventChatComponent } from '../event-chat/event-chat.component';
import {
  ChatMessage,
  UserTyping,
  ChatPaginationState,
} from '../../../../../../services/event-chat.service';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, EventActionsComponent, EventChatComponent],
  template: `
    <div class="flex-1 overflow-y-auto" *ngIf="event">
      <!-- Hero section avec hauteur adaptative -->
      <div
        class="h-40 md:h-60 bg-black bg-[url('https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80')] bg-cover bg-center relative"
      >
        <div
          class="absolute inset-0 bg-gradient-to-b from-black/20 to-black/70 flex flex-col justify-end p-4 md:p-6"
        >
          <h1 class="text-xl md:text-3xl font-bold mb-2 !text-white">
            {{ event.title }}
          </h1>
          <div
            class="flex flex-wrap items-center gap-2 md:gap-4 text-white/90 text-sm"
          >
            <span>{{ formatDate(event.startDateTime) }}</span>
            <span *ngIf="event.location">{{ event.location }}</span>
            <span
              class="text-xs px-2 py-1 rounded-full"
              [class.bg-green-100]="event.status === EventStatus.CONFIRMED"
              [class.text-green-800]="event.status === EventStatus.CONFIRMED"
              [class.bg-yellow-100]="event.status === EventStatus.PENDING"
              [class.text-yellow-800]="event.status === EventStatus.PENDING"
              [class.bg-red-100]="event.status === EventStatus.CANCELLED"
              [class.text-red-800]="event.status === EventStatus.CANCELLED"
            >
              {{ getStatusLabel(event.status) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Boutons d'action -->
      <app-event-actions
        [event]="event"
        [hasManagementRights]="hasManagementRights"
        [isCurrentUserInvited]="isCurrentUserInvited"
        [currentUserInvitationStatus]="currentUserInvitationStatus"
        [isEventInGoogleCalendar]="isEventInGoogleCalendar"
        (updateStatus)="onUpdateStatus($event)"
        (respondToInvitation)="onRespondToInvitation($event)"
        (inviteParticipants)="onInviteParticipants()"
        (duplicateEvent)="onDuplicateEvent()"
        (editEvent)="onEditEvent()"
        (sendReminders)="onSendReminders()"
        (sendMemo)="onSendMemo()"
        (deleteEvent)="onDeleteEvent()"
        (addToGoogleCalendar)="onAddToGoogleCalendar()"
      ></app-event-actions>

      <!-- Contenu de l'événement avec layout adaptatif -->
      <div class="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <!-- Détails de l'événement (2 colonnes sur grand écran) -->
        <div class="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
          <!-- Description -->
          <div *ngIf="event.description" class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">
              Description
            </h3>
            <p class="text-gray-700">{{ event.description }}</p>
          </div>

          <!-- Chat Section -->
          <app-event-chat
            [chatMessages]="chatMessages"
            [loadingChatMessages]="loadingChatMessages"
            [loadingMoreChatMessages]="loadingMoreChatMessages"
            [chatPaginationState]="chatPaginationState"
            [typingUsers]="typingUsers"
            [isTyping]="isTyping"
            (sendMessage)="onSendChatMessage($event)"
            (loadMoreMessages)="onLoadMoreChatMessages()"
            (typing)="onChatTyping()"
            (inputFocus)="onChatInputFocus()"
            (inputBlur)="onChatInputBlur()"
          ></app-event-chat>
        </div>

        <!-- Barre latérale de l'événement (1 colonne) -->
        <div class="space-y-6 overflow-y-auto">
          <!-- Détails -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Détails</h3>

            <div class="space-y-4">
              <div class="flex">
                <div class="text-gray-500 mr-3 mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-5 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"
                    />
                    <path
                      d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-xs text-gray-500 mb-1">Date de début</div>
                  <div class="text-gray-900">
                    {{ formatDate(event.startDateTime) }}
                  </div>
                </div>
              </div>

              <div class="flex">
                <div class="text-gray-500 mr-3 mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm-5 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"
                    />
                    <path
                      d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-xs text-gray-500 mb-1">Date de fin</div>
                  <div class="text-gray-900">
                    {{ formatDate(event.endDateTime) }}
                  </div>
                </div>
              </div>

              <div class="flex">
                <div class="text-gray-500 mr-3 mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"
                    />
                    <path
                      d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-xs text-gray-500 mb-1">
                    Heure de rendez-vous
                  </div>
                  <div class="text-gray-900">
                    {{ formatDate(event.meetupDateTime) }}
                  </div>
                </div>
              </div>

              <div class="flex" *ngIf="event.location">
                <div class="text-gray-500 mr-3 mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-xs text-gray-500 mb-1">Lieu</div>
                  <div class="text-gray-900">{{ event.location }}</div>
                </div>
              </div>

              <div
                class="flex"
                *ngIf="
                  event.status === EventStatus.CANCELLED &&
                  event.cancellationReason
                "
              >
                <div class="text-gray-500 mr-3 mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"
                    />
                    <path
                      d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="text-xs text-gray-500 mb-1">
                    Raison d'annulation
                  </div>
                  <div class="text-gray-900">
                    {{ event.cancellationReason }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Organisateurs -->
          <div
            *ngIf="eventOrganizers && eventOrganizers.length > 0"
            class="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div
              class="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center"
            >
              <h3 class="font-medium text-gray-900">
                {{
                  eventOrganizers.length > 1 ? 'Organisateurs' : 'Organisateur'
                }}
              </h3>
            </div>
            <div class="max-h-64 overflow-y-auto">
              <div
                *ngIf="loadingOrganizers"
                class="flex justify-center items-center py-4"
              >
                <div
                  class="w-6 h-6 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin"
                ></div>
              </div>
              <div
                *ngIf="!loadingOrganizers && eventOrganizers.length === 0"
                class="py-4 px-4 text-center text-gray-500 text-sm"
              >
                Aucun organisateur spécifié
              </div>
              <div
                *ngFor="let organizer of eventOrganizers"
                class="flex items-center px-4 py-3 border-b border-gray-200 last:border-b-0"
              >
                <div
                  class="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full mr-3 text-sm text-gray-700"
                >
                  {{ getInitials(organizer) }}
                </div>
                <div class="flex-1">
                  <div class="text-sm font-medium text-gray-900">
                    {{ organizer.firstName }} {{ organizer.name }}
                  </div>
                  <div class="text-xs text-gray-500">{{ organizer.email }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Participants -->
          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <div
              class="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center"
            >
              <h3 class="font-medium text-gray-900">Participation(s)</h3>
              <button
                *ngIf="hasManagementRights"
                class="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition"
                (click)="onInviteParticipants()"
              >
                Inviter des participants
              </button>
            </div>
            <div class="max-h-64 overflow-y-auto">
              <div
                *ngIf="loadingParticipants"
                class="flex justify-center items-center py-4"
              >
                <div
                  class="w-6 h-6 border-2 border-t-blue-500 border-gray-200 rounded-full animate-spin mr-2"
                ></div>
              </div>
              <div
                *ngIf="!loadingParticipants && eventParticipants.length === 0"
                class="py-4 px-4 text-center text-gray-500 text-sm"
              >
                Aucun participant pour le moment
              </div>
              <div
                *ngFor="let participant of eventParticipants"
                class="flex items-center px-4 py-3 border-b border-gray-200 last:border-b-0"
              >
                <div
                  class="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full mr-3 text-sm text-gray-700"
                >
                  {{ getInitials(participant) }}
                </div>
                <div class="flex-1">
                  <div class="text-sm font-medium text-gray-900">
                    {{
                      participant.name ||
                        (participant.isExternal
                          ? participant.personId
                          : 'Anonyme')
                    }}
                  </div>
                  <div *ngIf="participant.email" class="text-xs text-gray-500">
                    {{ participant.email }}
                  </div>
                </div>
                <span
                  class="text-xs px-2 py-0.5 rounded-full"
                  [class.bg-green-50]="participant.status === 'ACCEPTED'"
                  [class.text-green-700]="participant.status === 'ACCEPTED'"
                  [class.bg-red-50]="participant.status === 'DECLINED'"
                  [class.text-red-700]="participant.status === 'DECLINED'"
                  [class.bg-yellow-50]="participant.status === 'PENDING'"
                  [class.text-yellow-700]="participant.status === 'PENDING'"
                >
                  {{ getParticipantStatusLabel(participant.status) }}
                </span>
                <button
                  *ngIf="
                    participant.status === 'PENDING' && hasManagementRights
                  "
                  class="ml-2 text-xs text-red-600 hover:text-red-800 flex items-center"
                  title="Annuler l'invitation"
                  (click)="
                    onCancelInvitation(participant); $event.stopPropagation()
                  "
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class EventDetailComponent {
  @Input() event: Event | null = null;
  @Input() hasManagementRights = false;
  @Input() isCurrentUserInvited = false;
  @Input() currentUserInvitationStatus: InvitationStatus | null = null;
  @Input() isEventInGoogleCalendar = false;
  @Input() eventOrganizers: UserEntity[] = [];
  @Input() eventParticipants: InvitedPerson[] = [];
  @Input() loadingOrganizers = false;
  @Input() loadingParticipants = false;

  // Chat inputs
  @Input() chatMessages: ChatMessage[] = [];
  @Input() loadingChatMessages = false;
  @Input() loadingMoreChatMessages = false;
  @Input() chatPaginationState?: ChatPaginationState;
  @Input() typingUsers: UserTyping[] = [];
  @Input() isTyping = false;

  @Output() updateStatus = new EventEmitter<EventStatus>();
  @Output() respondToInvitation = new EventEmitter<InvitationStatus>();
  @Output() inviteParticipants = new EventEmitter<void>();
  @Output() duplicateEvent = new EventEmitter<void>();
  @Output() editEvent = new EventEmitter<void>();
  @Output() sendReminders = new EventEmitter<void>();
  @Output() sendMemo = new EventEmitter<void>();
  @Output() deleteEvent = new EventEmitter<void>();
  @Output() addToGoogleCalendar = new EventEmitter<void>();
  @Output() cancelInvitation = new EventEmitter<InvitedPerson>();

  // Chat outputs
  @Output() sendChatMessage = new EventEmitter<string>();
  @Output() loadMoreChatMessages = new EventEmitter<void>();
  @Output() chatTyping = new EventEmitter<void>();
  @Output() chatInputFocus = new EventEmitter<void>();
  @Output() chatInputBlur = new EventEmitter<void>();

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

  onCancelInvitation(participant: InvitedPerson): void {
    this.cancelInvitation.emit(participant);
  }

  onSendChatMessage(message: string): void {
    this.sendChatMessage.emit(message);
  }

  onLoadMoreChatMessages(): void {
    this.loadMoreChatMessages.emit();
  }

  onChatTyping(): void {
    this.chatTyping.emit();
  }

  onChatInputFocus(): void {
    this.chatInputFocus.emit();
  }

  onChatInputBlur(): void {
    this.chatInputBlur.emit();
  }

  getStatusLabel(status: EventStatus): string {
    switch (status) {
      case EventStatus.CONFIRMED:
        return 'Confirmé';
      case EventStatus.CANCELLED:
        return 'Annulé';
      case EventStatus.PENDING:
      default:
        return 'En attente';
    }
  }

  getParticipantStatusLabel(status: InvitationStatus): string {
    switch (status) {
      case InvitationStatus.ACCEPTED:
        return 'Accepté';
      case InvitationStatus.DECLINED:
        return 'Refusé';
      case InvitationStatus.PENDING:
      default:
        return 'En attente';
    }
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getInitials(person: {
    firstName?: string;
    name?: string;
    email?: string;
    personId?: number | string;
    isExternal?: boolean;
  }): string {
    if (person.firstName && person.name) {
      return `${person.firstName[0]}${person.name[0]}`.toUpperCase();
    } else if (person.name) {
      return person.name.substring(0, 2).toUpperCase();
    } else if (person.email) {
      return person.email.substring(0, 2).toUpperCase();
    } else if (person.personId && person.isExternal) {
      return person.personId.toString().substring(0, 2).toUpperCase();
    }
    return '??';
  }
}
