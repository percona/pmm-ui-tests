import { Page } from '@playwright/test';
import { CommonPage } from './Common.page';

export default class PerconaPlatform extends CommonPage {
  constructor(page: Page) {
    super(page);
  }
  // Containers
  perconaPlatformContainer = this.page.getByTestId('settings-tab-content');

  // Elements
  serverNameInput = this.perconaPlatformContainer.getByTestId('pmmServerName-text-input');
  serverNameInputError = this.perconaPlatformContainer.getByTestId('pmmServerName-field-error-message');
  accessTokenInput = this.perconaPlatformContainer.getByTestId('accessToken-text-input');
  accessTokenInputError = this.perconaPlatformContainer.getByTestId('accessToken-field-error-message');
  connectButton = this.perconaPlatformContainer.getByTestId('connect-button');

  // Messages

  // links
  perconaPlatformURL = 'graph/settings/percona-platform';
}
