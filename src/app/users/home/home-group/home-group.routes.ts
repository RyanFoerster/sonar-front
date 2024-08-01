import {Routes} from "@angular/router";
import {authGuard} from "../../../shared/guards/auth.guard";

export default [
  {
    path: ":id",
    loadComponent: () => import('./home-group.component').then((m) => m.HomeGroupComponent),
    canActivate: [authGuard]
  },
  {
    path: ":id/facturation",
    loadComponent: () => import('./facturation/facturation.component').then((m) => m.FacturationComponent),
    canActivate: [authGuard]
  },
  {
    path: ":id/facturation/new-quote",
    loadComponent: () => import('./facturation/new-quote/new-quote.component').then((m) => m.NewQuoteComponent),
    canActivate: [authGuard]
  },
  {
    path: ":id/membership",
    loadComponent: () => import('./membership/membership.component').then((m) => m.MembershipComponent),
    canActivate: [authGuard]
  },
  {
    path: ":id/project-account",
    loadComponent: () => import('./project-account/project-account.component').then((m) => m.ProjectAccountComponent),
    canActivate: [authGuard]
  },

] as Routes
