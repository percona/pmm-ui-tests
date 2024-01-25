import { BaseDashboard } from '../base-dashboard.page';

export class MongoDBInstanceSummary extends BaseDashboard {
  url = 'graph/d/mysql-instance-overview/mysql-instances-overview?orgId=1&refresh=1m';

  labels: any = {
    ...this.labels,
    dashboardName: 'MongoDB Instance Summary',
  };
}
