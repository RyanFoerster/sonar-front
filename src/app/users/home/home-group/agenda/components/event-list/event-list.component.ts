import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Event,
  EventStatus,
} from '../../../../../../shared/models/event.model';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">Listes des événements</h2>
        <!-- Bouton retour sur mobile quand un événement est sélectionné -->
        <button
          *ngIf="selectedEvent && window.innerWidth < 768"
          class="md:hidden p-2 rounded-lg hover:bg-gray-100"
          (click)="onCloseSelectedEvent()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Bouton de création d'événement -->
      <button
        *ngIf="hasAdminRights"
        class="w-full bg-black hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-lg transition"
        (click)="onCreateEvent()"
      >
        Créer un nouvel événement
      </button>

      <!-- Message informatif pour les utilisateurs sans droits d'admin -->
      <div
        *ngIf="!hasAdminRights && !isOrganizerOfAnyEvent"
        class="w-full text-gray-500 text-sm text-center py-2.5 px-4 bg-gray-50 rounded-lg mb-4"
      >
        Vous avez un accès en lecture seule à l'agenda
      </div>

      <!-- Section des filtres -->
      <div class="mt-6 space-y-4">
        <!-- Barre de recherche -->
        <div class="relative">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onFiltersChange()"
            placeholder="Rechercher par nom ou lieu..."
            class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <!-- Filtre par date -->
        <div>
          <select
            [(ngModel)]="dateFilter"
            (ngModelChange)="onFiltersChange()"
            class="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer"
          >
            <option value="all">Toutes les dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="tomorrow">Demain</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="past">Événements passés</option>
          </select>
        </div>

        <!-- Filtres de statut -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            class="flex items-center justify-center px-4 py-2 rounded-lg border transition-all duration-200 ease-in-out"
            [class.bg-blue-50]="statusFilter === 'all'"
            [class.text-blue-700]="statusFilter === 'all'"
            [class.border-blue-200]="statusFilter === 'all'"
            [class.hover:bg-blue-50]="statusFilter !== 'all'"
            [class.hover:border-blue-200]="statusFilter !== 'all'"
            [class.bg-white]="statusFilter !== 'all'"
            [class.border-gray-200]="statusFilter !== 'all'"
            (click)="statusFilter = 'all'; onFiltersChange()"
          >
            <span class="text-sm font-medium">Tout</span>
          </button>
          <button
            class="flex items-center justify-center px-4 py-2 rounded-lg border transition-all duration-200 ease-in-out"
            [class.bg-green-50]="statusFilter === 'CONFIRMED'"
            [class.text-green-700]="statusFilter === 'CONFIRMED'"
            [class.border-green-200]="statusFilter === 'CONFIRMED'"
            [class.hover:bg-green-50]="statusFilter !== 'CONFIRMED'"
            [class.hover:border-green-200]="statusFilter !== 'CONFIRMED'"
            [class.bg-white]="statusFilter !== 'CONFIRMED'"
            [class.border-gray-200]="statusFilter !== 'CONFIRMED'"
            (click)="statusFilter = 'CONFIRMED'; onFiltersChange()"
          >
            <span class="text-sm font-medium">Confirmés</span>
          </button>
          <button
            class="flex items-center justify-center px-4 py-2 rounded-lg border transition-all duration-200 ease-in-out"
            [class.bg-yellow-50]="statusFilter === 'PENDING'"
            [class.text-yellow-700]="statusFilter === 'PENDING'"
            [class.border-yellow-200]="statusFilter === 'PENDING'"
            [class.hover:bg-yellow-50]="statusFilter !== 'PENDING'"
            [class.hover:border-yellow-200]="statusFilter !== 'PENDING'"
            [class.bg-white]="statusFilter !== 'PENDING'"
            [class.border-gray-200]="statusFilter !== 'PENDING'"
            (click)="statusFilter = 'PENDING'; onFiltersChange()"
          >
            <span class="text-sm font-medium">En attente</span>
          </button>
          <button
            class="flex items-center justify-center px-4 py-2 rounded-lg border transition-all duration-200 ease-in-out"
            [class.bg-red-50]="statusFilter === 'CANCELLED'"
            [class.text-red-700]="statusFilter === 'CANCELLED'"
            [class.border-red-200]="statusFilter === 'CANCELLED'"
            [class.hover:bg-red-50]="statusFilter !== 'CANCELLED'"
            [class.hover:border-red-200]="statusFilter !== 'CANCELLED'"
            [class.bg-white]="statusFilter !== 'CANCELLED'"
            [class.border-gray-200]="statusFilter !== 'CANCELLED'"
            (click)="statusFilter = 'CANCELLED'; onFiltersChange()"
          >
            <span class="text-sm font-medium">Annulés</span>
          </button>
        </div>
      </div>

      <!-- Séparateur -->
      <div class="my-6 border-t border-gray-200"></div>
    </div>

    <!-- Liste des événements -->
    <div
      class="px-4 md:px-5 pb-5 overflow-y-auto"
      [class.hidden]="selectedEvent && window.innerWidth < 768"
    >
      <div *ngIf="loading" class="flex justify-center items-center py-6">
        <div
          class="w-8 h-8 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin"
        ></div>
      </div>

      <div
        *ngIf="!loading && filteredEvents.length === 0"
        class="py-6 px-4 text-center bg-gray-50 rounded-lg text-gray-500 text-sm"
      >
        Aucun événement trouvé
      </div>

      <div
        *ngFor="let event of filteredEvents"
        class="mb-3 p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 hover:shadow-sm transition"
        (click)="onEventSelect(event)"
        (keydown.enter)="onEventSelect(event)"
        (keydown.space)="onEventSelect(event); $event.preventDefault()"
        tabindex="0"
        role="button"
        [attr.aria-label]="getEventAriaLabel(event.title)"
      >
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-base font-semibold text-gray-900">
            {{ event.title }}
          </h3>
          <span
            class="text-xs px-2 py-1 rounded-full"
            [class.bg-green-50]="event.status === EventStatus.CONFIRMED"
            [class.text-green-700]="event.status === EventStatus.CONFIRMED"
            [class.bg-yellow-50]="event.status === EventStatus.PENDING"
            [class.text-yellow-700]="event.status === EventStatus.PENDING"
            [class.bg-red-50]="event.status === EventStatus.CANCELLED"
            [class.text-red-700]="event.status === EventStatus.CANCELLED"
          >
            {{ getStatusLabel(event.status) }}
          </span>
        </div>

        <div class="text-sm text-gray-600 mb-2">
          {{ formatDate(event.startDateTime) }}
        </div>

        <div class="flex justify-between items-center text-xs text-gray-500">
          <div *ngIf="event.location" class="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"
              />
            </svg>
            {{ event.location }}
          </div>

          <div
            class="flex items-center gap-1"
            *ngIf="event.organizers && event.organizers.length > 0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path
                d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              />
            </svg>
            {{ event.organizers.length }} organisateur{{
              event.organizers.length > 1 ? 's' : ''
            }}
          </div>
        </div>

        <!-- Raison d'annulation si applicable -->
        <div
          *ngIf="
            event.status === EventStatus.CANCELLED && event.cancellationReason
          "
          class="mt-2 pt-2 text-xs text-red-700 border-t border-gray-100"
        >
          <strong>Raison :</strong> {{ event.cancellationReason }}
        </div>
      </div>
    </div>
  `,
})
export class EventListComponent {
  @Input() events: Event[] = [];
  @Input() filteredEvents: Event[] = [];
  @Input() loading = false;
  @Input() selectedEvent: Event | null = null;
  @Input() hasAdminRights = false;
  @Input() isOrganizerOfAnyEvent = false;

  @Output() eventSelect = new EventEmitter<Event>();
  @Output() createEvent = new EventEmitter<void>();
  @Output() closeSelectedEvent = new EventEmitter<void>();
  @Output() filtersChange = new EventEmitter<{
    searchQuery: string;
    statusFilter: string;
    dateFilter: string;
  }>();

  searchQuery = '';
  statusFilter = 'all';
  dateFilter = 'all';
  window = window;

  // Pour accéder à l'enum dans le template
  EventStatus = EventStatus;

  onEventSelect(event: Event): void {
    this.eventSelect.emit(event);
  }

  onCreateEvent(): void {
    this.createEvent.emit();
  }

  onCloseSelectedEvent(): void {
    this.closeSelectedEvent.emit();
  }

  onFiltersChange(): void {
    this.filtersChange.emit({
      searchQuery: this.searchQuery,
      statusFilter: this.statusFilter,
      dateFilter: this.dateFilter,
    });
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

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getEventAriaLabel(title: string): string {
    return `Voir les détails de l'événement: ${title}`;
  }
}
