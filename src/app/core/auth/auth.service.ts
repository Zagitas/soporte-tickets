import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { scopesConfig } from './msal-config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private router: Router,
    private msalService: MsalService
  ) {}

  login(username: string, password: string): Observable<boolean> {
    // TODO: replace with real API call
    if (username === 'admin' && password === 'admin') {
      this.isAuthenticatedSubject.next(true);
      return of(true);
    }
    return of(false);
  }

  getApiAccessToken(): void {
    this.msalService.acquireTokenSilent(scopesConfig).subscribe({
      next: (result) => {
        const token = result.accessToken;
        console.log('Token para API:', token);
        // Aquí puedes almacenarlo si deseas: localStorage.setItem('apiToken', token);
      },
      error: (error) => {
        console.error('Error obteniendo token para API', error);
      }
    });
  }

  logout(): void {
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/']);
  }

  isLoggedIn(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  isLoggedInValue(): boolean {
    return this.isAuthenticatedSubject.value;
  }
}