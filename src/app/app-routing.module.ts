import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard, MsalRedirectComponent } from '@azure/msal-angular';
import { LoginComponent } from './features/tickets/pages/login/login.component';
import { TicketListComponent } from './features/tickets/pages/ticket-list/ticket-list.component';
import { HomeGuard } from './core/guards/home.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
  { path: 'auth-redirect', component: MsalRedirectComponent },

  // Público: si hay sesión, NoAuthGuard redirige a /tickets antes de pintar el login
  { path: 'login', component: LoginComponent, canActivate: [NoAuthGuard] },

  {
    path: 'tickets',
    canActivate: [MsalGuard],
    loadChildren: () => import('./features/tickets-routing').then(m => m.TICKETS_ROUTES)
  },

  // Root -> login (NoAuthGuard decide si manda a tickets)
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // Wildcard
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule {}
