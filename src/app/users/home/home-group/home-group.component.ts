import {AfterViewInit, Component, computed, effect, inject, input, signal, WritableSignal} from '@angular/core';
import {lucideChevronRight, lucideEdit} from '@ng-icons/lucide';
import {HlmAspectRatioDirective} from '@spartan-ng/ui-aspectratio-helm';
import {HlmButtonDirective} from '@spartan-ng/ui-button-helm';
import {HlmIconComponent, provideIcons} from '@spartan-ng/ui-icon-helm';
import {CompteGroupeService} from "../../../shared/services/compte-groupe.service";
import {ComptePrincipalService} from "../../../shared/services/compte-principal.service";
import {CompteGroupeEntity} from "../../../shared/entities/compte-groupe.entity";
import {PrincipalAccountEntity} from "../../../shared/entities/principal-account.entity";
import {UsersService} from "../../../shared/services/users.service";
import {UserEntity} from "../../../shared/entities/user.entity";
import {EMPTY, switchMap, tap} from "rxjs";
import {RouterLink} from "@angular/router";
import {AuthService} from "../../../shared/services/auth.service";

@Component({
  selector: 'app-home-group',
  standalone: true,
  imports: [
    HlmAspectRatioDirective,
    HlmButtonDirective,
    HlmIconComponent,
    RouterLink,
  ],
  templateUrl: './home-group.component.html',
  styleUrl: './home-group.component.css',
  providers: [provideIcons({lucideEdit, lucideChevronRight})]
})
export class HomeGroupComponent implements AfterViewInit {

  id = input<number>()
  typeOfProjet = input<string>()
  projet: WritableSignal<CompteGroupeEntity | PrincipalAccountEntity | null> = signal(null)
  connectedUser: WritableSignal<UserEntity | null> = signal(null);



  private compteGroupeService: CompteGroupeService = inject(CompteGroupeService)
  private comptePrincipalService: ComptePrincipalService = inject(ComptePrincipalService)
  private authService: AuthService = inject(AuthService)
  private usersService: UsersService = inject(UsersService);

  async ngAfterViewInit() {
    await this.fetchUserProjectInfo()
  }

  async fetchUserProjectInfo() {
    this.usersService.getInfo().pipe(
      tap((data) => this.connectedUser.set(data)),
      switchMap(() => {
        // Une fois que les données de l'utilisateur sont récupérées, vérifiez le type de projet
        if (this.typeOfProjet() === "PRINCIPAL") {
          // Vérifiez les conditions pour le deuxième if
          if (this.connectedUser()?.role === 'ADMIN' || this.connectedUser()?.comptePrincipal.id == this.id()) {
            // Récupérez le groupe par ID
            return this.comptePrincipalService.getGroupById(this.id()).pipe(
              tap((data) => this.projet.set(data))
            );
          }
        } else if (this.typeOfProjet() === "GROUP") {
          for (let userProjet of this.connectedUser()?.userSecondaryAccounts || []) {
            if (this.connectedUser()?.role === 'ADMIN' || userProjet.id === this.id()) {
              return this.compteGroupeService.getGroupById(this.id()).pipe(
                tap((data) => this.projet.set(data))
              );
            }
          }
        }
        // Si aucune condition n'est remplie, renvoyez un observable vide
        return EMPTY; // ou `of(null)` si vous préférez
      })
    ).subscribe();
  }

}
