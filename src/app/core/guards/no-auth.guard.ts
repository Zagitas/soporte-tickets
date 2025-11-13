import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Injectable({ providedIn: 'root' })
export class NoAuthGuard implements CanActivate {
  constructor(private msal: MsalService, private router: Router) {}

  canActivate(): boolean {
    const acc = this.msal.instance.getActiveAccount()
      ?? this.msal.instance.getAllAccounts()[0];
    if (acc) {
      this.msal.instance.setActiveAccount(acc);
      this.router.navigate(['/tickets']);
      return false;
    }
    return true;
  }
}
