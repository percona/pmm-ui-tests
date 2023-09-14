import { CommonPage } from '@pages/common.page';

export default class EnvironmentOverview extends CommonPage {
  environmentOverviewUrl = 'graph/entitlements';
  environmentOverviewContainer = this.page.getByTestId('page-wrapper-environment-overview');

  elements: any = {
    ...this.elements,
    contactsName: this.environmentOverviewContainer.getByTestId('contact-name'),
    contactsHeader: this.environmentOverviewContainer.getByText('Percona Contacts'),
    contactsSubHeader: this.environmentOverviewContainer.getByText('Customer Success Manager'),
    emailIcon: this.environmentOverviewContainer.getByTestId('contact-email-icon'),
  };
}
