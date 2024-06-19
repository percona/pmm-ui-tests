import { expect, test } from '@helpers//test-helper';
import apiHelper from '@api/helpers/api-helper';
import grafanaHelper from '@helpers/grafana-helper';
import Wait from '@helpers/enums/wait';
import { api, Role } from '@api/api';
import PmmVersion from '@helpers/types/pmm-version.class';

let pmmVersion: number;

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
 *  Access Control (RBAC) requires monitored MySQL service.
 *  Example setup: sudo bash -x /.../pmm-framework.sh --addclient=ps,1 --pmm2
 *  PMM Server needs to be started with "PMM_DEBUG=1" environment variable
 */
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

  test.beforeEach(async ({ page }) => {
    await apiHelper.confirmTour(page);
    await grafanaHelper.authorize(page);
  });

  test('PMM-T1573 Verify Access Roles tab on Configuration page @rbac @rbac-pre-upgrade', async ({ homeDashboardPage, accessRolesPage }) => {
    test.skip(await getPmmVersion() < 35, 'Test is for versions 2.35.0+');
    test.info().annotations.push({
      type: 'Also Covers',
      description: 'PMM-T1579 Verify docker variable to enable Access control (RBAC)',
    });

    await test.step('1. Click on Configuration on the left menu and then select Access roles link', async () => {
      await homeDashboardPage.open();
      await homeDashboardPage.sideMenu.configuration().selectAccessRoles();
    });

    await test.step('2. Click on Configuration on the left menu and then select Access roles link', async () => {
      await expect(accessRolesPage.rbacTable.elements.body).toContainText(accessRolesPage.rbacTable.labels.fullAccess);
    });

    await test.step('3. Verify there is "Create" button', async () => {
      await expect(accessRolesPage.elements.buttonCreate).toHaveText(accessRolesPage.labels.create);
      await expect(accessRolesPage.elements.buttonCreate).toHaveAttribute('href', accessRolesPage.links.createRole);
    });
  });

  test.skip('PMM-T1599 Verify assigned role after upgrade @rbac-post-upgrade', async ({ page, usersConfigurationPage, postgresqlInstancesOverviewDashboard }) => {
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

  test.skip('PMM-T1652 Verify replacing the role while removing it @rbac @rbac-post-upgrade', async ({ page, accessRolesPage, createRolePage, newUserPage, usersConfigurationPage }) => {
    test.skip(await getPmmVersion() < 35, 'Test is for versions 2.35.0+');

    const newRoleName = `Replace Role Test Role ${Date.now()}`;
    const newUserRoleDelete = {
      username: 'replaceRoleTestUser', email: 'replaceRoleTestUser@localhost', name: 'Replace Role Test User', password: 'password',
    };

    await test.step(
      '1. Navigate to the access role page delete old roles then create role MySQL with label agent_type and value mysql_exporter',
      async () => {
        await accessRolesPage.open();
        await accessRolesPage.elements.buttonCreate.click();
        await createRolePage.createNewRole({
          roleName: newRoleName, roleDescription, label: 'agent_type', value: 'mysqld_exporter',
        });
        await accessRolesPage.rbacTable.verifyRowData(newRoleName, roleDescription, 'agent_type', '=', 'mysqld_exporter');
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
      await accessRolesPage.open();
      await accessRolesPage.rbacTable.elements.rowOptions(newRoleName).click();
      await accessRolesPage.rbacTable.elements.delete.click();
      await expect(accessRolesPage.rbacTable.elements.confirmDeleteRoleHeader)
        .toContainText(accessRolesPage.rbacTable.messages.deleteRoleHeader(newRoleName) as string);
      await expect(accessRolesPage.rbacTable.elements.confirmDeleteRoleBody)
        .toContainText(accessRolesPage.rbacTable.messages.userAssigned(newRoleName) as string);
      await expect(accessRolesPage.rbacTable.elements.roleAssignedDialogRoleSelect).toHaveText(accessRolesPage.rbacTable.labels.fullAccess);
      await accessRolesPage.rbacTable.buttons.confirmAndDeleteRole.click();
      await page.goto(usersConfigurationPage.url);
      await expect(usersConfigurationPage.usersTable.elements.rowByText(newUserRoleDelete.username)).toContainText(accessRolesPage.rbacTable.labels.fullAccess);
    });
  });

  test('PMM-T1668 Verify removing Access role for deleted user. @rbac @rbac-post-upgrade', async ({ page, accessRolesPage, createRolePage, newUserPage, usersConfigurationPage }) => {
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
        await accessRolesPage.open();
        await accessRolesPage.elements.buttonCreate.click();
        await createRolePage.createNewRole({
          roleName: deleteUserRole, roleDescription, label: 'agent_type', value: 'postgres_exporter',
        });
        await accessRolesPage.rbacTable.verifyRowData(deleteUserRole, roleDescription, 'agent_type', '=', 'postgres_exporter');
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
      await accessRolesPage.open();
      await accessRolesPage.rbacTable.elements.rowOptions(deleteUserRole).click();
      await accessRolesPage.rbacTable.elements.delete.click();
      await expect(accessRolesPage.rbacTable.elements.confirmDeleteRoleHeader)
        .toContainText(accessRolesPage.rbacTable.messages.deleteRoleHeader(deleteUserRole) as string);
      await expect(accessRolesPage.rbacTable.elements.confirmDeleteRoleBody)
        .toContainText(accessRolesPage.rbacTable.messages.deleteRoleBody as string);
      await accessRolesPage.rbacTable.buttons.confirmAndDeleteRole.click();
      await accessRolesPage.toastMessage.waitForMessageContains(accessRolesPage.rbacTable.messages.roleDeleted(deleteUserRole) as string);
    });
  });
  // Remove from zephyr.
  test('PMM-T1629 Verify re-enabling of the Access Control @rbac @rbac-post-upgrade', async ({ homeDashboardPage, accessRolesPage, advancedSettingsPage }) => {
    test.skip(await getPmmVersion() < 35, 'Test is for versions 2.35.0+');

    await test.step('1.Navigate to the advanced settings and disable Access Control.', async () => {
      await advancedSettingsPage.open();
      await advancedSettingsPage.switchAccessControl('off');
    });

    await test.step('2. Verify Access Control is disabled.', async () => {
      await homeDashboardPage.sideMenu.configuration().showMenu();
      await homeDashboardPage.sideMenu.configuration().accessRoles.waitFor({ state: 'detached' });
      await accessRolesPage.open();
      await expect(accessRolesPage.elements.emptyBlock).toHaveText(accessRolesPage.messages.featureDisabled);
      await accessRolesPage.toastMessage.waitForError();
    });

    await test.step('3. Re-enable Access Control.', async () => {
      await advancedSettingsPage.open();
      await advancedSettingsPage.switchAccessControl('on');
    });

    await test.step('2. Verify Access Control is enabled.', async () => {
      await homeDashboardPage.sideMenu.configuration().selectAccessRoles();
    });
  });
});
