import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  Event,
  EventStatus,
  CreateEventRequest,
  UpdateEventRequest,
  InvitationStatus,
  InvitedPerson,
} from '../../../../shared/models/event.model';
import { EventService } from '../../../../services/event.service';
import { GoogleCalendarService } from '../../../../services/google-calendar.service';
import {
  EventChatService,
  ChatMessage,
  UserTyping,
  ChatPaginationState,
} from '../../../../services/event-chat.service';
import {
  GoogleCalendar,
  EventCreateData,
} from '../../../../shared/models/google-calendar.model';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserEntity } from '../../../../shared/entities/user.entity';
import { CompteGroupeService } from '../../../../shared/services/compte-groupe.service';
import { UsersService } from '../../../../shared/services/users.service';
import { AuthService } from '../../../../shared/services/auth.service';

// Import des nouveaux composants
import { EventListComponent } from './components/event-list/event-list.component';
import { EventDetailComponent } from './components/event-detail/event-detail.component';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    EventListComponent,
    EventDetailComponent,
  ],
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.css'],
})
export class AgendaComponent implements OnInit, OnDestroy {
  events: Event[] = [];
  filteredEvents: Event[] = [];
  groupId = 0;
  loading = false;
  error: string | null = null;
  statusFilter = 'all';
  searchQuery = '';
  dateFilter = 'all';

  // Pour accéder à l'enum dans le template
  EventStatus = EventStatus;
  InvitationStatus = InvitationStatus;

  // État des popups
  showCreateEventModal = false;
  showViewEventModal = false;
  showEditEventModal = false;
  showDuplicateEventModal = false;
  showInviteParticipantsModal = false;
  showCancelInvitationDialog = false;
  showSendRemindersModal = false;

  // Données de l'événement sélectionné
  selectedEvent: Event | null = null;
  selectedParticipant: InvitedPerson | null = null;

  // Raison d'annulation
  cancellationReason = '';
  showCancellationDialog = false;

  // Confirmation de suppression
  showDeleteConfirmationDialog = false;

  // Gestion des participants
  eventParticipants: InvitedPerson[] = [];
  loadingParticipants = false;

  // Gestion des organisateurs
  eventOrganizers: UserEntity[] = [];
  loadingOrganizers = false;

  // Gestion des membres du groupe
  groupMembers: UserEntity[] = [];
  loadingGroupMembers = false;
  selectedGroupMembers: UserEntity[] = [];
  selectedOrganizers: UserEntity[] = [];

  // Participants externes
  externalParticipants: { email: string; name?: string }[] = [];
  newExternalEmail = '';
  newExternalName = '';

  // Formulaires
  createEventForm: FormGroup;
  editEventForm: FormGroup;
  duplicateEventForm: FormGroup;

  // Message de succès
  successMessage: string | null = null;

  // Ajout de la propriété window
  window = window;

  // Utilisation d'inject pour AuthService au lieu de l'injecter via le constructeur
  public authService = inject(AuthService);

  // Google Calendar properties
  googleCalendars: GoogleCalendar[] = [];
  loadingGoogleCalendars = false;
  showAddToGoogleCalendarModal = false;
  selectedGoogleCalendar: string | null = null;
  googleCalendarSearchQuery = '';
  filteredGoogleCalendars: GoogleCalendar[] = [];
  showCreateCalendarForm = false;
  newCalendarForm: FormGroup;
  googleLinked = false;
  googleEventMapping = new Map<
    string,
    { calendarId: string; eventId: string }
  >();

  // Chat properties
  chatMessages: ChatMessage[] = [];
  newChatMessage = '';
  loadingChatMessages = false;
  loadingMoreChatMessages = false;
  chatSubscription?: Subscription;
  paginationSubscription?: Subscription;
  chatPaginationState?: ChatPaginationState;
  isTyping = false;
  typingUsers: UserTyping[] = [];
  typingUsersSubscription?: Subscription;
  typingTimeout?: ReturnType<typeof setTimeout>;

  // Reminder properties
  reminderTiming = 'now';
  customReminderDate = '';
  customReminderMessage = '';

  // Variables pour la programmation de mémos
  showSendMemoModal = false;
  memoTiming = 'now';
  customMemoDate = '';
  customMemoMessage = '';

  constructor(
    private eventService: EventService,
    private googleCalendarService: GoogleCalendarService,
    private eventChatService: EventChatService,
    private compteGroupeService: CompteGroupeService,
    private usersService: UsersService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    // Initialiser les formulaires
    this.createEventForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      location: [''],
      startDateTime: ['', Validators.required],
      endDateTime: [''],
      meetupDateTime: [''],
      status: [EventStatus.PENDING],
      organizers: [[], Validators.required],
    });

    this.editEventForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      location: [''],
      startDateTime: ['', Validators.required],
      endDateTime: [''],
      meetupDateTime: [''],
      status: [EventStatus.PENDING],
      organizers: [[], Validators.required],
    });

    this.duplicateEventForm = this.fb.group({
      startDateTime: ['', Validators.required],
      endDateTime: [''],
      meetupDateTime: [''],
    });

    // Initialize new calendar form
    this.newCalendarForm = this.fb.group({
      summary: ['', Validators.required],
      description: [''],
      timeZone: ['Europe/Paris'],
    });
  }

  ngOnInit(): void {
    let selectedEventIdFromUrl: string | null = null;

    // D'abord vérifier les paramètres d'URL pour voir s'il y a un événement sélectionné
    this.route.queryParams.subscribe((queryParams) => {
      selectedEventIdFromUrl = queryParams['selectedEventId'] || null;
    });

    // Ensuite charger les données du groupe et des événements
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.groupId = +params['id'];

        // Charger les événements et traiter l'événement sélectionné après le chargement
        this.eventService.getEventsByGroup(this.groupId).subscribe({
          next: (events) => {
            this.events = events;
            this.applyFilters();
            this.loading = false;

            // Vérifier si un événement doit être sélectionné d'après l'URL
            if (selectedEventIdFromUrl) {
              const selectedEvent = events.find(
                (e) => e.id === selectedEventIdFromUrl
              );
              if (selectedEvent && selectedEvent.id) {
                // Sélectionner l'événement sans naviguer à nouveau
                this.selectedEvent = selectedEvent;
                this.loadEventParticipants(selectedEvent.id);
                this.loadEventOrganizers(selectedEvent);

                // Faire défiler jusqu'à l'événement et le mettre en évidence
                setTimeout(() => {
                  const eventElement = document.querySelector(
                    `[data-event-id="${selectedEventIdFromUrl}"]`
                  );
                  if (eventElement) {
                    eventElement.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    });
                    eventElement.classList.add('highlight-event');
                    setTimeout(
                      () => eventElement.classList.remove('highlight-event'),
                      3000
                    );
                  }
                }, 500);
              }
            }
          },
          error: (err) => {
            console.error('Erreur lors du chargement des événements:', err);
            this.showErrorMessage('Impossible de charger les événements');
            this.loading = false;
          },
        });

        // Charger les membres du groupe séparément
        this.loadGroupMembers();
      }
    });

    // Ajouter un écouteur de redimensionnement pour mettre à jour la vue
    window.addEventListener('resize', this.onResize.bind(this));

    // Vérifier la connexion Google Calendar
    this.checkGoogleLinkStatus();

    // Charger le mapping des événements Google Calendar
    this.loadGoogleEventMapping();
  }

  ngOnDestroy(): void {
    // Nettoyer l'écouteur lors de la destruction du composant
    window.removeEventListener('resize', this.onResize.bind(this));

    // Nettoyer les abonnements
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
    if (this.typingUsersSubscription) {
      this.typingUsersSubscription.unsubscribe();
    }
    if (this.paginationSubscription) {
      this.paginationSubscription.unsubscribe();
    }
    // Nettoyer les timeouts
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Déconnecter le chat WebSocket
    if (this.selectedEvent && this.selectedEvent.id) {
      this.eventChatService.leaveEventRoom(this.selectedEvent.id);
    }
    this.eventChatService.disconnect();
  }

  // Méthode pour gérer le redimensionnement
  private onResize(): void {
    // Forcer la détection des changements si nécessaire
    // Note: Cette ligne peut être nécessaire selon votre configuration Angular
    // this.changeDetectorRef.detectChanges();
  }

  loadEvents() {
    this.loading = true;
    this.eventService.getEventsByGroup(this.groupId).subscribe({
      next: (events) => {
        this.events = events;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des événements:', err);
        this.showErrorMessage('Impossible de charger les événements');
        this.loading = false;
      },
    });
  }

  loadGroupMembers() {
    this.loadingGroupMembers = true;
    this.compteGroupeService.getAllMembers(this.groupId).subscribe({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: (members: any[]) => {
        // Extrait les utilisateurs des membres du groupe
        this.groupMembers = members.map((member) => {
          if (member && member.user) {
            return member.user as UserEntity;
          }
          return {} as UserEntity;
        });
        this.loadingGroupMembers = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des membres du groupe:', err);
        this.loadingGroupMembers = false;
      },
    });
  }

  loadEventParticipants(eventId: string) {
    if (!eventId) return;

    this.loadingParticipants = true;
    this.eventService.getParticipants(this.groupId, eventId).subscribe({
      next: (participants) => {
        this.eventParticipants = participants;
        this.loadingParticipants = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des participants:', err);
        this.loadingParticipants = false;
      },
    });
  }

  loadEventOrganizers(event: Event) {
    if (!event || !event.organizers || event.organizers.length === 0) {
      this.eventOrganizers = [];
      return;
    }

    this.loadingOrganizers = true;
    this.eventOrganizers = [];

    // Faire une seule requête pour obtenir tous les utilisateurs
    this.usersService.findAllUsersWithoutRelations().subscribe({
      next: (users) => {
        // Filtrer les utilisateurs qui sont organisateurs de l'événement
        this.eventOrganizers = users.filter((user) =>
          event.organizers.includes(user.id as number)
        );
        this.loadingOrganizers = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des organisateurs:', err);
        this.loadingOrganizers = false;
      },
    });
  }

  /**
   * Gère les changements de filtres depuis le composant EventList
   */
  onFiltersChange(filters: {
    searchQuery: string;
    statusFilter: string;
    dateFilter: string;
  }): void {
    this.searchQuery = filters.searchQuery;
    this.statusFilter = filters.statusFilter;
    this.dateFilter = filters.dateFilter;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.events];

    // Filtrer par statut
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter((event) => event.status === this.statusFilter);
    }

    // Filtrer par recherche (titre ou lieu)
    if (this.searchQuery.trim()) {
      const term = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(term) ||
          (event.location && event.location.toLowerCase().includes(term))
      );
    }

    // Filtrer par date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    switch (this.dateFilter) {
      case 'today':
        filtered = filtered.filter((event) => {
          const eventDate = new Date(event.startDateTime);
          return eventDate >= today && eventDate < tomorrow;
        });
        break;
      case 'tomorrow':
        filtered = filtered.filter((event) => {
          const eventDate = new Date(event.startDateTime);
          const nextDay = new Date(tomorrow);
          nextDay.setDate(tomorrow.getDate() + 1);
          return eventDate >= tomorrow && eventDate < nextDay;
        });
        break;
      case 'week':
        filtered = filtered.filter((event) => {
          const eventDate = new Date(event.startDateTime);
          return eventDate >= today && eventDate < nextWeek;
        });
        break;
      case 'month':
        filtered = filtered.filter((event) => {
          const eventDate = new Date(event.startDateTime);
          return eventDate >= today && eventDate < nextMonth;
        });
        break;
      case 'past':
        filtered = filtered.filter((event) => {
          const eventDate = new Date(event.startDateTime);
          return eventDate < today;
        });
        break;
    }

    // Trier par date (les plus récents d'abord)
    filtered.sort((a, b) => {
      const dateA = new Date(a.startDateTime).getTime();
      const dateB = new Date(b.startDateTime).getTime();
      return dateB - dateA;
    });

    this.filteredEvents = filtered;
  }

  // Méthodes pour ouvrir les popups
  openCreateModal() {
    this.showCreateEventModal = true;
    this.resetForms();
    this.selectedOrganizers = [];
    // Réinitialiser les participants et les participants externes
    this.selectedGroupMembers = [];
    this.externalParticipants = [];
    this.newExternalEmail = '';
    this.newExternalName = '';
  }

  openViewModal(event: Event) {
    this.selectedEvent = event;
    // Dans la nouvelle interface, on affiche l'événement dans la colonne principale
    // mais on ne montre plus le modal de visualisation
    if (event.id) {
      this.loadEventParticipants(event.id);
      this.loadEventOrganizers(event);

      // Charger et se connecter au chat de l'événement
      this.loadEventChat(event.id);

      // Ajouter l'ID de l'événement dans les paramètres de l'URL sans recharger la page
      // this.router.navigate([], {
      //   relativeTo: this.route,
      //   queryParams: { selectedEventId: event.id },
      //   queryParamsHandling: 'merge', // Conserver les autres paramètres d'URL
      //   replaceUrl: true, // Remplacer l'URL actuelle au lieu d'ajouter une entrée dans l'historique
      // });
    }
  }

  /**
   * Charge les messages du chat pour un événement et établit la connexion WebSocket
   */
  loadEventChat(eventId: string): void {
    // Nettoyer l'ancienne connexion si elle existe
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
    if (this.typingUsersSubscription) {
      this.typingUsersSubscription.unsubscribe();
    }
    if (this.paginationSubscription) {
      this.paginationSubscription.unsubscribe();
    }

    this.loadingChatMessages = true;

    // Rejoindre la room WebSocket pour cet événement
    this.eventChatService.joinEventRoom(eventId);

    // S'abonner à l'état de pagination pour les messages
    this.paginationSubscription =
      this.eventChatService.paginationState$.subscribe({
        next: (state) => {
          this.chatPaginationState = state;
          this.chatMessages = state.messages;
          this.loadingChatMessages = state.loading && state.currentPage === 1;
          this.loadingMoreChatMessages = state.loading && state.currentPage > 1;

          // Faire défiler jusqu'au dernier message seulement lors du chargement initial ou de nouveaux messages
          // Ne pas faire défiler lors du chargement de messages précédents (page > 1)
          if (
            !this.loadingMoreChatMessages &&
            !state.loading &&
            state.currentPage === 1
          ) {
            setTimeout(() => {
              this.scrollChatToBottom();
              this.focusChatInput();
            }, 100);
          }
        },
        error: (err) => {
          console.error("Erreur avec l'état de pagination du chat:", err);
          this.loadingChatMessages = false;
          this.loadingMoreChatMessages = false;
          this.showErrorMessage('Impossible de charger les messages du chat');
        },
      });

    // S'abonner au flux de messages (pour la compatibilité avec le code existant)
    this.chatSubscription = this.eventChatService.messages$.subscribe({
      next: (messages) => {
        this.chatMessages = messages;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des messages du chat:', err);
        this.showErrorMessage('Impossible de charger les messages du chat');
        this.loadingChatMessages = false;
      },
    });

    // S'abonner aux indicateurs de frappe
    this.typingUsersSubscription = this.eventChatService.typingUsers$.subscribe(
      {
        next: (users) => {
          this.typingUsers = users;
        },
        error: (err) => {
          console.error('Erreur avec les indicateurs de frappe:', err);
        },
      }
    );
  }

  /**
   * Charge plus de messages anciens
   */
  loadMoreMessages(): void {
    if (
      this.chatPaginationState &&
      this.chatPaginationState.hasMoreMessages &&
      !this.loadingMoreChatMessages
    ) {
      // Enregistrer la position de défilement actuelle
      const chatContainer = document.getElementById('chat-messages');
      const scrollHeight = chatContainer?.scrollHeight || 0;
      const scrollPosition = chatContainer?.scrollTop || 0;

      this.eventChatService.loadMoreMessages();

      // Après le chargement, maintenir la position relative de défilement
      if (chatContainer) {
        const checkNewHeight = () => {
          if (this.loadingMoreChatMessages) {
            // Si toujours en chargement, vérifier à nouveau plus tard
            setTimeout(checkNewHeight, 50);
            return;
          }

          // Calculer la nouvelle position pour garder la même vue relative
          // Les nouveaux messages sont ajoutés en haut, donc la différence de hauteur
          const newScrollHeight = chatContainer.scrollHeight;
          const heightDifference = newScrollHeight - scrollHeight;

          // Régler la position de défilement pour maintenir la même vue
          chatContainer.scrollTop = scrollPosition + heightDifference;
        };

        // Démarrer les vérifications
        setTimeout(checkNewHeight, 50);
      }
    }
  }

  /**
   * Fait défiler la fenêtre de chat jusqu'au dernier message
   */
  private scrollChatToBottom(): void {
    try {
      const chatContainer = document.getElementById('chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    } catch (err) {
      console.error('Erreur lors du défilement du chat:', err);
    }
  }

  /**
   * Met le focus sur le champ de saisie du chat
   */
  private focusChatInput(): void {
    try {
      const chatInput = document.querySelector(
        '#chatInput'
      ) as HTMLInputElement;
      if (chatInput) {
        chatInput.focus();
      }
    } catch (err) {
      console.error('Erreur lors du focus sur le champ de saisie:', err);
    }
  }

  openEditModal(event: Event) {
    this.selectedEvent = event;
    this.selectedOrganizers = [];

    // Charger les organisateurs actuels
    if (event.organizers && event.organizers.length > 0) {
      this.loadingOrganizers = true;
      this.usersService.findAllUsersWithoutRelations().subscribe({
        next: (users) => {
          // Filtrer les utilisateurs qui sont organisateurs de l'événement
          this.selectedOrganizers = users.filter((user) =>
            event.organizers.includes(user.id as number)
          );
          this.loadingOrganizers = false;
          this.populateEditForm(event);
        },
        error: (err) => {
          console.error('Erreur lors du chargement des organisateurs:', err);
          this.loadingOrganizers = false;
          this.populateEditForm(event);
        },
      });
    } else {
      this.populateEditForm(event);
    }

    this.showEditEventModal = true;
  }

  openDuplicateModal(event: Event) {
    this.selectedEvent = event;
    this.populateDuplicateForm(event);
    this.showDuplicateEventModal = true;
  }

  openInviteParticipantsModal() {
    this.showInviteParticipantsModal = true;
    this.selectedGroupMembers = [];
    this.externalParticipants = [];
    this.newExternalEmail = '';
    this.newExternalName = '';

    // S'assurer que nous avons bien chargé les participants de l'événement
    if (
      this.selectedEvent &&
      this.selectedEvent.id &&
      (!this.eventParticipants || this.eventParticipants.length === 0)
    ) {
      this.loadEventParticipants(this.selectedEvent.id);
    }
  }

  // Méthode générique pour fermer une modale spécifique
  closeModal(modalType: string) {
    switch (modalType) {
      case 'create':
        this.showCreateEventModal = false;
        this.resetForms();
        this.selectedOrganizers = [];
        break;
      case 'edit':
        this.showEditEventModal = false;
        this.resetForms();
        this.selectedOrganizers = [];
        break;
      case 'duplicate':
        this.showDuplicateEventModal = false;
        this.resetForms();
        break;
      case 'invite':
        this.showInviteParticipantsModal = false;
        this.selectedGroupMembers = [];
        this.externalParticipants = [];
        break;
      case 'cancel':
        this.showCancellationDialog = false;
        this.cancellationReason = '';
        break;
      case 'delete':
        this.showDeleteConfirmationDialog = false;
        break;
      case 'cancelInvitation':
        this.showCancelInvitationDialog = false;
        this.selectedParticipant = null;
        break;
      case 'reminders':
        this.closeSendRemindersModal();
        break;
      case 'memo':
        this.closeSendMemoModal();
        break;
    }
  }

  // Méthodes pour fermer les popups
  closeAllModals() {
    this.showCreateEventModal = false;
    this.showViewEventModal = false;
    this.showEditEventModal = false;
    this.showDuplicateEventModal = false;
    this.showInviteParticipantsModal = false;
    this.showCancellationDialog = false;
    this.showDeleteConfirmationDialog = false;
    this.resetForms();
    this.selectedOrganizers = [];

    // Si un événement était sélectionné, supprimer le paramètre de l'URL
    if (this.selectedEvent) {
      this.selectedEvent = null;
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { selectedEventId: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  closeInviteModal() {
    this.closeModal('invite');
  }

  closeCancellationDialog() {
    this.closeModal('cancel');
  }

  closeDeleteConfirmationDialog() {
    this.closeModal('delete');
  }

  // Méthodes pour les formulaires
  resetForms() {
    this.createEventForm.reset({
      status: EventStatus.PENDING,
      organizers: [],
    });
    this.editEventForm.reset();
    this.duplicateEventForm.reset();
    this.selectedOrganizers = [];
  }

  populateEditForm(event: Event) {
    // Formatter les dates pour l'input datetime-local
    const formatDateForInput = (dateStr: string | Date | undefined) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toISOString().slice(0, 16); // Format YYYY-MM-DDTHH:MM
    };

    this.editEventForm.patchValue({
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      startDateTime: formatDateForInput(event.startDateTime),
      endDateTime: formatDateForInput(event.endDateTime),
      meetupDateTime: formatDateForInput(event.meetupDateTime),
      status: event.status,
      organizers: this.selectedOrganizers.map((org) => org.id) || [],
    });
  }

  populateDuplicateForm(event: Event) {
    // Ajouter une semaine aux dates
    const addWeek = (dateStr: string | Date | undefined) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      date.setDate(date.getDate() + 7);
      return date.toISOString().slice(0, 16); // Format YYYY-MM-DDTHH:MM
    };

    this.duplicateEventForm.patchValue({
      startDateTime: addWeek(event.startDateTime),
      endDateTime: addWeek(event.endDateTime),
      meetupDateTime: addWeek(event.meetupDateTime),
    });
  }

  // Gestion des participants
  getInitials(person: {
    firstName?: string;
    name?: string;
    email?: string;
  }): string {
    if (person.firstName && person.name) {
      return `${person.firstName[0]}${person.name[0]}`.toUpperCase();
    } else if (person.name) {
      return person.name.substring(0, 2).toUpperCase();
    } else if (person.email) {
      return person.email.substring(0, 2).toUpperCase();
    }
    return '??';
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

  // Gestion des invitations
  toggleMemberSelection(member: UserEntity) {
    const index = this.selectedGroupMembers.findIndex(
      (m) => m.id === member.id
    );
    if (index > -1) {
      this.selectedGroupMembers.splice(index, 1);
    } else {
      this.selectedGroupMembers.push(member);
    }
  }

  isUserSelected(userId: number | string): boolean {
    return this.selectedGroupMembers.some((member) => member.id === userId);
  }

  addExternalParticipant() {
    if (!this.newExternalEmail) return;

    // Vérifier si l'email est déjà dans la liste des participants
    if (this.isEmailAlreadyInvited(this.newExternalEmail)) {
      this.showErrorMessage(
        "Cette adresse e-mail est déjà invitée à l'événement"
      );
      return;
    }

    // Vérifier si l'email est déjà dans la liste des participants externes temporaires
    if (
      this.externalParticipants.some(
        (p) => p.email.toLowerCase() === this.newExternalEmail.toLowerCase()
      )
    ) {
      this.showErrorMessage(
        "Cette adresse e-mail est déjà dans votre liste d'invitations"
      );
      return;
    }

    this.externalParticipants.push({
      email: this.newExternalEmail,
      name: this.newExternalName || undefined,
    });

    this.newExternalEmail = '';
    this.newExternalName = '';
    this.error = null; // Effacer les erreurs précédentes
  }

  removeExternalParticipant(index: number) {
    this.externalParticipants.splice(index, 1);
  }

  submitInvitations() {
    if (!this.selectedEvent || !this.selectedEvent.id) return;

    // Filtrer les membres du groupe qui ne sont pas déjà invités
    const filteredMembers = this.selectedGroupMembers.filter(
      (member) => !this.isAlreadyInvited(member.id)
    );

    // Filtrer les emails externes qui ne sont pas déjà invités
    const filteredExternals = this.externalParticipants.filter(
      (person) => !this.isEmailAlreadyInvited(person.email)
    );

    // Si tous les participants sont déjà invités, afficher un message et fermer la modale
    if (filteredMembers.length === 0 && filteredExternals.length === 0) {
      if (
        this.selectedGroupMembers.length > 0 ||
        this.externalParticipants.length > 0
      ) {
        this.showErrorMessage(
          'Tous les participants sélectionnés sont déjà invités'
        );
        return;
      } else {
        this.showErrorMessage('Veuillez sélectionner au moins un participant');
        return;
      }
    }

    this.loading = true;

    // Collecter les invitations existantes en excluant celles que nous allons mettre à jour
    const existingInvitations = this.eventParticipants || [];

    const newInvitations: InvitedPerson[] = [
      // Membres du groupe
      ...filteredMembers.map((member) => ({
        personId: member.id,
        status: InvitationStatus.PENDING,
        isExternal: false,
        email: member.email,
        name: member.name,
      })),

      // Participants externes
      ...filteredExternals.map((person) => ({
        personId: person.email,
        status: InvitationStatus.PENDING,
        isExternal: true,
        email: person.email,
        name: person.name,
      })),
    ];

    // Combiner les nouvelles invitations avec les invitations existantes
    const allInvitations = [...existingInvitations, ...newInvitations];

    const updatedEvent: UpdateEventRequest = {
      invitedPeople: allInvitations,
    };

    this.eventService
      .updateEvent(this.groupId, this.selectedEvent.id, updatedEvent)
      .subscribe({
        next: (event) => {
          // Mettre à jour l'événement dans la liste
          const index = this.events.findIndex(
            (e) => e.id === this.selectedEvent?.id
          );
          if (index !== -1) {
            this.events[index] = event;
          }

          // Recharger les participants
          if (this.selectedEvent && this.selectedEvent.id) {
            this.loadEventParticipants(this.selectedEvent.id);
          }

          this.closeInviteModal();
          this.loading = false;
          this.showSuccessMessage(
            `${newInvitations.length} invitation(s) envoyée(s) avec succès`
          );
        },
        error: (err) => {
          console.error("Erreur lors de l'envoi des invitations:", err);
          this.showErrorMessage("Impossible d'envoyer les invitations");
          this.loading = false;
        },
      });
  }

  removeParticipant(participant: InvitedPerson) {
    if (!this.selectedEvent || !this.selectedEvent.id) return;

    // Méthode simplifiée - dans une implémentation réelle, vous auriez besoin d'un endpoint API spécifique
    const updatedParticipants = this.eventParticipants.filter(
      (p) => p.personId !== participant.personId
    );

    const updatedEvent: UpdateEventRequest = {
      invitedPeople: updatedParticipants,
    };

    this.loading = true;
    this.eventService
      .updateEvent(this.groupId, this.selectedEvent.id, updatedEvent)
      .subscribe({
        next: (event) => {
          // Mettre à jour l'événement dans la liste
          const index = this.events.findIndex(
            (e) => e.id === this.selectedEvent?.id
          );
          if (index !== -1) {
            this.events[index] = event;
          }

          // Mettre à jour la liste des participants
          this.eventParticipants = updatedParticipants;

          this.loading = false;
          this.showSuccessMessage('Participant retiré avec succès');
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du participant:', err);
          this.showErrorMessage('Impossible de supprimer le participant');
          this.loading = false;
        },
      });
  }

  /**
   * Annule l'invitation d'un participant en attente
   * @param participant Le participant dont l'invitation doit être annulée
   */
  cancelInvitation(participant: InvitedPerson) {
    if (!this.selectedEvent || !this.selectedEvent.id) return;

    // Vérifier que le participant est bien en attente
    if (participant.status !== InvitationStatus.PENDING) {
      this.showErrorMessage(
        'Seules les invitations en attente peuvent être annulées'
      );
      return;
    }

    // Stocker le participant sélectionné et ouvrir le dialogue de confirmation
    this.selectedParticipant = participant;
    this.showCancelInvitationDialog = true;
  }

  /**
   * Confirme l'annulation de l'invitation après confirmation par l'utilisateur
   */
  confirmCancelInvitation() {
    if (
      !this.selectedEvent ||
      !this.selectedEvent.id ||
      !this.selectedParticipant
    )
      return;

    // Utiliser la même logique que removeParticipant mais avec un message différent
    const updatedParticipants = this.eventParticipants.filter(
      (p) => p.personId !== this.selectedParticipant?.personId
    );

    const updatedEvent: UpdateEventRequest = {
      invitedPeople: updatedParticipants,
    };

    this.loading = true;
    this.eventService
      .updateEvent(this.groupId, this.selectedEvent.id, updatedEvent)
      .subscribe({
        next: (updatedEvent) => {
          // Mettre à jour l'événement dans la liste
          const index = this.events.findIndex(
            (e) => e.id === this.selectedEvent?.id
          );
          if (index !== -1) {
            this.events[index] = updatedEvent;
          }

          // Mettre à jour la liste des participants
          this.eventParticipants = updatedParticipants;

          // Fermer le dialogue de confirmation
          this.closeModal('cancelInvitation');

          this.loading = false;
          this.showSuccessMessage('Invitation annulée avec succès');
        },
        error: (err) => {
          console.error("Erreur lors de l'annulation de l'invitation:", err);
          this.showErrorMessage("Impossible d'annuler l'invitation");
          this.loading = false;

          // Fermer quand même le dialogue en cas d'erreur
          this.closeModal('cancelInvitation');
        },
      });
  }

  // Mise à jour du statut d'un événement
  updateEventStatus(event: Event, status: EventStatus) {
    if (!event.id) return;

    // Si le statut est CANCELLED, demander une raison d'annulation
    if (status === EventStatus.CANCELLED) {
      this.selectedEvent = event;
      this.showCancellationDialog = true;
      return;
    }

    this.loading = true;

    const updatedEvent: UpdateEventRequest = {
      status: status,
    };

    this.eventService
      .updateEvent(this.groupId, event.id, updatedEvent)
      .subscribe({
        next: (updatedEvent) => {
          // Mettre à jour l'événement dans la liste
          const index = this.events.findIndex((e) => e.id === event.id);
          if (index !== -1) {
            this.events[index] = updatedEvent;

            // Appliquer les filtres pour mettre à jour l'affichage
            this.applyFilters();
          }

          // Mettre à jour l'événement sélectionné
          if (this.selectedEvent && this.selectedEvent.id === event.id) {
            this.selectedEvent = updatedEvent;
          }

          // Si la vue détaillée est ouverte, on la ferme
          this.showViewEventModal = false;
          this.showCancellationDialog = false;
          this.cancellationReason = '';
          this.loading = false;
          this.showSuccessMessage(
            `Statut de l'événement mis à jour: ${this.getStatusLabel(status)}`
          );
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour du statut:', err);
          this.showErrorMessage('Impossible de mettre à jour le statut');
          this.loading = false;
        },
      });
  }

  // Confirmer l'annulation avec une raison
  confirmCancellation() {
    if (!this.selectedEvent || !this.selectedEvent.id) return;

    if (!this.cancellationReason.trim()) {
      this.showErrorMessage("Une raison d'annulation est requise");
      return;
    }

    this.loading = true;

    const updatedEvent: UpdateEventRequest = {
      status: EventStatus.CANCELLED,
      cancellationReason: this.cancellationReason,
    };

    this.eventService
      .updateEvent(this.groupId, this.selectedEvent.id, updatedEvent)
      .subscribe({
        next: (updatedEvent) => {
          // Mettre à jour l'événement dans la liste
          const index = this.events.findIndex(
            (e) => e.id === this.selectedEvent?.id
          );
          if (index !== -1) {
            this.events[index] = updatedEvent;
          }

          // Mettre à jour l'événement sélectionné
          this.selectedEvent = updatedEvent;

          // Si la vue détaillée est ouverte, on la ferme
          this.showViewEventModal = false;
          this.showCancellationDialog = false;
          this.cancellationReason = '';
          this.loading = false;
          this.showSuccessMessage(`Événement annulé avec succès`);
        },
        error: (err) => {
          console.error("Erreur lors de l'annulation de l'événement:", err);
          this.showErrorMessage("Impossible d'annuler l'événement");
          this.loading = false;
        },
      });
  }

  // Actions sur les événements
  submitCreateEvent() {
    if (this.createEventForm.valid) {
      this.loading = true;
      const formValue = this.createEventForm.value;

      // S'assurer que les organisateurs sont correctement définis
      if (this.selectedOrganizers.length > 0) {
        formValue.organizers = this.selectedOrganizers.map((org) => org.id);
      }

      const newEvent: CreateEventRequest = formValue;

      // Préparer les invitations pour les participants sélectionnés (membres du groupe)
      const invitedPeople: InvitedPerson[] = [
        // Membres du groupe sélectionnés
        ...this.selectedGroupMembers.map((member) => ({
          personId: member.id,
          status: InvitationStatus.PENDING,
          isExternal: false,
          email: member.email,
          name: `${member.firstName} ${member.name}`,
        })),

        // Participants externes
        ...this.externalParticipants.map((person) => ({
          personId: person.email,
          status: InvitationStatus.PENDING,
          isExternal: true,
          email: person.email,
          name: person.name,
        })),
      ];

      // Ajouter les invitations à l'événement
      newEvent.invitedPeople = invitedPeople;

      this.eventService.createEvent(this.groupId, newEvent).subscribe({
        next: (createdEvent) => {
          this.events = [...this.events, createdEvent];
          this.selectedEvent = createdEvent;
          this.applyFilters();
          this.closeModal('create');
          this.loading = false;
          this.showSuccessMessage('Événement créé avec succès');
        },
        error: (err) => {
          console.error("Erreur lors de la création de l'événement:", err);
          this.showErrorMessage("Impossible de créer l'événement");
          this.loading = false;
        },
      });
    }
  }

  submitEditEvent() {
    if (this.editEventForm.valid && this.selectedEvent?.id) {
      this.loading = true;
      const formValue = this.editEventForm.value;

      // S'assurer que les organisateurs sont correctement définis
      if (this.selectedOrganizers.length > 0) {
        formValue.organizers = this.selectedOrganizers.map((org) => org.id);
      }

      const updatedEvent: UpdateEventRequest = formValue;

      this.eventService
        .updateEvent(this.groupId, this.selectedEvent.id, updatedEvent)
        .subscribe({
          next: (event) => {
            // Mettre à jour l'événement dans la liste et maintenir la sélection
            const index = this.events.findIndex(
              (e) => e.id === this.selectedEvent?.id
            );
            if (index !== -1) {
              this.events = [
                ...this.events.slice(0, index),
                event,
                ...this.events.slice(index + 1),
              ];
              this.selectedEvent = event;
            }

            // Si l'événement est déjà dans Google Calendar, le mettre à jour
            this.updateGoogleCalendarEventIfExists(event);

            this.applyFilters();
            this.closeEditModal();
            this.loading = false;

            // Créer un message détaillé des modifications
            const changes: string[] = [];
            if (event.title !== this.selectedEvent?.title)
              changes.push('le titre');
            if (event.description !== this.selectedEvent?.description)
              changes.push('la description');
            if (event.location !== this.selectedEvent?.location)
              changes.push('le lieu');
            if (event.startDateTime !== this.selectedEvent?.startDateTime)
              changes.push('la date de début');
            if (event.endDateTime !== this.selectedEvent?.endDateTime)
              changes.push('la date de fin');
            if (event.meetupDateTime !== this.selectedEvent?.meetupDateTime)
              changes.push('la date de rendez-vous');
            if (event.status !== this.selectedEvent?.status)
              changes.push('le statut');
            if (
              JSON.stringify(event.organizers) !==
              JSON.stringify(this.selectedEvent?.organizers)
            )
              changes.push('les organisateurs');

            const changeMessage =
              changes.length > 0
                ? `Modifications apportées : ${changes.join(', ')}`
                : 'Événement mis à jour avec succès';

            this.showSuccessMessage(changeMessage);
          },
          error: (err) => {
            console.error(
              "Erreur lors de la modification de l'événement:",
              err
            );
            this.showErrorMessage("Impossible de modifier l'événement");
            this.loading = false;
          },
        });
    }
  }

  closeEditModal() {
    this.showEditEventModal = false;
    // Ne pas réinitialiser selectedEvent ici
    this.editEventForm.reset();
    this.selectedOrganizers = [];
  }

  submitDuplicateEvent() {
    if (this.duplicateEventForm.valid && this.selectedEvent?.id) {
      this.loading = true;
      const duplicateData = this.duplicateEventForm.value;

      this.eventService
        .duplicateEvent(this.groupId, this.selectedEvent.id, duplicateData)
        .subscribe({
          next: (newEvent) => {
            this.events.push(newEvent);
            this.applyFilters();
            this.closeAllModals();
            this.loading = false;
            this.showSuccessMessage('Événement dupliqué avec succès');
          },
          error: (err) => {
            console.error("Erreur lors de la duplication de l'événement:", err);
            this.showErrorMessage("Impossible de dupliquer l'événement");
            this.loading = false;
          },
        });
    }
  }

  sendReminders(eventId: string | undefined): void {
    if (!eventId) return;

    // Ouvrir la modal de programmation des rappels
    this.openSendRemindersModal();
  }

  /**
   * Ouvre la modal de programmation des rappels
   */
  openSendRemindersModal(): void {
    this.showSendRemindersModal = true;
    this.reminderTiming = 'now';
    this.customReminderDate = '';
    this.customReminderMessage = '';
  }

  /**
   * Ferme la modal de programmation des rappels
   */
  closeSendRemindersModal(): void {
    this.showSendRemindersModal = false;
    this.reminderTiming = 'now';
    this.customReminderDate = '';
    this.customReminderMessage = '';
  }

  /**
   * Récupère la liste des participants qui ont confirmé leur présence
   */
  getConfirmedParticipants(): InvitedPerson[] {
    if (!this.eventParticipants || this.eventParticipants.length === 0) {
      return [];
    }

    return this.eventParticipants.filter(
      (participant) => participant.status === InvitationStatus.ACCEPTED
    );
  }

  /**
   * Récupère la liste des participants qui n'ont pas encore répondu
   */
  getPendingParticipants(): InvitedPerson[] {
    if (!this.eventParticipants || this.eventParticipants.length === 0) {
      return [];
    }

    return this.eventParticipants.filter(
      (participant) => participant.status === InvitationStatus.PENDING
    );
  }

  /**
   * Récupère tous les participants (peu importe leur statut)
   */
  getAllParticipants(): InvitedPerson[] {
    if (!this.eventParticipants || this.eventParticipants.length === 0) {
      return [];
    }

    return this.eventParticipants;
  }

  /**
   * Soumet la demande d'envoi de rappels
   */
  submitSendReminders(): void {
    if (!this.selectedEvent?.id) return;

    const pendingParticipants = this.getPendingParticipants();
    if (pendingParticipants.length === 0) {
      this.showErrorMessage(
        'Aucun participant en attente de réponse pour cet événement'
      );
      return;
    }

    // Calculer la date d'envoi selon le timing sélectionné
    let scheduledDate: Date | null = null;
    const eventStartDate = new Date(this.selectedEvent.startDateTime);

    switch (this.reminderTiming) {
      case 'now':
        scheduledDate = new Date();
        break;
      case '1hour':
        scheduledDate = new Date(eventStartDate.getTime() - 60 * 60 * 1000);
        break;
      case '1day':
        scheduledDate = new Date(
          eventStartDate.getTime() - 24 * 60 * 60 * 1000
        );
        break;
      case 'custom':
        if (!this.customReminderDate) {
          this.showErrorMessage('Veuillez sélectionner une date personnalisée');
          return;
        }
        scheduledDate = new Date(this.customReminderDate);
        break;
    }

    if (!scheduledDate) {
      this.showErrorMessage('Erreur dans la configuration de la date');
      return;
    }

    // Vérifier que la date programmée n'est pas dans le passé (sauf pour "maintenant")
    if (this.reminderTiming !== 'now' && scheduledDate < new Date()) {
      this.showErrorMessage('La date de rappel ne peut pas être dans le passé');
      return;
    }

    this.loading = true;

    const reminderRequest = {
      eventId: this.selectedEvent.id,
      recipientIds: pendingParticipants.map((p: InvitedPerson) => p.personId),
      scheduledDate: scheduledDate.toISOString(),
      customMessage: this.customReminderMessage || undefined,
      timing: this.reminderTiming,
    };

    this.eventService
      .sendReminders(this.groupId, this.selectedEvent.id, reminderRequest)
      .subscribe({
        next: () => {
          this.loading = false;
          this.closeSendRemindersModal();

          const timingText = this.getReminderTimingText();
          this.showSuccessMessage(
            `Rappels ${
              this.reminderTiming === 'now' ? 'envoyés' : 'programmés'
            } avec succès ${timingText}`
          );
        },
        error: (error) => {
          this.loading = false;
          this.showErrorMessage(
            `Erreur lors de ${
              this.reminderTiming === 'now' ? "l'envoi" : 'la programmation'
            } des rappels: ${error.message || 'Veuillez réessayer plus tard'}`
          );
        },
      });
  }

  /**
   * Retourne le texte descriptif du timing sélectionné
   */
  private getReminderTimingText(): string {
    switch (this.reminderTiming) {
      case 'now':
        return '';
      case '1hour':
        return "(1 heure avant l'événement)";
      case '1day':
        return "(1 jour avant l'événement)";
      case 'custom':
        return `(le ${this.formatDate(this.customReminderDate)})`;
      default:
        return '';
    }
  }

  /**
   * Méthodes pour la gestion des mémos
   */
  sendMemo(eventId: string | undefined): void {
    if (!eventId) return;
    this.openSendMemoModal();
  }

  /**
   * Ouvre la modal de programmation des mémos
   */
  openSendMemoModal(): void {
    this.showSendMemoModal = true;
    this.memoTiming = 'now';
    this.customMemoDate = '';
    this.customMemoMessage = '';
  }

  /**
   * Ferme la modal de programmation des mémos
   */
  closeSendMemoModal(): void {
    this.showSendMemoModal = false;
    this.memoTiming = 'now';
    this.customMemoDate = '';
    this.customMemoMessage = '';
  }

  /**
   * Soumet la demande d'envoi de mémos
   */
  submitSendMemo(): void {
    if (!this.selectedEvent?.id) return;

    const confirmedParticipants = this.getConfirmedParticipants();
    if (confirmedParticipants.length === 0) {
      this.showErrorMessage('Aucun participant confirmé pour cet événement');
      return;
    }

    // Calculer la date d'envoi selon le timing sélectionné
    let scheduledDate: Date | null = null;
    const eventStartDate = new Date(this.selectedEvent.startDateTime);

    switch (this.memoTiming) {
      case 'now':
        scheduledDate = new Date();
        break;
      case '1hour':
        scheduledDate = new Date(eventStartDate.getTime() - 60 * 60 * 1000);
        break;
      case '1day':
        scheduledDate = new Date(
          eventStartDate.getTime() - 24 * 60 * 60 * 1000
        );
        break;
      case 'custom':
        if (!this.customMemoDate) {
          this.showErrorMessage('Veuillez sélectionner une date personnalisée');
          return;
        }
        scheduledDate = new Date(this.customMemoDate);
        break;
    }

    if (!scheduledDate) {
      this.showErrorMessage('Erreur dans la configuration de la date');
      return;
    }

    // Vérifier que la date programmée n'est pas dans le passé (sauf pour "maintenant")
    if (this.memoTiming !== 'now' && scheduledDate < new Date()) {
      this.showErrorMessage('La date de mémo ne peut pas être dans le passé');
      return;
    }

    this.loading = true;

    const memoRequest = {
      eventId: this.selectedEvent.id,
      recipientIds: confirmedParticipants.map((p: InvitedPerson) => p.personId),
      scheduledDate: scheduledDate.toISOString(),
      customMessage: this.customMemoMessage || undefined,
      timing: this.memoTiming,
    };

    this.eventService
      .sendMemo(this.groupId, this.selectedEvent.id, memoRequest)
      .subscribe({
        next: () => {
          this.loading = false;
          this.closeSendMemoModal();

          const timingText = this.getMemoTimingText();
          this.showSuccessMessage(
            `Mémo ${
              this.memoTiming === 'now' ? 'envoyé' : 'programmé'
            } avec succès ${timingText}`
          );
        },
        error: (error) => {
          this.loading = false;
          this.showErrorMessage(
            `Erreur lors de ${
              this.memoTiming === 'now' ? "l'envoi" : 'la programmation'
            } du mémo: ${error.message || 'Veuillez réessayer plus tard'}`
          );
        },
      });
  }

  /**
   * Retourne le texte descriptif du timing sélectionné pour les mémos
   */
  private getMemoTimingText(): string {
    switch (this.memoTiming) {
      case 'now':
        return '';
      case '1hour':
        return "(1 heure avant l'événement)";
      case '1day':
        return "(1 jour avant l'événement)";
      case 'custom':
        return `(le ${this.formatDate(this.customMemoDate)})`;
      default:
        return '';
    }
  }

  showSuccessMessage(message: string) {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  /**
   * Affiche un message d'erreur qui disparaît automatiquement après 5 secondes
   * @param message Le message d'erreur à afficher
   */
  showErrorMessage(message: string) {
    this.error = message;
    setTimeout(() => {
      this.error = null;
    }, 5000);
  }

  /**
   * Ferme manuellement le message d'erreur
   */
  closeErrorMessage() {
    this.error = null;
  }

  getStatusClass(status: EventStatus): string {
    switch (status) {
      case EventStatus.CONFIRMED:
        return 'status-confirmed';
      case EventStatus.CANCELLED:
        return 'status-cancelled';
      case EventStatus.PENDING:
      default:
        return 'status-pending';
    }
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

  // Format date pour l'affichage
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Suppression d'un événement
  deleteEvent() {
    if (!this.selectedEvent || !this.selectedEvent.id) return;

    this.showDeleteConfirmationDialog = true;
  }

  // Confirmer la suppression d'un événement
  confirmDeleteEvent() {
    if (!this.selectedEvent || !this.selectedEvent.id) return;

    this.loading = true;

    this.eventService
      .deleteEvent(this.groupId, this.selectedEvent.id)
      .subscribe({
        next: () => {
          // Supprimer l'événement de la liste
          this.events = this.events.filter(
            (e) => e.id !== this.selectedEvent?.id
          );

          // Appliquer les filtres pour mettre à jour l'affichage
          this.applyFilters();

          // Supprimer le paramètre d'URL
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { selectedEventId: null },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });

          // Fermer les modales
          this.closeAllModals();
          this.showDeleteConfirmationDialog = false;

          this.loading = false;
          this.showSuccessMessage('Événement supprimé avec succès');
        },
        error: (err) => {
          console.error("Erreur lors de la suppression de l'événement:", err);
          this.showErrorMessage("Impossible de supprimer l'événement");
          this.loading = false;
        },
      });
  }

  // Méthodes pour la gestion des organisateurs
  toggleOrganizerSelection(member: UserEntity) {
    const index = this.selectedOrganizers.findIndex((m) => m.id === member.id);
    if (index > -1) {
      this.selectedOrganizers.splice(index, 1);
    } else {
      this.selectedOrganizers.push(member);
    }

    // Mettre à jour la valeur du formulaire
    this.createEventForm.patchValue({
      organizers: this.selectedOrganizers.map((org) => org.id),
    });
  }

  isOrganizerSelected(userId: number | string): boolean {
    return this.selectedOrganizers.some((member) => member.id === userId);
  }

  /**
   * Vérifie si un membre est déjà invité à l'événement
   * @param memberId L'identifiant du membre à vérifier
   * @returns true si le membre est déjà invité, false sinon
   */
  isAlreadyInvited(memberId: number | string): boolean {
    // Si on est dans le contexte de création d'un nouvel événement, personne n'est considéré comme déjà invité
    if (this.showCreateEventModal) {
      return false;
    }

    if (!this.eventParticipants || this.eventParticipants.length === 0) {
      return false;
    }

    return this.eventParticipants.some(
      (p) =>
        p.personId === memberId ||
        (p.email &&
          this.groupMembers.find((m) => m.id === memberId)?.email === p.email)
    );
  }

  /**
   * Vérifie si un email externe est déjà invité
   * @param email L'email à vérifier
   * @returns true si l'email est déjà invité, false sinon
   */
  isEmailAlreadyInvited(email: string): boolean {
    // Si on est dans le contexte de création d'un nouvel événement, aucun email n'est considéré comme déjà invité
    if (this.showCreateEventModal) {
      return false;
    }

    if (
      !this.eventParticipants ||
      this.eventParticipants.length === 0 ||
      !email
    ) {
      return false;
    }

    return this.eventParticipants.some(
      (p) =>
        p.email?.toLowerCase() === email.toLowerCase() ||
        p.personId?.toString().toLowerCase() === email.toLowerCase()
    );
  }

  /**
   * Ferme la vue détaillée d'un événement et met à jour l'URL
   */
  closeSelectedEvent() {
    // Si l'événement est sélectionné, quitter la room du chat
    if (this.selectedEvent && this.selectedEvent.id) {
      this.eventChatService.leaveEventRoom(this.selectedEvent.id);
    }

    this.selectedEvent = null;

    // Supprimer le paramètre de l'URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { selectedEventId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /**
   * Vérifie si l'utilisateur connecté est organisateur de l'événement
   * @param event L'événement à vérifier (par défaut, utilise l'événement sélectionné)
   * @returns true si l'utilisateur est organisateur, false sinon
   */
  isCurrentUserOrganizer(event?: Event): boolean {
    const eventToCheck = event || this.selectedEvent;

    if (
      !eventToCheck ||
      !eventToCheck.organizers ||
      eventToCheck.organizers.length === 0
    ) {
      return false;
    }

    const currentUser = this.authService.getUser();
    if (!currentUser || !currentUser.id) {
      return false;
    }

    return eventToCheck.organizers.includes(currentUser.id as number);
  }

  /**
   * Vérifie si l'utilisateur connecté est invité à l'événement
   * @returns true si l'utilisateur est invité, false sinon
   */
  isCurrentUserInvited(): boolean {
    if (
      !this.selectedEvent ||
      !this.selectedEvent.invitedPeople ||
      this.selectedEvent.invitedPeople.length === 0
    ) {
      return false;
    }

    const currentUser = this.authService.getUser();
    if (!currentUser || !currentUser.id) {
      return false;
    }

    return this.selectedEvent.invitedPeople.some(
      (person) =>
        person.personId === currentUser.id ||
        person.personId === currentUser.id.toString() ||
        person.email === currentUser.email
    );
  }

  /**
   * Récupère le statut d'invitation de l'utilisateur connecté
   * @returns le statut d'invitation ou null si l'utilisateur n'est pas invité
   */
  getCurrentUserInvitationStatus(): InvitationStatus | null {
    if (
      !this.selectedEvent ||
      !this.selectedEvent.invitedPeople ||
      this.selectedEvent.invitedPeople.length === 0
    ) {
      return null;
    }

    const currentUser = this.authService.getUser();
    if (!currentUser || !currentUser.id) {
      return null;
    }

    const invitation = this.selectedEvent.invitedPeople.find(
      (person) =>
        person.personId === currentUser.id ||
        person.personId === currentUser.id.toString() ||
        person.email === currentUser.email
    );

    return invitation ? invitation.status : null;
  }

  /**
   * Répond à une invitation à un événement
   * @param event L'événement auquel répondre
   * @param status Le statut de la réponse (ACCEPTED ou DECLINED)
   */
  respondToInvitation(event: Event, status: InvitationStatus): void {
    if (!event.id) return;

    const currentUser = this.authService.getUser();
    if (!currentUser || !currentUser.id) return;

    this.loading = true;
    const userId = currentUser.id.toString(); // Conversion en chaîne de caractères

    // Utiliser le service d'événement pour envoyer la réponse
    this.eventService.respondToInvitation(event.id, userId, status).subscribe({
      next: (updatedEvent) => {
        // Mettre à jour l'événement dans la liste
        const index = this.events.findIndex((e) => e.id === event.id);
        if (index !== -1) {
          this.events[index] = updatedEvent;
        }

        // Mettre à jour l'événement sélectionné
        if (this.selectedEvent && this.selectedEvent.id === event.id) {
          this.selectedEvent = updatedEvent;
        }

        // Recharger les participants
        if (event.id) {
          this.loadEventParticipants(event.id);
        }

        this.loading = false;
        this.showSuccessMessage(
          status === InvitationStatus.ACCEPTED
            ? "Vous avez accepté l'invitation"
            : "Vous avez refusé l'invitation"
        );
      },
      error: (err) => {
        console.error("Erreur lors de la réponse à l'invitation:", err);
        this.showErrorMessage("Impossible de répondre à l'invitation");
        this.loading = false;
      },
    });
  }

  /**
   * Vérifie si l'utilisateur actuel a des droits d'administrateur sur l'agenda du groupe
   * @returns true si l'utilisateur a des droits d'administrateur, false sinon
   */
  hasAdminRightsForAgenda(): boolean {
    const currentUser = this.authService.getUser();
    if (!currentUser || !currentUser.id || !currentUser.userSecondaryAccounts) {
      return false;
    }

    if (currentUser.role === 'ADMIN') {
      return true;
    }

    // Filtrer les comptes secondaires pour trouver celui associé au groupe actuel
    const secondaryAccountForCurrentGroup =
      currentUser.userSecondaryAccounts.find(
        (account) =>
          account.group_account && account.group_account.id === this.groupId
      );

    // Vérifier si l'utilisateur a le rôle ADMIN pour l'agenda dans ce groupe
    return secondaryAccountForCurrentGroup?.role_agenda === 'ADMIN';
  }

  /**
   * Vérifie si l'utilisateur actuel a des droits de gestion pour un événement spécifique
   * (soit il est administrateur de l'agenda, soit il est organisateur de cet événement)
   * @param event L'événement à vérifier
   * @returns true si l'utilisateur a des droits de gestion, false sinon
   */
  hasManagementRightsForEvent(event?: Event): boolean {
    // Si l'utilisateur est admin de l'agenda, il a toujours des droits de gestion
    if (this.hasAdminRightsForAgenda()) {
      return true;
    }

    // Si l'utilisateur est organisateur de cet événement spécifique, il a des droits de gestion
    return this.isCurrentUserOrganizer(event);
  }

  /**
   * Vérifie si l'utilisateur actuel est organisateur d'au moins un événement dans la liste
   * @returns true si l'utilisateur est organisateur d'au moins un événement, false sinon
   */
  isOrganizerOfAnyEvent(): boolean {
    const currentUser = this.authService.getUser();
    if (!currentUser || !currentUser.id) {
      return false;
    }

    // Vérifier pour chaque événement si l'utilisateur est organisateur
    return this.events.some(
      (event) => event.organizers && event.organizers.includes(currentUser.id)
    );
  }

  /**
   * Vérifie si le compte utilisateur est lié à Google Calendar
   */
  checkGoogleLinkStatus(): void {
    this.googleCalendarService.checkGoogleLinkStatus().subscribe({
      next: (response) => {
        this.googleLinked = response.linked;
      },
      error: (err) => {
        console.error('Erreur lors de la vérification du statut Google:', err);
        this.googleLinked = false;
      },
    });
  }

  /**
   * Ouvre la fenêtre d'autorisation Google dans un nouvel onglet
   */
  linkGoogleAccount(): void {
    this.googleCalendarService.getGoogleAuthUrl().subscribe({
      next: (response) => {
        window.open(response.url, '_blank');
      },
      error: (err) => {
        console.error(
          "Erreur lors de la récupération de l'URL d'autorisation Google:",
          err
        );
        this.showErrorMessage('Impossible de se connecter à Google Calendar');
      },
    });
  }

  /**
   * Charge la liste des calendriers Google
   */
  loadGoogleCalendars(): void {
    this.loadingGoogleCalendars = true;
    this.googleCalendarService.getCalendars().subscribe({
      next: (response) => {
        this.googleCalendars = response.items;
        this.filteredGoogleCalendars = [...this.googleCalendars];
        this.loadingGoogleCalendars = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des calendriers Google:', err);
        this.showErrorMessage('Impossible de charger les calendriers Google');
        this.loadingGoogleCalendars = false;
      },
    });
  }

  /**
   * Filtre les calendriers Google en fonction de la recherche
   */
  filterGoogleCalendars(): void {
    if (!this.googleCalendarSearchQuery.trim()) {
      this.filteredGoogleCalendars = [...this.googleCalendars];
      return;
    }

    const searchTerm = this.googleCalendarSearchQuery.toLowerCase().trim();
    this.filteredGoogleCalendars = this.googleCalendars.filter(
      (calendar) =>
        calendar.summary.toLowerCase().includes(searchTerm) ||
        (calendar.description &&
          calendar.description.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Ouvre la modal d'ajout à Google Calendar et charge les calendriers si nécessaire
   */
  openAddToGoogleCalendarModal(): void {
    this.showAddToGoogleCalendarModal = true;

    // Réinitialiser les valeurs si un événement n'est pas déjà synchronisé
    if (
      !(
        this.selectedEvent &&
        this.isEventInGoogleCalendar(this.selectedEvent.id)
      )
    ) {
      this.selectedGoogleCalendar = null;
    }

    this.googleCalendarSearchQuery = '';
    this.showCreateCalendarForm = false;

    // Vérifier si l'utilisateur est connecté à Google Calendar
    this.checkGoogleLinkStatus();

    // Si l'événement est déjà synchronisé, pré-sélectionner le calendrier
    if (
      this.selectedEvent &&
      this.isEventInGoogleCalendar(this.selectedEvent.id)
    ) {
      const googleEventInfo = this.getGoogleEventInfo(this.selectedEvent.id);
      if (googleEventInfo) {
        this.selectedGoogleCalendar = googleEventInfo.calendarId;
      }
    }

    // Si l'utilisateur est connecté à Google et que les calendriers ne sont pas encore chargés
    if (this.googleLinked && this.googleCalendars.length === 0) {
      this.loadGoogleCalendars();
    }
  }

  /**
   * Ferme la modale Google Calendar
   */
  closeGoogleCalendarModal(): void {
    this.showAddToGoogleCalendarModal = false;
    this.selectedGoogleCalendar = null;
    this.newCalendarForm.reset({
      timeZone: 'Europe/Paris',
    });
    this.showCreateCalendarForm = false;
  }

  /**
   * Crée un nouveau calendrier Google
   */
  createGoogleCalendar(): void {
    if (this.newCalendarForm.valid) {
      this.loading = true;
      this.googleCalendarService
        .createCalendar(this.newCalendarForm.value)
        .subscribe({
          next: (calendar) => {
            this.loading = false;
            this.googleCalendars.push(calendar);
            this.filteredGoogleCalendars = [...this.googleCalendars];
            this.selectedGoogleCalendar = calendar.id;
            this.showCreateCalendarForm = false;
            this.showSuccessMessage('Nouveau calendrier créé avec succès');
          },
          error: (err) => {
            console.error('Erreur lors de la création du calendrier:', err);
            this.showErrorMessage('Impossible de créer le calendrier');
            this.loading = false;
          },
        });
    }
  }

  /**
   * Ajoute ou met à jour l'événement sélectionné dans Google Calendar
   */
  addToGoogleCalendar(): void {
    if (!this.selectedEvent || !this.selectedGoogleCalendar) {
      this.showErrorMessage('Veuillez sélectionner un calendrier');
      return;
    }

    this.loading = true;

    // Formatage de l'événement pour l'API Google Calendar
    const googleEvent = this.formatEventForGoogleCalendar(this.selectedEvent);

    // Vérifier si l'événement existe déjà dans Google Calendar
    if (this.isEventInGoogleCalendar(this.selectedEvent.id)) {
      // Mise à jour de l'événement existant
      const googleEventInfo = this.getGoogleEventInfo(this.selectedEvent.id);

      if (googleEventInfo) {
        this.googleCalendarService
          .updateEvent(
            googleEventInfo.calendarId,
            googleEventInfo.eventId,
            googleEvent
          )
          .subscribe({
            next: () => {
              this.loading = false;
              this.closeGoogleCalendarModal();
              this.showSuccessMessage(
                'Événement mis à jour dans Google Calendar avec succès'
              );
            },
            error: (err) => {
              console.error(
                "Erreur lors de la mise à jour de l'événement dans Google Calendar:",
                err
              );
              this.showErrorMessage(
                "Impossible de mettre à jour l'événement dans Google Calendar"
              );
              this.loading = false;
            },
          });
      }
    } else {
      // Création d'un nouvel événement
      this.googleCalendarService
        .createEvent(this.selectedGoogleCalendar, googleEvent)
        .subscribe({
          next: (response) => {
            // Sauvegarder l'association entre l'événement local et l'événement Google
            if (this.selectedEvent?.id) {
              this.saveGoogleEventMapping(
                this.selectedEvent.id,
                this.selectedGoogleCalendar as string,
                response.id
              );
            }

            this.loading = false;
            this.closeGoogleCalendarModal();
            this.showSuccessMessage(
              'Événement ajouté à Google Calendar avec succès'
            );
          },
          error: (err) => {
            console.error(
              "Erreur lors de l'ajout de l'événement à Google Calendar:",
              err
            );
            this.showErrorMessage(
              "Impossible d'ajouter l'événement à Google Calendar"
            );
            this.loading = false;
          },
        });
    }
  }

  /**
   * Formate un événement pour l'API Google Calendar
   */
  private formatEventForGoogleCalendar(event: Event): EventCreateData {
    // Créer une description enrichie avec les détails supplémentaires
    let description = event.description || '';
    if (event.location) {
      description += `\n\nLieu: ${event.location}`;
    }

    // Si meetupDateTime existe et est différente de startDateTime, l'ajouter à la description
    if (event.meetupDateTime) {
      const meetupDate = new Date(event.meetupDateTime);
      description += `\n\nRendez-vous: ${this.formatDate(meetupDate)}`;
    }

    // Ajouter des informations sur les organisateurs et participants
    description += '\n\nOrganisé par Sonar Artists';

    return {
      summary: event.title,
      description,
      start: {
        dateTime: new Date(event.startDateTime).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.endDateTime
          ? new Date(event.endDateTime).toISOString()
          : new Date(
              new Date(event.startDateTime).getTime() + 3 * 60 * 60 * 1000
            ).toISOString(), // Par défaut 3h après le début
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      location: event.location || '',
      reminders: {
        useDefault: true,
      },
    };
  }

  /**
   * Vérifie si l'événement a déjà été ajouté à Google Calendar
   */
  isEventInGoogleCalendar(eventId: string | undefined): boolean {
    if (!eventId) return false;
    return this.googleEventMapping.has(eventId);
  }

  /**
   * Récupère les informations de l'événement Google Calendar associé
   */
  getGoogleEventInfo(
    eventId: string | undefined
  ): { calendarId: string; eventId: string } | null {
    if (!eventId) return null;
    return this.googleEventMapping.get(eventId) || null;
  }

  /**
   * Enregistre la relation entre un événement local et un événement Google Calendar
   */
  saveGoogleEventMapping(
    localEventId: string,
    calendarId: string,
    googleEventId: string
  ): void {
    this.googleEventMapping.set(localEventId, {
      calendarId,
      eventId: googleEventId,
    });

    // Persister le mapping dans le localStorage pour le conserver entre les sessions
    try {
      const existingMapping = JSON.parse(
        localStorage.getItem('googleEventMapping') || '{}'
      );
      existingMapping[localEventId] = { calendarId, eventId: googleEventId };
      localStorage.setItem(
        'googleEventMapping',
        JSON.stringify(existingMapping)
      );
    } catch (error) {
      console.error(
        'Erreur lors de la sauvegarde du mapping Google Calendar:',
        error
      );
    }
  }

  /**
   * Charge le mapping des événements depuis le localStorage
   */
  loadGoogleEventMapping(): void {
    try {
      const savedMapping = localStorage.getItem('googleEventMapping');
      if (savedMapping) {
        const mappingObject = JSON.parse(savedMapping);
        this.googleEventMapping = new Map(Object.entries(mappingObject));
      }
    } catch (error) {
      console.error(
        'Erreur lors du chargement du mapping Google Calendar:',
        error
      );
    }
  }

  /**
   * Met à jour l'événement dans Google Calendar s'il existe déjà
   */
  private updateGoogleCalendarEventIfExists(event: Event): void {
    if (!event.id) return;

    const googleEventInfo = this.getGoogleEventInfo(event.id);
    if (googleEventInfo) {
      const googleEvent = this.formatEventForGoogleCalendar(event);

      this.googleCalendarService
        .updateEvent(
          googleEventInfo.calendarId,
          googleEventInfo.eventId,
          googleEvent
        )
        .subscribe({
          next: () => {
            console.log('Événement Google Calendar mis à jour avec succès');
          },
          error: (err) => {
            console.error(
              "Erreur lors de la mise à jour de l'événement dans Google Calendar:",
              err
            );
            // Ne pas afficher d'erreur à l'utilisateur car c'est une opération secondaire
          },
        });
    }
  }

  /**
   * Déconnecte le compte Google
   */
  unlinkGoogleAccount(): void {
    if (confirm('Êtes-vous sûr de vouloir déconnecter votre compte Google ?')) {
      this.loading = true;
      this.googleCalendarService.unlinkGoogleAccount().subscribe({
        next: () => {
          this.loading = false;
          this.googleLinked = false;
          this.googleCalendars = [];
          this.filteredGoogleCalendars = [];
          this.showSuccessMessage('Compte Google déconnecté avec succès');
        },
        error: (err) => {
          console.error('Erreur lors de la déconnexion du compte Google:', err);
          this.showErrorMessage('Impossible de déconnecter le compte Google');
          this.loading = false;
        },
      });
    }
  }

  /**
   * Envoie un message dans le chat de l'événement (appelé depuis le composant EventDetailComponent)
   */
  onSendChatMessage(message: string): void {
    if (!message.trim() || !this.selectedEvent?.id) {
      return;
    }

    this.eventChatService.sendMessage(message.trim());

    // Réinitialiser le statut de frappe
    this.isTyping = false;
    // Annuler le timeout si existant
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Faire défiler jusqu'au dernier message après envoi
    setTimeout(() => {
      this.scrollChatToBottom();
    }, 300);
  }

  /**
   * Envoie un message dans le chat de l'événement (méthode legacy)
   */
  sendChatMessage(): void {
    if (!this.newChatMessage.trim() || !this.selectedEvent?.id) {
      return;
    }

    this.eventChatService.sendMessage(this.newChatMessage.trim());
    this.newChatMessage = '';

    // Réinitialiser le statut de frappe
    this.isTyping = false;
    // Annuler le timeout si existant
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Faire défiler jusqu'au dernier message après envoi
    setTimeout(() => {
      this.scrollChatToBottom();
    }, 300);
  }

  /**
   * Gère l'événement d'entrée dans le champ de texte
   */
  onChatInputFocus(): void {
    // Ne pas activer l'indicateur au simple focus
    // L'état de frappe sera activé uniquement lors de la frappe
  }

  /**
   * Gère l'événement de sortie du champ de texte
   */
  onChatInputBlur(): void {
    // Si l'utilisateur quitte le champ, désactiver l'état de frappe
    if (this.isTyping) {
      this.isTyping = false;
      this.eventChatService.sendTypingStatus(false);
    }
  }

  /**
   * Gère les événements de frappe dans le champ de texte
   */
  onChatInputTyping(): void {
    // Activer l'état de frappe seulement lorsque l'utilisateur tape du texte
    if (!this.isTyping && this.newChatMessage.trim().length > 0) {
      this.isTyping = true;
      this.eventChatService.sendTypingStatus(true);
    }

    // Réinitialiser le timeout à chaque frappe
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Définir un timeout pour arrêter l'indicateur de frappe après un délai
    this.typingTimeout = setTimeout(() => {
      this.isTyping = false;
      this.eventChatService.sendTypingStatus(false);
    }, 2000); // 2 secondes sans frappe = arrêt de frappe
  }

  /**
   * Vérifie si un utilisateur autre que l'utilisateur courant est en train d'écrire
   */
  isAnyoneTyping(): boolean {
    const currentUser = this.authService.getUser();
    if (!currentUser || this.typingUsers.length === 0) {
      return false;
    }

    return this.typingUsers.some((user) => user.userId !== currentUser.id);
  }

  /**
   * Retourne les noms des personnes qui écrivent
   */
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
