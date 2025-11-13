import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDividerModule } from 'ng-zorro-antd/divider';

import { SelectOption } from '../../models/ticket.model';
import { CreateTicketQuery, TicketsService } from '../../data/tickets.service';
import { ProjectsService } from '../../data/projects.service';
import { firstValueFrom } from 'rxjs';
import { UsersService } from '../../data/users.service';

function isNativeFile(x: any): x is File {
  return x && typeof x === 'object' && typeof x.name === 'string' && typeof x.size === 'number' && typeof x.slice === 'function';
}
function toNzUploadFileFromFile(f: File): NzUploadFile {
  return {
    uid: `${Date.now()}_${Math.random()}`,
    name: f.name,
    size: f.size,
    type: f.type,
    lastModified: (f as any).lastModified,
    originFileObj: f
  } as NzUploadFile;
}

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    NzGridModule, NzCardModule, NzFormModule, NzInputModule, NzSelectModule,
    NzButtonModule, NzTypographyModule, NzPageHeaderModule, NzUploadModule,
    NzIconModule, NzMessageModule, NzModalModule, NzToolTipModule, NzDividerModule
  ],
  templateUrl: './ticket-form.component.html',
  styleUrls: ['./ticket-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private msg = inject(NzMessageService);
  private modal = inject(NzModalService);
  private ticketsSvc = inject(TicketsService);
  private projectsSvc = inject(ProjectsService);
  private usersSvc = inject(UsersService);

  /** Constantes accesibles desde el template */
  readonly MIN_DESC = 10;
  readonly MAX_FILES = 5;

  /** Config para nz-upload */
  uploadListCfg = { showPreviewIcon: false };

  /** Estado */
  loading = signal(false);

  projects: SelectOption[] = [];
  priorities: SelectOption[] = [
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' }
  ];
  users: SelectOption[] = [
    { label: 'Unassigned', value: '' },
    { label: 'Sarah Chen', value: 'sarah.chen@example.com' },
    { label: 'Mike Johnson', value: 'mike.johnson@example.com' },
    { label: 'Emma Davis', value: 'emma.davis@example.com' },
    { label: 'Alex Wilson', value: 'alex.wilson@example.com' },
    { label: 'Lisa Anderson', value: 'lisa.anderson@example.com' }
  ];

  // Upload state (almacenamos y evitamos auto-upload)
  fileList: NzUploadFile[] = [];

  form = this.fb.group({
    projectSlug: ['', Validators.required],
    priority: ['', Validators.required],
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(this.MIN_DESC)]],
    assignedEmail: ['']
  });

  ngOnInit(): void {
    this.projectsSvc.listProjects().subscribe({
      next: (opts) => (this.projects = opts ?? []),
      error: () => (this.projects = [])
    });
  }

  // Upload hooks — normaliza SIEMPRE a File + NzUploadFile
  beforeUpload = (incoming: NzUploadFile): boolean => {
    if (this.fileList.length >= this.MAX_FILES) {
      this.msg.warning(`Máximo ${this.MAX_FILES} archivos.`);
      return false;
    }

    // Prioriza originFileObj; si no viene, detecta si 'incoming' es un File o trae 'raw'
    let native: File | undefined =
      (incoming as any).originFileObj ||
      (isNativeFile(incoming as any) ? (incoming as any as File) : undefined) ||
      ((incoming as any).raw && isNativeFile((incoming as any).raw) ? (incoming as any).raw : undefined);

    if (!native) {
      this.msg.error('No se pudo leer el archivo. Intenta nuevamente.');
      return false;
    }

    const normalized = toNzUploadFileFromFile(native);

    // Evita duplicados por nombre + size + lastModified
    const key = `${normalized.name}|${normalized.size}|${normalized.lastModified ?? ''}`;
    const exists = this.fileList.some(f => {
      const lm = (f as any).lastModified ?? (f as any).originFileObj?.lastModified ?? '';
      return `${f.name}|${f.size}|${lm}` === key;
    });
    if (!exists) this.fileList = [...this.fileList, normalized];

    return false; // bloquea auto-upload
  };

  removeFile = (file: NzUploadFile) => {
    this.fileList = this.fileList.filter(f => f.uid !== file.uid);
    return true;
  };

  // Helpers UI
  get f() { return this.form.controls; }
  get remaining() {
    const v = this.f.description.value ?? '';
    return Math.max(0, this.MIN_DESC - ('' + v).length);
  }

  cancel(): void {
    if (history.length > 1) { history.back(); }
    else { this.router.navigateByUrl('/tickets'); }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => c.markAsDirty());
      this.msg.error('Revisa los campos obligatorios.');
      return;
    }
    if (this.remaining > 0) {
      this.msg.warning(`La descripción debe tener al menos ${this.MIN_DESC} caracteres.`);
      return;
    }

    this.loading.set(true);
    const payload: CreateTicketQuery = {
      projectSlug: this.f.projectSlug.value!,
      title: this.f.title.value!.trim(),
      description: this.f.description.value!.trim(),
      priority: this.f.priority.value! as 'high'|'medium'|'low',
      status: 'OPEN',
      assignedEmail: this.usersSvc.userEmail || '',
      createdByEmail: this.usersSvc.userEmail || ''
    };

    try {
      // 1) Crear ticket
      const createResp = await firstValueFrom(this.ticketsSvc.createTicket(payload));
      const ticket = this.ticketsSvc.pickTicketFromResponse(createResp);
      const ticketNumber = this.ticketsSvc.pickTicketNumber(createResp, ticket);

      // 2) Subir archivos en lote (si corresponde)
      if (ticketNumber && this.fileList.length) {
        await firstValueFrom(this.ticketsSvc.uploadFilesBatch(ticketNumber, this.fileList /*, emailUsuario */));
      }

      // 3) Modal de éxito
      this.modal.success({
        nzTitle: 'Ticket created',
        nzContent: `
          <div>
            <p class="mb-2">Ticket <b>${ticketNumber || '—'}</b> created successfully.</p>
            <ul class="mb-0">
              <li><b>Ttile:</b> ${payload.title}</li>
              <li><b>Project:</b> ${ticket.project_name}</li>
              <li><b>Status:</b> Open</li>
            </ul>
          </div>
        `,
        nzOkText: 'Go to list',
        nzOnOk: () => this.router.navigateByUrl('/tickets')
      });

      this.form.disable();
    } catch (err) {
      console.error(err);
      this.msg.error('No se pudo crear el ticket. Intenta nuevamente.');
    } finally {
      this.loading.set(false);
    }
  }
}
