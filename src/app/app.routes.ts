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
    }

];
