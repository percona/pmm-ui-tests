import RbacTable from '@components/rbac-table';
import { CommonPage } from '@pages/common.page';

export class AccessRolesPage extends CommonPage {
  PAGE_PATH = 'graph/roles';
  PAGE_HEADING = 'Access Roles';
  PAGE_HEADING_LOCATOR = this.page.getByTestId('access-roles-title');

  rbacTable = new RbacTable(this.page);

  elements: any = {
    ...this.elements,
    buttonCreate: this.page.getByTestId('access-roles-create-role'),
  };

  labels = { create: 'Create' };

  links = { createRole: '/roles/create' };

  /**
   * Opens given Page entering url into the address field.
   */
  public open = async () => {
    await this.openPageByPath(this.PAGE_PATH, this.PAGE_HEADING, this.PAGE_HEADING_LOCATOR);
  };
}
