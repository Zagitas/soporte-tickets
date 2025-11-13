/* import { of } from "rxjs";
import { Estado, Prioridad, Ticket } from "../models/models";
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private data: Ticket[] = [
    { id: '001', proyecto: 'Website Redesign', titulo: 'Revamp homepage layout', prioridad: 'ALTA', estado: 'NUEVO', asignadoA: 'Jessica Lee', fechaCreacion: '2023-10-15' },
    // ...agrega 8-10 filas más
  ];

  list(params?: { proyecto?: string; estado?: Estado; prioridad?: Prioridad }) {
    // filtro básico
    return of(this.data.filter(t => (!params?.proyecto || t.proyecto===params.proyecto)
      && (!params?.estado || t.estado===params.estado)
      && (!params?.prioridad || t.prioridad===params.prioridad)));
  }

  getById(id: string){ return of(this.data.find(t => t.id===id)!); }
  create(payload: Ticket){ this.data = [payload, ...this.data]; return of(payload); }
  update(id: string, partial: Partial<Ticket>){
    this.data = this.data.map(t => t.id===id ? {...t, ...partial} : t);
    return of(this.data.find(t => t.id===id)!);
  }
}
 */