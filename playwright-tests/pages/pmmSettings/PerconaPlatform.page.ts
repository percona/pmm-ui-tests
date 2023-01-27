import { Page } from '@playwright/test';
import { CommonPage } from './Common.page';

export default class PerconaPlatform extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  perconaPlatformURL = 'graph/settings/percona-platform';
  perconaPlatformContainer = this.page.getByTestId('connect-form');
  connectedContainer = this.page.getByTestId('connected-wrapper'); 

  platformElements = {
    pmmServerIdHeader: this.perconaPlatformContainer.getByTestId('pmmServerId-field-label'),
    pmmServerNameHeader: this.perconaPlatformContainer.getByTestId('pmmServerName-field-label'),
    pmmServerNameError: this.perconaPlatformContainer.getByTestId('pmmServerName-field-error-message'),
    accessTokenHeader: this.perconaPlatformContainer.getByTestId('accessToken-field-label'),
    accessTokenError: this.perconaPlatformContainer.getByTestId('accessToken-field-error-message'),
  }

  platformFields = {
    pmmServerId: this.perconaPlatformContainer.getByTestId('pmmServerId-text-input'),
    pmmServerName: this.perconaPlatformContainer.getByTestId('pmmServerName-text-input'),
    accessToken: this.perconaPlatformContainer.getByTestId('accessToken-text-input'),
  }
  
  platformLabels = {
    header: 'Connect PMM to Percona Platform',
    pmmServerId: 'PMM Server Id',
    pmmServerName: 'PMM Server Name *',
    accessToken: 'Percona Platform Access Token *',
    getToken: 'Get token',
    requiredField: 'Required field',
  }

  platformButtons = {
    connect: this.perconaPlatformContainer.getByTestId('connect-button'),
    getToken: this.perconaPlatformContainer.getByText(this.platformLabels.getToken),
  }

  platformMessages = {
    connectedSuccess: 'Successfully connected PMM to Percona Platform',
    updateSuccess: 'Settings updated',
  }

  platformLinks = {
    getToken: 'https://portal-dev.percona.com/profile',
  }

  connectToPortal = async (token: string, serverName = 'Test Server', isIPAddressSet = false) => {
    await this.platformFields.pmmServerName.type(serverName);
    await this.platformFields.accessToken.fill(token);
    await this.platformButtons.connect.click();
    if (!isIPAddressSet) {
      await this.toast.checkToastMessage(this.platformMessages.updateSuccess);
    }
    await this.toast.checkToastMessage(this.platformMessages.connectedSuccess);
    await this.connectedContainer.waitFor({ state: 'visible' })
  }
}