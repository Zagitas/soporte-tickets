import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, map, Observable } from 'rxjs';
import { Ticket, TicketPriority, TicketStatus } from '../models/ticket.model';
import { environment } from '../../../../environments/environment';
import { NzUploadFile } from 'ng-zorro-antd/upload';

export interface TicketQuery {
  proyecto?: string;
  estado?: TicketStatus | '';
  prioridad?: TicketPriority | '';
  busqueda?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateTicketQuery {
  projectSlug: string;
  title: string;
  description: string;
  priority: 'high'|'medium'|'low';
  status: string;
  assignedEmail?: string;
  createdByEmail?: string;
}

type FlowRow = any;
interface FlowResponse {
  data?: { rows?: FlowRow[] };
  tickets?: FlowRow[];
  ResultSets?: { Table1?: FlowRow[] };
}

export interface NormalizedAttachment {
  id: number;
  name: string;
  url?: string;
  size?: number | null;
  contentType?: string;
  createdBy?: string;
  createdOn?: string | null;
  spSite?: string;
  spServerRel?: string;
  spUniqueId?: string;
  webUrl?: string;

  // aliases opcionales
  itemId?: number;
  sp_item_id?: number;
  spItemId?: number;
}

type FilePayload =
  | { fileName: string; contentType?: string; size?: number; base64: string } // ya armado
  | NzUploadFile; 

export interface UploadBatchPayload {
  ticketNumber: string;
  uploadedByEmail?: string | null;
  files?: FilePayload[];                  // opcional (puedes mandar solo deleted)
  deleted?: Array<{ itemId: number }>;    // opcional
}

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private http = inject(HttpClient);
  private listUrl = environment.api.tickets.list;
  private createUrl = environment.api.tickets.create;
  private attachmentsUrl = environment.api.tickets.attachments;
  private detailUrl = environment.api.tickets.detail;
  private updateUrl = environment.api.tickets.update;
  private deleteUrl = environment.api.tickets.delete;
  private comboProjects = environment.api.options.projects;
  private comboStatus = environment.api.options.status;
  private comboUsers = environment.api.options.users;

  listTickets(q: TicketQuery): Observable<Ticket[]> {
    const body = {
      projectSlug: q.proyecto || '',
      status:     q.estado   || '',
      priority:   q.prioridad|| '',
      search:     q.busqueda || '',
      page:       q.page ?? 1,
      pageSize:   q.pageSize ?? 50
    };

    return this.http.post<any>(this.listUrl, body).pipe(
      map(json => {
        const rows = json?.data?.tickets ?? [];
        return rows.map(this.mapRowToTicket);
      })
    );
  }

  private mapRowToTicket(r: any): Ticket {
    const id = String(r.number ?? r.ticket_number ?? r.id ?? r.ticket_id ?? '');
    const created = r.created ?? r.created_at ?? r.createdDate ?? new Date().toISOString();

    return {
      id: id ? `#${id}` : '',
      projectName: r.project_name ?? r.project ?? r.projectLabel ?? '',
      projectSlug: r.project_slug ?? r.project_code ?? r.projectId ?? '',
      created_email: r.created_email || '',
      assigned_email: r.assigned_email || '',
      title: r.title ?? '',
      priority: String(r.priority ?? 'low').toLowerCase() as TicketPriority,
      status: String(r.status ?? 'OPEN') as TicketStatus,
      assignedTo: r.assigned || r.assignee || r.assigned_name
        ? { id: String(r.assigned_to ?? ''), name: r.assigned ?? r.assignee ?? r.assigned_name }
        : undefined,
      createdDate: created
    };
  }

  createTicket(payload: CreateTicketQuery): Observable<any> {
    return this.http.post(this.createUrl, payload);
  }

  pickTicketFromResponse(resp: any): any {
    if (resp?.data?.ticket) return resp.data.ticket;
    if (resp?.data) return resp.data;
    if (resp?.rows?.length) return resp.rows[0];
    if (resp?.ResultSets?.Table1?.length) return resp.ResultSets.Table1[0];
    return resp;
  }

  pickTicketNumber(resp: any, ticket?: any): string | undefined {
    return ticket?.number || ticket?.ticket_number || ticket?.ticketNo || ticket?.num ||
           resp?.ticketNumber || resp?.number;
  }

  // ----- Subidas & base64 -----
  private isNativeFile(x: any): x is File {
    return x && typeof x === 'object' && typeof x.name === 'string' && typeof x.size === 'number' && typeof x.slice === 'function';
  }

  private dataUrlToFile(dataUrl: string, name: string, typeHint?: string): File {
    const parts = dataUrl.split(',');
    if (parts.length < 2) throw new Error('dataURL inválido');
    const meta = parts[0] ?? '';
    const b64  = parts[1] ?? '';
    const mime = typeHint || (meta.match(/data:(.*?);base64/)?.[1] ?? 'application/octet-stream');
    const bin  = atob(b64);
    const len  = bin.length;
    const u8   = new Uint8Array(len);
    for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
    return new File([u8], name || 'file', { type: mime });
  }

  private async ensureFileFromUpload(item: NzUploadFile): Promise<File> {
    console.log('item: ', item);
    if (!item) throw new Error('item inválido');

    if (this.isNativeFile(item as any)) return item as any as File;

    const origin: File | undefined = (item as any).originFileObj;
    if (origin) return origin;

    const raw: File | undefined = (item as any).raw;
    if (raw && this.isNativeFile(raw)) return raw;

    const anyItem = item as any;
    const dataUrl = (typeof anyItem.thumbUrl === 'string' && anyItem.thumbUrl.startsWith('data:')) ? anyItem.thumbUrl
                  : (typeof anyItem.url      === 'string' && anyItem.url.startsWith('data:'))      ? anyItem.url
                  : undefined;
    if (dataUrl) return this.dataUrlToFile(dataUrl, item.name, item.type);

    if (typeof anyItem.url === 'string' && anyItem.url && !anyItem.url.startsWith('data:')) {
      const res = await fetch(anyItem.url);
      const blob = await res.blob();
      return new File([blob], item.name || 'file', { type: item.type || blob.type });
    }

    throw new Error(`originFileObj no disponible para ${item?.name ?? 'item'}`);
  }

  private async fileToBase64Pure(file: File): Promise<string> {
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      const chunk = 0x8000;
      let bin = '';
      for (let i = 0; i < bytes.length; i += chunk) {
        bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      return btoa(bin);
    } catch {
      const base64 = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => {
          const res = String(fr.result || '');
          resolve(res.split('base64,').pop() || '');
        };
        fr.onerror = reject;
        fr.readAsDataURL(file);
      });
      return base64;
    }
  }

  uploadFilesBatch(ticketNumber: string, files: NzUploadFile[], uploadedByEmail?: string): Observable<any> {
    const work = (async () => {
      const safe = (files || [])
        .filter(Boolean)
        .filter(f => typeof f.name === 'string' && f.name.length > 0);

      const payloadFiles = [];
      for (const item of safe) {
        const fileObj = await this.ensureFileFromUpload(item);
        const base64  = await this.fileToBase64Pure(fileObj);

        payloadFiles.push({
          fileName: item.name || fileObj.name,
          contentType: item.type || fileObj.type || 'application/octet-stream',
          size: item.size ?? fileObj.size ?? 0,
          base64
        });
      }

      if (!payloadFiles.length) return { status: 'ok', message: 'Sin archivos' };

      const body = {
        ticketNumber,
        uploadedByEmail: uploadedByEmail || '',
        files: payloadFiles
      };

      return await this.http.post(this.attachmentsUrl, body).toPromise();
    })();

    return from(work);
  }

  uploadFilesBatchV2(payload: UploadBatchPayload): Observable<any> {
    const work = (async () => {
      const { ticketNumber, uploadedByEmail, files = [], deleted = [] } = payload || ({} as UploadBatchPayload);

      // Normaliza archivos: admite NZ files y objetos ya con base64
      const payloadFiles: Array<{fileName:string; contentType:string; size:number; base64:string}> = [];

      for (const item of (files || []).filter(Boolean)) {
        const anyItem = item as any;

        // Caso 1: objeto ya preparado (tiene propiedades fileName/base64)
        if ('fileName' in anyItem || 'base64' in anyItem) {
          const fileName    = anyItem.fileName ?? anyItem.name ?? 'file';
          const contentType = anyItem.contentType || 'application/octet-stream';
          const size        = typeof anyItem.size === 'number' ? anyItem.size : 0;
          const base64      = typeof anyItem.base64 === 'string' ? anyItem.base64 : '';

          // si no hay base64, mejor sáltalo para no romper (o lanza error si prefieres)
          if (!base64 || base64.length === 0) {
            console.warn('[uploadFilesBatchV2] archivo sin base64, omitido:', fileName);
            continue;
          }

          payloadFiles.push({ fileName, contentType, size, base64 });
          continue; // MUY IMPORTANTE: no intentes tratarlo como NzUploadFile
        }

        // Caso 2: NzUploadFile => convertir a File y a base64
        const nz = item as NzUploadFile;
        const fileObj = await this.ensureFileFromUpload(nz);
        const base64  = await this.fileToBase64Pure(fileObj);
        payloadFiles.push({
          fileName: nz.name || fileObj.name,
          contentType: (nz.type || fileObj.type || 'application/octet-stream'),
          size: (nz.size ?? fileObj.size ?? 0),
          base64
        });
      }

      // Si no hay cambios, evita el POST
      if (!payloadFiles.length && !deleted.length) {
        return { status: 'ok', message: 'Sin cambios' };
      }

      // Construye body final (incluye deleted solo si hay)
      const body: any = {
        ticketNumber,
        uploadedByEmail: uploadedByEmail || '',
        files: payloadFiles
      };
      if (deleted.length) body.deleted = deleted;

      return await this.http.post(this.attachmentsUrl, body).toPromise();
    })();

    return from(work);
  }

  // ----- Detalle / Update / Combos -----
  getTicketDetail(q: { id: string | null, number: string | null }) {
    const body: any = q.number ? { number: q.number } : { id: q.id ? Number(q.id) : null };
    return this.http.post<any>(this.detailUrl, body).pipe(
      map(json => {
        const raw =
          json?.data?.ticket ??
          (Array.isArray(json?.data?.tickets) && json.data.tickets[0]) ??
          json?.ticket ??
          json?.ResultSets?.Table1?.[0] ?? null;
        if (!raw) return null;

        let attachments = raw.attachments || raw.files || raw.sharepoint_files || raw.annotations || [];
        if (!Array.isArray(attachments)) attachments = [];
        const mapped = attachments.map((a: any) => this.mapAnyToAttachment(a)).filter(Boolean);

        return {
          id: raw.id ?? raw.ticket_id ?? null,
          number: raw.number ?? raw.ticket_number ?? null,
          title: raw.title ?? '',
          description: raw.description ?? '',
          project: raw.project ?? raw.project_name ?? null,
          project_id: raw.project_id ?? null,
          project_slug: raw.project_slug ?? null,
          assigned: raw.assigned ?? raw.assignee ?? raw.assigned_name ?? '',
          assigned_to: raw.assigned_to ?? null,
          assigned_email: raw.assigned_email ?? null,
          status: String(raw.status_code ?? 'OPEN'),
          statusLabel: '' ,
          priority: String(raw.priority_code ?? 'low').toLowerCase(),
          created: raw.created ?? raw.created_at ?? raw.created_date ?? raw.createdDate ?? null,
          timeline: raw.timeline ?? [],
          attachments: mapped
        };
      })
    );
  }

  updateTicket(payload: {
    number: string | null,
    title: string,
    description: string,
    status: string,
    priority: string,
    project_id: string | null,
    assigned_to: string | null
  }) {
    return this.http.post(this.updateUrl, payload);
  }

  deleteTicket(payload: {
    number: string | null
  }) {
    return this.http.post(this.deleteUrl, payload);
  }

  getProjectOptions() {
    return this.http.post<any>(this.comboProjects, {}).pipe(
      map(r => Array.isArray(r?.items) ? r.items : [])
    );
  }
  
  getStatusOptions() {
    return this.http.post<any>(this.comboStatus, {}).pipe(
      map(r => Array.isArray(r?.items) ? r.items : [])
    );
  }

  getUserOptions() {
    return this.http.post<any>(this.comboUsers, {}).pipe(
      map(r => Array.isArray(r?.items) ? r.items : [])
    );
  }

  // ----- Utilidades públicas para template -----
  formatDate(iso?: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const da = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${da}`;
  }
  relTimeFrom(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso); if (Number.isNaN(d.getTime())) return '';
    const days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days <= 0) return 'Today'; if (days === 1) return '1 day ago'; return `${days} days ago`;
  }
  humanSize(b?: number) {
    const v = Number(b || 0); if (!v) return '';
    const u = ['B','KB','MB','GB','TB']; const i = Math.floor(Math.log(v)/Math.log(1024));
    return (v/Math.pow(1024,i)).toFixed(1) + ' ' + u[i];
  }

  // ----- Helpers descarga & normalización adjuntos -----
  public safeNum(x: any): number | null {
    return x == null ? null : Number(x);
  }
  public cleanUrl(u?: string): string | undefined {
    if (!u) return u;
    return u.replace(/\s/g, '%20');
  }
  public trimEndSlash(s?: string): string {
    return (s || '').replace(/\/+$/, '');
  }
  public bestDownloadUrl(att: Partial<NormalizedAttachment> & any): string {
    const site = this.trimEndSlash(att.spSite || att.sp_site_url);
    const rel  = att.spServerRel || att.sp_server_relative_url || att.serverRelativeUrl;
    const uidRaw = (att.spUniqueId || att.sp_unique_id || '').toString();
    const uid = uidRaw.replace(/[{}]/g, '');
    const web  = att.webUrl || att.web_url;
    const raw  = att.url || web || '';

    if (site && uid) return `${site}/_layouts/15/download.aspx?UniqueId=${encodeURIComponent(uid)}`;
    if (site && rel) {
      const sep = String(rel).startsWith('/') ? '' : '/';
      const base = `${site}${sep}${rel}`;
      return base.includes('?') ? `${base}&download=1` : `${base}?download=1`;
    }
    if (raw) return raw.includes('?') ? `${raw}&download=1` : `${raw}?download=1`;
    return '#';
  }

  public mapAnyToAttachment(a: any): NormalizedAttachment | null {
    if (!a) return null;

    // coalesce de posibles nombres del id
    const rawId =
      a.id ?? a.itemId ?? a.ItemId ?? a.sp_item_id ?? a.spItemId ?? a.UniqueId ?? a.uniqueId ?? null;
    const normId = Number(rawId ?? 0) || 0;

    const base: NormalizedAttachment = {
      id: normId,
      name: String(a.name ?? a.file_name ?? a.fileName ?? a.Title ?? 'file'),
      url: this.cleanUrl(a.downloadUrl ?? a.webUrl ?? a.url ?? a.web_url ?? a.serverRelativeUrl ?? a.sp_server_relative_url ?? '#'),
      size: this.safeNum(a.size ?? a.length ?? a.size_bytes),
      contentType: a.contentType ?? a.mimetype ?? a.file?.mimeType ?? a.content_type ?? '',
      createdBy: a.createdBy?.user?.displayName ?? a.created_by ?? a.uploaded_by_email ?? a.author ?? a.createdbyname ?? a.ownername ?? '',
      createdOn: a.createdDateTime ?? a.timeCreated ?? a.created ?? a.uploaded_at ?? a.createdon ?? null,
      spSite: a.sp_site_url,
      spServerRel: a.sp_server_relative_url ?? a.serverRelativeUrl,
      spUniqueId: a.sp_unique_id,
      webUrl: a.web_url ?? a.webUrl,

      // === aliases para no perder el id con otros nombres (útiles para tu readItemId) ===
      itemId: normId as any,      // opcional en la interface
      sp_item_id: normId as any,  // opcional en la interface
      spItemId: normId as any
    };

    return base;
  }
}
