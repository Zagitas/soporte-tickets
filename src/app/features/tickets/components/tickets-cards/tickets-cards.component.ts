import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'app-tickets-cards',
  standalone: true,
  templateUrl: './tickets-cards.component.html',
  styleUrls: ['./tickets-cards.component.scss'],
  imports: [
    NgIf,
    NgFor,
    DatePipe,
    NzCardModule,
    NzSkeletonModule,
    NzTagModule,
    NzAvatarModule,
    NzButtonModule,
    NzIconModule,
    NzToolTipModule
  ]
})
export class TicketsCardComponent {
  @Input() tickets: any[] = [];
  @Input() loading = false;

  @Output() ticketView = new EventEmitter<any>();
  @Output() ticketEdit = new EventEmitter<any>();

  trackById = (_: number, t: any) => t?.id;

  // ✅ helpers (copiados simples). Si ya tienes una lógica exacta en tu table,
  // puedes reemplazar estos returns por tu misma lógica.
  initials(name?: string): string {
    if (!name) return '';
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase())
      .join('');
  }

  statusColor(status: any): string {
    const s = String(status ?? '').toLowerCase();
    if (s.includes('close')) return 'default';
    if (s.includes('progress')) return 'blue';
    if (s.includes('open')) return 'green';
    if (s.includes('breach') || s.includes('sla')) return 'red';
    return 'blue';
  }

  prioColor(priority: any): string {
    const p = String(priority ?? '').toLowerCase();
    if (p.includes('high') || p.includes('alta')) return 'red';
    if (p.includes('medium') || p.includes('media')) return 'orange';
    if (p.includes('low') || p.includes('baja')) return 'green';
    return 'blue';
  }

  prioDot(priority: any): string {
    const p = String(priority ?? '').toLowerCase();
    if (p.includes('high') || p.includes('alta')) return '#ef4444';
    if (p.includes('medium') || p.includes('media')) return '#f59e0b';
    if (p.includes('low') || p.includes('baja')) return '#22c55e';
    return '#1677ff';
  }
}
