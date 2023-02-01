import { Page } from '@playwright/test';
import { CommonPage } from '@pages/common.page';

export default class EnvironmentOverview extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  environmentOverviewUrl = 'graph/entitlements';
  environmentOverviewContainer = this.page.getByTestId('page-wrapper-environment-overview');

  elements = {
    ...super.getElements(),
    contactsName: this.environmentOverviewContainer.getByTestId('contact-name'),
    contactsHeader: this.environmentOverviewContainer.getByText('Percona Contacts'),
    contactsSubHeader: this.environmentOverviewContainer.getByText('Customer Success Manager'),
    emailIcon: this.environmentOverviewContainer.getByTestId('contact-email-icon'),
  }

  fields = {
    ...super.fields,
  }
  
  labels = {
    ...super.labels,
  }

  buttons = {
    ...super.buttons,
  }

  messages = {
    ...super.getMessages(),
  }

  links = {
    ...super.links,
  }
}