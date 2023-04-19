import { Page } from '@playwright/test';
import RbacTable from '@tests/components/rbacTable';
import { BaseDashboard } from '../BaseDashboard.page';

export class MongoDBInstanceSummary extends BaseDashboard {
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
        dashboardName: 'MongoDB Instance Summary',
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
