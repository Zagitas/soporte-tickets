import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { TicketDetailComponent } from './features/tickets/pages/ticket-detail/ticket-detail.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tickets' },
  {
    path: 'tickets',
    loadComponent: () => import('./features/tickets/pages/ticket-list/ticket-list.component').then(m => m.TicketListComponent),
    canActivate: [MsalGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./features/administration/pages/new-users/new-users.component').then(m => m.UsersNewComponent),
    canActivate: [MsalGuard]
  },
  {
    path: 'new',
    loadComponent: () => import('./features/tickets/pages/ticket-form/ticket-form.component').then(m => m.TicketFormComponent),
    canActivate: [MsalGuard]
  },
  {
    path: 'tickets/:id/edit',
    loadComponent: () =>
      import('./features/tickets/pages/ticket-detail/ticket-detail.component')
        .then(m => m.TicketDetailComponent),
    canActivate: [MsalGuard],
    data: { mode: 'edit' }
  },
  {
    path: 'tickets/:id',
    loadComponent: () =>
      import('./features/tickets/pages/ticket-detail/ticket-detail.component')
        .then(m => m.TicketDetailComponent)
  },
  {
    path: '**',
    redirectTo: 'tickets'
  }
];
