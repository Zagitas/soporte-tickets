import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { TranslateService } from '@ngx-translate/core';
import { scopesConfig } from '../../../../core/auth/msal-config';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzButtonModule,
    NzDropDownModule,
    TranslateModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  default: string = 'EN/ES';
  selectedLanguage: string = this.default;

  constructor(
    private msalService: MsalService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    const account = this.msalService.instance.getActiveAccount();
    if (account) {
      this.router.navigate(['/tickets']);
    }
  }

  changeLanguage(lang: 'en' | 'es') {
    this.selectedLanguage = lang;
    localStorage.setItem('language', lang);
    this.translate.use(lang);
  }

  login() {
    try {
      this.msalService.loginRedirect({
        ...scopesConfig,
        prompt: 'select_account'
      });
    } catch (error) {
      console.error('Error during login:', error);
    }
  }
}
