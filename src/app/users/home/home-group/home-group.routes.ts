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
    canActivate: [authGuard],
  },
  {
    path: ':id/facturation/new-quote',
    loadComponent: () =>
      import('./facturation/new-quote/new-quote.component').then(
        (m) => m.NewQuoteComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: ':id/facturation/new-invoice',
    loadComponent: () =>
      import('./facturation/new-invoice/new-invoice.component').then(
        (m) => m.NewInvoiceComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: ':id/facturation/new-credit-note',
    loadComponent: () =>
      import('./facturation/new-credit-note/new-credit-note.component').then(
        (m) => m.NewCreditNoteComponent
      ),
    canActivate: [authGuard],
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
    path: ':id/agenda',
    loadComponent: () =>
      import('../../../components/agenda/agenda.component').then(
        (m) => m.AgendaComponent
      ),
    canActivate: [authGuard],
  },
] as Routes;
