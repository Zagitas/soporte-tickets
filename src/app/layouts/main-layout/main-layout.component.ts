import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    NzIconModule,
    NzLayoutModule,
    NzMenuModule
  ],
  template: `
    <nz-layout class="app-layout">
      <nz-sider class="menu-sidebar"
        nzCollapsible
        nzWidth="256px"
        nzBreakpoint="md"
        [(nzCollapsed)]="isCollapsed"
        [nzTrigger]="null">
        <div class="sidebar-logo">
          <a href="https://ng.ant.design/" target="_blank">
            <img src="https://ng.ant.design/assets/img/logo.svg" alt="logo">
            <h1>Support Tickets</h1>
          </a>
        </div>
        <ul nz-menu nzTheme="dark" nzMode="inline" [nzInlineCollapsed]="isCollapsed">
          <li nz-menu-item nzMatchRouter>
            <a routerLink="/">
              <span nz-icon nzType="ordered-list"></span>
              <span>Tickets List</span>
            </a>
          </li>
          <li nz-menu-item nzMatchRouter>
            <a routerLink="/new">
              <span nz-icon nzType="plus"></span>
              <span>New Ticket</span>
            </a>
          </li>
        </ul>
      </nz-sider>
      <nz-layout>
        <nz-header>
          <div class="app-header">
            <span class="header-trigger" (click)="isCollapsed = !isCollapsed">
              <span class="trigger"
                nz-icon
                [nzType]="isCollapsed ? 'menu-unfold' : 'menu-fold'"
              ></span>
            </span>
          </div>
        </nz-header>
        <nz-content>
          <div class="inner-content">
            <router-outlet></router-outlet>
          </div>
        </nz-content>
      </nz-layout>
    </nz-layout>
  `,
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  isCollapsed = false;
}
