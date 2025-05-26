import {
  Component,
  effect,
  inject,
  signal,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import {
  lucideEdit,
  lucideBell,
  lucideBellOff,
  lucideUsers,
  lucideInbox,
  lucideCalendar,
  lucideCalendarX,
  lucideMapPin,
  lucideClock,
  lucideCalendarClock,
  lucidePlus,
} from '@ng-icons/lucide';
import { HlmAspectRatioDirective } from '@spartan-ng/ui-aspectratio-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { HlmIconComponent, provideIcons } from '@spartan-ng/ui-icon-helm';
import {
  BrnDialogContentDirective,
  BrnDialogTriggerDirective,
} from '@spartan-ng/ui-dialog-brain';
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogDescriptionDirective,
  HlmDialogFooterComponent,
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective,
} from '@spartan-ng/ui-dialog-helm';
import { UserEntity } from '../../shared/entities/user.entity';
import { UsersService } from '../../shared/services/users.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { UpdateUserDto } from '../../shared/dtos/update-user.dto';
import {
  NgOptimizedImage,
  NgClass,
  CommonModule,
  DatePipe,
} from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { GroupeInvitationService } from '../../shared/services/groupe-invitation.service';
import { GroupeInvitation } from '../../shared/entities/groupe-invitation.entity';
import { HlmLabelDirective } from '@spartan-ng/ui-label-helm';
import { finalize } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { HttpErrorResponse } from '@angular/common/http';
import { EventService } from '../../services/event.service';
import {
  Event,
  EventStatus,
  InvitationStatus,
} from '../../shared/models/event.model';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { GoogleCalendarService } from '../../services/google-calendar.service';
import {
  NominatimService,
  NominatimResult,
} from '../../services/nominatim.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

// Interface pour l'événement à créer
interface EventCreateData {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  colorId?: string;
  attendees?: {
    email: string;
    displayName?: string;
    optional?: boolean;
  }[];
  reminders?: {
    useDefault: boolean;
    overrides?: {
      method: string;
      minutes: number;
    }[];
  };
}

// Interfaces pour les types de données Google
interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  accessRole: string;
  primary?: boolean;
}

interface GoogleEventDateTime {
  dateTime: string;
  timeZone?: string;
  date?: string; // Ajout du champ date manquant
}

interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  start: GoogleEventDateTime;
  end: GoogleEventDateTime;
  location?: string;
  status: string;
  created: string;
  updated: string;
  colorId?: string;
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus?: string;
  }[];
}

// Constants pour les types de notification
const TOAST_TYPES = {
  SUCCESS: 'success' as const,
  ERROR: 'error' as const,
  INFO: 'info' as const,
  WARNING: 'warning' as const,
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    HlmAspectRatioDirective,
    HlmButtonDirective,
    HlmIconComponent,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogFooterComponent,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    ReactiveFormsModule,
    NgOptimizedImage,
    NgClass,
    CommonModule,
    HlmLabelDirective,
    DatePipe,
    FormsModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  providers: [
    provideIcons({
      lucideEdit,
      lucideBell,
      lucideBellOff,
      lucideUsers,
      lucideInbox,
      lucideCalendar,
      lucideCalendarX,
      lucideMapPin,
      lucideClock,
      lucideCalendarClock,
      lucidePlus,
    }),
  ],
})
export class ProfileComponent implements OnInit {
  protected connectedUser = signal<UserEntity | null>(null);
  protected updateUserForm!: FormGroup;
  protected notificationsEnabled = signal<boolean>(false);
  protected notificationsSupported = signal<boolean>(false);
  protected isProcessingNotificationPermission = signal<boolean>(false);

  // Invitations de groupe
  protected pendingInvitations = signal<GroupeInvitation[]>([]);
  protected isLoadingInvitations = signal<boolean>(false);
  protected isProcessingResponse = signal<boolean>(false);
  private processingInvitationIds = signal<Set<number>>(new Set());

  // Événements de l'utilisateur
  protected userEvents = signal<Event[]>([]);
  protected filteredEvents = signal<Event[]>([]);
  protected isLoadingEvents = signal<boolean>(false);
  protected currentEventTab = signal<'upcoming' | 'past' | 'pending'>(
    'upcoming'
  );
  protected pendingEventCount = signal<number>(0);
  protected isProcessingEventResponse: Record<string, boolean> = {};

  protected eventTabs = [
    { label: 'À venir', value: 'upcoming' },
    { label: 'Passés', value: 'past' },
    { label: 'Invitations', value: 'pending' },
  ];

  // Google Calendar
  protected isAdmin = signal<boolean>(false);
  protected isGoogleLinked = signal<boolean>(false);
  protected isGoogleLinking = signal<boolean>(false);
  protected isLoadingGoogleStatus = signal<boolean>(false);
  protected googleCalendars = signal<GoogleCalendar[]>([]);
  protected selectedCalendarId = signal<string | null>(null);
  protected calendarEvents = signal<GoogleEvent[]>([]);
  protected isLoadingCalendars = signal<boolean>(false);
  protected googleLinkError = signal<string | null>(null);

  // Propriétés pour le filtre des événements Google Calendar
  protected eventTimeFilter = 'upcoming';
  protected eventSearchQuery = '';
  protected filteredCalendarEventsData = signal<GoogleEvent[]>([]);

  // Mapping des couleurs d'événements Google
  private eventColors: Record<string, string> = {
    '1': '#7986cb', // Bleu lavande
    '2': '#33b679', // Vert sauge
    '3': '#8e24aa', // Violet prune
    '4': '#e67c73', // Rouge flamand
    '5': '#f6c026', // Jaune banane
    '6': '#f5511d', // Orange mandarine
    '7': '#039be5', // Bleu cobalt
    '8': '#616161', // Gris graphite
    '9': '#3f51b5', // Bleu indigo
    '10': '#0b8043', // Vert basilic
    '11': '#d60000', // Rouge tomate
  };

  // Gestion du formulaire de création d'événement
  protected showEventCreationForm = false;
  protected eventForm!: FormGroup;
  protected isCreatingEvent = false;

  // Propriétés pour la recherche d'adresses
  protected locationSearchResults = signal<NominatimResult[]>([]);
  protected isSearchingLocation = signal<boolean>(false);
  protected showLocationResults = signal<boolean>(false);
  private searchTerms = new Subject<string>();

  // Propriétés pour l'édition d'événement
  protected isEditMode = signal<boolean>(false);
  protected editingEventId = signal<string | null>(null);
  protected editingCalendarId = signal<string | null>(null);
  protected isLoadingEventDetails = signal<boolean>(false);

  private usersService: UsersService = inject(UsersService);
  private authService: AuthService = inject(AuthService);
  private formBuilder: FormBuilder = inject(FormBuilder);
  private pushNotificationService: PushNotificationService = inject(
    PushNotificationService
  );
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private groupeInvitationService = inject(GroupeInvitationService);
  private notificationService = inject(NotificationService);
  private eventService: EventService = inject(EventService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private http: HttpClient = inject(HttpClient);
  private googleCalendarService = inject(GoogleCalendarService);
  private nominatimService = inject(NominatimService);

  // Définir l'URL de base de l'API
  readonly apiUrl = environment.API_URL; // Utiliser l'URL de l'environnement

  constructor() {
    this.updateUserForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      name: ['', [Validators.required]],
      firstName: ['', [Validators.required]],
      numeroNational: ['', [Validators.required]],
      telephone: ['', [Validators.required]],
      email: ['', [Validators.required]],
      iban: ['', [Validators.required]],
      address: [''],
    });

    // Vérifier si les notifications sont supportées
    this.notificationsSupported.set(
      this.pushNotificationService.arePushNotificationsSupported()
    );

    // Vérifier si l'utilisateur est déjà abonné aux notifications
    if (this.notificationsSupported()) {
      this.pushNotificationService.isSubscribed$.subscribe((isSubscribed) => {
        this.notificationsEnabled.set(isSubscribed);
      });
    }

    effect(
      () => {
        this.connectedUser.set(this.authService.getUser());
        if (this.connectedUser()) {
          this.updateUserForm.patchValue({ iban: this.connectedUser()?.iban });
          this.updateUserForm.patchValue({
            username: this.connectedUser()?.comptePrincipal.username,
          });
          this.updateUserForm.patchValue({ name: this.connectedUser()?.name });
          this.updateUserForm.patchValue({
            firstName: this.connectedUser()?.firstName,
          });
          this.updateUserForm.patchValue({
            numeroNational: this.connectedUser()?.numeroNational,
          });
          this.updateUserForm.patchValue({
            telephone: this.connectedUser()?.telephone,
          });
          this.updateUserForm.patchValue({
            email: this.connectedUser()?.email,
          });
          this.updateUserForm.patchValue({
            address: this.connectedUser()?.address,
          });
        }
      },
      {
        allowSignalWrites: true,
      }
    );

    // Initialiser le formulaire de création d'événement
    this.initEventForm();

    // Initialiser la recherche d'adresses
    this.setupLocationSearch();
  }

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe((user) => {
      this.connectedUser.set(user);
      if (user) {
        // Suppression de la réinitialisation du formulaire ici
        /*
        this.updateUserForm = this.formBuilder.group({
          id: [user.id],
          email: [user.email, [Validators.required, Validators.email]],
          name: [user.name, Validators.required],
          firstName: [user.firstName],
          telephone: [user.telephone],
        });
        */
      }
    });

    // Vérification de la compatibilité des notifications
    this.notificationsSupported.set(
      this.pushNotificationService.areNotificationsSupported()
    );

    // Vérification de l'état actuel des notifications
    if (this.notificationsSupported()) {
      // Utiliser la méthode isCurrentlySubscribed qui vérifie aussi le localStorage
      this.notificationsEnabled.set(
        this.pushNotificationService.isCurrentlySubscribed()
      );

      // S'abonner aux changements de statut des notifications
      this.pushNotificationService.isSubscribed$.subscribe((isSubscribed) => {
        this.notificationsEnabled.set(isSubscribed);
        console.log('État des notifications mis à jour:', isSubscribed);
      });
    }

    // Charger les invitations de groupe en attente
    this.loadPendingInvitations();

    // Charger les événements de l'utilisateur
    this.loadUserEvents();

    // Vérifier si l'utilisateur est admin
    this.authService.getCurrentUser().subscribe((user) => {
      this.isAdmin.set(user?.role === 'ADMIN');

      // Si l'URL contient un code d'authentification Google, lier le compte
      this.route.queryParams.subscribe((params) => {
        if (params['code'] && this.isAdmin()) {
          this.linkGoogleAccount(params['code']);
        }
      });

      // Vérifier si le compte est lié à Google
      this.checkGoogleLinkStatus();
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateUser(ctx: any) {
    if (this.updateUserForm.valid) {
      const updateUserDto: UpdateUserDto = this.updateUserForm.value;

      this.usersService.update(updateUserDto).subscribe((user) => {
        this.connectedUser.set(user);
        this.authService.setUser(user);
        this.notificationService.showToast(
          TOAST_TYPES.SUCCESS,
          'Profil mis à jour',
          'Vos informations ont été enregistrées avec succès.'
        );
        ctx.close();
      });
    }
  }

  toggleNotifications(event: boolean | Event) {
    console.log('Toggle notifications appelé avec:', event);

    // Ne pas changer immédiatement l'état local - attendons le résultat réel
    const newState = !this.notificationsEnabled();
    console.log('Nouvel état demandé:', newState);

    // Activer l'indicateur de chargement
    this.isProcessingNotificationPermission.set(true);

    if (newState) {
      console.log("Tentative d'activation des notifications...");

      // Si on est sur mobile, on force une interaction utilisateur directe
      if ('Notification' in window && Notification.permission === 'default') {
        console.log(
          'Demande de permission directe via Notification API avant Firebase'
        );
        Notification.requestPermission().then((permission) => {
          console.log('Permission réponse:', permission);
          if (permission === 'granted') {
            this.enableNotifications();
          } else {
            // Permission refusée explicitement, mettre à jour l'UI
            console.log('Permission notification refusée');
            this.notificationsEnabled.set(false);
            this.isProcessingNotificationPermission.set(false);
            this.cdr.detectChanges();
          }
        });
      } else {
        // Permission déjà accordée ou refusée, passer directement à Firebase
        this.enableNotifications();
      }
    } else {
      console.log('Tentative de désactivation des notifications...');
      this.disableNotifications();
    }
  }

  private enableNotifications() {
    console.log('Méthode enableNotifications appelée');

    // Pour le débogage, vérifier l'état actuel de la permission
    console.log('État actuel de la permission:', Notification.permission);

    this.pushNotificationService.subscribeToNotifications().subscribe({
      next: (response) => {
        console.log("Réponse de l'abonnement:", response);

        // Vérifier si la réponse indique un succès
        if (response && (response as { success?: boolean }).success) {
          // On ne met pas immédiatement à jour l'interface utilisateur
          // On attend la confirmation du serveur
          console.log('Notifications activées avec succès');

          // Utiliser un timeout pour laisser le temps au serveur de traiter la demande
          setTimeout(() => {
            // Vérifier l'état réel côté serveur après un délai
            this.pushNotificationService.isSubscribed$.subscribe(
              (isSubscribed) => {
                this.notificationsEnabled.set(isSubscribed);
                console.log(
                  'État des notifications vérifié après activation:',
                  isSubscribed
                );

                // Désactiver l'indicateur de chargement
                this.isProcessingNotificationPermission.set(false);
                // Forcer la détection de changements
                this.cdr.detectChanges();
              }
            );
          }, 1000); // Délai d'une seconde pour laisser le temps au serveur

          // Afficher une notification de confirmation
          if (this.pushNotificationService.hasNotificationPermission()) {
            this.pushNotificationService
              .sendLocalTestNotification('Notifications activées', {
                body: "La page va être rechargée pour finaliser l'activation",
                requireInteraction: false,
              })
              .catch((err) => console.error('Erreur notification test:', err))
              .finally(() => {
                // Recharger la page après 2 secondes pour appliquer les changements côté serveur
                setTimeout(() => {
                  console.log(
                    "Rechargement de la page pour finaliser l'activation des notifications"
                  );
                  window.location.reload();
                }, 2000);
              });
          } else {
            // Si on ne peut pas envoyer de notification, recharger quand même la page
            setTimeout(() => {
              console.log(
                "Rechargement de la page pour finaliser l'activation des notifications"
              );
              window.location.reload();
            }, 2000);
          }
        } else {
          console.warn(
            "Réponse d'abonnement reçue mais sans confirmation de succès:",
            response
          );
          // En cas d'échec, vérifier l'état réel via le service
          this.pushNotificationService.isSubscribed$.subscribe(
            (isSubscribed) => {
              this.notificationsEnabled.set(isSubscribed);
              console.log(
                "État d'abonnement vérifié via service:",
                isSubscribed
              );

              // Désactiver l'indicateur de chargement
              this.isProcessingNotificationPermission.set(false);
              // Forcer la détection de changements
              this.cdr.detectChanges();
            }
          );
        }
      },
      error: (error) => {
        console.error("Erreur lors de l'activation des notifications", error);
        this.notificationsEnabled.set(false);
        // Désactiver l'indicateur de chargement
        this.isProcessingNotificationPermission.set(false);
        // Forcer la détection de changements
        this.cdr.detectChanges();
      },
    });
  }

  private disableNotifications() {
    console.log('Méthode disableNotifications appelée');
    this.pushNotificationService
      .unsubscribeFromNotifications()
      .then(() => {
        console.log('Désabonnement réussi');

        // Utiliser un timeout pour laisser le temps au serveur de traiter la demande
        setTimeout(() => {
          // Vérifier l'état réel côté serveur après un délai
          this.pushNotificationService.isSubscribed$.subscribe(
            (isSubscribed) => {
              this.notificationsEnabled.set(isSubscribed);
              console.log(
                'État des notifications vérifié après désactivation:',
                isSubscribed
              );

              // Désactiver l'indicateur de chargement
              this.isProcessingNotificationPermission.set(false);
              // Forcer la détection de changements
              this.cdr.detectChanges();
            }
          );
        }, 1000); // Délai d'une seconde pour laisser le temps au serveur

        console.log(
          'Notifications désactivées avec succès, état:',
          this.notificationsEnabled()
        );
      })
      .catch((error) => {
        console.error(
          'Erreur lors de la désactivation des notifications',
          error
        );
        // Vérifier l'état réel via le service
        this.pushNotificationService.isSubscribed$.subscribe((isSubscribed) => {
          this.notificationsEnabled.set(isSubscribed);
          // Désactiver l'indicateur de chargement
          this.isProcessingNotificationPermission.set(false);
          this.cdr.detectChanges();
        });
      });
  }

  /**
   * Charge les invitations de groupe en attente pour l'utilisateur
   */
  private loadPendingInvitations(): void {
    this.isLoadingInvitations.set(true);

    this.groupeInvitationService
      .getPendingInvitations({ excludeRelations: true })
      .pipe(finalize(() => this.isLoadingInvitations.set(false)))
      .subscribe({
        next: (invitations) => {
          this.pendingInvitations.set(invitations);
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Erreur lors du chargement des invitations:',
            error.message
          );
          this.notificationService.showToast(
            'error',
            'Erreur lors du chargement des invitations:',
            error.message
          );
        },
      });
  }

  /**
   * Vérifie si une invitation spécifique est en cours de traitement
   * @param invitationId ID de l'invitation
   * @returns true si l'invitation est en cours de traitement
   */
  protected isProcessingInvitation(invitationId: number): boolean {
    return this.processingInvitationIds().has(invitationId);
  }

  /**
   * Répond à une invitation de groupe (accepter ou refuser)
   * @param invitationId ID de l'invitation
   * @param accept true pour accepter, false pour refuser
   */
  protected respondToInvitation(invitationId: number, accept: boolean): void {
    // Ajouter l'ID de l'invitation à la liste des invitations en cours de traitement
    const currentProcessingIds = new Set(this.processingInvitationIds());
    currentProcessingIds.add(invitationId);
    this.processingInvitationIds.set(currentProcessingIds);

    this.groupeInvitationService
      .respondToInvitation(invitationId, accept, { excludeRelations: true })
      .subscribe({
        next: () => {
          // Afficher un message de succès
          this.notificationService.showToast(
            accept ? 'success' : 'info',
            accept ? 'Invitation acceptée' : 'Invitation refusée',
            accept
              ? 'Vous avez rejoint le groupe avec succès'
              : "Vous avez refusé l'invitation au groupe"
          );

          // Rafraîchir la liste des invitations
          this.loadPendingInvitations();

          // Retirer l'ID de l'invitation de la liste des invitations en cours de traitement
          const updatedProcessingIds = new Set(this.processingInvitationIds());
          updatedProcessingIds.delete(invitationId);
          this.processingInvitationIds.set(updatedProcessingIds);
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            "Erreur lors de la réponse à l'invitation:",
            error.message
          );
          this.notificationService.showToast(
            'error',
            "Erreur lors de la réponse à l'invitation:",
            error.message
          );

          // Retirer l'ID de l'invitation de la liste des invitations en cours de traitement
          const updatedProcessingIds = new Set(this.processingInvitationIds());
          updatedProcessingIds.delete(invitationId);
          this.processingInvitationIds.set(updatedProcessingIds);
        },
      });
  }

  /**
   * Calcule le temps relatif depuis une date (ex: "il y a 2 jours")
   * @param date La date à comparer
   * @returns Une chaîne formatée indiquant le temps écoulé
   */
  protected getRelativeTime(date: Date | string): string {
    const now = new Date();
    const invitationDate = new Date(date);
    const diffInMs = now.getTime() - invitationDate.getTime();

    const diffInSecs = Math.floor(diffInMs / 1000);
    const diffInMins = Math.floor(diffInSecs / 60);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSecs < 60) {
      return 'il y a quelques secondes';
    } else if (diffInMins < 60) {
      return `il y a ${diffInMins} minute${diffInMins > 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      return `il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInDays < 30) {
      return `il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    } else {
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      return `le ${invitationDate.toLocaleDateString('fr-FR', options)}`;
    }
  }

  /**
   * Charge les événements auxquels l'utilisateur participe
   */
  private loadUserEvents(): void {
    const userId = this.connectedUser()?.id;
    if (!userId) return;

    this.isLoadingEvents.set(true);

    this.eventService.getUserEvents(userId).subscribe({
      next: (events) => {
        this.userEvents.set(events);

        // Compter les invitations en attente
        this.updatePendingEventCount();

        // Appliquer le filtre par défaut (à venir)
        this.filterEvents('upcoming');

        this.isLoadingEvents.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des événements:', error);
        this.notificationService.showToast(
          TOAST_TYPES.ERROR,
          'Erreur',
          'Impossible de charger vos événements'
        );
        this.isLoadingEvents.set(false);
      },
    });
  }

  /**
   * Met à jour le compteur d'invitations en attente
   */
  private updatePendingEventCount(): void {
    const pendingCount = this.userEvents().filter((event) =>
      event.invitedPeople.some(
        (person) =>
          person.personId === this.connectedUser()?.id &&
          person.status === InvitationStatus.PENDING
      )
    ).length;

    this.pendingEventCount.set(pendingCount);
  }

  /**
   * Filtre les événements selon le tab sélectionné
   */
  protected filterEvents(tab: string): void {
    const now = new Date();
    const userId = this.connectedUser()?.id;

    this.currentEventTab.set(tab as 'upcoming' | 'past' | 'pending');

    if (!userId) {
      this.filteredEvents.set([]);
      return;
    }

    let filtered: Event[] = [];

    switch (tab) {
      case 'upcoming':
        filtered = this.userEvents().filter(
          (event) =>
            new Date(event.startDateTime) >= now &&
            event.invitedPeople.some(
              (person) =>
                person.personId === userId &&
                person.status === InvitationStatus.ACCEPTED
            )
        );
        break;

      case 'past':
        filtered = this.userEvents().filter(
          (event) =>
            new Date(event.startDateTime) < now &&
            event.invitedPeople.some(
              (person) =>
                person.personId === userId &&
                person.status === InvitationStatus.ACCEPTED
            )
        );
        break;

      case 'pending':
        filtered = this.userEvents().filter((event) =>
          event.invitedPeople.some(
            (person) =>
              person.personId === userId &&
              person.status === InvitationStatus.PENDING
          )
        );
        break;
    }

    // Tri par date (le plus récent d'abord pour les passés, le plus proche d'abord pour les futurs)
    if (tab === 'past') {
      filtered.sort(
        (a, b) =>
          new Date(b.startDateTime).getTime() -
          new Date(a.startDateTime).getTime()
      );
    } else {
      filtered.sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime()
      );
    }

    this.filteredEvents.set(filtered);
  }

  /**
   * Répond à une invitation à un événement
   */
  protected respondToEventInvitation(
    event: Event,
    status: 'ACCEPTED' | 'DECLINED'
  ): void {
    if (!event.id || !this.connectedUser()?.id) return;

    this.isProcessingEventResponse[event.id] = true;

    const userId = this.connectedUser()?.id;
    const invitationStatus =
      status === 'ACCEPTED'
        ? InvitationStatus.ACCEPTED
        : InvitationStatus.DECLINED;

    // Utiliser HttpClient directement pour éviter les problèmes d'URL
    this.http
      .post<Event>(
        `${this.apiUrl}/groups/events/${event.id}/response?personId=${userId}`,
        { status: invitationStatus }
      )
      .subscribe({
        next: (updatedEvent) => {
          // Mettre à jour l'événement dans la liste
          const updatedEvents = this.userEvents().map((e) => {
            if (e.id === updatedEvent.id) {
              return updatedEvent;
            }
            return e;
          });

          this.userEvents.set(updatedEvents);
          this.updatePendingEventCount();
          this.filterEvents(this.currentEventTab());

          // Afficher un toast de confirmation
          this.notificationService.showToast(
            TOAST_TYPES.SUCCESS,
            status === 'ACCEPTED'
              ? 'Invitation acceptée'
              : 'Invitation refusée',
            status === 'ACCEPTED'
              ? `Vous participez maintenant à l'événement "${event.title}"`
              : `Vous avez refusé l'invitation à l'événement "${event.title}"`
          );

          if (event.id) {
            this.isProcessingEventResponse[event.id] = false;
          }
        },
        error: (error) => {
          console.error("Erreur lors de la réponse à l'invitation:", error);
          this.notificationService.showToast(
            TOAST_TYPES.ERROR,
            'Erreur',
            "Impossible de répondre à l'invitation"
          );

          if (event.id) {
            this.isProcessingEventResponse[event.id] = false;
          }
        },
      });
  }

  /**
   * Formate la date d'un événement selon le format demandé
   */
  protected formatEventDate(
    date: string | Date,
    format: 'day' | 'month' | 'time' | 'full' | 'date'
  ): string {
    const eventDate = new Date(date);

    switch (format) {
      case 'day':
        return eventDate.getDate().toString();
      case 'month':
        return eventDate.toLocaleDateString('fr-FR', { month: 'short' });
      case 'time':
        return eventDate.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        });
      case 'date':
        return eventDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      case 'full':
        return eventDate.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      default:
        return '';
    }
  }

  /**
   * Formate la durée d'un événement
   */
  protected formatEventDuration(event: Event): string {
    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);

    // Si c'est le même jour
    if (start.toDateString() === end.toDateString()) {
      return `${this.formatEventDate(start, 'time')} - ${this.formatEventDate(
        end,
        'time'
      )}`;
    }

    // Si c'est sur plusieurs jours
    return `${start.toLocaleDateString('fr-FR')} ${this.formatEventDate(
      start,
      'time'
    )} - ${end.toLocaleDateString('fr-FR')} ${this.formatEventDate(
      end,
      'time'
    )}`;
  }

  /**
   * Retourne le libellé du statut d'un événement
   */
  protected getStatusLabel(status: string): string {
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

  /**
   * Navigue vers la page de détail d'un événement spécifique
   * @param event L'événement sur lequel l'utilisateur a cliqué
   */
  protected navigateToEvent(event: Event): void {
    if (!event.id || !event.groupId) {
      this.notificationService.showToast(
        TOAST_TYPES.ERROR,
        'Erreur',
        "Impossible d'accéder à cet événement"
      );
      return;
    }

    // Naviguer vers la page de l'agenda en passant l'ID de l'événement
    this.router.navigate(['/home/home-group', event.groupId, 'agenda'], {
      queryParams: {
        typeOfProjet: 'GROUP',
        selectedEventId: event.id,
      },
    });
  }

  /**
   * Vérifie si le compte de l'utilisateur est lié à Google
   */
  protected checkGoogleLinkStatus(): void {
    if (!this.isAdmin()) return;

    this.isLoadingGoogleStatus.set(true);
    this.googleCalendarService
      .checkGoogleLinkStatus()
      .pipe(finalize(() => this.isLoadingGoogleStatus.set(false)))
      .subscribe({
        next: (result) => {
          this.isGoogleLinked.set(result.linked);

          // Si le compte est lié, charger les calendriers
          if (result.linked) {
            this.loadGoogleCalendars();
          }
        },
        error: (error) => {
          console.error(
            'Erreur lors de la vérification du statut Google:',
            error
          );
          this.notificationService.showToast(
            'error',
            'Erreur',
            'Impossible de vérifier le statut de liaison Google'
          );
        },
      });
  }

  /**
   * Initie le processus de liaison d'un compte Google
   */
  protected initiateGoogleLink(): void {
    if (!this.isAdmin()) return;

    this.isGoogleLinking.set(true);
    this.googleCalendarService
      .getGoogleAuthUrl()
      .pipe(finalize(() => this.isGoogleLinking.set(false)))
      .subscribe({
        next: (response) => {
          // Rediriger vers l'URL d'authentification Google
          window.location.href = response.url;
        },
        error: (error) => {
          console.error("Erreur lors de l'obtention de l'URL Google:", error);
          this.googleLinkError.set(
            "Impossible d'obtenir l'URL d'authentification Google"
          );
          this.notificationService.showToast(
            'error',
            'Erreur',
            "Impossible de démarrer l'authentification Google"
          );
        },
      });
  }

  /**
   * Finalise la liaison d'un compte Google après redirection
   */
  protected linkGoogleAccount(code: string): void {
    if (!this.isAdmin()) return;

    this.isGoogleLinking.set(true);
    this.googleLinkError.set(null);

    this.googleCalendarService
      .linkGoogleAccount(code)
      .pipe(finalize(() => this.isGoogleLinking.set(false)))
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.isGoogleLinked.set(true);
            this.notificationService.showToast(
              'success',
              'Compte Google lié',
              'Votre compte Google a été lié avec succès'
            );

            // Charger les calendriers après liaison réussie
            this.loadGoogleCalendars();

            // Supprimer le code de l'URL
            const url = new URL(window.location.href);
            url.searchParams.delete('code');
            url.searchParams.delete('scope');
            url.searchParams.delete('state');
            window.history.replaceState({}, document.title, url.toString());
          } else {
            this.googleLinkError.set(
              result.message || 'Échec de la liaison du compte Google'
            );
            this.notificationService.showToast(
              'error',
              'Erreur',
              'Échec de la liaison du compte Google'
            );
          }
        },
        error: (error) => {
          console.error('Erreur lors de la liaison du compte Google:', error);
          this.googleLinkError.set(
            error.error?.message || 'Erreur inconnue lors de la liaison Google'
          );
          this.notificationService.showToast(
            'error',
            'Erreur',
            'Impossible de lier le compte Google'
          );
        },
      });
  }

  /**
   * Supprime la liaison avec Google
   */
  protected unlinkGoogleAccount(): void {
    if (!this.isAdmin()) return;

    if (
      confirm(
        "Êtes-vous sûr de vouloir supprimer la liaison avec votre compte Google ? Vous n'aurez plus accès à vos calendriers Google."
      )
    ) {
      this.isGoogleLinking.set(true);

      this.googleCalendarService
        .unlinkGoogleAccount()
        .pipe(finalize(() => this.isGoogleLinking.set(false)))
        .subscribe({
          next: (result) => {
            if (result.success) {
              this.isGoogleLinked.set(false);
              this.googleCalendars.set([]);
              this.selectedCalendarId.set(null);
              this.calendarEvents.set([]);

              this.notificationService.showToast(
                'success',
                'Compte Google délié',
                'La liaison avec votre compte Google a été supprimée'
              );
            } else {
              this.notificationService.showToast(
                'error',
                'Erreur',
                'Échec de la suppression de la liaison Google'
              );
            }
          },
          error: (error) => {
            console.error(
              'Erreur lors de la suppression de la liaison Google:',
              error
            );
            this.notificationService.showToast(
              'error',
              'Erreur',
              'Impossible de supprimer la liaison Google'
            );
          },
        });
    }
  }

  /**
   * Charge les calendriers Google de l'utilisateur
   */
  protected loadGoogleCalendars(): void {
    if (!this.isAdmin() || !this.isGoogleLinked()) return;

    this.isLoadingCalendars.set(true);
    this.googleCalendarService
      .getCalendars()
      .pipe(finalize(() => this.isLoadingCalendars.set(false)))
      .subscribe({
        next: (response) => {
          this.googleCalendars.set(response.items || []);

          // Sélectionner le calendrier principal par défaut s'il existe
          const primaryCalendar = response.items?.find((cal) => cal.primary);
          if (primaryCalendar) {
            this.selectedCalendarId.set(primaryCalendar.id);
            this.loadCalendarEvents(primaryCalendar.id);
          } else if (response.items?.length > 0) {
            this.selectedCalendarId.set(response.items[0].id);
            this.loadCalendarEvents(response.items[0].id);
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement des calendriers:', error);
          this.notificationService.showToast(
            'error',
            'Erreur',
            'Impossible de charger vos calendriers Google'
          );
        },
      });
  }

  /**
   * Charge les événements d'un calendrier spécifique
   */
  protected loadCalendarEvents(
    calendarIdOrEvent: string | { target: HTMLSelectElement }
  ): void {
    if (!this.isAdmin() || !this.isGoogleLinked()) return;

    let calendarId: string;

    // Déterminer si l'argument est un événement ou directement un ID
    if (typeof calendarIdOrEvent === 'string') {
      calendarId = calendarIdOrEvent;
    } else {
      // C'est un événement de formulaire
      calendarId = calendarIdOrEvent.target.value;
    }

    if (!calendarId) return;

    this.isLoadingEvents.set(true);
    this.selectedCalendarId.set(calendarId);

    this.googleCalendarService
      .getCalendarEvents(calendarId)
      .pipe(finalize(() => this.isLoadingEvents.set(false)))
      .subscribe({
        next: (response) => {
          this.calendarEvents.set(response.items || []);
          // Initialiser les événements filtrés après chargement
          this.filterCalendarEvents();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des événements:', error);
          this.notificationService.showToast(
            'error',
            'Erreur',
            'Impossible de charger les événements du calendrier'
          );
        },
      });
  }

  /**
   * Formate la date d'un événement Google pour l'affichage
   */
  protected formatGoogleEventDate(dateTimeString: string): string {
    const date = new Date(dateTimeString);
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Crée un nouveau calendrier Google
   */
  protected createNewCalendar(): void {
    if (!this.isAdmin() || !this.isGoogleLinked()) return;

    // Demander les informations du calendrier
    const calendarName = prompt('Nom du nouveau calendrier:');
    if (!calendarName) return;

    const calendarDescription = prompt('Description (optionnelle):');

    const calendarData = {
      summary: calendarName,
      description: calendarDescription || undefined,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    this.googleCalendarService.createCalendar(calendarData).subscribe({
      next: (response) => {
        this.notificationService.showToast(
          'success',
          'Calendrier créé',
          `Le calendrier "${response.summary}" a été créé avec succès`
        );

        // Recharger la liste des calendriers
        this.loadGoogleCalendars();
      },
      error: (error) => {
        console.error('Erreur lors de la création du calendrier:', error);
        this.notificationService.showToast(
          'error',
          'Erreur',
          'Impossible de créer le calendrier'
        );
      },
    });
  }

  // Méthode utilitaire pour obtenir la date d'événement Google avec sécurité de type
  private getEventDate(eventDateTime: GoogleEventDateTime): Date {
    return new Date(eventDateTime.dateTime || eventDateTime.date || '');
  }

  // Filtrer les événements du calendrier selon les critères
  protected filterCalendarEvents(): void {
    if (!this.selectedCalendarId()) return;

    const now = new Date();
    const query = this.eventSearchQuery.toLowerCase();

    let filtered = this.calendarEvents();

    // Filtrer par période
    switch (this.eventTimeFilter) {
      case 'upcoming':
        filtered = filtered.filter(
          (event) => this.getEventDate(event.start) >= now
        );
        break;
      case 'past':
        filtered = filtered.filter(
          (event) => this.getEventDate(event.start) < now
        );
        break;
      case 'today': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        filtered = filtered.filter((event) => {
          const eventDate = this.getEventDate(event.start);
          return eventDate >= today && eventDate < tomorrow;
        });
        break;
      }
      case 'week': {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        filtered = filtered.filter((event) => {
          const eventDate = this.getEventDate(event.start);
          return eventDate >= startOfWeek && eventDate < endOfWeek;
        });
        break;
      }
      case 'month': {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        );

        filtered = filtered.filter((event) => {
          const eventDate = this.getEventDate(event.start);
          return eventDate >= startOfMonth && eventDate <= endOfMonth;
        });
        break;
      }
      // 'all' ne nécessite pas de filtrage supplémentaire
    }

    // Filtrer par recherche textuelle
    if (query) {
      filtered = filtered.filter(
        (event) =>
          event.summary?.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query)
      );
    }

    // Trier par date
    if (this.eventTimeFilter === 'past') {
      filtered.sort(
        (a, b) =>
          this.getEventDate(b.start).getTime() -
          this.getEventDate(a.start).getTime()
      );
    } else {
      filtered.sort(
        (a, b) =>
          this.getEventDate(a.start).getTime() -
          this.getEventDate(b.start).getTime()
      );
    }

    this.filteredCalendarEventsData.set(filtered);
  }

  // Méthode pour accéder aux événements filtrés
  protected filteredCalendarEvents(): GoogleEvent[] {
    return this.filteredCalendarEventsData();
  }

  // Obtenir le libellé du filtre actuel
  protected getEventFilterLabel(): string {
    switch (this.eventTimeFilter) {
      case 'upcoming':
        return 'à venir';
      case 'past':
        return 'passés';
      case 'today':
        return "d'aujourd'hui";
      case 'week':
        return 'de cette semaine';
      case 'month':
        return 'de ce mois';
      case 'all':
        return 'tous';
      default:
        return '';
    }
  }

  // Obtenir la couleur d'un événement selon son ID de couleur
  protected getEventColor(colorId: string | undefined): string {
    if (!colorId) return '#4285F4'; // Couleur par défaut (bleu Google)
    return this.eventColors[colorId] || '#4285F4';
  }

  // Obtenir le libellé du statut d'un événement Google
  protected getEventStatusLabel(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'tentative':
        return 'Provisoire';
      case 'cancelled':
        return 'Annulé';
      default:
        return 'Non spécifié';
    }
  }

  /**
   * Configure la recherche d'adresses avec debounce
   */
  private setupLocationSearch(): void {
    this.searchTerms
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term: string) => {
          if (term.length < 3) {
            this.locationSearchResults.set([]);
            this.isSearchingLocation.set(false);
            return [];
          }

          this.isSearchingLocation.set(true);
          return this.nominatimService.searchPlaces(term);
        })
      )
      .subscribe({
        next: (results) => {
          this.locationSearchResults.set(results);
          this.isSearchingLocation.set(false);
          this.showLocationResults.set(results.length > 0);
        },
        error: (error) => {
          console.error("Erreur lors de la recherche d'adresses", error);
          this.isSearchingLocation.set(false);
          this.showLocationResults.set(false);
        },
      });
  }

  /**
   * Recherche d'adresses lorsque l'utilisateur tape
   */
  protected searchLocation(term: string): void {
    this.searchTerms.next(term);
  }

  /**
   * Sélectionne une adresse dans les résultats
   */
  protected selectLocation(result: NominatimResult): void {
    this.eventForm.get('location')?.setValue(result.display_name);
    this.eventForm.get('latitude')?.setValue(result.lat);
    this.eventForm.get('longitude')?.setValue(result.lon);
    this.showLocationResults.set(false);
  }

  /**
   * Initialise le formulaire de création d'événement
   */
  private initEventForm(): void {
    this.eventForm = this.formBuilder.group(
      {
        title: ['', Validators.required],
        calendarId: [null, Validators.required],
        startDateTime: [this.getDefaultStartDate(), Validators.required],
        endDateTime: [this.getDefaultEndDate(), Validators.required],
        location: [''],
        latitude: [''],
        longitude: [''],
        description: [''],
        attendees: [
          '',
          Validators.pattern(
            /^(\s*[^\s,]+@[^\s,]+\.[^\s,]+\s*,\s*)*([^\s,]+@[^\s,]+\.[^\s,]+\s*)?$/
          ),
        ],
        colorId: ['1'],
        eventId: [''], // Champ caché pour stocker l'ID de l'événement en mode édition
      },
      { validators: this.validateEventDates }
    );
  }

  /**
   * Obtient la date et heure par défaut pour le début de l'événement (heure actuelle arrondie à l'heure suivante)
   */
  private getDefaultStartDate(): string {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return this.formatDateForInput(date);
  }

  /**
   * Obtient la date et heure par défaut pour la fin de l'événement (1 heure après le début)
   */
  private getDefaultEndDate(): string {
    const date = new Date();
    date.setHours(date.getHours() + 2);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return this.formatDateForInput(date);
  }

  /**
   * Formate une date pour un champ input datetime-local
   */
  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * Validateur personnalisé pour vérifier que la date de fin est après la date de début
   */
  private validateEventDates(
    control: AbstractControl
  ): ValidationErrors | null {
    const startDateTime = new Date(control.get('startDateTime')?.value);
    const endDateTime = new Date(control.get('endDateTime')?.value);

    if (startDateTime && endDateTime) {
      if (endDateTime <= startDateTime) {
        return { endDateBeforeStart: true };
      }
    }

    return null;
  }

  /**
   * Retourne les IDs de couleurs disponibles pour les événements Google
   */
  protected getColorIds(): string[] {
    return Object.keys(this.eventColors);
  }

  /**
   * Lance l'édition d'un événement existant
   */
  protected editEvent(event: GoogleEvent, calendarId: string): void {
    this.isLoadingEventDetails.set(true);
    this.editingEventId.set(event.id);
    this.editingCalendarId.set(calendarId);
    this.isEditMode.set(true);

    // Récupérer les détails complets de l'événement
    this.googleCalendarService
      .getEvent(calendarId, event.id)
      .pipe(finalize(() => this.isLoadingEventDetails.set(false)))
      .subscribe({
        next: (eventDetails) => {
          // Extraire les participants s'il y en a
          let attendeesString = '';
          const eventAttendees = eventDetails as unknown as {
            attendees?: { email: string }[];
          };
          if (eventAttendees.attendees && eventAttendees.attendees.length > 0) {
            attendeesString = eventAttendees.attendees
              .map((attendee: { email: string }) => attendee.email)
              .join(', ');
          }

          // Extraire les dates en format local
          const startDate = new Date(eventDetails.start.dateTime);
          const endDate = new Date(eventDetails.end.dateTime);

          // Rechercher les coordonnées dans la description si elles existent
          let latitude = '';
          let longitude = '';

          if (eventDetails.description) {
            const coordsMatch = eventDetails.description.match(
              /Coordonnées: ([-\d.]+),([-\d.]+)/
            );
            if (coordsMatch && coordsMatch.length === 3) {
              latitude = coordsMatch[1];
              longitude = coordsMatch[2];
            }
          }

          // Remplir le formulaire avec les données de l'événement
          this.eventForm.patchValue({
            title: eventDetails.summary,
            calendarId: calendarId,
            startDateTime: this.formatDateForInput(startDate),
            endDateTime: this.formatDateForInput(endDate),
            location: eventDetails.location || '',
            latitude: latitude,
            longitude: longitude,
            description: eventDetails.description
              ? this.cleanDescription(eventDetails.description)
              : '',
            attendees: attendeesString,
            colorId:
              (eventDetails as unknown as { colorId?: string }).colorId || '1',
            eventId: eventDetails.id,
          });

          // Afficher le formulaire d'édition
          this.showEventCreationForm = true;
        },
        error: (error) => {
          console.error(
            "Erreur lors de la récupération des détails de l'événement",
            error
          );
          this.notificationService.showToast(
            'error',
            'Erreur',
            "Impossible de charger les détails de l'événement"
          );
          this.isEditMode.set(false);
          this.editingEventId.set(null);
          this.editingCalendarId.set(null);
        },
      });
  }

  /**
   * Nettoie la description des informations de localisation ajoutées automatiquement
   */
  private cleanDescription(description: string): string {
    // Enlever les informations de localisation ajoutées
    return description.replace(
      /\n\nLieu: .*\nCoordonnées: .*\nCarte: .*$/s,
      ''
    );
  }

  /**
   * Réinitialise le formulaire et sort du mode édition
   */
  protected cancelEdit(): void {
    this.isEditMode.set(false);
    this.editingEventId.set(null);
    this.editingCalendarId.set(null);
    this.showEventCreationForm = false;
    this.initEventForm();
  }

  /**
   * Crée ou met à jour un événement Google Calendar selon le mode (création ou édition)
   */
  protected createEvent(): void {
    if (this.eventForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.eventForm.controls).forEach((key) => {
        const control = this.eventForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isCreatingEvent = true;

    const formValues = this.eventForm.value;
    const calendarId = formValues.calendarId;
    const isEdit = this.isEditMode() && formValues.eventId;

    // Préparer les données de l'événement
    const eventData: EventCreateData = {
      summary: formValues.title,
      location: formValues.location,
      description: formValues.description,
      start: {
        dateTime: new Date(formValues.startDateTime).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: new Date(formValues.endDateTime).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      colorId: formValues.colorId,
    };

    // Ajouter les coordonnées géographiques si disponibles
    if (formValues.latitude && formValues.longitude) {
      // Ajout des coordonnées au format geo:latitude,longitude dans la description
      const geoLink = `https://maps.google.com/?q=${formValues.latitude},${formValues.longitude}`;
      const locationInfo = `\n\nLieu: ${formValues.location}\nCoordonnées: ${formValues.latitude},${formValues.longitude}\nCarte: ${geoLink}`;

      eventData.description = (eventData.description || '') + locationInfo;
    }

    // Ajouter les participants si spécifiés
    if (formValues.attendees && formValues.attendees.trim()) {
      const attendeesEmails = formValues.attendees
        .split(',')
        .map((email: string) => email.trim());
      eventData.attendees = attendeesEmails.map((email: string) => ({ email }));
    }

    // Créer ou mettre à jour l'événement selon le mode
    const operation = isEdit
      ? this.googleCalendarService.updateEvent(
          calendarId,
          formValues.eventId,
          eventData
        )
      : this.googleCalendarService.createEvent(calendarId, eventData);

    operation
      .pipe(
        finalize(() => {
          this.isCreatingEvent = false;
          if (isEdit) {
            this.isEditMode.set(false);
            this.editingEventId.set(null);
            this.editingCalendarId.set(null);
          }
        })
      )
      .subscribe({
        next: (response) => {
          const actionMsg = isEdit ? 'modifié' : 'créé';
          this.notificationService.showToast(
            'success',
            isEdit ? 'Événement modifié' : 'Événement créé',
            `L'événement "${response.summary}" a été ${actionMsg} avec succès`
          );

          // Fermer le formulaire et rafraîchir les événements
          this.showEventCreationForm = false;
          this.initEventForm(); // Réinitialiser le formulaire
          this.loadCalendarEvents(calendarId);
        },
        error: (error) => {
          const actionMsg = isEdit ? 'la modification' : 'la création';
          console.error(`Erreur lors de ${actionMsg} de l'événement:`, error);
          this.notificationService.showToast(
            'error',
            'Erreur',
            `Impossible de ${isEdit ? 'modifier' : 'créer'} l'événement`
          );
        },
      });
  }

  /**
   * Cache les résultats de recherche après un délai
   */
  protected hideLocationResults(): void {
    setTimeout(() => {
      this.showLocationResults.set(false);
    }, 200);
  }
}
