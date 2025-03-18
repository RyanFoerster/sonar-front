import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { activatedUserGuard } from './shared/guards/activated-user.guard';
import { adminGuard } from './shared/guards/admin.guard';
import { maintenanceGuard } from './shared/guards/maintenance.guard';
import { isLoggedInGuard } from './shared/guards/is-logged.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./users/index/index.component').then((m) => m.IndexComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login.component').then((m) => m.LoginComponent),
    canActivate: [maintenanceGuard, isLoggedInGuard],
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
    canActivate: [maintenanceGuard, isLoggedInGuard],
  },
  {
    path: 'forgotten-password',
    loadComponent: () =>
      import('./auth/forgotten-password/forgotten-password.component').then(
        (m) => m.ForgottenPasswordComponent
      ),
    canActivate: [maintenanceGuard, isLoggedInGuard],
  },
  {
    path: 'home',
    loadChildren: () => import('./users/home/home.routes'),
    canActivate: [maintenanceGuard, authGuard, activatedUserGuard],
  },
  {
    path: 'rendez-vous',
    loadComponent: () =>
      import('./users/rendez-vous/rendez-vous.component').then(
        (m) => m.RendezVousComponent
      ),
    canActivate: [maintenanceGuard, authGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./users/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
    canActivate: [maintenanceGuard, authGuard, activatedUserGuard],
  },
  {
    path: 'user-validation',
    loadComponent: () =>
      import('./admin/user-validation/user-validation.component').then(
        (m) => m.UserValidationComponent
      ),
    canActivate: [maintenanceGuard, authGuard, activatedUserGuard, adminGuard],
  },
  {
    path: 'creating-new-users',
    loadComponent: () =>
      import('./admin/creating-new-users/creating-new-users.component').then(
        (m) => m.CreatingNewUsersComponent
      ),
    canActivate: [maintenanceGuard, authGuard, activatedUserGuard, adminGuard],
  },
  {
    path: 'sepa-validation',
    loadComponent: () =>
      import('./admin/sepa-validation/sepa-validation.component').then(
        (m) => m.SepaValidationComponent
      ),
    canActivate: [maintenanceGuard, authGuard, activatedUserGuard, adminGuard],
  },
  {
    path: 'all-invoices',
    loadComponent: () =>
      import('./admin/all-invoices/all-invoices.component').then(
        (m) => m.AllInvoicesComponent
      ),
    canActivate: [maintenanceGuard, authGuard, activatedUserGuard, adminGuard],
  },
  {
    path: 'usage-policy',
    loadComponent: () =>
      import('./usage-policy/usage-policy.component').then(
        (m) => m.UsagePolicyComponent
      ),
    canActivate: [maintenanceGuard, authGuard],
  },
  {
    path: 'home-new-users',
    loadComponent: () =>
      import('./users/home-new-users/home-new-users.component').then(
        (m) => m.HomeNewUsersComponent
      ),
    canActivate: [maintenanceGuard, authGuard],
  },
  {
    path: 'meet',
    loadComponent: () =>
      import('./users/meet/meet.component').then((m) => m.MeetComponent),
    canActivate: [maintenanceGuard, authGuard],
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./privacy-policy/privacy-policy.component').then(
        (m) => m.PrivacyPolicyComponent
      ),
    canActivate: [maintenanceGuard, authGuard],
  },
  {
    path: 'ponto-connect',
    loadComponent: () =>
      import('./ponto-connect/ponto-connect.component').then(
        (m) => m.PontoConnectComponent
      ),
    canActivate: [maintenanceGuard, authGuard],
  },
  {
    path: 'quote-decision',
    loadComponent: () =>
      import('./quote-decision/quote-decision.component').then(
        (m) => m.QuoteDecisionComponent
      ),
    canActivate: [maintenanceGuard],
  },
  {
    path: 'notification-test',
    loadComponent: () =>
      import('./test/notification-test/notification-test.component').then(
        (m) => m.NotificationTestComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
