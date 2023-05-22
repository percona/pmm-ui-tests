import { Page, expect, test } from '@playwright/test';
import { api } from '@tests/api/api';
import apiHelper from '@tests/api/helpers/apiHelper';
import { oktaAPI } from '@tests/api/okta';
import { portalAPI } from '@tests/api/portalApi';
import { serviceNowAPI } from '@tests/api/serviceNowApi';
import Duration from '@tests/helpers/Duration';
import grafanaHelper from '@tests/helpers/GrafanaHelper';
import HomeDashboard from '@tests/pages/HomeDashboard.page';
import { SignInPage } from '@tests/pages/SignIn.page';
import { AdvisorInsights, FailedAdvisorType } from '@tests/tests/advisors/pages/AdvisorInsights.page';
import { ConfigurationAdvisors } from '@tests/tests/advisors/pages/ConfigurationAdvisors.page';
import PerconaPlatform from '@tests/pages/pmmSettings/PerconaPlatform.page';
import config from '@tests/playwright.config';
import User from '@tests/support/types/user.interface';
import { MongoDbAdvisors, MySqlAdvisors, PgSqlAdvisors } from './helpers/advisors';
import { executeCommand } from '@tests/helpers/CommandLine';

test.describe('Spec file for basic database version control of Advisors. ', async () => {
  let freePlatformUser: User;
  let freeUserToken: string;
  let freeOrg: any;
  let paidPlatformUser: User;
  let paidOrg: any;
  let numberOfAdvisorsNonRegistered: number;
  let numberOfAdvisorsRegistered: number;
  let numberOfAdvisorsPaid: number;

  test.beforeAll(async ({ baseURL }) => {
    freePlatformUser = await oktaAPI.createTestUser();
    freeUserToken = await portalAPI.getUserAccessToken(freePlatformUser.email, freePlatformUser.password);
    freeOrg = (await portalAPI.createOrg(freeUserToken)).org;
    await api.pmm.settingsV1.changeSettings({ pmm_public_address: baseURL!.replace(/(^\w+:|^)\/\//, '') });
    console.log(freePlatformUser);
    [paidPlatformUser] = await serviceNowAPI.createServiceNowUsers();
    const paidPlatformUserToken = await portalAPI.getUserAccessToken(paidPlatformUser.email, paidPlatformUser.password);
    paidOrg = (await portalAPI.createOrg(paidPlatformUserToken)).org;
    console.log(paidPlatformUser);
  });

  test.beforeEach(async ({ page }, testInfo) => {
    if (testInfo.title.includes('PMM-T1645')) {
      executeCommand('npx ts-node ../pmm-qa/pmm-integration/integration-setup.ts --clear-all-setups')
      executeCommand('npx ts-node ../pmm-qa/pmm-integration/integration-setup.ts --addclient=modb,2 --pmm-server-flags="-e PERCONA_TEST_CHECKS_FILE=/opt/checks/mongodb-clickhouse-qan-enabled.yml"')
    }
    await apiHelper.confirmTour(page);
    await grafanaHelper.authorize(page, 'admin', 'admin');
    await page.goto('');
  });

  test.afterAll(async () => {
    await portalAPI.deleteOrg(await portalAPI.getUserAccessToken(freePlatformUser.email, freePlatformUser.password), freeOrg.id);
    await oktaAPI.deleteUserByEmail(freePlatformUser.email);
    await portalAPI.deleteOrg(await portalAPI.getUserAccessToken(paidPlatformUser.email, paidPlatformUser.password), paidOrg.id);
    await oktaAPI.deleteUserByEmail(paidPlatformUser.email);
  });

  test('PMM-T1631 Verify integrity of the new Advisors PoC @advisors', async ({ page, context, browser }) => {
    test.info().annotations.push({
      type: 'Also Covers',
      description: 'PMM-T1679 Verify integrity of the new Advisors : Verify that basic Advisors regarding services versions are displayed',
    });
    let configurationAdvisors = new ConfigurationAdvisors(page);
    let advisorInsights = new AdvisorInsights(page);
    let homeDashboard = new HomeDashboard(page);
    let signInPage = new SignInPage(page);
    let perconaPlatformPage = new PerconaPlatform(page);
    let paidPage: Page;

    await test.step('1. Login and run advisors check', async () => {
      await page.goto(configurationAdvisors.url);
      await configurationAdvisors.buttons.runChecks.click();
      await configurationAdvisors.toast.checkToastMessageContains(configurationAdvisors.messages.advisorsRunning, { variant: 'success' });
      numberOfAdvisorsNonRegistered = await configurationAdvisors.getNumberOfAllAvailableAdvisors();
    });

    await test.step('2. Verify that check passed with results.', async () => {
      await configurationAdvisors.buttons.advisorInsights.click();
      await advisorInsights.verifyFailedAdvisorsForServiceAndType('mo-integration-', FailedAdvisorType.Notice, 1);
      await advisorInsights.verifyFailedAdvisorsForServiceAndType('pdpgsql-integration-', FailedAdvisorType.Warning, 1);
      await advisorInsights.verifyFailedAdvisorsForServiceAndType('ps_integration_', FailedAdvisorType.Warning, 1);
      await advisorInsights.verifyFailedAdvisorsForServiceAndType('ps_integration_', FailedAdvisorType.Notice, 1);
      await advisorInsights.verifyFailedAdvisorsForServiceAndType('mo-ps-integration-', FailedAdvisorType.Error, 2);
    });

    await test.step('3. Verify Correct failed advisors for the Percona Server for MongoDb', async () => {
      await advisorInsights.elements.failedAdvisorRowByServiceName('mo-ps-integration-').click();
      await advisorInsights.elements.failedAdvisorRow(MongoDbAdvisors.mongoDbEndOfLife).waitFor({ state: 'visible' });
      await advisorInsights.elements.failedAdvisorRow(MongoDbAdvisors.mongoDbUnsupportedVersion).waitFor({ state: 'visible' });
    });

    await test.step('3. Verify Correct failed advisors for the Percona Server for MySql', async () => {
      await configurationAdvisors.buttons.advisorInsights.click();
      await advisorInsights.elements.failedAdvisorRowByServiceName('ps_integration_').click();
      await advisorInsights.elements.failedAdvisorRow(MySqlAdvisors.mysqlVersionEndOfLife57).waitFor({ state: 'visible' });
      await advisorInsights.elements.failedAdvisorRow(MySqlAdvisors.mysqlVersion).waitFor({ state: 'visible' });
    });

    await test.step('3. Verify Correct failed advisors for the Percona Server for PgSql', async () => {
      await configurationAdvisors.buttons.advisorInsights.click();
      await advisorInsights.elements.failedAdvisorRowByServiceName('pdpgsql-integration-').click();
      await advisorInsights.elements.failedAdvisorRow(PgSqlAdvisors.pgsqlVersionCheck).waitFor({ state: 'visible' });
    });

    await test.step('3. Verify Correct failed advisors for the MongoDb', async () => {
      await configurationAdvisors.buttons.advisorInsights.click();
      await advisorInsights.elements.failedAdvisorRowByServiceName('mo-integration-').click();
      await advisorInsights.elements.failedAdvisorRow(MongoDbAdvisors.mongoDbVersion).waitFor({ state: 'visible' });
    });

    await test.step('3. Verify that failed advisors are displayed on home dashboard.', async () => {
      await advisorInsights.sideMenu.elements.home.click();
      await homeDashboard.verifyFailedAdvisorsNumberIsGreaterThen({ error: 2, warning: 2, notice: 2 });
    });

    await test.step('4. Verify that advisors link from home dashboard links to advisors page.', async () => {
      await homeDashboard.elements.failedAdvisorsPanel.advisorLink.click();
      await expect(page).toHaveURL(`${config.use?.baseURL}/${advisorInsights.url}`);
      numberOfAdvisorsNonRegistered = await configurationAdvisors.getNumberOfAllAvailableAdvisors();
    });

    await test.step('5. Connect free Org and open new browser window.', async () => {
      await api.pmm.platformV1.connect('Test Server', await portalAPI.getUserAccessToken(freePlatformUser.email, freePlatformUser.password));

      await page.close();
      page = await context.newPage()
      await apiHelper.confirmTour(page);
      configurationAdvisors = new ConfigurationAdvisors(page);
      advisorInsights = new AdvisorInsights(page);
      homeDashboard = new HomeDashboard(page);
      signInPage = new SignInPage(page);
      perconaPlatformPage = new PerconaPlatform(page);
      await page.waitForTimeout(Duration.TenSeconds);
      await page.goto('')
      await grafanaHelper.unAuthorize(page);
    });

    await test.step('6. Login as free registered platform user.', async () => {
      await signInPage.oktaLogin(freePlatformUser.email, freePlatformUser.password);
      await page.goto(configurationAdvisors.url);
      await configurationAdvisors.buttons.runChecks.click();
      await configurationAdvisors.toast.checkToastMessageContains(configurationAdvisors.messages.advisorsRunning, { variant: 'success' });
    });

    await test.step('7. Verify that failed advisors are displayed on home dashboard.', async () => {
      await page.waitForTimeout(Duration.OneMinute);
      await advisorInsights.sideMenu.elements.home.click();
      await homeDashboard.verifyFailedAdvisorsNumberIsGreaterThen({ error: 2, warning: 10, notice: 3 });
    });

    await test.step('8. Verify Number of advisors available', async () => {
      await page.goto(configurationAdvisors.url);
      numberOfAdvisorsRegistered = await configurationAdvisors.getNumberOfAllAvailableAdvisors();
      expect(numberOfAdvisorsRegistered).toBeGreaterThan(numberOfAdvisorsNonRegistered);
    });

    await test.step('9. Disconnect PMM from the registered org.', async () => {
      await page.goto(perconaPlatformPage.perconaPlatformURL)
      await perconaPlatformPage.buttons.disconnect.click();
      await perconaPlatformPage.buttons.confirmDisconnect.click();
      await signInPage.fields.username.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
    });

    await test.step('10. Connect paid Org and open new browser window.', async () => {
      await api.pmm.platformV1.connect('Test Server', await portalAPI.getUserAccessToken(paidPlatformUser.email, paidPlatformUser.password));
      const paidContext = await browser.newContext();
      await page.close();
      page = await paidContext.newPage()
      await apiHelper.confirmTour(page);
      configurationAdvisors = new ConfigurationAdvisors(page);
      advisorInsights = new AdvisorInsights(page);
      homeDashboard = new HomeDashboard(page);
      signInPage = new SignInPage(page);
      perconaPlatformPage = new PerconaPlatform(page);
      await page.waitForTimeout(Duration.TenSeconds);
      await page.goto('')
      await grafanaHelper.unAuthorize(page);
    });

    await test.step('11. Login as paid user and rerun checks.', async () => {
      await signInPage.waitForOktaLogin();

      await signInPage.oktaLogin(paidPlatformUser.email, paidPlatformUser.password);
      await page.goto(configurationAdvisors.url);
      await configurationAdvisors.buttons.runChecks.click();
      await configurationAdvisors.toast.checkToastMessageContains(configurationAdvisors.messages.advisorsRunning, { variant: 'success' });
      numberOfAdvisorsPaid = await configurationAdvisors.getNumberOfAllAvailableAdvisors();
      expect(numberOfAdvisorsPaid).toBeGreaterThan(numberOfAdvisorsRegistered);
    });

    await test.step('12. Verify that failed advisors are displayed on home dashboard.', async () => {
      await page.waitForTimeout(Duration.OneMinute);
      await advisorInsights.sideMenu.elements.home.click();
      await homeDashboard.verifyFailedAdvisorsNumberIsGreaterThen({ error: 2, warning: 10, notice: 3 });
    });
  });


  test('PMM-T1684 Verify integrity of the new Advisors: Test example Check @developmentAdvisors', async ({ page, context, browser }) => {
    let configurationAdvisors = new ConfigurationAdvisors(page);
    let advisorInsights = new AdvisorInsights(page);

    await test.step('1. Login and run advisors check', async () => {
      await page.goto(advisorInsights.url);
      await advisorInsights.buttons.developmentAdvisors.click();
      await advisorInsights.openAllCategoryCollapseElements();
      await advisorInsights.buttons.runAdvisor('Check format V2').click();
      await advisorInsights.toast.checkToastMessage(advisorInsights.messages.advisorRunning('Check format V2'), { variant: 'success' });
    });

    await test.step('1. Login and run advisors check', async () => {
      await configurationAdvisors.buttons.advisorInsights.click();
      await advisorInsights.verifyFailedAdvisorsForServiceAndType('ps_integration_', FailedAdvisorType.Warning, 5, Duration.TwentyMinutes);
    });
  });

  test('PMM-T1689 Verify Advisors : MongoDB replica sets Actions executed always on the corresponding node @developmentAdvisors', async ({ page, context, browser }) => {
    let advisorInsights = new AdvisorInsights(page);
    const advisorName = 'Check that advisor hits proper service';

    await test.step('1. Login and run advisor check for mongo db replica set.', async () => {
      await page.goto(advisorInsights.url);
      await advisorInsights.buttons.developmentAdvisors.click();
      await advisorInsights.openAllCategoryCollapseElements();
      await advisorInsights.buttons.runAdvisor(advisorName).click();
      await advisorInsights.toast.checkToastMessage(advisorInsights.messages.advisorRunning(advisorName), { variant: 'success' });
    });

    await test.step('2. Verify that check for the first node is executed on the first node.', async () => {
      const serviceName = 'mo-replica-integration-0';
      await advisorInsights.buttons.advisorInsights.click();
      await advisorInsights.verifyFailedAdvisorsForServiceAndType(serviceName, FailedAdvisorType.Notice, 1, Duration.TwentyMinutes);
      await advisorInsights.elements.failedAdvisorRow(serviceName).click();
      await advisorInsights.failedChecksTable.elements.showDetails('test_check').click();
      await expect(advisorInsights.failedChecksTable.elements.serviceName('test_check')).toContainText(serviceName);
    });

    await test.step('3. Verify that check for the second node is executed on the second node.', async () => {
      const serviceName = 'mo-replica-integration-1';
      await advisorInsights.buttons.advisorInsights.click();
      await advisorInsights.verifyFailedAdvisorsForServiceAndType(serviceName, FailedAdvisorType.Notice, 1, Duration.TwentyMinutes);
      await advisorInsights.elements.failedAdvisorRow(serviceName).click();
      await advisorInsights.failedChecksTable.elements.showDetails('test_check').click();
      await expect(advisorInsights.failedChecksTable.elements.serviceName('test_check')).toContainText(serviceName);
    });

    await test.step('2. Verify that check for the third node is executed on the third node.', async () => {
      const serviceName = 'mo-replica-integration-2';
      await advisorInsights.buttons.advisorInsights.click();
      await advisorInsights.verifyFailedAdvisorsForServiceAndType(serviceName, FailedAdvisorType.Notice, 1, Duration.TwentyMinutes);
      await advisorInsights.elements.failedAdvisorRow(serviceName).click();
      await advisorInsights.failedChecksTable.elements.showDetails('test_check').click();
      await expect(advisorInsights.failedChecksTable.elements.serviceName('test_check')).toContainText(serviceName);
    });

  });
});
