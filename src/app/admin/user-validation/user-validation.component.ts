import { AfterViewInit, Component, inject, signal } from '@angular/core';

import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { UsersService } from '../../shared/services/users.service';
import { UserEntity } from '../../shared/entities/user.entity';
import { tap } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-validation',
  standalone: true,
  imports: [HlmButtonDirective, FormsModule],
  templateUrl: './user-validation.component.html',
  styleUrl: './user-validation.component.css',
})
export class UserValidationComponent implements AfterViewInit {
  private usersService: UsersService = inject(UsersService);

  protected usersPending = signal<UserEntity[] | []>([]);
  protected searchQuery = signal<string>('');
  protected allUsers = signal<UserEntity[] | []>([]);

  ngAfterViewInit() {
    this.usersService.findAllPendingUser().subscribe((data) => {
      this.usersPending.set(data);
      this.allUsers.set(data);
    });
  }

  protected filterUsers(query: string) {
    this.searchQuery.set(query);
    if (!query) {
      this.usersPending.set(this.allUsers());
      return;
    }

    const searchLower = query.toLowerCase();
    const filtered = this.allUsers().filter(
      (user) =>
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
    );
    this.usersPending.set(filtered);
  }

  toggleActiveUser(user: UserEntity) {
    this.usersService
      .toggleActiveUser(user)
      .pipe(
        tap(() => {
          const filteredUsers = this.allUsers().filter((u) => u.id !== user.id);
          this.allUsers.set(filteredUsers);
          this.filterUsers(this.searchQuery());
        })
      )
      .subscribe();
  }

  deleteUser(id: number) {
    this.usersService
      .deleteUser(id)
      .pipe(
        tap(() => {
          const filteredUsers = this.allUsers().filter((u) => u.id !== id);
          this.allUsers.set(filteredUsers);
          this.filterUsers(this.searchQuery());
        })
      )
      .subscribe();
  }
}
