import {
  Component,
  effect,
  inject,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { lucideEdit, lucideBell, lucideBellOff } from '@ng-icons/lucide';
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
import { NgOptimizedImage, NgClass } from '@angular/common';
import { AuthService } from '../../shared/services/auth.service';
import { PushNotificationService } from '../../services/push-notification.service';

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
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  providers: [provideIcons({ lucideEdit, lucideBell, lucideBellOff })],
})
export class ProfileComponent {
  protected connectedUser = signal<UserEntity | null>(null);
  protected updateUserForm!: FormGroup;
  protected notificationsEnabled = signal<boolean>(false);
  protected notificationsSupported = signal<boolean>(false);
  protected isProcessingNotificationPermission = signal<boolean>(false);

  private usersService: UsersService = inject(UsersService);
  private authService: AuthService = inject(AuthService);
  private formBuilder: FormBuilder = inject(FormBuilder);
  private pushNotificationService: PushNotificationService = inject(
    PushNotificationService
  );
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

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
}
