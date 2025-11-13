import { MsalGuardConfiguration, MsalInterceptorConfiguration } from '@azure/msal-angular';
import { InteractionType, PublicClientApplication, RedirectRequest } from '@azure/msal-browser';
import { environment } from '../../../environments/environment';

export const msalConfig = {
  auth: {
    clientId: environment.azure.clientId,
    authority: `https://login.microsoftonline.com/${environment.azure.tenantId}`,
    redirectUri: environment.azure.redirectUri
  }
};

export function MSALInstanceFactory(): PublicClientApplication {
  return new PublicClientApplication(msalConfig);
}

export const msalGuardConfig: MsalGuardConfiguration = {
  interactionType: InteractionType.Redirect,
  authRequest: {
    scopes: [`api://${environment.azure.clientId}/access_as_user`]
  }
};

export const scopesConfig: RedirectRequest = {
    scopes: [`api://${environment.azure.clientId}/access_as_user`]
};

export const msalInterceptorConfig: MsalInterceptorConfiguration = {
  interactionType: InteractionType.Redirect,
  protectedResourceMap: new Map()
};
