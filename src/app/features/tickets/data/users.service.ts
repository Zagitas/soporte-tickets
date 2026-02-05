import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SelectOption, UserRol } from '../models/ticket.model';

// Ajusta estos nombres a lo que devuelva tu Flow / backend
interface FlowResponse {
  data?: { items?: any[] };
  items?: any[];
  ResultSets?: { Table1?: any[] };
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private url = environment.api.users.rol;
  private idUserRolSubject = new BehaviorSubject<number>(0);
  public idUserRol$ = this.idUserRolSubject.asObservable();
  userEmail: string = '';

  get idUserRol(): number {
    return this.idUserRolSubject.value;
  }

  set idUserRol(value: number) {
    this.idUserRolSubject.next(value);
  }

  userRol(body: {}): Observable<number> {
    return this.http.post<UserRol>(this.url, body).pipe(
      map(json => {
        this.idUserRol = json.role_id; 
        return json.role_id;
      })
    );
  }
}
