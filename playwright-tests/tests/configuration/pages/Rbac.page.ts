import { Page } from '@playwright/test';
import RbacTable from '@components/rbacTable';
import { ConfigurationPage } from './Configuration.page';

export class RbacPage extends ConfigurationPage {
  constructor(page: Page) {
    super(page);
  }

  url = 'graph/roles';

  rbacTable = new RbacTable(this.page);

  elements = {
    ...super.getConfigurationElements(),
  };

  fields = {
    ...super.getConfigurationFields(),
  };

  labels = {
    ...super.getConfigurationLabels(),
    create: 'Create',
  };

  buttons = {
    ...super.getConfigurationButtons(),
    create: this.page.getByTestId('access-roles-create-role'),
  };

  messages = {
    ...super.getConfigurationMessages(),
  };

  links = {
    ...super.getConfigurationLinks(),
    createRole: '/roles/create',
  };
}
