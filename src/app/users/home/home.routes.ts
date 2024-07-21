import {Routes} from "@angular/router";
import {authGuard} from "../../shared/guards/auth.guard";

export default [
  {
    path: "",
    loadComponent: () => import('./home.component').then((m) => m.HomeComponent),
    canActivate: [authGuard]
  },
  {
    path: "home-group",
    loadChildren: () => import('./home-group/home-group.routes'),
    canActivate: [authGuard]
  },
] as Routes
