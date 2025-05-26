import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ChatMessage,
  UserTyping,
  ChatPaginationState,
} from '../../../../../../services/event-chat.service';
import { AuthService } from '../../../../../../shared/services/auth.service';

@Component({
  selector: 'app-event-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Chat Section -->
    <div class="border border-gray-200 rounded-lg overflow-hidden">
      <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 class="font-medium text-gray-900">Chat de l'événement</h3>
      </div>

      <!-- Messages du chat -->
      <div
        class="h-80 overflow-y-auto p-4 overflow-x-hidden"
        id="chat-messages"
      >
        <!-- Indicateur de chargement initial -->
        <div
          *ngIf="loadingChatMessages"
          class="flex justify-center items-center py-4"
        >
          <div
            class="w-6 h-6 border-2 border-t-blue-500 border-gray-200 rounded-full animate-spin"
          ></div>
        </div>

        <!-- Indicateur de chargement des messages plus anciens -->
        <div
          *ngIf="loadingMoreChatMessages"
          class="flex justify-center items-center py-3 mb-3"
        >
          <div
            class="w-5 h-5 border-2 border-t-blue-500 border-gray-200 rounded-full animate-spin mr-2"
          ></div>
          <span class="text-xs text-gray-500">Chargement des messages...</span>
        </div>

        <!-- Bouton pour charger plus de messages -->
        <div
          *ngIf="
            !loadingChatMessages &&
            !loadingMoreChatMessages &&
            chatPaginationState?.hasMoreMessages
          "
          class="flex flex-col items-center mb-4"
        >
          <div class="text-xs text-gray-500 mb-1">
            {{ chatMessages.length }} sur
            {{ chatPaginationState?.totalMessages }} messages
          </div>
          <button
            class="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition"
            (click)="onLoadMoreMessages()"
          >
            Charger les messages précédents
          </button>
        </div>

        <!-- Aucun message -->
        <div
          *ngIf="!loadingChatMessages && chatMessages.length === 0"
          class="py-4 text-center text-gray-500 text-sm"
        >
          Aucun message dans le chat
        </div>

        <!-- Liste des messages -->
        <div
          *ngFor="let message of chatMessages; let i = index"
          class="mb-4 last:mb-0"
          [ngClass]="{
            'animate-fade-in':
              i === chatMessages.length - 1 && chatMessages.length > 0
          }"
        >
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div
                class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-sm"
                [class.bg-blue-100]="
                  message.senderId === authService.getUser()?.id
                "
                [class.text-blue-700]="
                  message.senderId === authService.getUser()?.id
                "
              >
                {{
                  getInitials({
                    name: message.senderName,
                    email: message.senderEmail
                  })
                }}
              </div>
            </div>
            <div class="ml-3 max-w-[85%] break-words overflow-hidden">
              <div class="flex items-center">
                <div
                  class="font-medium text-sm text-gray-900"
                  [class.text-blue-700]="
                    message.senderId === authService.getUser()?.id
                  "
                >
                  {{ message.senderName || message.senderEmail }}
                  <span
                    *ngIf="message.senderId === authService.getUser()?.id"
                    class="text-xs text-blue-600 ml-1"
                    >(vous)</span
                  >
                </div>
                <div class="ml-2 text-xs text-gray-500">
                  {{ formatDate(message.createdAt) }}
                </div>
              </div>
              <div
                class="mt-1 text-sm text-gray-700 p-2 rounded-lg message-content"
                [class.bg-blue-50]="
                  message.senderId === authService.getUser()?.id
                "
                [class.bg-gray-50]="
                  message.senderId !== authService.getUser()?.id
                "
              >
                {{ message.content }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulaire d'envoi de message -->
      <div class="p-3 border-t border-gray-200">
        <!-- Indicateur de frappe -->
        <div
          *ngIf="isAnyoneTyping()"
          class="mb-2 text-xs text-gray-500 font-italic typing-indicator"
        >
          {{ getTypingUsersText() }}
        </div>

        <div class="flex">
          <input
            #chatInput
            id="chatInput"
            type="text"
            [(ngModel)]="newChatMessage"
            placeholder="Écrivez votre message..."
            class="flex-1 px-3 py-2 rounded-l-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            (keyup.enter)="onSendMessage()"
            (keyup)="onTyping()"
            (focus)="onInputFocus()"
            (blur)="onInputBlur()"
            maxlength="500"
          />
          <button
            class="px-4 py-2 text-white rounded-r-lg transition-colors"
            [ngClass]="{
              'bg-blue-600 hover:bg-blue-700': !isTyping,
              'bg-green-600 hover:bg-green-700': isTyping
            }"
            [disabled]="!newChatMessage.trim()"
            (click)="onSendMessage()"
          >
            <svg
              *ngIf="!isTyping"
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <svg
              *ngIf="isTyping"
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          </button>
        </div>
        <!-- Compteur de caractères -->
        <div class="mt-1 text-xs text-right text-gray-500">
          {{ 500 - newChatMessage.length }} caractères restants
        </div>
      </div>
    </div>
  `,
})
export class EventChatComponent {
  @Input() chatMessages: ChatMessage[] = [];
  @Input() loadingChatMessages = false;
  @Input() loadingMoreChatMessages = false;
  @Input() chatPaginationState?: ChatPaginationState;
  @Input() typingUsers: UserTyping[] = [];
  @Input() isTyping = false;

  @Output() sendMessage = new EventEmitter<string>();
  @Output() loadMoreMessages = new EventEmitter<void>();
  @Output() typing = new EventEmitter<void>();
  @Output() inputFocus = new EventEmitter<void>();
  @Output() inputBlur = new EventEmitter<void>();

  newChatMessage = '';
  public authService = inject(AuthService);

  onSendMessage(): void {
    if (!this.newChatMessage.trim()) {
      return;
    }
    this.sendMessage.emit(this.newChatMessage.trim());
    this.newChatMessage = '';
  }

  onLoadMoreMessages(): void {
    this.loadMoreMessages.emit();
  }

  onTyping(): void {
    this.typing.emit();
  }

  onInputFocus(): void {
    this.inputFocus.emit();
  }

  onInputBlur(): void {
    this.inputBlur.emit();
  }

  getInitials(person: { name?: string; email?: string }): string {
    if (person.name) {
      return person.name.substring(0, 2).toUpperCase();
    } else if (person.email) {
      return person.email.substring(0, 2).toUpperCase();
    }
    return '??';
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  isAnyoneTyping(): boolean {
    const currentUser = this.authService.getUser();
    if (!currentUser || this.typingUsers.length === 0) {
      return false;
    }

    return this.typingUsers.some((user) => user.userId !== currentUser.id);
  }

  getTypingUsersText(): string {
    const currentUser = this.authService.getUser();
    if (!currentUser) return '';

    const otherTypingUsers = this.typingUsers.filter(
      (user) => user.userId !== currentUser.id
    );

    if (otherTypingUsers.length === 0) {
      return '';
    } else if (otherTypingUsers.length === 1) {
      return `${otherTypingUsers[0].userName} est en train d'écrire...`;
    } else if (otherTypingUsers.length === 2) {
      return `${otherTypingUsers[0].userName} et ${otherTypingUsers[1].userName} sont en train d'écrire...`;
    } else {
      return `${otherTypingUsers.length} personnes sont en train d'écrire...`;
    }
  }
}
