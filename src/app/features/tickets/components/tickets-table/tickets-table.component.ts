import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { Ticket } from '../../models/ticket.model';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

type SortDir = 'ascend' | 'descend' | null;
type TicketWithSla = Ticket & { slaBreached?: boolean } & { statusLabel?: string };

@Component({
  selector: 'app-tickets-table',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule, NzTagModule, NzAvatarModule, NzButtonModule, NzIconModule,
    NzDropDownModule, NzSpaceModule, NzToolTipModule, NzMenuModule, ScrollingModule,
    TimeAgoPipe
  ],
  templateUrl: './tickets-table.component.html',
  styleUrls: ['./tickets-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketsTableComponent {
  @Input() tickets: TicketWithSla[] = [];
  @Input() density: 'default' | 'small' = 'default';
  @Input() loading = false;

  /** Outputs separados para decidir modo */
  @Output() ticketView  = new EventEmitter<Ticket>();
  @Output() ticketEdit  = new EventEmitter<Ticket>();
  @Output() ticketDelete = new EventEmitter<Ticket>();
  @Output() sortChange = new EventEmitter<{ field: keyof Ticket, dir: SortDir }>();

  trackById = (_: number, t: Ticket) => t.id;

  sort(field: keyof Ticket, evt: any) {
    const dir: SortDir =
      evt === 'ascend' || evt?.value === 'ascend' ? 'ascend' :
      evt === 'descend' || evt?.value === 'descend' ? 'descend' : null;
    this.sortChange.emit({ field, dir });
  }

  prioColor(p?: string): string {
    switch (p) {
      case 'critical':
      case 'high':   return 'error';
      case 'medium': return 'warning';
      case 'low':    return 'default';
      default:       return 'default';
    }
  }
  statusColor(s?: string): string {
    switch (s) {
      case 'OPEN':         return 'processing';
      case 'IN_PROGRESS':  return 'warning';
      case 'RESOLVED':     return 'success';
      case 'CLOSED':       return 'default';
      default:             return 'default';
    }
  }
  prioDot(p?: string): string {
    switch (p) {
      case 'critical':
      case 'high':   return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low':    return '#22c55e';
      default:       return '#94a3b8';
    }
  }
  statusDot(s?: string): string {
    switch (s) {
      case 'OPEN':         return '#3b82f6';
      case 'IN_PROGRESS':  return '#f59e0b';
      case 'RESOLVED':     return '#10b981';
      case 'CLOSED':       return '#64748b';
      default:             return '#94a3b8';
    }
  }

  /** Handlers */
  onView(t: Ticket) { this.ticketView.emit(t); }
  onEdit(t: Ticket) { this.ticketEdit.emit(t); }

  duplicate(t: Ticket) {
    // Emítelo como "view" del duplicado o crea otro output si quieres manejarlo aparte
    this.ticketView.emit({ ...t, id: `${t.id}-copy` } as any);
  }

  initials(name?: string): string {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase()).join('');
  }
}
