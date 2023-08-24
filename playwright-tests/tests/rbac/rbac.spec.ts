import { expect, test } from '@helpers//test-helper';
import apiHelper from '@api/helpers/api-helper';
import grafanaHelper from '@helpers/grafana-helper';
import Wait from '@helpers/enums/wait';
import { api } from '@api/api';
import { ListRoles } from '@api/management.api';
import PmmVersion from '@helpers/types/pmm-version.class';

let pmmVersion: number;
let roles: ListRoles | undefined;

/**
 * Cp. Obvious: Lazy initialization.
 */
const getPmmVersion = async (): Promise<number> => {
  if (!pmmVersion) {
    pmmVersion = process.env.PMM_SERVER_START_VERSION
      ? new PmmVersion(process.env.PMM_SERVER_START_VERSION).minor
      : (await api.pmm.serverV1.getPmmVersion()).minor;
  }
  return pmmVersion;
};

/**
 * Cp. Obvious: Lazy initialization
 */
const getRolesObj = async (): Promise<ListRoles | undefined> => {
  if (!roles) {
    roles = await api.pmm.managementV1.listRoles();
  }
  return roles;
};

test.describe('Spec file for Access Control (RBAC)', async () => {
  // test.skip(await getPmmVersion() < 35, 'Test is for PMM version 2.35.0+');
  // test.skip(() => getPmmVersion() < 35);
  const newUser = {
    username: 'testUserRBAC', email: 'testUserRBAC@localhost', name: 'Test User', password: 'password',
  };
  const roleName = 'Role Name Only MySql Access';
  const roleDescription = 'Role Description Only MySql Access';
  const roleNameCreate = `Role Name ${new Date().getTime()}`;
  const roleDescriptionCreate = `Role Description ${new Date().getTime()}`;

  test.beforeAll(async () => {
    if (!pmmVersion) {
      pmmVersion = (await api.pmm.serverV1.getPmmVersion()).minor;
    }
  });

  test.beforeEach(async ({ page }) => {
    await apiHelper.confirmTour(page);
    await grafanaHelper.authorize(page);
  });

  test('PMM-T1573 Verify Access Roles tab on Configuration page @rbac @rbac-pre-upgrade', async ({ homeDashboardPage, rbacPage }) => {
    test.skip(await getPmmVersion() < 35, 'Test is for versions 2.35.0+');
    test.info().annotations.push({
      type: 'Also Covers',
      description: 'PMM-T1579 Verify docker variable to enable Access control (RBAC)',
    });

    await test.step('1. Click on Configuration on the left menu and then select Access roles link', async () => {
      await homeDashboardPage.sideMenu.elements.configuration.hover();
      await expect(homeDashboardPage.sideMenu.configuration.buttons.rbac)
        .toHaveText(homeDashboardPage.sideMenu.configuration.labels.rbac);
      await homeDashboardPage.sideMenu.configuration.buttons.rbac.click();
    });

    await test.step('2. Click on Configuration on the left menu and then select Access roles link', async () => {
      await expect(rbacPage.rbacTable.elements.body).toContainText(rbacPage.rbacTable.labels.fullAccess);
    });

    await test.step('3. Verify there is "Create" button', async () => {
      await expect(rbacPage.elements.buttonCreate).toHaveText(rbacPage.labels.create);
      await expect(rbacPage.elements.buttonCreate).toHaveAttribute('href', rbacPage.links.createRole);
    });
  });

  test('PMM-T1580 Verify creating Access Role @rbac @rbac-pre-upgrade @rbac-post-upgrade', async ({ page, rbacPage, createRolePage }) => {
    test.skip(await getPmmVersion() < 35, 'Test is for versions 2.35.0+');
    test.info().annotations.push({
      type: 'Also Covers',
      description: 'PMM-T1581 Verify assigning default role on Access roles page.',
    });
    test.skip((await getRolesObj())?.roles.length !== 1, 'For updating from version without RBAC (<35)');

    await test.step('1. Navigate to the Access Role page, then click create button.', async () => {
      await page.goto(rbacPage.url);
      await rbacPage.elements.buttonCreate.click();
    });

    await test.step('2. Create new role agent_type=mysqld_exporter.', async () => {
      await createRolePage.createNewRole({
        roleName: roleNameCreate,
        roleDescription: roleDescriptionCreate,
        label: 'agent_type',
        value: 'mysqld_exporter',
      });
      await rbacPage.rbacTable.verifyRowData(roleNameCreate, roleDescriptionCreate, 'agent_type', '=', 'mysqld_exporter');
    });

    await test.step('3. Assign new role as a default one.', async () => {
      await rbacPage.rbacTable.elements.rowOptions(roleNameCreate).click();
      await rbacPage.rbacTable.elements.setDefault.click();
      await expect(rbacPage.rbacTable.elements.defaultRow).toContainText(roleNameCreate);
      await expect(rbacPage.rbacTable.elements.rowByText(rbacPage.rbacTable.labels.fullAccess)).not.toContainText('Default');
    });

    await test.step('4. Assign default role back to Full Access.', async () => {
      await rbacPage.rbacTable.elements.rowOptions(rbacPage.rbacTable.labels.fullAccess).click();
      await rbacPage.rbacTable.elements.setDefault.click();
      await expect(rbacPage.rbacTable.elements.defaultRow).toContainText(rbacPage.rbacTable.labels.fullAccess);
    });
  });

  test('PMM-T1584 Verify assigning Access role to user @rbac @rbac-pre-upgrade @rbac-post-upgrade', async ({
    page, rbacPage, createRolePage, newUserPage, usersConfigurationPage,
    mySqlDashboard, nodesOverviewDashboard,
  }) => {
    test.skip(await getPmmVersion() < 35, 'Test is for versions 2.35.0+');
    test.skip((await getRolesObj())?.roles.length !== 1, 'For updating from version without RBAC (<35)');

    await test.step(
      '1. Navigate to the access role page then create role MySQL with label agent_type and value mysql_exporter',
      async () => {
        await page.goto(rbacPage.url);
        await rbacPage.elements.buttonCreate.click();
        await createRolePage.createNewRole({
          roleName, roleDescription, label: 'agent_type', value: 'mysqld_exporter',
        });
        await rbacPage.rbacTable.verifyRowData(roleName, roleDescription, 'agent_type', '=', 'mysqld_exporter');
      },
    );

    await test.step('2. Create new user and assign new role to the user.', async () => {
      await page.goto(newUserPage.url);
      await newUserPage.createUser(newUser.name, newUser.email, newUser.username, newUser.password);

      await page.goto(usersConfigurationPage.url);
      await usersConfigurationPage.usersTable.fields.accessRole('testUserRBAC@localhost').click();
      await usersConfigurationPage.optionMenu.selectOption(roleName);
      await page.goto(mySqlDashboard.url);
      await mySqlDashboard.waitForPanelToHaveData('Top MySQL Used Connections', 444, Wait.TenMinutes);
    });

    await test.step('3. Login as new user and verify that Node Dashboard does NOT show data.', async () => {
      await grafanaHelper.unAuthorize(page);
      await grafanaHelper.authorize(page, newUser.username, newUser.password);
      await page.goto(nodesOverviewDashboard.url);
      await nodesOverviewDashboard.verifyRoleAccessBlocksNodeExporter();
    });

    await test.step('4. Login as new user and verify that Node MySql Dashboard shows data.', async () => {
      await page.goto(mySqlDashboard.url);
      await mySqlDashboard.verifyAllPanelsHaveData(3);
    });
  });

  test('PMM-T1599 Verify assigned role after upgrade @rbac @rbac-post-upgrade', async ({ page, usersConfigurationPage, postgresqlInstancesOverviewDashboard }) => {
    test.skip(await getPmmVersion() < 35, 'Test is for versions 2.35.0+');

    await test.step('1. Verify user role is assigned after upgrade.', async () => {
      await page.goto(usersConfigurationPage.url);
      await expect(usersConfigurationPage.usersTable.elements.rowByText(newUser.username)).toContainText(roleName);
    });

    await test.step('2. Open PostgreSQL Overview dashboard and verify there is no any data.', async () => {
      await grafanaHelper.unAuthorize(page);
      await grafanaHelper.authorize(page, newUser.username, newUser.password);
      await page.goto(postgresqlInstancesOverviewDashboard.url);
      await postgresqlInstancesOverviewDashboard.verifyAllPanelsDoesNotHaveData();
    });
  });

  test('PMM-T1585 Verify deleting Access role @rbac @rbac-post-upgrade', async ({ page, rbacPage, usersConfigurationPage }) => {
    test.skip(await getPmmVersion() < 35, 'Test is for versions 2.35.0+');
    test.info().annotations.push({
      type: 'Also Covers',
      description: 'PMM-T1578 Verify there is ability to enable Access control on Settings page.',
    });

    await test.step('1. Navigate to Access Control page and try to delete role that is assigned to the user.', async () => {
      await page.goto(rbacPage.url);
      await rbacPage.rbacTable.elements.rowOptions(roleName).click();
      await rbacPage.rbacTable.elements.delete.click();
      await expect(rbacPage.rbacTable.elements.confirmDeleteRoleHeader)
        .toContainText(rbacPage.rbacTable.messages.deleteRoleHeader(roleName) as string);
      await expect(rbacPage.rbacTable.elements.confirmDeleteRoleBody)
        .toContainText(rbacPage.rbacTable.messages.userAssigned(roleName) as string);
      await rbacPage.rbacTable.buttons.closeDialog.click();
    });

    await test.step('2. Unassign role from the user.', async () => {
      await page.goto(usersConfigurationPage.url);
      await usersConfigurationPage.usersTable.fields.accessRole(newUser.username).click();
      await usersConfigurationPage.usersTable.fields.assignRole('Full access').click();
      await usersConfigurationPage.usersTable.fields.removeRole(newUser.username, roleName).click({ force: true });
      await usersConfigurationPage.usersTable.fields.removeRole(newUser.username, roleName).click({ force: true });
    });

    await test.step('3. Delete role and verify that role was successfully deleted.', async () => {
      await page.goto(rbacPage.url);
      await rbacPage.rbacTable.elements.rowOptions(roleName).click();
      await rbacPage.rbacTable.elements.delete.click();
      await rbacPage.rbacTable.buttons.confirmAndDeleteRole.click();
      await rbacPage.toastMessage.waitForMessageContains(rbacPage.rbacTable.messages.roleDeleted(roleName) as string);
      await expect(rbacPage.rbacTable.elements.body).not.toContainText(roleName);
    });
  });

  test('PMM-T1652 Verify replacing the role while removing it @rbac @rbac-post-upgrade', async ({ page, rbacPage, createRolePage, newUserPage, usersConfigurationPage }) => {
    test.skip(await getPmmVersion() < 35, 'Test is for versions 2.35.0+');

    const newRoleName = `Replace Role Test Role ${Date.now()}`;
    const newUserRoleDelete = {
      username: 'replaceRoleTestUser', email: 'replaceRoleTestUser@localhost', name: 'Replace Role Test User', password: 'password',
    };

    await test.step(
      '1. Navigate to the access role page delete old roles then create role MySQL with label agent_type and value mysql_exporter',
      async () => {
        await page.goto(rbacPage.url);
        await rbacPage.elements.buttonCreate.click();
        await createRolePage.createNewRole({
          roleName: newRoleName, roleDescription, label: 'agent_type', value: 'mysqld_exporter',
        });
        await rbacPage.rbacTable.verifyRowData(newRoleName, roleDescription, 'agent_type', '=', 'mysqld_exporter');
      },
    );

    await test.step('2. Create new user and assign new role to the user.', async () => {
      await page.goto(newUserPage.url);
      await newUserPage.createUser(newUserRoleDelete.name, newUserRoleDelete.email, newUserRoleDelete.username, newUserRoleDelete.password);

      await page.goto(usersConfigurationPage.url);
      await usersConfigurationPage.usersTable.fields.accessRole(newUserRoleDelete.name).click();
      await usersConfigurationPage.optionMenu.selectOption(newRoleName);
    });

    await test.step('3. Navigate to Access Control page and click delete role that has users assigned to it.', async () => {
      await page.goto(rbacPage.url);
      await rbacPage.rbacTable.elements.rowOptions(newRoleName).click();
      await rbacPage.rbacTable.elements.delete.click();
      await expect(rbacPage.rbacTable.elements.confirmDeleteRoleHeader)
        .toContainText(rbacPage.rbacTable.messages.deleteRoleHeader(newRoleName) as string);
      await expect(rbacPage.rbacTable.elements.confirmDeleteRoleBody)
        .toContainText(rbacPage.rbacTable.messages.userAssigned(newRoleName) as string);
      await expect(rbacPage.rbacTable.elements.roleAssignedDialogRoleSelect).toHaveText(rbacPage.rbacTable.labels.fullAccess);
      await rbacPage.rbacTable.buttons.confirmAndDeleteRole.click();
      await page.goto(usersConfigurationPage.url);
      await expect(usersConfigurationPage.usersTable.elements.rowByText(newUserRoleDelete.username)).toContainText(rbacPage.rbacTable.labels.fullAccess);
    });
  });

  test('PMM-T1668 Verify removing Access role for deleted user. @rbac @rbac-post-upgrade', async ({ page, rbacPage, createRolePage, newUserPage, usersConfigurationPage }) => {
    test.info().annotations.push({
      type: 'Also Covers',
      description: 'PMM-T1601 Verify Grafana Does not crash when filtering users from the admin page.',
    });
    test.skip(await getPmmVersion() < 36, 'Test is for versions 2.36.0+');
    const deleteUser = {
      username: `userRBACDelete_${Date.now()}`,
      email: `userRBACDelete@localhost_${Date.now()}`,
      name: 'Delete User',
      password: 'password',
    };
    const deleteUserRole = `Delete Role PgSql Access - ${Date.now()} `;

    await test.step(
      '1. Navigate to the access role page then create role PgSql with label agent_type and value postgres_exporter',
      async () => {
        await page.goto(rbacPage.url);
        await rbacPage.elements.buttonCreate.click();
        await createRolePage.createNewRole({
          roleName: deleteUserRole, roleDescription, label: 'agent_type', value: 'postgres_exporter',
        });
        await rbacPage.rbacTable.verifyRowData(deleteUserRole, roleDescription, 'agent_type', '=', 'postgres_exporter');
      },
    );

    await test.step(`2. Create new user: "${deleteUser.email}" and assign new role: "${deleteUserRole}" to the user.`, async () => {
      await page.goto(newUserPage.url);
      await newUserPage.createUser(deleteUser.name, deleteUser.email, deleteUser.username, deleteUser.password);

      await page.goto(usersConfigurationPage.url);
      await usersConfigurationPage.usersTable.fields.accessRole(deleteUser.name).click();
      await usersConfigurationPage.optionMenu.selectOption(deleteUserRole);
    });

    await test.step('3. Search for non existing user, and verify page does not crash.', async () => {
      await usersConfigurationPage.elements.searchUserInput.type('NonExistingUser');
      await usersConfigurationPage.elements.deleteUserButton(deleteUser.email).waitFor({ state: 'hidden' });
      await expect(usersConfigurationPage.elements.usersTable).toBeVisible();
      await usersConfigurationPage.elements.searchUserInput.clear();
    });

    await test.step(`3. Delete user assigned to the role: ${deleteUserRole} `, async () => {
      await usersConfigurationPage.deleteUser(deleteUser.email);
      await usersConfigurationPage.verifyUserNotExists(deleteUser.email);
    });

    await test.step(`4. Delete user role: ${deleteUserRole}.`, async () => {
      await page.goto(rbacPage.url);
      await rbacPage.rbacTable.elements.rowOptions(deleteUserRole).click();
      await rbacPage.rbacTable.elements.delete.click();
      await expect(rbacPage.rbacTable.elements.confirmDeleteRoleHeader)
        .toContainText(rbacPage.rbacTable.messages.deleteRoleHeader(deleteUserRole) as string);
      await expect(rbacPage.rbacTable.elements.confirmDeleteRoleBody)
        .toContainText(rbacPage.rbacTable.messages.deleteRoleBody as string);
      await rbacPage.rbacTable.buttons.confirmAndDeleteRole.click();
      await rbacPage.toastMessage.waitForMessageContains(rbacPage.rbacTable.messages.roleDeleted(deleteUserRole) as string);
    });
  });

  test('PMM-T1629 Verify re-enabling of the Access Control @rbac @rbac-post-upgrade', async ({ page, homeDashboardPage, rbacPage, advancedSettingsPage }) => {
    test.skip(await getPmmVersion() < 35, 'Test is for versions 2.35.0+');

    await test.step('1.Navigate to the advanced settings and disable Access Control.', async () => {
      await page.goto(advancedSettingsPage.url);
      await advancedSettingsPage.fields.accessControl.click({ force: true });
      await expect(advancedSettingsPage.fields.accessControl).not.toBeChecked();
      await advancedSettingsPage.buttons.applyChanges.click();
    });

    await test.step('2. Verify Access Control is disabled.', async () => {
      await homeDashboardPage.sideMenu.elements.configuration.hover();
      await homeDashboardPage.sideMenu.configuration.buttons.rbac.waitFor({ state: 'detached' });
      await page.goto(rbacPage.url);
      await expect(rbacPage.elements.emptyBlock).toHaveText(rbacPage.messages.featureDisabled);
    });

    await test.step('3. Re-enable Access Control.', async () => {
      await page.goto(advancedSettingsPage.url);
      await advancedSettingsPage.fields.accessControl.check({ force: true });
      await expect(advancedSettingsPage.fields.accessControl).toBeChecked();
      await advancedSettingsPage.buttons.applyChanges.click();
    });

    await test.step('2. Verify Access Control is enabled.', async () => {
      await homeDashboardPage.sideMenu.elements.configuration.hover();
      await homeDashboardPage.sideMenu.configuration.buttons.rbac.waitFor({ state: 'visible' });
    });
  });
});
