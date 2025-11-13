import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [LoginComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule
  ]
})
export class LoginModule {}
