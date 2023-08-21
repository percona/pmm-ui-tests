import { CommonPage } from '@pages/common.page';

interface CreateRole {
  roleName: string,
  roleDescription?: string,
  label: string,
  operator?: string,
  value: string,
}

export class CreateRolePage extends CommonPage {
  url = 'graph/roles/create';
  metricsAccessRowContainer = this.page.getByTestId('prometheus-dimensions-filter-item');
  selectOptionsMenuContainer = this.page.locator('//*[@aria-label="Select options menu"]');

  elements: any = {
    ...this.elements,
    menuOption: (label: string) => this.selectOptionsMenuContainer.getByText(label),
  };

  fields = {
    roleName: this.page.getByTestId('role-name-field'),
    roleDescription: this.page.getByTestId('role-description-field'),
    selectLabel: this.metricsAccessRowContainer.locator('//*[@id="prometheus-dimensions-filter-item-key"]'),
    selectMatchOperator: this.metricsAccessRowContainer.locator('//*[@aria-label="Select match operator"]'),
    selectValue: this.metricsAccessRowContainer.locator('//*[@id="prometheus-dimensions-filter-item-value"]'),
  };

  buttons = {
    submit: this.page.getByTestId('add-edit-role-submit'),
  };

  messages: any = {
    ...this.messages,
    roleCreatedHeader: (roleName: string) => `Role “${roleName}” created`,
    roleCreatedDescription: 'Your new role is now ready to be assigned to any user.',
  };

  createNewRole = async (options: CreateRole) => {
    await this.fields.roleName.type(options.roleName);
    if (options.roleDescription) {
      await this.fields.roleDescription.type(options.roleDescription);
    }

    await this.fields.selectLabel.click();
    await this.elements.menuOption(options.label).click();
    if (options.operator) {
      await this.fields.selectMatchOperator.click();
      await this.elements.menuOption(options.operator).click();
    }

    await this.fields.selectValue.click();
    await this.elements.menuOption(options.value).click();
    await this.buttons.submit.click();
    await this.toast.checkToastMessage(
      `${this.messages.roleCreatedHeader(options.roleName)}${this.messages.roleCreatedDescription}`,
    );
  };
}
