import { Page } from '@playwright/test';
import RbacTable from '@tests/components/rbacTable';
import { BaseDashboard } from '../BaseDashboard.page';

export class MySqlDashboard extends BaseDashboard {
  constructor(page: Page) {
    super(page);
  }

  url = 'graph/d/mysql-instance-overview/mysql-instances-overview?orgId=1&refresh=1m'

  elements = {
    ...super.getBaseDashboardElements(),
  };

  fields = {
    ...super.getBaseDashboardFields(),
  };

  labels = {
    ...super.getBaseDashboardLabels(),
    create: 'Create',

  };

  buttons = {
    ...super.getBaseDashboardButtons(),
  };

  messages = {
    ...super.getBaseDashboardMessages(),
  };

  links = {
    ...super.getBaseDashboardLinks(),
  };

}
