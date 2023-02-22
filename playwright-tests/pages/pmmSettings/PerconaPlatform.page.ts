import { Page } from '@playwright/test';
import { CommonPage } from '@pages/Common.page';

export default class PerconaPlatform extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  perconaPlatformURL = 'graph/settings/percona-platform';
  perconaPlatformContainer = this.page.getByTestId('connect-form');
  connectedContainer = this.page.getByTestId('connected-wrapper');

  elements = {
    ...super.getElements(),
    header_2_35: this.page.getByText('Connect to Percona Platform'),
    pmmServerIdHeader: this.perconaPlatformContainer.getByTestId('pmmServerId-field-label'),
    pmmServerNameHeader: this.perconaPlatformContainer.getByTestId('pmmServerName-field-label'),
    pmmServerNameError: this.perconaPlatformContainer.getByTestId('pmmServerName-field-error-message'),
    accessTokenHeader: this.perconaPlatformContainer.getByTestId('accessToken-field-label'),
    accessTokenError: this.perconaPlatformContainer.getByTestId('accessToken-field-error-message'),
    readMore: this.page.getByText('Read More...'),
  };

  fields = {
    ...super.getFields(),
    pmmServerId: this.perconaPlatformContainer.getByTestId('pmmServerId-text-input'),
    email: this.perconaPlatformContainer.getByTestId('email-text-input'),
    password: this.perconaPlatformContainer.getByTestId('password-password-input'),
    pmmServerName: this.perconaPlatformContainer.getByTestId('pmmServerName-text-input'),
    accessToken: this.perconaPlatformContainer.getByTestId('accessToken-text-input'),
  };

  labels = {
    ...super.getLabels(),
    header: 'Connect PMM to Percona Platform',
    connectToPlatform: 'Connect to Percona Platform',
    pmmServerId: 'PMM Server Id',
    pmmServerId_35: 'PMM Server ID',
    pmmServerName: 'PMM Server Name *',
    accessToken: 'Percona Platform Access Token *',
    getToken: 'Get token',
    requiredField: 'Required field',
    createPerconaAccount: 'Create a Percona account',
    validateConnection: 'Validate Platform connection',
  };

  buttons = {
    ...super.getButtons(),
    connect: this.perconaPlatformContainer.getByTestId('connect-button'),
    disconnect: this.connectedContainer.getByTestId('disconnect-button'),
    confirmDisconnect: this.page.locator('//*[@aria-label="Confirm Modal Danger Button"]'),
    getToken: this.perconaPlatformContainer.getByText(this.labels.getToken),
    getToken35: this.page.locator(`//*[contains(text(), "${this.labels.getToken}")]//ancestor::a`),
    createPerconaAccount: this.page.locator(`//*[contains(text(), "${this.labels.createPerconaAccount}")]//ancestor::a`),
  };

  messages = {
    ...super.getMessages(),
    connectedSuccess: 'Successfully connected PMM to Percona Platform',
    disconnectedSuccess: 'You have successfully disconnected this server from Percona Platform',
    updateSuccess: 'Settings updated',
    oldPmmVersionError: 'Authentication failed. Please update the PMM version.',
    pmmDisconnectedFromPortal: 'Successfully disconnected PMM from Percona Platform',
  };

  links = {
    ...super.getLinks(),
    portalProfile: 'https://portal-dev.percona.com/profile',
    platformProfile: 'https://platform-dev.percona.com/profile',
    portalLogin: 'https://portal-dev.percona.com/login',
    readMore:
      'https://docs.percona.com/percona-monitoring-and-management/how-to/integrate-platform.html#disconnect-a-pmm-instance',
  };

  connectToPortal = async (token: string, serverName = 'Test Server', isIPAddressSet = false) => {
    await this.fields.pmmServerName.type(serverName);
    await this.fields.accessToken.type(token);
    await this.buttons.connect.click();

    if (!isIPAddressSet) {
      await this.toast.checkToastMessage(this.messages.updateSuccess);
    }
    await this.toast.checkToastMessage(this.messages.connectedSuccess, { variant: 'success' });
    await this.connectedContainer.waitFor({ state: 'visible' });
  };
}