import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';

export interface User {
  id: string;
  name: string;
  avatar: string;
}

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule, NzAvatarModule],
  template: `
    <div class="user-avatar">
      <nz-avatar [nzSrc]="user.avatar"></nz-avatar>
      <span>{{user.name}}</span>
    </div>
  `,
  styles: [`
    .user-avatar {
      display: flex;
      align-items: center;
      gap: 8px;

      nz-avatar {
        flex-shrink: 0;
      }

      span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  `]
})
export class UserAvatarComponent {
  @Input() user!: User;
}
