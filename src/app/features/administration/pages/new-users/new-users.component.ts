import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';

type Role = 'CLIENT' | 'SUPERVISOR';
type Option = { id: string; label: string };

@Component({
  selector: 'app-new-users',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    NzPageHeaderModule, NzCardModule, NzGridModule,
    NzInputModule, NzSelectModule, NzButtonModule, NzIconModule, NzMessageModule
  ],
  templateUrl: './new-users.component.html',
  styleUrls: ['./new-users.component.scss']
})
export class UsersNewComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private msg = inject(NzMessageService);

  // Combos
  companies = signal<Option[]>([]);
  projects  = signal<Option[]>([]);
  loading   = signal(false);

  // Form
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    role: ['CLIENT' as Role, Validators.required],
    companyId: [null as string | null, Validators.required],
    // SIEMPRE array (para ambos roles); en CLIENT forzamos longitud 1
    projects: this.fb.control<string[]>([], { nonNullable: true })
  });

  get role(): Role { return this.form.value.role as Role; }
  isClient()     { return this.role === 'CLIENT'; }
  isSupervisor() { return this.role === 'SUPERVISOR'; }

  ngOnInit(): void {
    this.loadCombos();

    // Reglas dinámicas al cambiar de rol
    this.form.get('role')!.valueChanges.subscribe((r) => {
      const projectsCtrl = this.form.get('projects')!;
      if (r === 'CLIENT') {
        // exactamente 1 seleccionado
        projectsCtrl.setValidators([(c) =>
          Array.isArray(c.value) && c.value.length === 1 ? null : { oneRequired: true }
        ]);
        const arr = (projectsCtrl.value || []) as string[];
        if (arr.length !== 1) {
          projectsCtrl.setValue(arr.slice(0, 1), { emitEvent: false });
        }
      } else {
        // SUPERVISOR: >=1
        projectsCtrl.setValidators([(c) =>
          Array.isArray(c.value) && c.value.length >= 1 ? null : { required: true }
        ]);
        if (!Array.isArray(projectsCtrl.value)) {
          projectsCtrl.setValue([], { emitEvent: false });
        }
      }
      projectsCtrl.updateValueAndValidity({ emitEvent: false });
    });

    // Normaliza al estado inicial
    this.form.get('role')!.updateValueAndValidity({ emitEvent: true });
  }

  private loadCombos(): void {
    this.loading.set(true);
    // Simulación de carga; reemplazar por tus servicios reales
    setTimeout(() => {
      this.companies.set([
        { id: '1', label: 'Empresa A' },
        { id: '2', label: 'Empresa B' },
        { id: '3', label: 'Empresa C' }
      ]);
      this.projects.set([
        { id: 'PRJ-OPS', label: 'Operaciones' },
        { id: 'PRJ-WEB', label: 'Web App' },
        { id: 'PRJ-MOB', label: 'Mobile' }
      ]);
      this.loading.set(false);
    }, 150);
  }

  isInvalid(name: string) {
    const c = this.form.get(name);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => c.markAsDirty());
      this.msg.warning('Revisa los campos requeridos.');
      return;
    }

    const v = this.form.getRawValue();
    const payload = {
      email: v.email?.trim(),
      fullName: v.fullName?.trim(),
      role: v.role,
      companyId: v.companyId,
      // Shape por rol:
      projectId: this.isClient() ? v.projects[0] ?? null : null,
      projectIds: this.isSupervisor() ? v.projects : null
    };

    // TODO: Llama a tu servicio real
    console.log('Crear usuario payload:', payload);

    this.msg.success('Usuario registrado correctamente.');
    this.router.navigateByUrl('/users'); // ajusta la ruta de retorno
  }

  cancel(): void {
    this.router.navigateByUrl('/users'); // ajusta la ruta de retorno
  }
}
