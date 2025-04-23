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

// Interface simple pour les calendriers Google
interface GoogleCalendar {
  id: string;
  summary: string; // Nom du calendrier
  description?: string;
  primary?: boolean;
  // Ajouter d'autres champs si nécessaire
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

  // Google Calendar Test Section
  protected isLoadingCalendars = signal<boolean>(false);
  protected googleCalendarsFetchAttempted = signal<boolean>(false); // Pour savoir si on doit afficher la zone de résultat
  protected googleCalendars = signal<GoogleCalendar[] | null>(null);
  protected googleCalendarsError = signal<string | null>(null);

  protected eventTabs = [
    { label: 'À venir', value: 'upcoming' },
    { label: 'Passés', value: 'past' },
    { label: 'Invitations', value: 'pending' },
  ];

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

    // Gérer les queryParams pour les onglets et le succès de la liaison Google
    this.route.queryParams.subscribe((params) => {
      // Vérifier si la liaison Google vient de réussir
      if (params['google_linked'] === 'success') {
        console.log(
          'Google account linked successfully, refreshing user data...'
        );
        // Forcer le rafraîchissement via UsersService.getInfo()
        this.usersService.getInfo().subscribe(
          (updatedUser: UserEntity) => {
            console.log('User data refreshed:', updatedUser);
            // Mettre à jour l'état d'authentification global
            this.authService.setUser(updatedUser);
            // Le signal connectedUser devrait se mettre à jour via l'effect
            // this.connectedUser.set(updatedUser); // Normalement plus nécessaire grâce à l'effect

            // Afficher un toast de succès
            this.notificationService.showToast(
              TOAST_TYPES.SUCCESS,
              'Compte Google lié',
              'Votre compte Google a été lié avec succès.'
            );
            // Nettoyer l'URL (supprimer le query param)
            // Utiliser replaceUrl pour éviter d'ajouter une entrée dans l'historique
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { google_linked: null }, // Met à null pour le supprimer
              queryParamsHandling: 'merge', // Conserve les autres params éventuels
              replaceUrl: true, // Remplace l'entrée actuelle dans l'historique
            });
          },
          (error) => {
            console.error(
              'Error refreshing user data after Google link:',
              error
            );
            this.notificationService.showToast(
              TOAST_TYPES.ERROR,
              'Erreur',
              'Impossible de rafraîchir les informations utilisateur.'
            );
          }
        );
      }

      // Si on a un paramètre 'tab' pour indiquer qu'il faut afficher l'onglet événements
      if (params['tab'] === 'event') {
        // Scroller jusqu'à la section des événements
        setTimeout(() => {
          const eventSection = document.querySelector('.events-section');
          if (eventSection) {
            eventSection.scrollIntoView({ behavior: 'smooth' });
          }

          // Sélectionner l'onglet approprié
          if (params['eventTab']) {
            this.filterEvents(params['eventTab']);
          }

          // Si on a un ID d'événement à mettre en surbrillance
          if (params['highlight']) {
            setTimeout(() => {
              const eventElement = document.querySelector(
                `[data-event-id="${params['highlight']}"]`
              );
              if (eventElement) {
                eventElement.classList.add('highlight-event');
                // Retirer la surbrillance après quelques secondes
                setTimeout(() => {
                  eventElement.classList.remove('highlight-event');
                }, 3000);
              }
            }, 500);
          }
        }, 300);
      }
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
   * Initiate Google account linking by calling the backend to get the
   * specific Google OAuth URL for the authenticated user, then redirects.
   */
  linkGoogleAccount(): void {
    // Call the backend endpoint to get the Google Auth URL
    this.http
      .get<{ googleAuthUrl: string }>(`${this.apiUrl}/auth/google/get-auth-url`)
      .subscribe({
        next: (response) => {
          if (response && response.googleAuthUrl) {
            // Redirect the user's browser to the URL provided by the backend
            window.location.href = response.googleAuthUrl;
          } else {
            console.error('Invalid response from backend for Google Auth URL');
            this.notificationService.showToast(
              TOAST_TYPES.ERROR,
              'Erreur',
              "Impossible d'initier la connexion avec Google (réponse invalide)."
            );
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error fetching Google Auth URL:', error);
          this.notificationService.showToast(
            TOAST_TYPES.ERROR,
            'Erreur',
            `Impossible d'initier la connexion avec Google: ${error.message}`
          );
        },
      });
  }

  /**
   * Initiates the process to unlink the Google account.
   */
  unlinkGoogleAccount(): void {
    // Optionnel: Ajouter une confirmation
    if (
      !confirm(
        'Êtes-vous sûr de vouloir délier votre compte Google ? Cette action ne peut pas être annulée.'
      )
    ) {
      return;
    }

    console.log('Unlinking Google Account...');

    this.http
      .delete<{ message: string }>(`${this.apiUrl}/auth/google/unlink`)
      .subscribe({
        next: (response) => {
          console.log(
            'Google account unlinked successfully:',
            response.message
          );
          // Rafraîchir les données utilisateur pour mettre à jour l'UI
          this.usersService.getInfo().subscribe(
            (updatedUser: UserEntity) => {
              this.authService.setUser(updatedUser);
              // Afficher un toast de succès
              this.notificationService.showToast(
                TOAST_TYPES.SUCCESS,
                'Compte Google délié',
                'Votre compte Google a été dissocié avec succès.'
              );
              // Pas besoin de nettoyer l'URL ici
            },
            (error) => {
              console.error(
                'Error refreshing user data after Google unlink:',
                error
              );
              // Afficher un toast même si le rafraîchissement échoue, car la dissociation a réussi
              this.notificationService.showToast(
                TOAST_TYPES.INFO,
                'Compte Google délié',
                'Compte dissocié, mais erreur lors du rafraîchissement des informations.'
              );
            }
          );
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error unlinking Google account:', error);
          this.notificationService.showToast(
            TOAST_TYPES.ERROR,
            'Erreur de dissociation',
            `Impossible de délier le compte Google: ${
              error.error?.message || error.message
            }`
          );
        },
      });
  }

  /**
   * Fetches the list of Google Calendars from the backend.
   */
  fetchGoogleCalendars(): void {
    this.isLoadingCalendars.set(true);
    this.googleCalendarsFetchAttempted.set(true); // Marquer que la tentative a été faite
    this.googleCalendars.set(null); // Réinitialiser les résultats précédents
    this.googleCalendarsError.set(null); // Réinitialiser l'erreur précédente

    this.http
      .get<GoogleCalendar[]>(`${this.apiUrl}/auth/google/calendars`) // Utiliser l'interface
      .pipe(finalize(() => this.isLoadingCalendars.set(false))) // Assure que le chargement s'arrête
      .subscribe({
        next: (calendars) => {
          console.log('Fetched Google Calendars:', calendars);
          this.googleCalendars.set(calendars);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error fetching Google Calendars:', error);
          this.googleCalendarsError.set(
            error.error?.message ||
              error.message ||
              'Une erreur inconnue est survenue.'
          );
          // Afficher un toast d'erreur
          this.notificationService.showToast(
            TOAST_TYPES.ERROR,
            'Erreur Calendriers Google',
            this.googleCalendarsError() ||
              'Impossible de récupérer les calendriers.'
          );
        },
      });
  }
}
