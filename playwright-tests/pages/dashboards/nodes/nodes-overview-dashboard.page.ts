import { NodesOverviewDashboardPanels } from '@components/dashboards/nodes-overview-dashboard-panels';
import { BaseDashboard } from '../base-dashboard.page';

export default class NodesOverviewDashboard extends BaseDashboard {
  url = 'graph/d/node-instance-overview/nodes-overview?orgId=1&refresh=1m';

  verifyRoleAccessBlocksNodeExporter = async () => {
    const {
      dBInstances: _,
      minNodeUptime: __,
      ...panels
    } = NodesOverviewDashboardPanels;
    await this.verifyExpectedPanelsShowError(Object.values(panels));
  };
}
