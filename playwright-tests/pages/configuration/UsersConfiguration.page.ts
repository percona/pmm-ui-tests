import { Page } from '@playwright/test';
import UsersTable from '@tests/components/configuration/usersTable';
import { ConfigurationPage } from './Configuration.page';

export class UsersConfigurationPage extends ConfigurationPage {
  constructor(page: Page) {
    super(page);
  }

  url = 'graph/org/users'
  usersTable = new UsersTable(this.page);

  elements = {
    ...super.getConfigurationElements(),
  };

  fields = {
    ...super.getConfigurationFields(),
  };

  labels = {
    ...super.getConfigurationLabels(),

  };

  buttons = {
    ...super.getConfigurationButtons(),
  };

  messages = {
    ...super.getConfigurationMessages(),
  };

  links = {
    ...super.getConfigurationLinks(),
  };

}
