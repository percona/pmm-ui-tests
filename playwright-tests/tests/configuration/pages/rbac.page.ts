import RbacTable from '@components/rbac-table';
import { ConfigurationPage } from './configuration.page';

export class RbacPage extends ConfigurationPage {
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
