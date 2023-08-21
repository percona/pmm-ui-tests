import { BaseDashboard } from '../base-dashboard.page';

export default class PostgresqlInstancesOverviewDashboard extends BaseDashboard {
  url = 'graph/d/postgresql-instance-overview/postgresql-instances-overview?orgId=1&refresh=1m';

  elements: any = {
    ...this.elements,
  };
  buttons: any = {
    ...this.buttons,
  };
  messages: any = {
    ...this.messages,
  };
}
