import RbacTable from '@components/rbac-table';
import { CommonPage } from '@pages/common.page';

export class RbacPage extends CommonPage {
  url = 'graph/roles';

  rbacTable = new RbacTable(this.page);

  elements: any = {
    ...this.elements,
    buttonCreate: this.page.getByTestId('access-roles-create-role'),
  };

  labels = {
    create: 'Create',
  };

  links = {
    createRole: '/roles/create',
  };
}
