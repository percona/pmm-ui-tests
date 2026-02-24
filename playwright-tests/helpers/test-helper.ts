import { test as base } from '@playwright/test';
import HomeDashboardPage from '@pages/home-dashboard.page';
import LoginPage from '@pages/login.page';
import { AccessRolesPage } from '@tests/configuration/pages/access-roles.page';
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

// Declare the types of fixtures.
type PagesCollection = {
  accessRolesPage: AccessRolesPage;
  addServicePage: AddServicePage;
  advancedSettingsPage: AdvancedSettingsPage;
  createRolePage: CreateRolePage;
  homeDashboardPage: HomeDashboardPage;
  loginPage: LoginPage;
  mongoDBInstanceSummary: MongoDBInstanceSummary;
  mySqlDashboard: MySqlDashboard;
  newUserPage: NewUserPage;
  nodesOverviewDashboard: NodesOverviewDashboard;
  nodesPage: NodesPage;
  postgresqlInstancesOverviewDashboard: PostgresqlInstancesOverviewDashboard;
  qanPage: QanPage;
  servicesPage: ServicesPage;
  usersConfigurationPage: UsersConfigurationPage;
};

/**
 * Test base to provide pages collection to any test.
 * Also holds predefined custom test actions. Should be used
 */
export const test = base.extend<PagesCollection>({
  // TODO: implement lazy init ex: loginPage() to save resources
  accessRolesPage: async ({ page }, use) => {
    await use(new AccessRolesPage(page));
  },
  addServicePage: async ({ page }, use) => {
    await use(new AddServicePage(page));
  },
  advancedSettingsPage: async ({ page }, use) => {
    await use(new AdvancedSettingsPage(page));
  },
  createRolePage: async ({ page }, use) => {
    await use(new CreateRolePage(page));
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
  postgresqlInstancesOverviewDashboard: async ({ page }, use) => {
    await use(new PostgresqlInstancesOverviewDashboard(page));
  },
  qanPage: async ({ page }, use) => {
    await use(new QanPage(page));
  },
  servicesPage: async ({ page }, use) => {
    await use(new ServicesPage(page));
  },
  usersConfigurationPage: async ({ page }, use) => {
    await use(new UsersConfigurationPage(page));
  },
});
export { expect } from '@playwright/test';
