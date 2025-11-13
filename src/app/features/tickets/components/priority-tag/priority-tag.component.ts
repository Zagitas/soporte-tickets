import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-priority-tag',
  standalone: true,
  imports: [CommonModule, NzTagModule],
  template: `
    <nz-tag [nzColor]="getColor()">
      {{ priority }}
    </nz-tag>
  `
})
export class PriorityTagComponent {
  @Input() priority: string = '';

  getColor(): string {
    const colors: { [key: string]: string } = {
      'critical': 'red',
      'high': 'volcano',
      'medium': 'gold',
      'low': 'green'
    };
    return colors[this.priority.toLowerCase()] || 'blue';
  }
}
