Feature('PMM Server Role Based Access Control (RBAC)');

const newPsUser = { username: 'rbac_ps_test_user', password: 'Test1234!' };
const newPgUser = { username: 'rbac_pg_test_user', password: 'Test1234!' };
let rbacPsUserId;
let rbacPgUserId;
let psRole = {
  name: 'psRole',
  description: 'Test PS Role',
  label: 'service_type',
  operator: '=',
  value: 'mysql',
};
const pgRole = {
  name: 'pgRole',
  description: 'Test PG Role',
  label: 'service_type',
  operator: '=',
  value: 'postgresql',
};

Before(async ({ I, settingsAPI }) => {
  rbacPsUserId = await I.createUser(newPsUser.username, newPsUser.password);
  rbacPgUserId = await I.createUser(newPgUser.username, newPgUser.password);
  await I.Authorize();
  await settingsAPI.changeSettings({ rbac: true });
});

After(async ({ I, rolesApi }) => {
  const rolesId = await rolesApi.getNonDefaultRolesIds();

  await rolesApi.deleteRoles(rolesId, 3);
  await I.deleteUser(rbacPsUserId);
  await I.deleteUser(rbacPgUserId);
});

Scenario('PMM-T1580 Verify creating Access Role @rbac', async ({ I, accessRolesPage }) => {
  I.amOnPage(accessRolesPage.url);
  accessRolesPage.createAccessRole(psRole);
  accessRolesPage.createAccessRole(pgRole);
});

Scenario('PMM-T1584 Verify assigning Access role to user @rbac', async ({ I, usersPage, rolesApi }) => {
  await rolesApi.createRole(psRole);
  await rolesApi.createRole(pgRole);

  I.amOnPage(usersPage.url);
  usersPage.assignRole(newPsUser.username, psRole.name);
  usersPage.assignRole(newPgUser.username, pgRole.name);
});

Scenario(
  'PMM-T1899 - Access Role based on Labels and Check Filtering of Metrics on Dashboard @rbac',
  async ({
    I, dashboardPage, accessRolesPage, rolesApi,
  }) => {
    const psRoleId = await rolesApi.createRole(psRole);
    const pgRoleId = await rolesApi.createRole(pgRole);

    await rolesApi.assignRole([psRoleId], rbacPsUserId);
    await rolesApi.assignRole([pgRoleId], rbacPgUserId);

    await I.unAuthorize();

    await I.Authorize(newPsUser.username, newPsUser.password);

    I.amOnPage(dashboardPage.mySQLInstanceOverview.clearUrl);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(3);

    I.amOnPage(dashboardPage.postgresqlInstanceOverviewDashboard.cleanUrl);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.verifyThatAllGraphsNoData(1);

    await I.unAuthorize();

    await I.Authorize(newPgUser.username, newPgUser.password);

    I.amOnPage(dashboardPage.mySQLInstanceOverview.clearUrl);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.verifyThatAllGraphsNoData(1);

    I.amOnPage(dashboardPage.postgresqlInstanceOverviewDashboard.cleanUrl);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();

    await I.unAuthorize();

    psRole = {
      ...psRole, label: 'cluster', operator: '!=', value: 'dev',
    };

    await I.Authorize();

    I.amOnPage(accessRolesPage.url);
    accessRolesPage.editAccessRole(psRole);

    await I.unAuthorize();

    await I.Authorize(newPsUser.username, newPsUser.password);

    I.amOnPage(I.buildUrlWithParams(dashboardPage.mySQLInstanceOverview.clearUrl, {
      environment: psRole.value,
      from: 'now-1m',
    }));
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.verifyThatAllGraphsNoData();
  },
);

Scenario('PMM-T1585 Verify deleting Access role @rbac', async ({ I, accessRolesPage, rolesApi }) => {
  await rolesApi.createRole(psRole);
  await rolesApi.createRole(pgRole);

  I.amOnPage(accessRolesPage.url);
  accessRolesPage.deleteAccessRole(pgRole.name);
  accessRolesPage.deleteAccessRole(psRole.name);
});
