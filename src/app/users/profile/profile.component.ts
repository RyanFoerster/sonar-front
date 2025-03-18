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

    // Option de test simple pour vérifier si le problème est lié à l'UI ou aux appels réseau
    // Lors du clic, on change simplement l'état local
    this.notificationsEnabled.set(!this.notificationsEnabled());
    console.log(
      'État local des notifications changé à:',
      this.notificationsEnabled()
    );

    // Forcer la détection de changements
    this.cdr.detectChanges();

    // Appeler le service selon l'état
    if (this.notificationsEnabled()) {
      console.log("Tentative d'activation des notifications...");
      this.enableNotifications();
    } else {
      console.log('Tentative de désactivation des notifications...');
      this.disableNotifications();
    }
  }

  private enableNotifications() {
    console.log('Méthode enableNotifications appelée');
    this.pushNotificationService.subscribeToNotifications().subscribe({
      next: (response) => {
        console.log("Réponse de l'abonnement:", response);
        this.notificationsEnabled.set(true);
        // Forcer la détection de changements
        this.cdr.detectChanges();
        console.log(
          'Notifications activées avec succès, état:',
          this.notificationsEnabled()
        );
      },
      error: (error) => {
        console.error("Erreur lors de l'activation des notifications", error);
        this.notificationsEnabled.set(false);
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
        this.notificationsEnabled.set(false);
        // Forcer la détection de changements
        this.cdr.detectChanges();
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
        // Forcer la détection de changements
        this.cdr.detectChanges();
      });
  }
}
