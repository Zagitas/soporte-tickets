import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TICKETS_ROUTES } from './tickets-routing';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(TICKETS_ROUTES)
  ]
})
export class TicketsModule {}
