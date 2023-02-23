import { expect, Page } from '@playwright/test';
import { NodesOverviewDashboardPanels } from '@tests/components/dashboardPanels/nodesOverviewDashboardPanels';
import { BaseDashboard } from '../BaseDashboard.page';

export default class PostgresqlInstancesOverviewDashboard extends BaseDashboard {
  constructor(page: Page) {
    super(page);
  }

  url = 'graph/d/postgresql-instance-overview/postgresql-instances-overview?orgId=1&refresh=1m';

  elements = {
    ...super.getBaseDashboardElements(),
  };

  fields = {
    ...super.getBaseDashboardFields(),
  };

  labels = {
    ...super.getBaseDashboardLabels(),
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
