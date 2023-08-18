import { BaseDashboard } from '../base-dashboard.page';

export class MySqlDashboard extends BaseDashboard {
  url = 'graph/d/mysql-instance-overview/mysql-instances-overview?orgId=1&refresh=1m';

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
