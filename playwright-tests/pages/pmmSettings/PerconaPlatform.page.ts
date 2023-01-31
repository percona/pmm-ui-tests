import { Page } from '@playwright/test';
import { CommonPage } from '../Common.page';

export default class PerconaPlatform extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  perconaPlatformURL = 'graph/settings/percona-platform';
  perconaPlatformContainer = this.page.getByTestId('connect-form');
  connectedContainer = this.page.getByTestId('connected-wrapper'); 

  elements = {
    ...super.elements,
    pmmServerIdHeader: this.perconaPlatformContainer.getByTestId('pmmServerId-field-label'),
    pmmServerNameHeader: this.perconaPlatformContainer.getByTestId('pmmServerName-field-label'),
    pmmServerNameError: this.perconaPlatformContainer.getByTestId('pmmServerName-field-error-message'),
    accessTokenHeader: this.perconaPlatformContainer.getByTestId('accessToken-field-label'),
    accessTokenError: this.perconaPlatformContainer.getByTestId('accessToken-field-error-message'),
  }

  fields = {
    ...super.fields,
    pmmServerId: this.perconaPlatformContainer.getByTestId('pmmServerId-text-input'),
    pmmServerName: this.perconaPlatformContainer.getByTestId('pmmServerName-text-input'),
    accessToken: this.perconaPlatformContainer.getByTestId('accessToken-text-input'),
  }
  
  labels = {
    ...super.labels,
    header: 'Connect PMM to Percona Platform',
    pmmServerId: 'PMM Server Id',
    pmmServerName: 'PMM Server Name *',
    accessToken: 'Percona Platform Access Token *',
    getToken: 'Get token',
    requiredField: 'Required field',
  }

  buttons = {
    ...super.buttons,
    connect: this.perconaPlatformContainer.getByTestId('connect-button'),
    getToken: this.perconaPlatformContainer.getByText(this.labels.getToken),
  }

  messages = {
    ...super.messages,
    connectedSuccess: 'Successfully connected PMM to Percona Platform',
    updateSuccess: 'Settings updated',
  }

  links = {
    ...super.links,
    getToken: 'https://portal-dev.percona.com/profile',
  }

  connectToPortal = async (token: string, serverName = 'Test Server', isIPAddressSet = false) => {
    await this.fields.pmmServerName.type(serverName);
    await this.fields.accessToken.type(token);
    await this.buttons.connect.click();
    
    if (!isIPAddressSet) {
      await this.toast.checkToastMessage(this.messages.updateSuccess);
    }
    await this.toast.checkToastMessage(this.messages.connectedSuccess);
    await this.connectedContainer.waitFor({ state: 'visible' })
  }
}