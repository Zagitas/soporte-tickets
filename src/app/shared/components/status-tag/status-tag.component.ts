import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTagModule } from 'ng-zorro-antd/tag';

type Status = 'high' | 'medium' | 'low' | 'open' | 'in-progress' | 'done';

@Component({
  selector: 'app-status-tag',
  standalone: true,
  imports: [CommonModule, NzTagModule],
  template: `
    <nz-tag [nzColor]="getColor()">{{ getLabel() }}</nz-tag>
  `
})
export class StatusTagComponent {
  @Input() status!: Status;

  private statusConfig = {
    high: { color: 'red', label: 'High' },
    medium: { color: 'orange', label: 'Medium' },
    low: { color: 'blue', label: 'Low' },
    open: { color: 'blue', label: 'Open' },
    'in-progress': { color: 'orange', label: 'In Progress' },
    done: { color: 'green', label: 'Done' }
  };

  getColor(): string {
    return this.statusConfig[this.status]?.color || 'default';
  }

  getLabel(): string {
    return this.statusConfig[this.status]?.label || this.status;
  }
}
