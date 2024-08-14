import {Routes} from '@angular/router';
import {authGuard} from './shared/guards/auth.guard';
import {activatedUserGuard} from "./shared/guards/activated-user.guard";
import {adminGuard} from "./shared/guards/admin.guard";
import {AccountBalanceComponent} from "./account-balance/account-balance.component";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import('./users/index/index.component').then((m) => m.IndexComponent)
  },
  {
    path: "login",
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: "register",
    loadComponent: () => import('./auth/register/register.component').then((m) => m.RegisterComponent)
  },
  {
    path: "forgotten-password",
    loadComponent: () => import('./auth/forgotten-password/forgotten-password.component').then((m) => m.ForgottenPasswordComponent)
  },
  {
    path: "home",
    loadChildren: () => import('./users/home/home.routes'),
    canActivate: [authGuard, activatedUserGuard]
  },
  {
    path: "rendez-vous",
    loadComponent: () => import('./users/rendez-vous/rendez-vous.component').then((m) => m.RendezVousComponent),
    canActivate: [authGuard]
  },
  {
    path: "profile",
    loadComponent: () => import('./users/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard, activatedUserGuard]
  },
  {
    path: "user-validation",
    loadComponent: () => import('./admin/user-validation/user-validation.component').then((m) => m.UserValidationComponent),
    canActivate: [authGuard, activatedUserGuard, adminGuard]
  },
  {
    path: "creating-new-users",
    loadComponent: () => import('./admin/creating-new-users/creating-new-users.component').then((m) => m.CreatingNewUsersComponent),
    canActivate: [authGuard, activatedUserGuard, adminGuard]
  },
  {
    path: "sepa-validation",
    loadComponent: () => import('./admin/sepa-validation/sepa-validation.component').then((m) => m.SepaValidationComponent),
    canActivate: [authGuard, activatedUserGuard, adminGuard]
  },
  {
    path: "diary",
    loadComponent: () => import('./users/diary/diary.component').then((m) => m.DiaryComponent),
    canActivate: [authGuard]
  },

  {
    path: "usage-policy",
    loadComponent: () => import('./usage-policy/usage-policy.component').then((m) => m.UsagePolicyComponent),
    canActivate: [authGuard]
  },
  {
    path: "privacy-policy",
    loadComponent: () => import('./privacy-policy/privacy-policy.component').then((m) => m.PrivacyPolicyComponent),
    canActivate: [authGuard]
  },
  {path: 'callback', component: AccountBalanceComponent},
];
