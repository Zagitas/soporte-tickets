import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTagModule } from 'ng-zorro-antd/tag'; // 👈 faltaba

import { TicketFiltersComponent } from '../../components/ticket-filters/ticket-filters.component';
import { TicketsTableComponent } from '../../components/tickets-table/tickets-table.component';
import { TicketsService } from '../../data/tickets.service';
import { ProjectsService } from '../../data/projects.service';
import { SelectOption, Ticket, TicketFilters } from '../../models/ticket.model';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { UsersService } from '../../data/users.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { TicketsCardComponent } from '../../components/tickets-cards/tickets-cards.component';

type SortDir = 'ascend' | 'descend' | null;

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule, NzCardModule, NzIconModule, NzTypographyModule, NzPaginationModule,
    NzPageHeaderModule, NzStatisticModule, NzDropDownModule, NzEmptyModule, NzToolTipModule,
    NzTagModule,
    NzMenuModule,
    NzModalModule,
    TicketFiltersComponent, TicketsTableComponent, TicketsCardComponent
  ],
  templateUrl: './ticket-list.component.html',
  styleUrls: ['./ticket-list.component.scss']
})
export class TicketListComponent implements OnInit {
  private router = inject(Router);
  private ticketsSvc = inject(TicketsService);
  private projectsSvc = inject(ProjectsService);
  private usersSvc = inject(UsersService);
  private modal: NzModalService = inject(NzModalService);
  private route = inject(ActivatedRoute);

  density: 'default' | 'small' = 'small';
  loading = false;

  kpis = { open: 0, inProgress: 0, closed: 0, breachedSla: 0 };

  projects: SelectOption[] = [];
  projectsLoading = false;
  statuses: SelectOption[] = [];
  statusLoading = false;
  priorities: SelectOption[] = [
    { label: 'Critical', value: 'critical' },
    { label: 'High',     value: 'high' },
    { label: 'Medium',   value: 'medium' },
    { label: 'Low',      value: 'low' }
  ];

  private allTickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  pagedTickets: Ticket[] = [];

  filters: TicketFilters = {};

  private sortField?: keyof Ticket;
  private sortDir: SortDir = null;

  pageIndex = 1;
  pageSize = 5;
  pageSizeOptions = [5, 8, 10];

  isMobile = false;
  
  constructor(private bo: BreakpointObserver) {
    this.bo.observe([Breakpoints.Handset]).subscribe(r => {
      this.isMobile = r.matches;
    });
  }

  ngOnInit(): void {
    this.loadProjects();
    this.loadStatus();
    this.loadTicketsFromApi();
  }

  private loadProjects(): void {
    this.projectsLoading = true;
    this.projectsSvc.listProjects().subscribe({
      next: (opts) => { this.projects = opts; },
      error: err => { console.error('Projects load error', err); this.projects = []; },
      complete: () => (this.projectsLoading = false)
    });
  }
  
  private loadStatus(): void {
    this.statusLoading = true;
    this.projectsSvc.listStatus().subscribe({
      next: (opts) => { this.statuses = opts; },
      error: err => { console.error('Status load error', err); this.statuses = []; },
      complete: () => (this.statusLoading = false)
    });
  }

  private loadTicketsFromApi(): void {
    this.loading = true;
    this.ticketsSvc.listTickets({ page: 1, pageSize: 200 }).subscribe({
      next: rows => {
        this.allTickets = rows ?? [];
        this.pageIndex = 1;
        this.applyLocalFilters();
      },
      error: _ => {
        this.allTickets = [];
        this.pageIndex = 1;
        this.applyLocalFilters();
      },
      complete: () => { this.loading = false; }
    });
  }

  onFiltersChange(f: TicketFilters) {
    this.filters = {
      proyecto:  (f.proyecto  ?? '').toString(),
      estado:    (f.estado    ?? '') as any,
      prioridad: (f.prioridad ?? '') as any,
      busqueda:  (f.busqueda  ?? '')
    };
    this.pageIndex = 1;
    this.applyLocalFilters();
  }

  get appliedChips() {
    const chips: Array<{key: keyof TicketFilters, label: string, value: string}> = [];
    if (this.filters?.proyecto)  chips.push({ key: 'proyecto',  label: 'Proyecto',  value: String(this.filters.proyecto) });
    if (this.filters?.estado)    chips.push({ key: 'estado',    label: 'Estado',    value: String(this.filters.estado) });
    if (this.filters?.prioridad) chips.push({ key: 'prioridad', label: 'Prioridad', value: String(this.filters.prioridad) });
    if ((this.filters?.busqueda ?? '').trim()) chips.push({ key: 'busqueda', label: 'Búsqueda', value: String(this.filters.busqueda) });
    return chips;
  }

  removeFilterChip(key: keyof TicketFilters) {
    this.filters = { ...this.filters, [key]: '' };
    this.onFiltersChange(this.filters);
  }
  clearAllFilters() {
    this.filters = { proyecto: '', estado: '', prioridad: '', busqueda: '' };
    this.onFiltersChange(this.filters);
  }

  private applyLocalFilters(): void {
    const { proyecto, estado, prioridad, busqueda } = this.filters;
    const q = (busqueda ?? '').trim().toLowerCase();

    let rows = [...this.allTickets];

    if (proyecto) {
      const p = proyecto.toLowerCase();
      rows = rows.filter(t =>
        (t.projectSlug && t.projectSlug.toLowerCase() === p) ||
        (t.projectName && t.projectName.toLowerCase() === p)
      );
    }
    if (estado)     rows = rows.filter(t => t.status   === estado);
    if (prioridad)  rows = rows.filter(t => t.priority === prioridad);
    if (q) {
      rows = rows.filter(t =>
        (t.title ?? '').toLowerCase().includes(q) ||
        String(t.id).toLowerCase().includes(q)    ||
        (t.projectName ?? '').toLowerCase().includes(q)
      );
    }

    rows = this.applySort(rows);

    this.filteredTickets = rows;
    this.computeKpis();
    this.paginate();
  }

  private applySort(rows: Ticket[]): Ticket[] {
    if (!this.sortField || !this.sortDir) return rows;
    const dir = this.sortDir === 'ascend' ? 1 : -1;
    const field = this.sortField as string;

    return [...rows].sort((a: any, b: any) => {
      const va = a?.[field]; const vb = b?.[field];
      if (va == null && vb == null) return 0;
      if (va == null) return -1 * dir;
      if (vb == null) return  1 * dir;
      if (typeof va === 'string' && typeof vb === 'string') {
        return va.localeCompare(vb) * dir;
      }
      return (va > vb ? 1 : va < vb ? -1 : 0) * dir;
    });
  }

  private paginate(): void {
    const total = this.filteredTickets.length;

    if (total === 0) {
      this.pageIndex = 1;
      this.pagedTickets = [];
      return;
    }

    const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.pageIndex > totalPages) this.pageIndex = totalPages;

    const start = (this.pageIndex - 1) * this.pageSize;
    const end   = start + this.pageSize;
    this.filteredTickets = this.filteredTickets.map(t => {
      const statusObj = this.statuses.find(s => s.value === t.status);
      return {
        ...t,
        statusLabel: statusObj ? statusObj.label : null
      };
    });
    this.pagedTickets = this.filteredTickets.slice(start, end);

    if (this.usersSvc.idUserRol === 1 || this.usersSvc.idUserRol === 2 ) {
      this.pagedTickets = this.pagedTickets.filter(t => t.created_email === this.usersSvc.userEmail);
    } else if (this.usersSvc.idUserRol === 3 ) {
      this.pagedTickets = this.pagedTickets.filter(t => t.assigned_email === this.usersSvc.userEmail);
    }
  }

  onPageChange(newIndex: number) {
    this.pageIndex = newIndex;
    this.paginate();
  }
  onPageSizeChange(newSize: number) {
    this.pageSize = newSize;
    this.pageIndex = 1;
    this.paginate();
  }

  private computeKpis() {
    const data = this.filteredTickets;
    this.kpis.open       = data.filter(t => t.status === 'OPEN').length;
    this.kpis.inProgress = data.filter(t => t.status === 'IN_PROGRESS').length;
    this.kpis.closed     = data.filter(t => t.status === 'CLOSED').length;
    this.kpis.breachedSla= data.filter(t => (t as any).slaBreached === true).length;
  }

  get rangeStart() { return this.filteredTickets.length ? (this.pageIndex - 1) * this.pageSize + 1 : 0; }
  get rangeEnd()   { return Math.min(this.pageIndex * this.pageSize, this.filteredTickets.length); }

  refresh() { this.loadTicketsFromApi(); }
  newTicket() { this.router.navigate(['/tickets', 'new']); }

  exportCSV() {
    const rows = this.filteredTickets;
    const headers = ['id','projectName','title','priority','status','assignedTo','createdDate'];
    const lines = [
      headers.join(','),
      ...rows.map(r => ([
        r.id,
        wrap(r.projectName),
        wrap(r.title),
        r.priority,
        r.status,
        wrap(r.assignedTo?.name ?? ''),
        r.createdDate ? new Date(r.createdDate).toISOString() : ''
      ].join(',')))
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `tickets_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);

    function wrap(v: any) {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    }
  }

  onSortChange(e: { field: keyof Ticket, dir: SortDir }) {
    this.sortField = e.field;
    this.sortDir = e.dir;
    this.applyLocalFilters();
  }

  onTicketView(t: Ticket) {
    const id = String(t.id || '').replace(/^#/, '');
    this.router.navigate(['/tickets', id]);
  }

  onTicketEdit(t: Ticket) {
    const id = String(t.id || '').replace(/^#/, '');
    this.router.navigate(['/tickets', id, 'edit']);
  }

  onTicketDelete(t: Ticket) {
    this.loading = true;
    const id = String(t.id || '').replace(/^#/, '');
    this.ticketsSvc.deleteTicket({ number: id }).subscribe({
      next: rows => {
        this.showDeletedModal(id);
        this.refresh();
      },
      error: _ => {
        this.refresh();
      },
      complete: () => { this.loading = false; }
    });
  }

  private showDeletedModal(number: string): void {
    this.modal.success({
      nzTitle: 'Ticket eliminado',
      nzContent: 'El ticket' + number + ' fue eliminado correctamente.',
      nzOkText: 'Ir al listado',
      nzOnOk: () => this.router.navigateByUrl('/tickets')
    });
  }
}
