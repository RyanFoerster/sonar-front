import {Component, CUSTOM_ELEMENTS_SCHEMA, effect, inject, input, signal} from '@angular/core';
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
import {lucideAlertTriangle, lucideUndo2} from '@ng-icons/lucide';
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
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {PrincipalAccountEntity} from "../../../../shared/entities/principal-account.entity";
import {CompteGroupeEntity} from "../../../../shared/entities/compte-groupe.entity";
import {EventEntity} from '../../../../shared/entities/event.entity';
import {map, switchMap, tap} from "rxjs";
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
  providers: [provideIcons({lucideUndo2, lucideAlertTriangle})],
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

  protected reason = signal<string>("")
  protected selectedFilter = signal<"upcoming" | "past" | "hidden" | "all">("all")
  protected isUserAccepted = signal<Boolean>(false)

  protected createEventForm: FormGroup

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
            switchMap(() =>  {
              return this.eventService.getEventsByGroupId(this.accountGroup()?.id!)
            }),
            map(data => {
              let eventUser: EventEntity[] = []
              for (const event of data) {
                if(event.participants?.find(user => user.id === this.connectedUser()?.id)) {
                  eventUser.push(event)
                }

                if(event.organisateurs?.find(user => user.id === this.connectedUser()?.id)) {
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
          return event.status === "pending" || event.status === 'confirmed' && eventDate.getTime() > currentDate.getTime();
        } else if (filter === "past") {
          eventEndDate = new Date(event.end_time!);
          return eventEndDate.getTime() < currentDate.getTime() && event.status !== "hidden";
        } else if (filter === "hidden") {
          return event.status === "hidden";
        } else {
          return true;
        }
      }));
    }
  }

  userConfirmEvent() {
    this.eventService.userStatus(this.selectedEvent()!.id, this.connectedUser()!.id, "accepted").pipe(
      tap(() => {
        this.isUserAccepted.set(true)
      })
    )
      .subscribe()
  }

  userRefuseEvent() {
    this.eventService.userStatus(this.selectedEvent()!.id, this.connectedUser()!.id, "refused").pipe(
      tap(() => {
        this.isUserAccepted.set(false)
      })
    )
      .subscribe()
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
    }
  }

  checkUserOrganisateur() {
    return this.eventOrganisateur().find(user => user.email === this.connectedUser()?.email);
  }




}
