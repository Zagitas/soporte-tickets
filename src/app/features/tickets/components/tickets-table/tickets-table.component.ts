import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { Ticket } from '../../models/ticket.model';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { UsersService } from '../../data/users.service';

type SortDir = 'ascend' | 'descend' | null;
type TicketWithSla = Ticket & { slaBreached?: boolean } & { statusLabel?: string };

@Component({
  selector: 'app-tickets-table',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule, NzTagModule, NzAvatarModule, NzButtonModule, NzIconModule,
    NzDropDownModule, NzSpaceModule, NzToolTipModule, NzMenuModule, NzProgressModule, ScrollingModule,
    TimeAgoPipe
  ],
  templateUrl: './tickets-table.component.html',
  styleUrls: ['./tickets-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketsTableComponent implements OnInit {
  @Input() tickets: TicketWithSla[] = [];
  @Input() density: 'default' | 'small' = 'default';
  @Input() loading = false;

  /** Outputs separados para decidir modo */
  @Output() ticketView  = new EventEmitter<Ticket>();
  @Output() ticketEdit  = new EventEmitter<Ticket>();
  @Output() ticketDelete = new EventEmitter<Ticket>();
  @Output() sortChange = new EventEmitter<{ field: keyof Ticket, dir: SortDir }>();
  
  userRol: number = 0;
  private usersSvc = inject(UsersService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Subscribirse a cambios de rol reactivamente
    this.usersSvc.idUserRol$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(rol => {
      this.userRol = rol;
    });
  }

  trackById = (_: number, t: Ticket) => t.id;

  updateTicketInTable(updated: Partial<TicketWithSla> & { id: string }) {
    const index = this.tickets.findIndex(t => t.id === updated.id);
    if (index === -1) return;

    this.tickets[index] = { ...this.tickets[index], ...updated };

    // Forzamos detección de cambios para OnPush
    this.tickets = [...this.tickets];
  }

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

  ticketProgress(t: Ticket): number {
    const estimated = (t as any).estimated_time;
    const spent = (t as any).time_spent;

    // ❌ Si faltan datos → 0%
    if (!estimated || !spent || estimated <= 0) {
      return 0;
    }

    // ✅ Progreso real
    const percent = Math.round((spent / estimated) * 100);

    // 🔒 Nunca más de 100
    return Math.min(percent, 100);
  }

  progressStatus(t: Ticket): 'normal' | 'active' | 'success' {
    switch (t.status) {
      case 'IN_PROGRESS':
        return 'active';
      case 'RESOLVED':
      case 'CLOSED':
        return 'success';
      default:
        return 'normal';
    }
  }

  progressTooltip(t: Ticket): string {
    const estimated = (t as any).estimated_time;
    const spent = (t as any).time_spent;

    if (!estimated || !spent) {
      return 'Sin información de tiempo';
    }

    return `Avance: ${this.ticketProgress(t)}%`;
  }

}
