import { expect, test } from '@helpers/test-helper';
import apiHelper from '@api/helpers/api-helper';
import { PortalUser } from '@helpers/types/portal-user.class';
import grafanaHelper from '@helpers/grafana-helper';
import { api, OrgUser } from '@api/api';
import { portalHelper } from '@helpers/portal-helper';
import Wait from '@helpers/enums/wait';

/**
 *  Connect PMM to Portal tests do not require any monitored services.
 *  But requires environment variables(.env file supported) with credentials see: {@link constants.portal},
 *  {@link constants.okta} and {@link constants.serviceNow}.
 *  PMM Server requires number of environment variables.
 *
 *  @see /docs/setup-env-portal.md
 */
test.describe.skip('Spec file for PMM connected the portal', async () => {
  let firstAdmin: PortalUser;
  let secondAdmin: PortalUser;
  let technicalUser: PortalUser;
  let freeUser: PortalUser;
  let pmmVersion: number;

  test.beforeAll(async () => {
    if (!pmmVersion) {
      pmmVersion = (await api.pmm.serverV1.getPmmVersion()).minor;
    }
    [firstAdmin, secondAdmin, technicalUser, freeUser] = portalHelper.loadUsersFromFile();
  });

  test.beforeEach(async ({ page, loginPage }) => {
    await apiHelper.confirmTour(page);
    await loginPage.open();
  });

  test.fixme('Verify user roles are untouched after PMM server upgrade'
      + ' @not-ui-pipeline @portal @portal-post-upgrade', async () => {
    // TODO: Investigate issue: listOrgUsers() authenticated with "admin" users and does not display
    //  users from constants.portal.credentialsFile.
    const users = await api.grafana.org.listOrgUsers();
    console.log(users);
    console.log(firstAdmin.email);
    console.log(secondAdmin.email);
    console.log(technicalUser.email);
    const foundAdmin1User = users.find((user: OrgUser) => user.email === firstAdmin.email);
    const foundAdmin2User = users.find((user: OrgUser) => user.email === secondAdmin.email);
    const foundTechnicalUser = users.find((user: OrgUser) => user.email === technicalUser.email);

    expect(foundAdmin1User).toBeDefined();
    expect(foundAdmin2User).toBeDefined();
    expect(foundAdmin1User).toBeDefined();
    expect(foundAdmin1User?.role).toEqual('Admin');
    expect(foundAdmin2User?.role).toEqual('Admin');
    expect(foundTechnicalUser?.role).toEqual('Viewer');
  });

  test('PMM-T1149 PMM-T1132 Verify PMM user logged in using SSO and member of SN account is able to see tickets'
      + ' @not-ui-pipeline @portal @portal-post-upgrade', async ({ loginPage, homeDashboardPage, ticketsPage, context }) => {
    test.skip(pmmVersion < 27, 'This test is for PMM version 2.27.0 and higher');
    await test.step('1. Login to he connected pmm with SSO', async () => {
      await loginPage.signInWithPerconaAccount(firstAdmin.email, firstAdmin.password);
      await homeDashboardPage.waitToBeOpened();
    });

    await test.step('2. Verify that there is a side menu for organizational tickets', async () => {
      await homeDashboardPage.sideMenu.tickets.click();
    });

    await test.step('3. Verify user can see tickets for his org.', async () => {
      await ticketsPage.elements.table.waitFor({ state: 'visible' });
      await expect(ticketsPage.elements.rows).toHaveCount(1);
      const [newPage] = await Promise.all([context.waitForEvent('page'), ticketsPage.elements.row(0).click()]);

      await newPage.getByRole('main').waitFor({ state: 'visible' });
      expect(newPage.url()).toContain(ticketsPage.serviceNowUrl);
      await newPage.close();
    });

    await test.step('4. Verify user can see empty list of tickets for his org.', async () => {
      await ticketsPage.network.interceptRequest('**/v1/Platform/SearchOrganizationTickets', { tickets: [] });
      await ticketsPage.page.reload();
      await expect(ticketsPage.elements.noDataTable).toHaveText(ticketsPage.messages.noTicketsFound);
    });
  });

  test('PMM-T1152 Verify user logged in using SSO and is a member of SN account is able to see Entitlements'
      + ' @not-ui-pipeline @portal @portal-post-upgrade', async ({ page, loginPage, homeDashboardPage, entitlementsPage }) => {
    test.skip(pmmVersion < 27, 'This test is for PMM version 2.27.0 and higher');

    await test.step('1. Login to he connected pmm with SSO', async () => {
      await loginPage.signInWithPerconaAccount(firstAdmin.email, firstAdmin.password);
      await homeDashboardPage.waitToBeOpened();
    });
    await test.step('2. Verify that there is a side menu for Entitlements', async () => {
      await homeDashboardPage.sideMenu.entitlements.click();
    });
    await test.step('3. Verify user can see entitlements for his org.', async () => {
      await expect(entitlementsPage.elements.row).toHaveCount(3);
      await page.waitForTimeout(6000);
    });
    await test.step('4. Verify user can see empty list of entitlements for his org.', async () => {
      await entitlementsPage.network.interceptRequest('**/v1/Platform/SearchOrganizationEntitlements', { entitlements: [] });
      await entitlementsPage.page.reload();
      await expect(entitlementsPage.elements.noData).toHaveText(entitlementsPage.messages.noEntitlements);
    });
  });

  test('PMM-T1168 PMM-T1222 Verify user can see the contacts from Percona'
      + ' @not-ui-pipeline @portal @portal-post-upgrade', async ({ page, loginPage, homeDashboardPage, environmentOverviewPage, context }) => {
    test.skip(pmmVersion < 29, 'This test is for PMM version 2.27.0 and higher');
    await context.grantPermissions(['clipboard-write', 'clipboard-read']);
    const userToken = await api.portal.getUserAccessToken(firstAdmin.email, firstAdmin.password);
    const contactsEmail = (await api.portal.getOrgDetails(userToken, firstAdmin.org!.id)).contacts.customer_success.email;

    await loginPage.signInWithPerconaAccount(firstAdmin.email, firstAdmin.password);
    await homeDashboardPage.waitToBeOpened();
    await homeDashboardPage.sideMenu.environmentOverview.click();
    await environmentOverviewPage.elements.contactsHeader.waitFor({ state: 'visible' });
    await environmentOverviewPage.elements.contactsSubHeader.waitFor({ state: 'visible' });
    await environmentOverviewPage.elements.contactsName.waitFor({ state: 'visible' });
    await environmentOverviewPage.elements.emailIcon.click();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());

    expect(contactsEmail).toEqual(clipboardContent);
  });

  test('PMM-T1147 Verify PMM user that is not logged in with SSO can NOT see Tickets for organization'
      + ' @not-ui-pipeline @portal @portal-post-upgrade', async ({ page, homeDashboardPage, ticketsPage }) => {
    test.skip(pmmVersion < 27, 'This test is for PMM version 2.27.0 and higher');

    await test.step('1. Login to he connected pmm with SSO', async () => {
      await grafanaHelper.authorize(page);
      await homeDashboardPage.waitToBeOpened();
    });
    await test.step('2. Verify that there is NO side menu for organizational tickets', async () => {
      await homeDashboardPage.sideMenu.tickets.waitFor({ state: 'detached' });
    });
    await test.step('3. Verify user can NOT see tickets.', async () => {
      await page.goto(ticketsPage.ticketsUrl);
      if (pmmVersion >= 28) {
        await expect(ticketsPage.elements.notPlatformUser).toHaveText(ticketsPage.messages.loginWithPercona);
      } else {
        await expect(ticketsPage.elements.emptyBlock).toHaveText(ticketsPage.messages.notConnectedToThePortal);
      }
    });
  });

  test('PMM-T1154 Verify PMM user that is not logged in with SSO can NOT see Entitlements for organization'
      + ' @not-ui-pipeline @portal @portal-post-upgrade', async ({ page, homeDashboardPage, entitlementsPage }) => {
    test.skip(pmmVersion < 27, 'This test is for PMM version 2.27.0 and higher');

    await test.step('1. Login to the connected pmm with local account', async () => {
      await grafanaHelper.authorize(page);
      await homeDashboardPage.waitToBeOpened();
    });
    await test.step('2. Verify that there is NO side menu for organizational Entitlements', async () => {
      await homeDashboardPage.sideMenu.entitlements.waitFor({ state: 'detached' });
    });
    await test.step('3. Verify user can NOT see Entitlements.', async () => {
      await page.goto(entitlementsPage.entitlementsUrl);
      if (pmmVersion >= 28) {
        await expect(entitlementsPage.elements.notPlatformUser).toHaveText(entitlementsPage.messages.loginWithPercona);
      } else {
        await expect(entitlementsPage.elements.emptyBlock).toHaveText(entitlementsPage.messages.notConnectedToThePortal);
      }
    });
  });

  test('PMM-T1170 Verify PMM user that is not logged in with SSO can NOT see Contacts for organization'
      + ' @not-ui-pipeline @portal @portal-post-upgrade', async ({ page, homeDashboardPage, environmentOverviewPage }) => {
    test.skip(pmmVersion < 27, 'This test is for PMM version 2.27.0 and higher');

    await test.step('1. Login to the connected pmm with local account', async () => {
      await grafanaHelper.authorize(page);
      await homeDashboardPage.waitToBeOpened();
    });
    await test.step('1. Login to the connected pmm with local account', async () => {
      await page.goto(environmentOverviewPage.environmentOverviewUrl);
      await expect(environmentOverviewPage.elements.notPlatformUser).toHaveText(environmentOverviewPage.messages.loginWithPercona);
    });
  });

  test('PMM-T1148 Verify PMM user logged in using SSO and member of organization in Portal'
      + ' BUT not a SN account is NOT able to see Tickets'
      + ' @not-ui-pipeline @portal @portal-post-upgrade', async ({ loginPage, homeDashboardPage, ticketsPage }) => {
    test.skip(pmmVersion < 27, 'This test is for PMM version 2.27.0 and higher');

    await test.step('1. Login to he connected pmm with SSO', async () => {
      await loginPage.signInWithPerconaAccount(freeUser.email, freeUser.password);
      await homeDashboardPage.waitToBeOpened();
    });
    await test.step('2. Verify that there is a side menu for organizational tickets', async () => {
      await homeDashboardPage.sideMenu.tickets.click();
    });
    await test.step('3. Verify user can NOT see tickets for his org.', async () => {
      await expect(ticketsPage.elements.noDataTable).toHaveText(ticketsPage.messages.noTicketsFound);
    });
  });

  test('PMM-T1153 Verify user logged in using SSO and is not a member of SN account is NOT able to see Entitlements'
      + ' @not-ui-pipeline @portal @portal-post-upgrade', async ({ loginPage, homeDashboardPage, ticketsPage, entitlementsPage }) => {
    test.skip(pmmVersion < 27, 'This test is for PMM version 2.27.0 and higher');

    await test.step('1. Login to he connected pmm with SSO', async () => {
      await loginPage.signInWithPerconaAccount(freeUser.email, freeUser.password);
      await homeDashboardPage.waitToBeOpened();
    });
    await test.step('2. Verify that there is a side menu for organizational Entitlements', async () => {
      await homeDashboardPage.sideMenu.entitlements.click();
    });
    await test.step('3. Verify user can NOT see Entitlements for his org.', async () => {
      await expect(ticketsPage.elements.noData).toHaveText(entitlementsPage.messages.noEntitlements);
    });
  });

  test('PMM-T1204 PMM-T1112 Verify user can disconnect pmm from portal success flow'
      + ' @portal @not-ui-pipeline @portal-post-upgrade', async ({ page, loginPage, homeDashboardPage, perconaPlatformPage }) => {
    test.skip(pmmVersion < 27, 'This test is for PMM version 2.27.0 and higher');

    await test.step('Login as platform user and open "Settings / Percona Platform" page', async () => {
      await loginPage.signInWithPerconaAccount(firstAdmin.email, firstAdmin.password);
      await homeDashboardPage.waitToBeOpened();
      await page.goto(perconaPlatformPage.PAGE_PATH);
      await perconaPlatformPage.connectedContainer.waitFor({ state: 'visible' });
      await perconaPlatformPage.buttons.disconnect.click();
      if (pmmVersion >= 28) {
        await expect(perconaPlatformPage.elements.modalMessage).toHaveText(perconaPlatformPage.messages.disconnectWarning);
        await perconaPlatformPage.buttons.confirmDisconnect.click();
        await page.locator('//input[@name="user"]').waitFor({ state: 'visible' });
      } else {
        await perconaPlatformPage.toastMessage.waitForMessage(perconaPlatformPage.messages.pmmDisconnectedFromPortal);
      }
    });
    await test.step('Verify that force disconnect was successful.', async () => {
      await grafanaHelper.authorize(page);
      await homeDashboardPage.waitToBeOpened();
      await page.goto(perconaPlatformPage.PAGE_PATH);
      await expect(perconaPlatformPage.buttons.connect).toBeVisible({ timeout: Wait.PageLoad });
    });
  });

  // TODO: improve test to work without chain dependency. run new pmm-server, connect to portal and force disconnect then
  test.skip('PMM-T1264 Verify that pmm admin user can force disconnect pmm from the portal'
      + ' @not-ui-pipeline @portal @portal-post-upgrade', async ({ page, homeDashboardPage, perconaPlatformPage }) => {
    test.skip(pmmVersion < 29, 'This test is for PMM version 2.29.0 and higher');

    await test.step('Connect PMM to the Portal', async () => {
      await homeDashboardPage.authenticateSession();
      await homeDashboardPage.waitToBeOpened();
      await page.goto(perconaPlatformPage.PAGE_PATH);
      const adminToken = await api.portal.getUserAccessToken(firstAdmin.email, firstAdmin.password);
      await perconaPlatformPage.connectToPortal(adminToken, `Test Server ${Date.now()}`, true);
    });
    // await perconaPlatformPage.connectToPortal(adminToken, `Test Server ${Date.now()}`, true);
    await test.step('1. Login into the pmm and navigate to the percona platform page.', async () => {
      await grafanaHelper.authorize(page);
      await page.goto(perconaPlatformPage.PAGE_PATH);
      await perconaPlatformPage.connectedContainer.waitFor({ state: 'visible' });
    });
    await test.step('2. Force disconnect from the platform.', async () => {
      await perconaPlatformPage.buttons.disconnect.click();
      await expect(perconaPlatformPage.elements.forceDisconnectModal).toHaveText(perconaPlatformPage.messages.forceDisconnectWarning);
      await expect(perconaPlatformPage.elements.readMore).toHaveAttribute('href', perconaPlatformPage.links.readMore);
      await perconaPlatformPage.buttons.confirmDisconnect.click();
    });
    await test.step('3. Verify that force disconnect was successful.', async () => {
      await perconaPlatformPage.toastMessage.waitForMessage(perconaPlatformPage.messages.disconnectedSuccess);
      await perconaPlatformPage.buttons.connect.waitFor({ state: 'visible' });
    });
  });

  test('PMM-T1247 Verify user cannot access platform functionality when PMM is not connected to the portal'
      + ' @not-ui-pipeline @portal @portal-post-upgrade', async ({ page, environmentOverviewPage, entitlementsPage, ticketsPage }) => {
    await grafanaHelper.authorize(page);
    await page.goto(environmentOverviewPage.environmentOverviewUrl);
    await expect(environmentOverviewPage.elements.notConnectedToPlatform).toHaveText(
      environmentOverviewPage.messages.notConnectedToThePortal,
    );

    await page.goto(entitlementsPage.entitlementsUrl);
    await expect(entitlementsPage.elements.notConnectedToPlatform).toHaveText(entitlementsPage.messages.notConnectedToThePortal);

    await page.goto(ticketsPage.ticketsUrl);
    await expect(ticketsPage.elements.notConnectedToPlatform).toHaveText(ticketsPage.messages.notConnectedToThePortal);
  });
});
