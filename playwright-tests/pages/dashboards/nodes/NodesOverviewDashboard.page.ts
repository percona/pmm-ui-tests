import { expect, Page } from '@playwright/test';
import { NodesOverviewDashboardPanels } from '@tests/components/dashboardPanels/nodesOverviewDashboardPanels';
import { BaseDashboard } from '../BaseDashboard.page';

export default class NodesOverviewDashboard extends BaseDashboard {
  constructor(page: Page) {
    super(page);
  }

  url = 'graph/d/node-instance-overview/nodes-overview?orgId=1&refresh=1m';

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

  verifyRoleAccessBlocksNodeExporter = async () => {
    const { dBInstances: _, minNodeUptime: __, ...panels } = NodesOverviewDashboardPanels;
    await this.verifyExpectedPanelsShowError(Object.values(panels));
  }
}
