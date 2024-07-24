import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';

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
    },
    {
        path: "rendez-vous",
        loadComponent: () => import('./users/rendez-vous/rendez-vous.component').then((m) => m.RendezVousComponent),
        canActivate: [authGuard]
    },
    {
        path: "profile",
        loadComponent: () => import('./users/profile/profile.component').then((m) => m.ProfileComponent),
        canActivate: [authGuard]
    },
    {
        path: "user-validation",
        loadComponent: () => import('./user-validation/user-validation.component').then((m) => m.UserValidationComponent),
        canActivate: [authGuard]
    },
    {
        path: "creating-new-users",
        loadComponent: () => import('./creating-new-users/creating-new-users.component').then((m) => m.CreatingNewUsersComponent),
        canActivate: [authGuard]
    },
    {
        path: "sepa-validation",
        loadComponent: () => import('./sepa-validation/sepa-validation.component').then((m) => m.SepaValidationComponent),
        canActivate: [authGuard]
    },
    {
        path: "membership",
        loadComponent: () => import('./users/membership/membership.component').then((m) => m.MembershipComponent),
        canActivate: [authGuard]
    },

    }
];
