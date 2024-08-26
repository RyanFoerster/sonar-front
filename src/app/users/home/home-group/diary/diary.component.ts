import {Component, CUSTOM_ELEMENTS_SCHEMA, effect, ElementRef, inject, input, signal, ViewChild} from '@angular/core';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {
  BrnDialogContentDirective,
  BrnDialogTitleDirective,
  BrnDialogTriggerDirective
} from '@spartan-ng/ui-dialog-brain';
import {
  HlmDialogComponent,
  HlmDialogContentComponent,
  HlmDialogDescriptionDirective,
  HlmDialogFooterComponent,
  HlmDialogHeaderComponent,
  HlmDialogTitleDirective,
} from '@spartan-ng/ui-dialog-helm';
import {HlmInputDirective} from '@spartan-ng/ui-input-helm';
import {HlmLabelDirective} from '@spartan-ng/ui-label-helm';
import {BrnSelectImports} from '@spartan-ng/ui-select-brain';
import {HlmSelectImports} from '@spartan-ng/ui-select-helm';
import {CalendarModule} from 'primeng/calendar';
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';

import {HlmCheckboxComponent} from '@spartan-ng/ui-checkbox-helm';
import {provideIcons} from '@ng-icons/core';
import {lucideAlertTriangle, lucideSend, lucideUndo2} from '@ng-icons/lucide';
import {HlmIconComponent} from '@spartan-ng/ui-icon-helm';
import {BrnMenuTriggerDirective} from '@spartan-ng/ui-menu-brain';
import {
  HlmMenuComponent,
  HlmMenuGroupComponent,
  HlmMenuItemCheckboxDirective,
  HlmMenuItemCheckComponent,
  HlmMenuItemDirective,
  HlmMenuItemIconDirective,
  HlmMenuItemRadioComponent,
  HlmMenuItemRadioDirective,
  HlmMenuItemSubIndicatorComponent,
  HlmMenuLabelComponent,
  HlmMenuSeparatorComponent,
  HlmMenuShortcutComponent,
  HlmSubMenuComponent,
} from '@spartan-ng/ui-menu-helm';
import {ComptePrincipalService} from "../../../../shared/services/compte-principal.service";
import {CompteGroupeService} from "../../../../shared/services/compte-groupe.service";
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {PrincipalAccountEntity} from "../../../../shared/entities/principal-account.entity";
import {CompteGroupeEntity} from "../../../../shared/entities/compte-groupe.entity";
import {EventEntity} from '../../../../shared/entities/event.entity';
import {map, switchMap, take, tap} from "rxjs";
import {EventService} from "../../../../shared/services/event.service";
import {BrnSeparatorComponent} from "@spartan-ng/ui-separator-brain";
import {HlmSeparatorDirective} from "@spartan-ng/ui-separator-helm";
import {DatePipe, JsonPipe, NgClass} from "@angular/common";
import {UserEntity} from "../../../../shared/entities/user.entity";
import {AuthService} from "../../../../shared/services/auth.service";

import {
  BrnPopoverCloseDirective,
  BrnPopoverComponent,
  BrnPopoverContentDirective,
  BrnPopoverTriggerDirective,
} from '@spartan-ng/ui-popover-brain';
import {HlmPopoverCloseDirective, HlmPopoverContentDirective} from '@spartan-ng/ui-popover-helm';
import {HlmBadgeDirective} from '@spartan-ng/ui-badge-helm';
import {
  HlmAlertDescriptionDirective,
  HlmAlertDirective,
  HlmAlertIconDirective,
  HlmAlertTitleDirective,
} from '@spartan-ng/ui-alert-helm';
import {UsersService} from "../../../../shared/services/users.service";
import {EventDto} from "../../../../shared/dtos/event.dto";
import {CommentDto} from "../../../../shared/dtos/comment.dto";


@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [
    BrnMenuTriggerDirective,
    HlmMenuComponent,
    HlmSubMenuComponent,
    HlmMenuItemDirective,
    HlmMenuItemSubIndicatorComponent,
    HlmMenuLabelComponent,
    HlmMenuShortcutComponent,
    HlmMenuSeparatorComponent,
    HlmMenuItemIconDirective,
    HlmMenuItemCheckComponent,
    HlmMenuItemRadioComponent,
    HlmMenuGroupComponent,
    HlmMenuItemRadioDirective,
    HlmMenuItemCheckboxDirective,
    HlmIconComponent,
    HlmCheckboxComponent,
    HlmCaptionComponent,
    HlmTableComponent,
    HlmTdComponent,
    HlmThComponent,
    HlmTrowComponent,
    BrnSelectImports,
    HlmSelectImports,
    HlmButtonDirective,
    HlmDialogComponent,
    HlmDialogContentComponent,
    HlmDialogDescriptionDirective,
    HlmDialogFooterComponent,
    HlmDialogHeaderComponent,
    HlmDialogTitleDirective,
    HlmInputDirective,
    HlmLabelDirective,
    BrnDialogContentDirective,
    BrnDialogTriggerDirective,
    CalendarModule,
    BrnSeparatorComponent,
    HlmSeparatorDirective,
    NgClass,
    DatePipe,
    JsonPipe,
    BrnPopoverCloseDirective,
    BrnPopoverComponent,
    BrnPopoverContentDirective,
    BrnPopoverTriggerDirective,
    HlmPopoverCloseDirective, HlmPopoverContentDirective,
    HlmBadgeDirective, ReactiveFormsModule,
    HlmAlertDescriptionDirective,
    HlmAlertDirective,
    HlmAlertIconDirective,
    HlmAlertTitleDirective, BrnDialogTitleDirective,
  ],
  providers: [provideIcons({lucideUndo2, lucideAlertTriangle, lucideSend})],
  templateUrl: './diary.component.html',
  styleUrl: './diary.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DiaryComponent {

  private principalAccountService: ComptePrincipalService = inject(ComptePrincipalService)
  private groupAccountService: CompteGroupeService = inject(CompteGroupeService)
  private usersService: UsersService = inject(UsersService)
  private eventService: EventService = inject(EventService)
  private authService: AuthService = inject(AuthService)
  private formBuilder: FormBuilder = inject(FormBuilder)

  protected id = input<string>()
  protected typeOfProjet = input<string>()

  protected accountPrincipal = signal<PrincipalAccountEntity | undefined>(undefined)
  protected accountGroup = signal<CompteGroupeEntity | undefined>(undefined)
  protected connectedUser = signal<UserEntity | null>(null)
  protected usersGroup = signal<UserEntity[] | null>(null)
  protected events = signal<EventEntity[]>([])
  protected filteredEvents = signal<EventEntity[]>([])
  protected selectedEvent = signal<EventEntity | null>(null)
  protected eventOrganisateur = signal<UserEntity[]>([])
  protected userSelectedToBeInvited = signal<UserEntity[]>([])
  protected filteredUserInvited = signal<UserEntity[]>([])

  protected reason = signal<string>("")
  protected comment = signal<string>("")
  protected selectedFilter = signal<"upcoming" | "past" | "hidden" | "all">("all")
  protected userInvitedFilter = signal<"invited" | "accepted" | "refused" | "all">("all")
  protected isUserAccepted = signal<Boolean | undefined>(undefined)
  protected isSameParticipants = signal<Boolean>(false)
  protected isSameDate = signal<Boolean>(false)

  protected createEventForm: FormGroup
  protected updateEventForm: FormGroup
  protected duplicateEventForm: FormGroup

  @ViewChild('commentInput') commentInput!: ElementRef;

  constructor() {
    effect(() => {
      this.connectedUser.set(this.authService.getUser())
      if (this.typeOfProjet() === "PRINCIPAL") {
        this.principalAccountService.getGroupById(+this.id()!)
          .pipe(
            tap(data => {
              this.accountPrincipal.set(data);
            }),
            switchMap(() => {
              return this.eventService.getEventsByGroupId(+this.id()!)
            }),
            tap(data => {
              this.events.set(data);
              this.selectedEvent.set(data[0]);
            })
          )
          .subscribe()
      } else if (this.typeOfProjet() === "GROUP") {
        this.groupAccountService.getGroupById(+this.id()!)
          .pipe(
            tap(data => {
              this.accountGroup.set(data);
            }),
            switchMap(() => {
              return this.eventService.getEventsByGroupId(this.accountGroup()?.id!)
            }),
            map(data => {
              let eventUser: EventEntity[] = []
              for (const event of data) {
                if (event.participants?.find(user => user.id === this.connectedUser()?.id)) {
                  eventUser.push(event)
                }

                if (event.organisateurs?.find(user => user.id === this.connectedUser()?.id)) {
                  eventUser.push(event)
                }
              }

              return eventUser.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
            }),
            tap((data: EventEntity[]) => {
              console.log(data);
              this.events.set(data);
              this.filterEvents("upcoming");
              this.selectedEvent.set(this.filteredEvents()[0]);
              this.selectedEvent()?.user_status
              const findedUser = this.selectedEvent()?.user_status?.find(user => user.user_id === this.connectedUser()?.id)
              if (findedUser) {
                this.isUserAccepted.set(findedUser.status === "accepted")
              }
              this.eventOrganisateur.update((value) => [...value, ...this.selectedEvent()?.organisateurs!]);
            })
          )
          .subscribe()
      }

      this.usersService.getAllUsersGroup(+this.id()!)
        .subscribe(data => {
          this.usersGroup.set(data);
        })

    }, {
      allowSignalWrites: true
    });

    this.createEventForm = this.formBuilder.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      location: ['', Validators.required],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      rendez_vous_date: ['', Validators.required],
      organisateurs_ids: [[]],
      invitations_ids: [[]],
    })

    this.updateEventForm = this.formBuilder.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      location: ['', Validators.required],
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
      rendez_vous_date: ['', Validators.required],
    })

    this.duplicateEventForm = this.formBuilder.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      location: ['', Validators.required],
      start_time: [''],
      end_time: [''],
      rendez_vous_date: [''],
      organisateurs_ids: [[]],
      invitations_ids: [[]],
    })
  }

  date1: Date | undefined;

  date2: Date | undefined;

  date3: Date | undefined;

  protected _invoices = [
    {
      invoice: 'INV001',
      paymentStatus: 'Paid',
      totalAmount: '$250.00',
      paymentMethod: 'Credit Card',
    },
    {
      invoice: 'INV002',
      paymentStatus: 'Pending',
      totalAmount: '$150.00',
      paymentMethod: 'PayPal',
    },
    {
      invoice: 'INV003',
      paymentStatus: 'Unpaid',
      totalAmount: '$350.00',
      paymentMethod: 'Bank Transfer',
    },
  ]

  setSelectedEvent(event: EventEntity) {
    this.selectedEvent.set(event);
    this.eventOrganisateur.set(event.organisateurs)
    const findedUser = this.selectedEvent()?.user_status?.find(user => user.user_id === this.connectedUser()?.id)
    if (findedUser) {
      this.isUserAccepted.set(findedUser.status === "accepted")
    }
    console.log(this.selectedEvent())
  }

  setReason($event: any) {
    this.reason.set($event.target.value);
  }

  confirmEvent() {
    this.eventService.confirm(this.selectedEvent()!.id, this.selectedEvent()!)
      .subscribe(() => {
        this.selectedEvent()!.status = "confirmed";
      })
  }

  cancelEvent() {
    if (this.reason() === "") {
      alert("Veuillez entrer une raison pour annuler l'évènement");
      return;
    }
    this.eventService.cancel(this.selectedEvent()!.id, this.reason())
      .subscribe(() => {
        this.selectedEvent()!.status = "canceled";
      })
  }

  hideEvent() {
    if (this.reason() === "") {
      alert("Veuillez entrer une raison pour annuler l'évènement");
      return;
    }
    this.eventService.hide(this.selectedEvent()!.id, this.reason())
      .subscribe(() => {
        this.selectedEvent()!.status = "hidden";
      })
  }

  filterEvents(filter: "upcoming" | "past" | "hidden" | "all") {

    const currentDate = new Date();
    let eventDate
    let eventEndDate
    if (this.selectedFilter() === filter) {
      this.selectedFilter.set("all");
    } else {
      this.selectedFilter.set(filter);
      this.filteredEvents.set(this.events().filter(event => {
        if (filter === "upcoming") {
          eventDate = new Date(event.start_time);
          return eventDate.getTime() > currentDate.getTime() && event.status === "pending" || event.status === 'confirmed'
        } else if (filter === "past") {
          eventEndDate = new Date(event.end_time!);
          return eventEndDate.getTime() < currentDate.getTime() && event.status !== "hidden";
        } else if (filter === "hidden") {
          return event.status === "hidden";
        } else {
          return true;
        }
      }).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()))
    }
  }

  userConfirmEvent(user: UserEntity) {
    this.eventService.userStatus(this.selectedEvent()!.id, user.id, "accepted").pipe(
      tap(() => {
        if(user.id === this.connectedUser()?.id) {
          this.isUserAccepted.set(true);
        }
        const userStatus = this.selectedEvent()?.user_status;
        const userId = user.id
        const existingStatusIndex = userStatus?.findIndex(status => status.user_id === userId);

        if (existingStatusIndex !== -1 && existingStatusIndex !== undefined) {
          // Replace the status at the found index
          userStatus![existingStatusIndex] = {user_id: userId, status: "accepted"};
        } else {
          // If not found, push the new status
          userStatus?.push({user_id: userId, status: "accepted"});
        }
      })
    ).subscribe();
  }

  userRefuseEvent(user: UserEntity) {
    this.eventService.userStatus(this.selectedEvent()!.id, user.id, "refused").pipe(
      tap(() => {
        if(user.id === this.connectedUser()?.id) {
          this.isUserAccepted.set(false);
        }
        const userStatus = this.selectedEvent()?.user_status;
        const userId = user.id
        const existingStatusIndex = userStatus?.findIndex(status => status.user_id === userId);

        if (existingStatusIndex !== -1 && existingStatusIndex !== undefined) {
          // Replace the status at the found index
          userStatus![existingStatusIndex] = {user_id: userId, status: "refused"};
          console.log(this.selectedEvent())
        } else {
          // If not found, push the new status
          userStatus?.push({user_id: userId, status: "refused"});
        }
      })
    ).subscribe();
  }

  createEvent(ctx: any) {
    if (this.createEventForm.valid) {
      if (this.createEventForm.value.organisateurs_ids.length === 0) {
        alert("Veuillez sélectionner au moins un organisateur");
        return;
      }

      console.log(this.createEventForm.value)

      this.eventService.create(this.createEventForm.value, this.accountGroup()!.id).subscribe(event => {
        this.events.set([...this.events(), event]);
        this.filterEvents("upcoming");
        this.selectedEvent.set(event);
        this.createEventForm.reset();
        ctx.close();
      })
    } else if (this.duplicateEventForm.valid) {
      let eventDto: EventDto = {}


      eventDto.title = this.duplicateEventForm.value.title;
      eventDto.description = this.duplicateEventForm.value.description;
      eventDto.location = this.duplicateEventForm.value.location;

      if (this.isSameDate()) {
        eventDto.start_time = this.selectedEvent()?.start_time!;
        eventDto.end_time = this.selectedEvent()?.end_time;
        eventDto.rendez_vous_date = this.selectedEvent()?.rendez_vous_date!;
      } else {
        if (!this.duplicateEventForm.value.start_time || !this.duplicateEventForm.value.end_time || !this.duplicateEventForm.value.rendez_vous_date) {
          alert("Veuillez remplir les champs de date")
          return;
        }
        eventDto.start_time = this.duplicateEventForm.value.start_time;
        eventDto.end_time = this.duplicateEventForm.value.end_time;
        eventDto.rendez_vous_date = this.duplicateEventForm.value.rendez_vous_date;
      }

      if (this.isSameParticipants()) {
        eventDto.organisateurs_ids = this.selectedEvent()?.organisateurs!.map(organisateur => organisateur.id)
        eventDto.invitations_ids = this.selectedEvent()?.invitation!.map(invitation => invitation.user.id)
      } else {
        eventDto.organisateurs_ids = this.duplicateEventForm.value.organisateurs_ids
        eventDto.invitations_ids = this.duplicateEventForm.value.invitations_ids
      }

      console.log(eventDto)
      this.eventService.create(eventDto, this.accountGroup()!.id).subscribe(event => {
        if(event.organisateurs.find(user => user.id === this.connectedUser()?.id)) {
          this.events.set([...this.events(), event]);
          this.filterEvents("upcoming");
          this.selectedEvent.set(event);
        }
        this.createEventForm.reset();
        ctx.close();
      })
    }
  }

  checkUserOrganisateur() {
    return this.eventOrganisateur().find(user => user.email === this.connectedUser()?.email);
  }

  setInvitation(user: UserEntity) {

    if (this.userSelectedToBeInvited().includes(user)) {
      this.userSelectedToBeInvited.set(this.userSelectedToBeInvited().filter(userInArray => userInArray.id !== user.id))
    } else {
      this.userSelectedToBeInvited.set([...this.userSelectedToBeInvited(), user])
    }


  }

  createInvitation(ctx: any) {
    if (this.userSelectedToBeInvited().length === 0) {
      alert("Veuillez sélectionner au moins un utilisateur");
      return;
    }
    for (const user of this.userSelectedToBeInvited()) {
      this.eventService.invite({eventId: this.selectedEvent()!.id, userId: user.id}).pipe(
        take(1),
      ).subscribe(
        data => {
          this.userSelectedToBeInvited.set([])
          this.selectedEvent()!.invitation.push(data)
          ctx.close()
        },
      )
    }
  }

  protected isUserInvolved(user: UserEntity): boolean {
    const event = this.selectedEvent();

    if (!event) {
      return false;
    }

    const isOrganisateur = this.eventOrganisateur().some(eu => eu.id === user.id);
    const isParticipant = event.participants?.some(eu => eu.id === user.id) || false;
    const isInvited = event.invitation?.some(eu => eu.id === user.id) || false;

    return isOrganisateur || isParticipant || isInvited;
  }

  setInfoForm() {
    this.updateEventForm.patchValue({
      title: this.selectedEvent()?.title,
      description: this.selectedEvent()?.description,
      location: this.selectedEvent()?.location,
      start_time: this.selectedEvent()?.start_time,
      end_time: this.selectedEvent()?.end_time,
      rendez_vous_date: this.selectedEvent()?.rendez_vous_date,
    })

  }

  setDuplicateInfoForm() {
    this.duplicateEventForm.patchValue({
      title: this.selectedEvent()?.title,
      description: this.selectedEvent()?.description,
      location: this.selectedEvent()?.location,

    })
  }

  updateEvent(ctx: any) {
    if (this.updateEventForm.valid) {
      const updatedEvent = this.updateEventForm.value as EventDto;
      this.eventService.update(this.selectedEvent()!.id as number, this.updateEventForm.value as EventDto).subscribe(event => {
        this.events.update((events) => {
          return [...events.filter(event => event.id !== this.selectedEvent()!.id), event]
        });
        this.selectedEvent.set(event);
        this.filterEvents("upcoming");
        this.filterEvents("upcoming");
        this.updateEventForm.reset();
        ctx.close();
      })
    }
  }

  isUserAcceptedEvent(participant: UserEntity) {
    return this.selectedEvent()?.user_status?.find(user => user.user_id === participant.id)?.status === "accepted"
  }

  isUserRefusedEvent(participant: UserEntity) {
    return this.selectedEvent()?.user_status?.find(user => user.user_id === participant.id)?.status === "refused"
  }

  filterUserInvited(filter: "invited" | "accepted" | "refused") {
    if (this.userInvitedFilter() === filter) {
      this.userInvitedFilter.set("all")
      return
    }

    this.userInvitedFilter.set(filter)
    if (this.userInvitedFilter() === "invited") {
      const invitations = this.selectedEvent()?.invitation
      this.filteredUserInvited.set(invitations!.filter(invitation => invitation.status === this.userInvitedFilter()).map(invitation => invitation.user))

    } else if (this.userInvitedFilter() === "accepted") {

      const acceptedParticipants = this.selectedEvent()?.participants!.filter(participant => this.isUserAcceptedEvent(participant))
      const acceptedOrganisateurs = this.selectedEvent()?.organisateurs!.filter(organisateur => this.isUserAcceptedEvent(organisateur))
      this.filteredUserInvited.set([...acceptedParticipants!, ...acceptedOrganisateurs!])
    } else if (this.userInvitedFilter() === "refused") {
      const refusedParticipants = this.selectedEvent()?.participants!.filter(participant => this.isUserRefusedEvent(participant))
      const refusedOrganisateurs = this.selectedEvent()?.organisateurs!.filter(organisateur => this.isUserRefusedEvent(organisateur))
      this.filteredUserInvited.set([...refusedParticipants!, ...refusedOrganisateurs!])
    }
  }

  sendComment() {
    if (this.comment() === "") {
      alert("Veuillez entrer un commentaire");
      return;
    }
    let commentDto: CommentDto = {
      content: this.comment(),
      userId: this.connectedUser()!.id,
      eventId: this.selectedEvent()!.id
    }

    this.eventService.createComment(commentDto).subscribe(comment => {
      this.selectedEvent()!.comments.push(comment);
      this.comment.set("");
      this.commentInput.nativeElement.value = "";
    })
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.sendComment();
      event.preventDefault(); // Empêche le retour à la ligne par défaut
    }
  }

  setComment($event: any) {
    this.comment.set($event.target.value);
  }
}
