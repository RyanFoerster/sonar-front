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

] as Routes
