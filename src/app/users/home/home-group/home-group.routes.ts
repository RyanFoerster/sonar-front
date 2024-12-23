import { Routes } from '@angular/router';
import { authGuard } from '../../../shared/guards/auth.guard';
import { adminGuard } from '../../../shared/guards/admin.guard';

export default [
  {
    path: ':id',
    loadComponent: () =>
      import('./home-group.component').then((m) => m.HomeGroupComponent),
    canActivate: [authGuard],
  },
  {
    path: ':id/facturation',
    loadComponent: () =>
      import('./facturation/facturation.component').then(
        (m) => m.FacturationComponent
      ),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: ':id/facturation/new-quote',
    loadComponent: () =>
      import('./facturation/new-quote/new-quote.component').then(
        (m) => m.NewQuoteComponent
      ),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: ':id/facturation/credit-note',
    loadComponent: () =>
      import('./facturation/credit-note/credit-note.component').then(
        (m) => m.CreditNoteComponent
      ),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: ':id/membership',
    loadComponent: () =>
      import('./membership/membership.component').then(
        (m) => m.MembershipComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: ':id/project-account',
    loadComponent: () =>
      import('./project-account/project-account.component').then(
        (m) => m.ProjectAccountComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: ':id/diary',
    loadComponent: () =>
      import('./diary/diary.component').then((m) => m.DiaryComponent),
    canActivate: [authGuard],
  },
] as Routes;
