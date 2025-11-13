import { Routes } from "@angular/router";
import { TicketDetailComponent } from "./tickets/pages/ticket-detail/ticket-detail.component";
import { TicketFormComponent } from "./tickets/pages/ticket-form/ticket-form.component";
import { TicketKanbanComponent } from "./tickets/pages/ticket-kanban/ticket-kanban.component";
import { TicketListComponent } from "./tickets/pages/ticket-list/ticket-list.component";

const TICKETS_ROUTES: Routes = [
  { path: '', component: TicketListComponent },
  { path: 'new', component: TicketFormComponent },
  // Vista
  { path: ':id', component: TicketDetailComponent },
  // Edición (misma página, modo 'edit')
  { path: ':id/edit', component: TicketDetailComponent, data: { mode: 'edit' } },
  { path: 'tablero', component: TicketKanbanComponent }
];
