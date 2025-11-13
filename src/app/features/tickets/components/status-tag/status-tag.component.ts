import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-status-tag',
  standalone: true,
  imports: [CommonModule, NzTagModule],
  template: `
    <nz-tag [nzColor]="getColor()">
      {{ status }}
    </nz-tag>
  `
})
export class StatusTagComponent {
  @Input() status: string = '';

  getColor(): string {
    const colors: { [key: string]: string } = {
      'OPEN': 'blue',
      'IN_PROGRESS': 'gold',
      'RESOLVED': 'green',
      'CLOSED': 'default'
    };
    return colors[this.status] || 'default';
  }
}
