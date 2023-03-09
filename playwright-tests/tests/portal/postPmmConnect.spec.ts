import { expect, test } from '@playwright/test';
import apiHelper from '@api/apiHelper';
import User from '@support/types/user.interface';
import { fileHelper } from '@helpers/FileHelper';
import { portalAPI } from '@api/portalApi';
import { oktaAPI } from '@api/okta';
import { serviceNowAPI } from '@api/serviceNowApi';
import { PortalUserRoles } from '@support/enums/portalUserRoles';
import { SignInPage } from '@pages/SignIn.page';
import HomeDashboard from '@pages/HomeDashboard.page';
import TicketsPage from '@pages/platformPages/Tickets.page';
import Duration from '@helpers/Duration';
import EntitlementsPage from '@pages/platformPages/Entitlements.page';
import EnvironmentOverview from '@pages/platformPages/EnvironmentOverview.page';
import grafanaHelper from '@helpers/GrafanaHelper';
import PerconaPlatform from '@pages/pmmSettings/PerconaPlatform.page';

test.describe('Spec file for PMM connected the portal', async () => {
  let firstAdmin: User;
  let secondAdmin: User;
  let technicalUser: User;
  let freeUser: User;
  let pmmVersion: number;
  const fileName = 'portalCredentials';
  let orgId: string;

  test.beforeAll(async () => {
    if (!pmmVersion) {
      const versionString = (await apiHelper.getPmmVersion()).versionMinor;
      pmmVersion = parseInt(versionString);
    }
    const userCredentials = await fileHelper.readfile(fileName);
    let adminToken;
    if (userCredentials) {
      [firstAdmin, secondAdmin, technicalUser] = JSON.parse(userCredentials);
      adminToken = await portalAPI.getUserAccessToken(firstAdmin.email, firstAdmin.password);
      orgId = (await portalAPI.getOrg(adminToken)).orgs[0].id;
    } else {
      [firstAdmin, secondAdmin, technicalUser] = await serviceNowAPI.createServiceNowUsers();
      adminToken = await portalAPI.getUserAccessToken(firstAdmin.email, firstAdmin.password);
      let { org } = await portalAPI.createOrg(adminToken);
      orgId = org.id;
      await portalAPI.inviteUserToOrg(adminToken, org.id, secondAdmin.email, PortalUserRoles.admin);
      await portalAPI.inviteUserToOrg(adminToken, org.id, technicalUser.email, PortalUserRoles.technical);
      await fileHelper.writeFileSync(fileName, JSON.stringify([firstAdmin, secondAdmin, technicalUser]));
    }
    freeUser = await oktaAPI.createTestUser();
    await portalAPI.inviteUserToOrg(adminToken, orgId, freeUser.email, PortalUserRoles.admin);
  });

  test.beforeEach(async ({ page }) => {
    await apiHelper.confirmTour(page);
    await page.goto('');
  });

  test('Verify user roles are untouched after PMM server upgrade @not-ui-pipeline @portal @post-pmm-portal-upgrade', async () => {
    const users = await apiHelper.listOrgUsers();
    const foundAdmin1User = users.find((user: any) => user.email === firstAdmin.email);
    const foundAdmin2User = users.find((user: any) => user.email === secondAdmin.email);
    const foundTechnicalUser = users.find((user: any) => user.email === technicalUser.email);

    expect(foundAdmin1User.role).toEqual('Admin');
    expect(foundAdmin2User.role).toEqual('Admin');
    expect(foundTechnicalUser.role).toEqual('Viewer');
  });

  test('PMM-T1132 Verify PMM user logged in using SSO and member of SN account is able to see tickets @not-ui-pipeline @portal @post-pmm-portal-upgrade', async ({
    page,
    context,
  }) => {
    test.info().annotations.push({
      type: 'Also Covers',
      description:
        'PMM-T1149 Verify PMM user logged in using SSO and is a member of SN account is able to see empty list of tickets',
    });
    const signInPage = new SignInPage(page);
    const homeDashboard = new HomeDashboard(page);
    const ticketsPage = new TicketsPage(page);

    if (pmmVersion > 27) {
      await test.step('1. Login to he connected pmm with SSO', async () => {
        await signInPage.oktaLogin(firstAdmin.email, firstAdmin.password);
        await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
      });

      await test.step('2. Verify that there is a side menu for organizational tickets', async () => {
        await homeDashboard.sideMenu.elements.tickets.click();
      });

      await test.step('3. Verify user can see tickets for his org.', async () => {
        await ticketsPage.elements.table.waitFor({ state: 'visible' });
        await expect(ticketsPage.elements.rows).toHaveCount(1);
        const [newPage] = await Promise.all([context.waitForEvent('page'), ticketsPage.elements.row(0).click()]);
        await newPage.getByRole('form').waitFor({ state: 'visible' });
        expect(newPage.url()).toContain(ticketsPage.serviceNowUrl);
        await newPage.close();
      });

      await test.step('4. Verify user can see empty list of tickets for his org.', async () => {
        await apiHelper.interceptBackEndCall(page, '**/v1/Platform/SearchOrganizationTickets', { tickets: [] });
        await page.reload();
        await expect(ticketsPage.elements.noDataTable).toHaveText(ticketsPage.messages.noTicketsFound);
      });
    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.28.0 and higher',
      });
    }
  });

  test('PMM-T1152 Verify user logged in using SSO and is a member of SN account is able to see Entitlements @not-ui-pipeline @portal @post-pmm-portal-upgrade', async ({
    page,
    context,
  }) => {
    const signInPage = new SignInPage(page);
    const homeDashboard = new HomeDashboard(page);
    const entitlementsPage = new EntitlementsPage(page);

    if (pmmVersion > 27) {
      await test.step('1. Login to he connected pmm with SSO', async () => {
        await signInPage.oktaLogin(firstAdmin.email, firstAdmin.password);
        await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
      });

      await test.step('2. Verify that there is a side menu for Entitlements', async () => {
        await homeDashboard.sideMenu.elements.entitlements.click();
      });

      await test.step('3. Verify user can see entitlements for his org.', async () => {
        await expect(entitlementsPage.elements.row).toHaveCount(3);
        await page.waitForTimeout(6000);
      });

      await test.step('4. Verify user can see empty list of entitlements for his org.', async () => {
        await apiHelper.interceptBackEndCall(page, '**/v1/Platform/SearchOrganizationEntitlements', { entitlements: [] });
        await page.reload();
        await expect(entitlementsPage.elements.noData).toHaveText(entitlementsPage.messages.noEntitlements);
      });
    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.28.0 and higher',
      });
    }
  });

  test('PMM-T1222 Verify user can see the contacts from Percona @not-ui-pipeline @portal @post-pmm-portal-upgrade', async ({
    page,
    context,
  }) => {
    test.info().annotations.push({
      type: 'Also Covers:',
      description: 'PMM-T1168 - Verify PMM user logged in using SSO and member of SN account is able to see contacts',
    });
    await context.grantPermissions(['clipboard-write', 'clipboard-read']);
    const homeDashboard = new HomeDashboard(page);
    const signInPage = new SignInPage(page);
    const environmentOverviewPage = new EnvironmentOverview(page);
    const userToken = await portalAPI.getUserAccessToken(firstAdmin.email, firstAdmin.password);
    const contactsEmail = (await portalAPI.getOrgDetails(userToken, orgId)).contacts.customer_success.email;

    if (pmmVersion >= 29) {
      await signInPage.oktaLogin(firstAdmin.email, firstAdmin.password);
      await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
      await homeDashboard.sideMenu.elements.environmentOverview.click();
      await environmentOverviewPage.elements.contactsHeader.waitFor({ state: 'visible' });
      await environmentOverviewPage.elements.contactsSubHeader.waitFor({ state: 'visible' });
      await environmentOverviewPage.elements.contactsName.waitFor({ state: 'visible' });
      await environmentOverviewPage.elements.emailIcon.click();
      const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
      expect(contactsEmail).toEqual(clipboardContent);
    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.28.0 and higher',
      });
    }
  });

  test('PMM-T1147 Verify PMM user that is not logged in with SSO can NOT see Tickets for organization @not-ui-pipeline @portal @post-pmm-portal-upgrade', async ({
    page,
    context,
  }) => {
    const homeDashboard = new HomeDashboard(page);
    const ticketsPage = new TicketsPage(page);
    if (pmmVersion > 27) {
      await test.step('1. Login to he connected pmm with SSO', async () => {
        await grafanaHelper.authorize(page);
        await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
      });

      await test.step('2. Verify that there is NO side menu for organizational tickets', async () => {
        await homeDashboard.sideMenu.elements.tickets.waitFor({ state: 'detached' });
      });

      await test.step('3. Verify user can NOT see tickets.', async () => {
        await page.goto(ticketsPage.ticketsUrl);
        if (pmmVersion >= 28) {
          await expect(ticketsPage.elements.notPlatformUser).toHaveText(ticketsPage.messages.loginWithPercona);
        } else {
          await expect(ticketsPage.elements.emptyBlock).toHaveText(ticketsPage.messages.notConnectedToThePortal);
        }
      });
    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.28.0 and higher',
      });
    }
  });

  test('PMM-T1154 Verify PMM user that is not logged in with SSO can NOT see Entitlements for organization @not-ui-pipeline @portal @post-pmm-portal-upgrade', async ({
    page,
    context,
  }) => {
    const homeDashboard = new HomeDashboard(page);
    const ticketsPage = new TicketsPage(page);
    const entitlementsPage = new EntitlementsPage(page);

    if (pmmVersion > 27) {
      await test.step('1. Login to the connected pmm with local account', async () => {
        await grafanaHelper.authorize(page);
        await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
      });

      await test.step('2. Verify that there is NO side menu for organizational Entitlements', async () => {
        await homeDashboard.sideMenu.elements.entitlements.waitFor({ state: 'detached' });
      });

      await test.step('3. Verify user can NOT see Entitlements.', async () => {
        await page.goto(entitlementsPage.entitlementsUrl);
        if (pmmVersion >= 28) {
          await expect(entitlementsPage.elements.notPlatformUser).toHaveText(entitlementsPage.messages.loginWithPercona);
        } else {
          await expect(entitlementsPage.elements.emptyBlock).toHaveText(entitlementsPage.messages.notConnectedToThePortal);
        }
      });
    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.28.0 and higher',
      });
    }
  });

  test('PMM-T1170 Verify PMM user that is not logged in with SSO can NOT see Contacts for organization @not-ui-pipeline @portal @post-pmm-portal-upgrade', async ({
    page,
    context,
  }) => {
    const homeDashboard = new HomeDashboard(page);
    const environmentOverview = new EnvironmentOverview(page);
    if (pmmVersion > 27) {
      await test.step('1. Login to the connected pmm with local account', async () => {
        await grafanaHelper.authorize(page);
        await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
      });
      await test.step('1. Login to the connected pmm with local account', async () => {
        await page.goto(environmentOverview.environmentOverviewUrl);
        await expect(environmentOverview.elements.notPlatformUser).toHaveText(environmentOverview.messages.loginWithPercona);
      });
    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.28.0 and higher',
      });
    }
  });

  test('PMM-T1148 Verify PMM user logged in using SSO and member of organization in Portal BUT not a SN account is NOT able to see Tickets @not-ui-pipeline @portal @post-pmm-portal-upgrade', async ({
    page,
  }) => {
    const signInPage = new SignInPage(page);
    const homeDashboard = new HomeDashboard(page);
    const ticketsPage = new TicketsPage(page);

    if (pmmVersion > 27) {
      await test.step('1. Login to he connected pmm with SSO', async () => {
        await signInPage.oktaLogin(freeUser.email, freeUser.password);
        await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
      });

      await test.step('2. Verify that there is a side menu for organizational tickets', async () => {
        await homeDashboard.sideMenu.elements.tickets.click();
      });

      await test.step('3. Verify user can NOT see tickets for his org.', async () => {
        await expect(ticketsPage.elements.noDataTable).toHaveText(ticketsPage.messages.noTicketsFound);
      });
    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.28.0 and higher',
      });
    }
  });

  test('PMM-T1153 Verify user logged in using SSO and is not a member of SN account is NOT able to see Entitlements @not-ui-pipeline @portal @post-pmm-portal-upgrade', async ({
    page,
  }) => {
    const signInPage = new SignInPage(page);
    const homeDashboard = new HomeDashboard(page);
    const ticketsPage = new TicketsPage(page);
    const entitlementsPage = new EntitlementsPage(page);

    if (pmmVersion > 27) {
      await test.step('1. Login to he connected pmm with SSO', async () => {
        await signInPage.oktaLogin(freeUser.email, freeUser.password);
        await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
      });

      await test.step('2. Verify that there is a side menu for organizational Entitlements', async () => {
        await homeDashboard.sideMenu.elements.entitlements.click();
      });

      await test.step('3. Verify user can NOT see Entitlements for his org.', async () => {
        await expect(ticketsPage.elements.noData).toHaveText(entitlementsPage.messages.noEntitlements);
      });
    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.28.0 and higher',
      });
    }
  });

  test('PMM-T1112 Verify user can disconnect pmm from portal success flow @portal @not-ui-pipeline @post-pmm-portal-upgrade', async ({
    page,
  }) => {
    const signInPage = new SignInPage(page);
    const homeDashboard = new HomeDashboard(page);
    const platformPage = new PerconaPlatform(page);

    if (pmmVersion > 27) {
      await signInPage.oktaLogin(firstAdmin.email, firstAdmin.password);
      await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
      await page.goto(platformPage.perconaPlatformURL);
      await platformPage.connectedContainer.waitFor({ state: 'visible' });
      await platformPage.buttons.disconnect.click();
      if (pmmVersion >= 28) {
        await platformPage.buttons.confirmDisconnect.click();
        await page.locator('//input[@name="user"]').waitFor({ state: 'visible' });
      } else {
        await platformPage.toast.checkToastMessage(platformPage.messages.pmmDisconnectedFromPortal);
      }
      await grafanaHelper.authorize(page);
      await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
      await page.goto(platformPage.perconaPlatformURL);
      const adminToken = await portalAPI.getUserAccessToken(firstAdmin.email, firstAdmin.password);
      await platformPage.connectToPortal(adminToken, `Test Server ${Date.now()}`, true);
    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.28.0 and higher',
      });
    }
  });
  // Needs to be fixed in the future.
  test('PMM-T1264 Verify that pmm admin user can force disconnect pmm from the portal. @not-ui-pipeline @portal @post-pmm-portal-upgrade', async ({
    page,
  }) => {
    const platformPage = new PerconaPlatform(page);

    if (pmmVersion > 28) {
      await test.step('1. Login into the pmm and navigate to the percona platform page.', async () => {
        await grafanaHelper.authorize(page);
        await page.goto(platformPage.perconaPlatformURL);
        await platformPage.connectedContainer.waitFor({ state: 'visible' });  
      });

      await test.step('2. Force disconnect from the platform.', async () => {
        await platformPage.buttons.disconnect.click();
        await expect(platformPage.elements.readMore).toHaveAttribute('href', platformPage.links.readMore);
        await platformPage.buttons.confirmDisconnect.click();
      });
      
      await test.step('3. Verify that force disconnect was successful.', async () => {
        await platformPage.toast.checkToastMessage(platformPage.messages.disconnectedSuccess);
        await platformPage.buttons.connect.waitFor({ state: 'visible' });
      });
      
    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.29.0 and higher',
      });
    }
  });

  test('PMM-T1247 Verify user cannot access platform functionality when PMM is not connected to the portal. @not-ui-pipeline @portal @post-pmm-portal-upgrade', async ({
    page,
  }) => {
    const environmentOverview = new EnvironmentOverview(page);
    const entitlementsPage = new EntitlementsPage(page);
    const ticketsPage = new TicketsPage(page);

    await grafanaHelper.authorize(page);
    await page.goto(environmentOverview.environmentOverviewUrl);
    await expect(environmentOverview.elements.notConnectedToPlatform).toHaveText(
      environmentOverview.messages.notConnectedToThePortal,
    );

    await page.goto(entitlementsPage.entitlementsUrl);
    await expect(entitlementsPage.elements.notConnectedToPlatform).toHaveText(entitlementsPage.messages.notConnectedToThePortal);

    await page.goto(ticketsPage.ticketsUrl);
    await expect(ticketsPage.elements.notConnectedToPlatform).toHaveText(ticketsPage.messages.notConnectedToThePortal);
  });

  test('After tests cleanup.', async () => {
    const adminToken = await portalAPI.getUserAccessToken(firstAdmin.email, firstAdmin.password);
    const org = await portalAPI.getOrg(adminToken);

    if (org.orgs.length) {
      await portalAPI.deleteOrg(adminToken, org.orgs[0].id);
    }

    await oktaAPI.deleteUsers([firstAdmin, secondAdmin, technicalUser]);
  });
});
