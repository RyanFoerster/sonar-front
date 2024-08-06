import {AfterViewInit, Component, inject, signal} from '@angular/core';
import {
  HlmCaptionComponent,
  HlmTableComponent,
  HlmTdComponent,
  HlmThComponent,
  HlmTrowComponent,
} from '@spartan-ng/ui-table-helm';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import {UsersService} from "../../shared/services/users.service";
import {UserEntity} from "../../shared/entities/user.entity";
import {map, tap} from "rxjs";


@Component({
  selector: 'app-user-validation',
  standalone: true,
  imports: [
    HlmCaptionComponent,
    HlmTableComponent,
    HlmTdComponent,
    HlmThComponent,
    HlmTrowComponent,
    HlmButtonDirective
  ],
  templateUrl: './user-validation.component.html',
  styleUrl: './user-validation.component.css'
})
export class UserValidationComponent implements AfterViewInit {

  private usersService: UsersService = inject(UsersService)

  protected usersPending = signal<UserEntity[] | []>([])
  protected _invoices = [
    {
      invoice: '000001',
      paymentStatus: 'test@test.be',
      totalAmount: 'La folie des concert',
      paymentMethod: 'La folie des concert',
    },
    {
      invoice: '89687585',
      paymentStatus: 'test@test.be',
      totalAmount: 'La croisière samuse',
      paymentMethod: 'La croisière samuse',
    },
    {
      invoice: '97646',
      paymentStatus: 'test@test.be',
      totalAmount: 'cest la fete',
      paymentMethod: 'cest la fete',
    },
  ];

  ngAfterViewInit() {
    this.usersService.findAllPendingUser().subscribe(data => this.usersPending.set(data))
  }

  toggleActiveUser(user: UserEntity) {

    this.usersService.toggleActiveUser(user).pipe(
      tap(() => {
        const filteredUsers = this.usersPending().filter(u => u.id !== user.id)
        this.usersPending.set(filteredUsers)
      })
    ).subscribe()
  }

  deleteUser(id: number) {
    this.usersService.deleteUser(id).pipe(
      tap(() => {
        const filteredUsers = this.usersPending().filter(u => u.id !== id)
        this.usersPending.set(filteredUsers)
      })
    ).subscribe()
  }

}
