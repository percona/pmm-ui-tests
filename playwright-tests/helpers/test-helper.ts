import { test as base } from '@playwright/test';
import HomeDashboardPage from '@pages/home-dashboard.page';
import LoginPage from '@pages/login.page';
import PerconaPlatformPage from '@pages/pmm-settings/PerconaPlatform.page';
import EntitlementsPage from '@pages/platformPages/entitlements.page';
import EnvironmentOverviewPage from '@pages/platformPages/environment-overview.page';
import TicketsPage from '@pages/platformPages/tickets.page';
import { RbacPage } from '@tests/configuration/pages/rbac.page';
import AdvancedSettingsPage from '@pages/pmm-settings/advanced-settings.page';
import { CreateRolePage } from '@tests/configuration/pages/create-role.page';
import { NewUserPage } from '@pages/serverAdmin/NewUser.page';
import { UsersConfigurationPage } from '@tests/configuration/pages/users-configuration.page';
import NodesOverviewDashboard from '@pages/dashboards/nodes/nodes-overview-dashboard.page';
import { MySqlDashboard } from '@pages/dashboards/mysql/mysql-dashboard.page';
import PostgresqlInstancesOverviewDashboard from '@pages/dashboards/postgresql/postgresql-iInstances-overview.page';
import { MongoDBInstanceSummary } from '@pages/dashboards/mongo/mongo-db-instance-summary.page';
import { QanPage } from '@pages/QAN/QueryAnalytics.page';
import { ServicesPage } from '@tests/inventory/pages/services.page';
import { NodesPage } from '@tests/inventory/pages/nodes.page';
import { AddServicePage } from '@tests/inventory/pages/add-service.page';
import grafanaHelper from "@helpers/grafana-helper";

// Declare the types of fixtures.
type PagesCollection = {
  addServicePage: AddServicePage;
  advancedSettingsPage: AdvancedSettingsPage;
  createRolePage: CreateRolePage;
  entitlementsPage: EntitlementsPage;
  environmentOverviewPage: EnvironmentOverviewPage;
  homeDashboardPage: HomeDashboardPage;
  loginPage: LoginPage;
  mongoDBInstanceSummary: MongoDBInstanceSummary;
  mySqlDashboard: MySqlDashboard;
  newUserPage: NewUserPage;
  nodesOverviewDashboard: NodesOverviewDashboard;
  nodesPage: NodesPage;
  perconaPlatformPage: PerconaPlatformPage;
  postgresqlInstancesOverviewDashboard: PostgresqlInstancesOverviewDashboard;
  qanPage: QanPage;
  servicesPage: ServicesPage;
  rbacPage: RbacPage;
  ticketsPage: TicketsPage;
  usersConfigurationPage: UsersConfigurationPage;
};

/**
 * Test base to provide pages collection to any test.
 * Also holds predefined custom test actions. Should be used
 */
export const test = base.extend<PagesCollection>({
  // TODO: implement lazy init ex: loginPage() to save resources
  addServicePage: async ({ page }, use) => {
    await use(new AddServicePage(page));
  },
  advancedSettingsPage: async ({ page }, use) => {
    await use(new AdvancedSettingsPage(page));
  },
  createRolePage: async ({ page }, use) => {
    await use(new CreateRolePage(page));
  },
  entitlementsPage: async ({ page }, use) => {
    await use(new EntitlementsPage(page));
  },
  environmentOverviewPage: async ({ page }, use) => {
    await use(new EnvironmentOverviewPage(page));
  },
  homeDashboardPage: async ({ page }, use) => {
    await use(new HomeDashboardPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  mongoDBInstanceSummary: async ({ page }, use) => {
    await use(new MongoDBInstanceSummary(page));
  },
  mySqlDashboard: async ({ page }, use) => {
    await use(new MySqlDashboard(page));
  },
  newUserPage: async ({ page }, use) => {
    await use(new NewUserPage(page));
  },
  nodesOverviewDashboard: async ({ page }, use) => {
    await use(new NodesOverviewDashboard(page));
  },
  nodesPage: async ({ page }, use) => {
    await use(new NodesPage(page));
  },
  perconaPlatformPage: async ({ page }, use) => {
    await use(new PerconaPlatformPage(page));
  },
  postgresqlInstancesOverviewDashboard: async ({ page }, use) => {
    await use(new PostgresqlInstancesOverviewDashboard(page));
  },
  qanPage: async ({ page }, use) => {
    await use(new QanPage(page));
  },
  servicesPage: async ({ page }, use) => {
    await use(new ServicesPage(page));
  },
  rbacPage: async ({ page }, use) => {
    await use(new RbacPage(page));
  },
  ticketsPage: async ({ page }, use) => {
    await use(new TicketsPage(page));
  },
  usersConfigurationPage: async ({ page }, use) => {
    await use(new UsersConfigurationPage(page));
  },

  // authenticateSession: async ({ page: Page }) => {
  //   await grafanaHelper.authorize(page);
  // },
});
export { expect } from '@playwright/test';
