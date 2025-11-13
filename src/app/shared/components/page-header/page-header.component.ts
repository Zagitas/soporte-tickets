import { Component, Input } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [NzTypographyModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 nz-typography>{{ title }}</h1>
          <p *ngIf="subtitle" nz-typography nzType="secondary">{{ subtitle }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 24px;
    }
    
    .header-content {
      padding: 16px 0;
    }
    
    .title-section {
      h1 {
        margin-bottom: 8px;
      }
      
      p {
        margin-bottom: 0;
      }
    }
  `]
})
export class PageHeaderComponent {
  @Input() title!: string;
  @Input() subtitle?: string;
}
