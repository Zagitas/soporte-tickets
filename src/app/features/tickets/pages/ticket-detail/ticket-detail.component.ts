import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { SelectOption, TicketPriority, TicketStatus } from '../../models/ticket.model';
import { firstValueFrom } from 'rxjs';
import { TicketsService } from '../../data/tickets.service';
import { EXTENSION_RECORD } from '../../../shared/interface/extension';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { UsersService } from '../../data/users.service';
import { ProjectsService } from '../../data/projects.service';

// type DetailTabKey = 'summary'|'timeline'|'attachments';
type DetailTabKey = 'summary'|'attachments';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    NzPageHeaderModule, NzCardModule, NzTabsModule, NzButtonModule, NzTagModule,
    NzGridModule, NzAvatarModule, NzDescriptionsModule, NzSelectModule, NzInputModule,
    NzListModule, NzMessageModule, NzIconModule, NzModalModule
  ],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketDetailComponent implements OnInit {

  supportTypes = [
    { label: 'Technical', value: 'technical' },
    { label: 'Billing', value: 'billing' },
    { label: 'General', value: 'general' }
  ];


  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public  tickets = inject(TicketsService);
  public  projectsSvc = inject(ProjectsService);
  private usersSvc = inject(UsersService);
  private msg = inject(NzMessageService);
  private fb = inject(FormBuilder);
  private modal: NzModalService = inject(NzModalService);
  userRol: number = 0;

  // Params / modo
  readonly id = signal<string | null>(null);
  readonly number = signal<string | null>(null);
  readonly mode = signal<'view'|'edit'>('view');

  // Estado UI
  readonly loading = signal(true);
  readonly saving  = signal(false);
  readonly activeTab = signal<DetailTabKey>('summary');
  readonly isEditMode = computed(() => this.mode() === 'edit');

  // Índice para <nz-tabset>
  readonly tabIndex = computed(() => {
    const k = this.activeTab();
    // return k === 'summary' ? 0 : (k === 'timeline' ? 1 : 2);
    return k === 'summary' ? 0 : 2;
  });
  onTabIndexChange(i: number) {
   // this.activeTab.set(i === 0 ? 'summary' : i === 1 ? 'timeline' : 'attachments');
    this.activeTab.set(i === 0 ? 'summary' : 'attachments');
  }

  // Datos
  readonly ticket = signal<any | null>(null);
  readonly projects = signal<SelectOption[]>([]);
  readonly status = signal<SelectOption[]>([]);
  readonly users    = signal<SelectOption[]>([]);
  readonly supports = signal<SelectOption[]>([]);

  // ===== Adjuntos (reactivo con señales) =====
  private originalAttachments = signal<any[]>([]);   // existentes del API (deben traer itemId/sp_item_id)
  private newFilesArr         = signal<any[]>([]);   // { fileName, contentType, size, base64, _isNew, name }
  private deletedItemIds      = signal<Set<number>>(new Set()); // ItemId de SharePoint a eliminar

  // Vista combinada: existentes (menos los marcados) + nuevos
  attachmentsView = computed<any[]>(() => {
    const deleted = this.deletedItemIds();
    const existing = this.originalAttachments().filter(a => !deleted.has(this.readItemId(a)));
    return [...existing, ...this.newFilesArr()];
  });

  // Form edición
  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    project_id: [null as number | null],
    assigned_to: [null as number | null],
    project_slug: [null as string | null],
    assigned_email: [null as string | null],
    status: [null as string | null],
    priority: ['low' as TicketPriority, Validators.required],
    supports: [null as string | null],
    request_date: [null as string | null],
    estimated_time: [null as number | null],
    time_spent: [null as number | null]
  });

  // Catálogos
  priorities: SelectOption[] = [
    {label: 'Critical', value: 'critical'},
    {label: 'High',     value: 'high'},
    {label: 'Medium',   value: 'medium'},
    {label: 'Low',      value: 'low'}
  ];

  // Cambios pendientes en adjuntos
  hasAttachmentChanges = computed(() =>
    this.newFilesArr().length > 0 || this.deletedItemIds().size > 0
  );

  async ngOnInit(): Promise<void> {
    const rp = this.route.snapshot.paramMap;
    const qp = this.route.snapshot.queryParamMap;

    this.id.set(rp.get('id') ?? qp.get('id'));
    this.number.set(this.id()); // si tu API usa 'number', aquí reusamos id

    const routeMode = (this.route.snapshot.data['mode'] as string) || '';
    const m = (qp.get('mode') || routeMode || 'view').toLowerCase();
    this.mode.set(m === 'edit' ? 'edit' : 'view');

    try {
      this.loading.set(true);

      const [proj, sta, usr, spp] = await Promise.all([
        firstValueFrom(this.tickets.getProjectOptions()),
        firstValueFrom(this.tickets.getStatusOptions()),
        firstValueFrom(this.tickets.getUserOptions()),
        firstValueFrom(this.projectsSvc.listSupport())
      ]);
      this.projects.set(proj ?? []);
      this.status.set(sta ?? []);
      this.users.set(usr ?? []);
      this.supports.set(spp ?? []);
      
      const detail = await firstValueFrom(
        this.tickets.getTicketDetail({ id: this.id(), number: this.number() })
      );
      this.setTicket(detail);

      if (detail) {
        const statusObj = this.status().find(s => s.value === detail.status);
        detail.statusLabel = statusObj ? statusObj.label : '';

        const supportsObj = this.supports().find(s => s.value === detail.supports);
        detail.supportsLabel = supportsObj ? supportsObj.label : '';
      }

      // Adjuntos originales
      const originals = Array.isArray(detail?.attachments)
        ? detail.attachments.map((a: any) => ({
            ...a, // <-- aquí ya viene id normalizado desde el service
            name: a.name || a.file_name || a.fileName || a.title || 'archivo',
            size: a.size ?? a.size_bytes ?? a.Size ?? null
          }))
        : [];
      this.originalAttachments.set(originals);
      this.newFilesArr.set([]);
      this.deletedItemIds.set(new Set());
      if (this.isEditMode() && detail) {
        this.form.patchValue({
          title: detail.title ?? '',
          description: detail.description ?? '',
          project_id: detail.project_id ?? null,
          assigned_to: detail.assigned_to ?? null,
          project_slug: detail.project_slug ?? null,
          assigned_email: detail.assigned_email ?? null,
          status: (detail.status).toUpperCase() ?? null,
          supports: (detail.supports).toUpperCase() ?? null,
          priority: (detail.priority || 'low') as TicketPriority,
          request_date: detail.request_date ?? null,
          estimated_time: detail.estimated_time ?? null,
          time_spent: detail.time_spent ?? null
        });
      }
      this.userRol = this.usersSvc.idUserRol;
    } catch (e: any) {
      console.error(e);
      this.msg.error('No se pudo cargar el detalle.');
    } finally {
      this.loading.set(false);
    }
  }

  private setTicket(detail: any | null) {
    if (!detail) {
      this.ticket.set(null);
      return;
    }

    const statusObj = this.status().find(s => s.value === detail.status);
    detail.statusLabel = statusObj ? statusObj.label : '';

    const supportsObj = this.supports().find(s => s.value === detail.supports);
    detail.supportsLabel = supportsObj ? supportsObj.label : '';
    
    this.ticket.set({
      ...detail,
      estimated_time: detail.estimated_time ?? null,
      time_spent: detail.time_spent ?? null
    });
  }

  // Navegación a edición: usar query param ?mode=edit
  goEdit(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { mode: 'edit' },
      queryParamsHandling: 'merge'
    });
    this.mode.set('edit');

    const t = this.ticket();
    if (t) {
      this.form.patchValue({
        title: t.title ?? '',
        description: t.description ?? '',
        project_id: t.project_id ?? null,
        assigned_to: t.assigned_to ?? null,
        status: t.status ?? null,
        priority: (t.priority || 'low') as TicketPriority,
        supports: t.supports ?? null,
        estimated_time: t.estimated_time ?? null,
        time_spent: t.time_spent ?? null
      });
    }
  }

  // Salir de edición: quitar ?mode
  cancelEdit(): void {
    const q = { ...this.route.snapshot.queryParams };
    delete (q as any).mode;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: q
    });
    this.mode.set('view');
  }

  initials(name?: string): string {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase()).join('');
  }

  statusColor(s?: string): 'processing'|'warning'|'success'|'default' {
    const x = (s || '');
    if (x === 'OPEN') return 'processing';
    if (x === 'IN_PROGRESS') return 'warning';
    if (x === 'RESOLVED') return 'success';
    return 'default';
  }
  priorityColor(p?: string): 'error'|'warning'|'default' {
    const x = (p || '').toLowerCase();
    if (x === 'critical' || x === 'high') return 'error';
    if (x === 'medium') return 'warning';
    return 'default';
  }

  // ===== Guardar =====
  async save(): Promise<void> {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => c.markAsDirty());
      this.msg.warning('Revisa los campos del formulario.');
      return;
    }
    try {
      this.saving.set(true);
      const raw = this.form.getRawValue();
      const payload = {
        number: this.ticket()?.number ?? null,
        title: (raw.title ?? '').trim(),
        description: (raw.description ?? '').trim(),
        status: String(raw.status ?? 'OPEN'),
        priority: String(raw.priority ?? 'low'),
        project_id: String(raw.project_id) ?? null,
        assigned_to: String(raw.assigned_to) ?? null,
        estimated_time: raw.estimated_time ?? null,
        time_spent: raw.time_spent ?? null
      };
      await firstValueFrom(this.tickets.updateTicket(payload));
      await this.persistAttachments();
      this.showUpdatedModal(this.ticket()?.number);

      const refreshed = await firstValueFrom(
        this.tickets.getTicketDetail({ id: this.id(), number: this.number() })
      );

      this.setTicket(refreshed);

      if (refreshed) {
        const statusObj = this.status().find(s => s.value === refreshed.status);
        refreshed.statusLabel = statusObj ? statusObj.label : '';
        
        const supportsObj = this.supports().find(s => s.value === refreshed.supports);
        refreshed.supportsLabel = supportsObj ? supportsObj.label : '';
      }

      // resync adjuntos
      this.originalAttachments.set(Array.isArray(refreshed?.attachments)
        ? refreshed.attachments.map((a: any) => ({
            ...a,
            name: a.name || a.file_name || a.fileName || a.title || 'archivo',
            size: a.size ?? a.size_bytes ?? a.Size ?? null
          }))
        : []);
      this.newFilesArr.set([]);
      this.deletedItemIds.set(new Set());

      this.cancelEdit();
    } catch (e: any) {
      console.error(e);
      this.msg.error('No se pudo actualizar el ticket.');
    } finally {
      this.saving.set(false);
    }
  }

  // ===== Descarga / Preview =====
  isPdf(f: any): boolean {
    if (!f) return false;
    const ct = String(f.contentType || '').toLowerCase();
    const name = String(f.name || '').toLowerCase();
    return ct === 'application/pdf' || name.endsWith('.pdf');
  }

  fileUrl(f: any): string {
    return f?.webUrl || f?.url || this.tickets.bestDownloadUrl(f) || '#';
  }

  private forceDownload(att: any): void {
    const href = this.tickets.bestDownloadUrl(att) || this.fileUrl(att);
    if (!href || href === '#') return;

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = href;
    a.target = '_self';
    if (att?.name) a.setAttribute('download', String(att.name)); // puede ser ignorado cross-origin
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 0);
  }

  private openPdf(att: any): void {
    const href = this.fileUrl(att);
    if (!href || href === '#') return;
    window.open(href, '_blank', 'noopener,noreferrer');
  }

  downloadOrPreview(att: any): void {
    if (this.isPdf(att)) this.openPdf(att);
    else this.forceDownload(att);
  }

  // ===== Utilidades adjuntos =====
  private readItemId(a: any): number {
    const raw = a?.id ?? a?.itemId ?? a?.sp_item_id ?? a?.spItemId ?? a?.ItemId ?? null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  private guessMimeByExt(name: string): string {
    const ext = (name.split('?')[0].split('#')[0].split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'csv') return 'text/csv';
    if (ext === 'txt') return 'text/plain';
    if (['xlsx','xls'].includes(ext)) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (['docx','doc'].includes(ext)) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (['pptx','ppt'].includes(ext)) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    if (['png','jpg','jpeg','gif','webp','bmp','svg'].includes(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    return 'application/octet-stream';
  }

  private async fileToUploadEntry(file: File): Promise<any> {
    const base64 = await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        const res = String(fr.result || '');
        const idx = res.indexOf('base64,');
        resolve(idx >= 0 ? res.slice(idx + 7) : res);
      };
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });

    const ct = file.type || this.guessMimeByExt(file.name);
    return {
      fileName: file.name,
      name: file.name,
      contentType: ct,
      size: file.size,
      base64,
      _isNew: true
    };
  }

  async onFilesPicked(evt: Event): Promise<void> {
    const input = evt.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;

    const entries = await Promise.all(files.map(f => this.fileToUploadEntry(f)));
    this.newFilesArr.update(arr => [...arr, ...entries]);
    input.value = ''; // permitir volver a elegir el mismo archivo
  }

  removeAttachment(att: any): void {
    if (att?._isNew) {
      this.newFilesArr.update(arr => arr.filter(x => x !== att));
      return;
    }
    const id = this.readItemId(att);
    if (id) {
      this.deletedItemIds.update(set => {
        const next = new Set(set);
        next.add(id);
        return next;
      });
    } else {
      this.msg.warning('No se encontró el ItemId del adjunto.');
    }
  }

  private async persistAttachments(): Promise<void> {
    const number = this.ticket()?.number;
    if (!number) return;

    // SOLO los nuevos (estos sí tienen base64)
    const filesPayload = this.newFilesArr()
      .filter(f => typeof f.base64 === 'string' && f.base64.length > 0) // <- filtro
      .map(f => ({
        fileName: f.fileName,
        contentType: f.contentType,
        size: f.size ?? null,
        base64: f.base64
      })
    );

    // Eliminados por itemId normalizado
    const deletedPayload = Array.from(this.deletedItemIds()).map(id => ({ itemId: id }));

    if (!filesPayload.length && !deletedPayload.length) return;

    await firstValueFrom(this.tickets.uploadFilesBatchV2({
      ticketNumber: number,
      uploadedByEmail: this.ticket()?.assigned_email ?? null,
      files: filesPayload,
      deleted: deletedPayload
    }));
  }

  // ===== Tipo/Descripción para UI =====
  private fileExt(name?: string): string {
    const n = String(name || '');
    const base = n.split('?')[0].split('#')[0];
    const dot = base.lastIndexOf('.');
    return dot >= 0 ? base.slice(dot + 1).toLowerCase() : '';
  }

  extLabelMap = EXTENSION_RECORD;

  displayType(att: any): string {
    const ct = String(att?.contentType || '').toLowerCase().trim();
    const byMime =
      ct === 'application/pdf' ? 'PDF' :
      ct === 'text/csv' ? 'CSV' :
      ct.startsWith('image/') ? 'Imagen' :
      ct.startsWith('audio/') ? 'Audio' :
      ct.startsWith('video/') ? 'Video' :
      ct.includes('excel') ? 'Excel' :
      ct.includes('word') ? 'Word' :
      ct.includes('powerpoint') ? 'PowerPoint' :
      '';

    const ext = this.fileExt(att?.name);
    const byExt = this.extLabelMap[ext] || (ext ? ext.toUpperCase() : '');

    return byExt || byMime || 'Archivo';
  }

  displayDescription(att: any): string {
    const type = this.displayType(att);
    const size = att?.size ? ` • ${this.tickets.humanSize(att.size)}` : '';
    return `${type}${size}`;
  }

  private showUpdatedModal(number: string): void {
    this.modal.success({
      nzTitle: 'Updated ticket',
      nzContent: 'The changes to ticket ' + number + ' were saved correctly.',
      nzOkText: 'Understood'
    });
  }

  isStatusDisabled(p: any): boolean {
    if (this.userRol === 1 || this.userRol === 2) {
      return p.label !== 'Closed';
    }

    if (this.userRol === 3) {
      return p.label === 'Closed';
    }

    return false;
  }

}
