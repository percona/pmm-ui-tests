import { test as base } from '@playwright/test';
import HomeDashboardPage from '@pages/home-dashboard.page';
import LoginPage from '@pages/login.page';
import PerconaPlatformPage from '@pages/pmm-settings/PerconaPlatform.page';
import EntitlementsPage from '@pages/platformPages/entitlements.page';
import EnvironmentOverviewPage from '@pages/platformPages/environment-overview.page';
import TicketsPage from '@pages/platformPages/tickets.page';

// Declare the types of fixtures.
type PagesCollection = {
  entitlementsPage: EntitlementsPage;
  environmentOverviewPage: EnvironmentOverviewPage;
  homeDashboardPage: HomeDashboardPage;
  loginPage: LoginPage;
  perconaPlatformPage: PerconaPlatformPage;
  ticketsPage: TicketsPage;
};

/**
 * Test base to provide pages collection to any test.
 * Also holds predefined custom test actions. Should be used
 */
export const test = base.extend<PagesCollection>({
  // TODO: implement lazy init ex: loginPage() to save resources
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
  perconaPlatformPage: async ({ page }, use) => {
    await use(new PerconaPlatformPage(page));
  },
  ticketsPage: async ({ page }, use) => {
    await use(new TicketsPage(page));
  },
});
export { expect } from '@playwright/test';
