import { CommonPage } from '@pages/common.page';
import { Locator } from '@playwright/test';

export default class PerconaPlatformPage extends CommonPage {
  readonly PAGE_PATH = 'graph/settings/percona-platform';
  readonly PAGE_HEADING = 'Percona Platform';
  perconaPlatformContainer = this.page.getByTestId('connect-form');
  connectedContainer = this.page.getByTestId('connected-wrapper');

  elements: { [key: string]: Locator } = {
    ...this.elements,
    // heading: this.page.locator(`//h2[text()="${this.PAGE_HEADING}"] | //*[contains(text(), "${this.OLD_HEADING}")]`),
    heading: this.page.locator(`//h1[text()="${this.PAGE_HEADING}"]`),
    pmmServerIdHeader: this.perconaPlatformContainer.getByTestId('pmmServerId-field-label'),
    pmmServerNameHeader: this.perconaPlatformContainer.getByTestId('pmmServerName-field-label'),
    pmmServerNameError: this.perconaPlatformContainer.getByTestId('pmmServerName-field-error-message'),
    accessTokenHeader: this.perconaPlatformContainer.getByTestId('accessToken-field-label'),
    accessTokenError: this.perconaPlatformContainer.getByTestId('accessToken-field-error-message'),
    readMore: this.page.getByText('Read More...'),
    forceDisconnectModal: this.page.getByTestId('force-disconnect-modal'),
    modalMessage: this.page.locator('//*[@role="dialog"]//p'),
  };

  fields = {
    pmmServerId: this.perconaPlatformContainer.getByTestId('pmmServerId-text-input'),
    email: this.perconaPlatformContainer.getByTestId('email-text-input'),
    password: this.perconaPlatformContainer.getByTestId('password-password-input'),
    pmmServerName: this.perconaPlatformContainer.getByTestId('pmmServerName-text-input'),
    accessToken: this.perconaPlatformContainer.getByTestId('accessToken-text-input'),
  };

  labels = {
    connectToPlatform: 'Connect to Percona Platform',
    pmmServerId: 'PMM Server Id',
    pmmServerName: 'PMM Server Name *',
    accessToken: 'Percona Platform Access Token *',
    getToken: 'Get token',
    requiredField: 'Required field',
    createPerconaAccount: 'Create a Percona account',
    validateConnection: 'Validate Platform connection',
    connect: 'Connect',
  };

  buttons = {
    connect: this.perconaPlatformContainer.getByTestId('connect-button'),
    disconnect: this.connectedContainer.getByTestId('disconnect-button'),
    confirmDisconnect: this.page.locator('//*[@aria-label="Confirm Modal Danger Button"]'),
    getToken: this.perconaPlatformContainer.getByText(this.labels.getToken),
    getToken35: this.page.locator(`//*[contains(text(), "${this.labels.getToken}")]//ancestor::a`),
    createPerconaAccount: this.page.locator(`//*[contains(text(), "${this.labels.createPerconaAccount}")]//ancestor::a`),
  };

  messages: { [key: string]: string } = {
    ...this.messages,
    connectedSuccess: 'Successfully connected PMM to Percona Platform',
    disconnectedSuccess: 'You have successfully disconnected this server from Percona Platform',
    updateSuccess: 'Settings updated',
    oldPmmVersionError: 'Authentication failed. Please update the PMM version.',
    pmmDisconnectedFromPortal: 'Successfully disconnected PMM from Percona Platform',
    forceDisconnectWarning: ' Are you sure you want to disconnect this PMM instance? This will unlink the instance from its current organization and stop all synchronization with Percona Platform. ',
    disconnectWarning: 'Are you sure you want to disconnect from Percona Platform? This will automatically log you out from PMM.',
  };

  links = {
    portalProfile: 'https://portal-dev.percona.com/profile',
    platformProfile: 'https://platform-dev.percona.com/profile',
    portalLogin: 'https://portal-dev.percona.com/login',
    readMore:
      'https://per.co.na/disconnect',
  };

  /**
   * Opens given Page entering url into the address field.
   */
  public open = async () => {
    await this.openPageByPath(this.PAGE_PATH, this.PAGE_HEADING, this.elements.heading);
  };

  /**
   * Check whether current page path is displayed in browser address
   *
   * @return  {@code true} if url found; {@code false} otherwise
   */
  public isOpened = () => {
    // TODO: insert baseUrl to change eval to "equals"
    return this.page.url().includes(this.PAGE_PATH);
  };

  connectToPortal = async (token: string, serverName = 'Test Server', isIPAddressSet = false) => {
    await this.fields.pmmServerName.type(serverName);
    await this.fields.accessToken.type(token);
    await this.buttons.connect.click();

    if (!isIPAddressSet) {
      await this.toastMessage.waitForMessage(this.messages.updateSuccess);
    }
    await this.toastMessage.waitForMessage(this.messages.connectedSuccess);
    await this.connectedContainer.waitFor({ state: 'visible' });
  };
}
