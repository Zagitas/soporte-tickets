import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';

export interface Project {
  value: string;
  label: string;
}

@Component({
  selector: 'app-project-select',
  standalone: true,
  imports: [CommonModule, FormsModule, NzSelectModule, NzFormModule],
  template: `
    <nz-form-item>
      <nz-form-label *ngIf="label" [nzRequired]="required" [nzFor]="id">{{ label }}</nz-form-label>
      <nz-form-control [nzErrorTip]="errorTip">
        <nz-select
          [id]="id"
          [(ngModel)]="value"
          [nzPlaceHolder]="placeholder"
          (ngModelChange)="onChanged($event)"
          (blur)="onTouched()"
          [attr.aria-describedby]="id + '-error'">
          <nz-option
            *ngFor="let project of projects"
            [nzValue]="project.value"
            [nzLabel]="project.label">
          </nz-option>
        </nz-select>
      </nz-form-control>
    </nz-form-item>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ProjectSelectComponent),
      multi: true
    }
  ]
})
export class ProjectSelectComponent implements ControlValueAccessor {
  @Input() id: string = 'project';
  @Input() label?: string;
  @Input() required: boolean = false;
  @Input() placeholder: string = 'Select a project';
  @Input() errorTip: string = 'Please select a project';
  @Input() projects: Project[] = [
    { value: 'website-redesign', label: 'Website Redesign' },
    { value: 'mobile-app', label: 'Mobile App' },
    { value: 'api-integration', label: 'API Integration' },
    { value: 'dashboard', label: 'Dashboard' }
  ];

  value: any;
  isDisabled: boolean = false;

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onChanged(value: any): void {
    this.onChange(value);
  }
}
