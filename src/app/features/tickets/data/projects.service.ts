import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SelectOption } from '../models/ticket.model';

// Ajusta estos nombres a lo que devuelva tu Flow / backend
interface FlowResponse {
  data?: { items?: any[] };
  items?: any[];
  ResultSets?: { Table1?: any[] };
}

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private http = inject(HttpClient);
  private urlProjects = environment.api.options.projects;
  private urlStatus = environment.api.options.status;
  private urlSupport = environment.api.options.support;

  listProjects(): Observable<SelectOption[]> {
    return this.http.post<FlowResponse>(this.urlProjects, {}).pipe(
      map(json => {
        const rows =
          json?.data?.items ??
          json?.items ??
          json?.ResultSets?.Table1 ??
          [];
        // Mapea a {label, value}. Usa las columnas reales de tu BD/Flow.
        return rows;
      })
    );
  }

  listStatus(): Observable<SelectOption[]> {
    return this.http.post<FlowResponse>(this.urlStatus, {}).pipe(
      map(json => {
        const rows =
          json?.data?.items ??
          json?.items ??
          json?.ResultSets?.Table1 ??
          [];
        // Mapea a {label, value}. Usa las columnas reales de tu BD/Flow.
        return rows;
      })
    );
  }

  listSupport(): Observable<SelectOption[]> {
    return this.http.post<FlowResponse>(this.urlSupport, {}).pipe(
      map(json => {
        const rows =
          json?.data?.items ??
          json?.items ??
          json?.ResultSets?.Table1 ??
          [];
        // Mapea a {label, value}. Usa las columnas reales de tu BD/Flow.
        return rows;
      })
    );
  }
}
