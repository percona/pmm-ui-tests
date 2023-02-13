import { Page } from '@playwright/test';
import RbacTable from '@tests/components/rbacTable';
import { CommonPage } from '../Common.page';

export class CreateRolePage extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  url = 'graph/roles/create'
  metricsAccessRowContainer = this.page.getByTestId('prometheus-dimensions-filter-item');
  selectOptionsMenuContainer = this.page.locator('//*[@aria-label="Select options menu"]')

  elements = {
    ...super.getElements(),
    menuOption: (label: string) => this.selectOptionsMenuContainer.getByText(label),
  };

  fields = {
    ...super.getFields(),
    roleName: this.page.getByTestId('role-name-field'),
    roleDescription: this.page.getByTestId('role-description-field'),
    selectLabel: this.metricsAccessRowContainer.locator('//*[@id="prometheus-dimensions-filter-item-key"]'),
    selectMatchOperator: this.metricsAccessRowContainer.locator('//*[@aria-label="Select match operator"]'),
    selectValue: this.metricsAccessRowContainer.locator('//*[@id="prometheus-dimensions-filter-item-value"]'),
  };

  labels = {
    ...super.getLabels(),
  };

  buttons = {
    ...super.getButtons(),
    submit: this.page.getByTestId('add-edit-role-submit'),
  };

  messages = {
    ...super.getMessages(),
    roleCreatedHeader: (roleName: string) => `Role “${roleName}” created`,
    roleCreatedDescription: 'Your new role is now ready to be assigned to any user.',
  };

  links = {
    ...super.getLinks(),
  };

}


