import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
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
  idUserRol: number = 0;
  userEmail: string = '';

  userRol(body: {}): Observable<number> {
    return this.http.post<UserRol>(this.url, body).pipe(
      map(json => {
        this.idUserRol = json.role_id;
        return json.role_id;
      })
    );
  }
}
