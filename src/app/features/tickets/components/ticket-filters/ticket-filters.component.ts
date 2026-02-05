import {
  Component, EventEmitter, Input, Output,
  ChangeDetectionStrategy, OnInit,
  inject,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { SelectOption, TicketFilters, TicketPriority, TicketStatus } from '../../models/ticket.model';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { UsersService } from '../../data/users.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-ticket-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, NzFormModule, NzInputModule, NzSelectModule, NzIconModule],
  templateUrl: './ticket-filters.component.html',
  styleUrls: ['./ticket-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketFiltersComponent implements OnInit {
  @Input() projects: SelectOption[] = [];
  @Input() projectsLoading = false;
  @Input() statuses:   SelectOption[] = [];
  @Input() priorities: SelectOption[] = [];

  @Output() filtersChange = new EventEmitter<TicketFilters>();

  userRol: number = 0;
  private usersSvc = inject(UsersService);
    private destroyRef = inject(DestroyRef);
  
  proyecto:  string = '';
  estado:    TicketStatus | '' = '';
  prioridad: TicketPriority | '' = '';
  busqueda:  string = '';

  private search$ = new Subject<void>();

  ngOnInit(): void {
    // Subscribirse a cambios de rol reactivamente
    this.usersSvc.idUserRol$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(rol => {
      this.userRol = rol;
    });
    this.search$.pipe(debounceTime(300)).subscribe(() => this.emit());
    this.emit(); // primera carga
  }

  emit(): void {
    this.filtersChange.emit({
      proyecto:  (this.proyecto ?? '').toString(),
      estado:    this.estado ?? '',
      prioridad: this.prioridad ?? '',
      busqueda:  (this.busqueda ?? '').trim()
    });
  }

  onTextChange() { this.search$.next(); }

  get hasFilters(): boolean {
    return !!(this.proyecto || this.estado || this.prioridad || (this.busqueda || '').trim());
  }

  clear(): void {
    this.proyecto = '';
    this.estado = '';
    this.prioridad = '';
    this.busqueda = '';
    this.emit();
  }
}
