import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, NzUploadModule, NzFormModule, NzIconModule],
  template: `
    <nz-form-item>
      <nz-form-label *ngIf="label" [nzRequired]="required" [nzFor]="id">{{ label }}</nz-form-label>
      <nz-form-control>
        <nz-upload
          [id]="id"
          nzType="drag"
          [nzMultiple]="multiple"
          [nzLimit]="maxFiles"
          [nzAction]="uploadUrl"
          (nzChange)="handleChange($event)">
          <p class="ant-upload-drag-icon">
            <span nz-icon nzType="inbox"></span>
          </p>
          <p class="ant-upload-text">{{ dragText }}</p>
          <p class="ant-upload-hint">{{ hint }}</p>
        </nz-upload>
      </nz-form-control>
    </nz-form-item>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileUploadComponent),
      multi: true
    }
  ]
})
export class FileUploadComponent implements ControlValueAccessor {
  @Input() id: string = 'file-upload';
  @Input() label?: string;
  @Input() required: boolean = false;
  @Input() multiple: boolean = true;
  @Input() maxFiles: number = 5;
  @Input() uploadUrl: string = '/api/upload';
  @Input() dragText: string = 'Click or drag files to this area';
  @Input() hint: string = 'Support for PDF, Word, Excel and image files. Maximum 5 files.';

  value: any[] = [];
  isDisabled: boolean = false;

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any[]): void {
    this.value = value || [];
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

  handleChange(event: any): void {
    if (event.type === 'success') {
      this.value = event.fileList.map((file: any) => file.response || file);
      this.onChange(this.value);
      this.onTouched();
    }
  }
}
