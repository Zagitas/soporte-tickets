// features/tickets/tickets.routes.ts
import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

export const TICKETS_ROUTES: Routes = [
  {
    path: '',
    canActivateChild: [MsalGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./tickets/pages/ticket-list/ticket-list.component')
            .then(m => m.TicketListComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./tickets/pages/ticket-form/ticket-form.component')
            .then(m => m.TicketFormComponent),
        data: { mode: 'new' },
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./administration/pages/new-users/new-users.component')
            .then(m => m.UsersNewComponent),
        data: { mode: 'users' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./tickets/pages/ticket-detail/ticket-detail.component')
            .then(m => m.TicketDetailComponent),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./tickets/pages/ticket-detail/ticket-detail.component')
            .then(m => m.TicketDetailComponent),
        data: { mode: 'edit' },
      }
    ],
  },
];

