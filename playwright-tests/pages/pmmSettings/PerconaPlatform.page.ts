import { Page } from '@playwright/test';
import { CommonPage } from './Common.page';

export default class PerconaPlatform extends CommonPage {
  constructor(page: Page) {
    super(page);
  }
  // Containers
  perconaPlatformURL = 'graph/settings/percona-platform';
  perconaPlatformContainer = this.page.getByTestId('connect-form');

  // Elements
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

  platformLinks = {
    getToken: 'https://portal-dev.percona.com/profile',
  }
}