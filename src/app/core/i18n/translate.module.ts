import { NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';

class CustomTranslateLoader implements TranslateLoader {
    constructor(private http: HttpClient) {}

    getTranslation(lang: string): any {
        return this.http.get(`./assets/i18n/${lang}.json`);
    }
}

@NgModule({
    imports: [
        HttpClientModule,
        TranslateModule.forRoot({
            defaultLanguage: 'en',
            loader: {
                provide: TranslateLoader,
                useClass: CustomTranslateLoader,
                deps: [HttpClient]
            }
        })
    ],
    exports: [TranslateModule]
})
export class TranslateRootModule { }
