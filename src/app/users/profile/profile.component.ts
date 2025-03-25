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

  private usersService: UsersService = inject(UsersService);
  private authService: AuthService = inject(AuthService);
  private formBuilder: FormBuilder = inject(FormBuilder);
  private pushNotificationService: PushNotificationService = inject(
    PushNotificationService
  );
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private groupeInvitationService = inject(GroupeInvitationService);
  private notificationService = inject(NotificationService);

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
        this.updateUserForm = this.formBuilder.group({
          id: [user.id],
          email: [user.email, [Validators.required, Validators.email]],
          name: [user.name, Validators.required],
          firstName: [user.firstName],
          telephone: [user.telephone],
        });
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
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateUser(ctx: any) {
    if (this.updateUserForm.valid) {
      const updateUserDto: UpdateUserDto = this.updateUserForm.value;

      this.usersService.update(updateUserDto).subscribe((user) => {
        this.connectedUser.set(user);
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
}
