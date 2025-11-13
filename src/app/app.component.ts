import { Component, inject, OnInit } from '@angular/core';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { RouterModule, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { UsersService } from './features/tickets/data/users.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet,
    RouterModule, 
    NzIconModule, 
    NzLayoutModule, 
    NzMenuModule,
    NzDropDownModule,
    NzToolTipModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  private usersSvc = inject(UsersService);
  isCollapsed = false;
  isLoggedIn = false;   // controla visibilidad del menú/layout
  isBooting  = true;    // evita cualquier render fugaz
  userName = '';
  userEmail = '';
  userRol = 0;
  loading = false;

  constructor(
    private msalService: MsalService,
    private msalBroadcast: MsalBroadcastService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // Procesa respuesta del redirect (NO navegar aquí)
      const result = await this.msalService.instance.handleRedirectPromise();
      const acc = result?.account
        ?? this.msalService.instance.getActiveAccount()
        ?? this.msalService.instance.getAllAccounts()[0];

      if (acc) this.msalService.instance.setActiveAccount(acc);
      this.isLoggedIn = !!acc;
    } finally {
      this.isBooting = false;
    }

    // Mantén isLoggedIn sincronizado cuando cambia el estado de interacción
    this.msalBroadcast.inProgress$
      .pipe(filter(s => s === InteractionStatus.None))
      .subscribe(() => {
        const acc = this.msalService.instance.getActiveAccount()
          ?? this.msalService.instance.getAllAccounts()[0];
        this.isLoggedIn = !!acc;
        this.userName = acc?.name || '';
        this.userEmail = acc?.username || '';
        console.log('Cambio de estado de interacción, isLoggedIn:', {acc});
        this.getUserRol();
        this.usersSvc.userEmail = this.userEmail;
        console.log('User rol after interaction change:', this.usersSvc.idUserRol);
      });
  }

  logout() {
    this.msalService.instance.logoutRedirect({
      account: this.msalService.instance.getActiveAccount(),
      postLogoutRedirectUri: '/login',
    });
  }

  getUserRol(): void {
    this.loading = true;
    this.usersSvc.userRol({ email: this.userEmail }).subscribe({
      next: rol => {
        this.userRol = rol;
        this.usersSvc.idUserRol = this.userRol;
      },
      error: err => {
        console.error('Error obteniendo el rol del usuario:', err);
        this.userRol = 0;
        this.usersSvc.idUserRol = 0;
      },
      complete: () => { this.loading = false; }
    });
  }
}
