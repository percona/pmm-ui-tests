import { expect, test } from '@playwright/test';
import apiHelper from "@api/helpers/apiHelper";
import HomeDashboard from '@tests/pages/HomeDashboard.page';
import grafanaHelper from '@tests/helpers/GrafanaHelper';
import { RbacPage } from '@tests/tests/configuration/pages/Rbac.page';
import { CreateRolePage } from '@tests/tests/configuration/pages/CreateRole.page';
import { NewUserPage } from '@tests/pages/serverAdmin/NewUser.page';
import { UsersConfigurationPage } from '@tests/tests/configuration/pages/UsersConfiguration.page';
import { MySqlDashboard } from '@tests/pages/dashboards/mysql/MySqlDashboard.page';
import NodesOverviewDashboard from '@tests/pages/dashboards/nodes/NodesOverviewDashboard.page';
import Duration from '@tests/helpers/Duration';
import PostgresqlInstancesOverviewDashboard from '@tests/pages/dashboards/postgresql/PostgresqlInstancesOverview.page';
import AdvancedSettings from '@tests/pages/pmmSettings/AdvancedSettings.page';
import {api} from "@api/api";
import { ListRoles } from '@tests/api/management';

let pmmVersion: number;

test.beforeAll(async () => {
  pmmVersion = (await api.pmm.serverV1.getPmmVersion()).minor;
  // beforeAll() does not work without any sync statement, given comment fixes it just fine
});

test.describe('Spec file for Access Control (RBAC)', async () => {
  test.skip(pmmVersion < 35, 'This test is for PMM version 2.35.0 and higher');
  const newUser = { username: 'testUserRBAC', email: 'testUserRBAC@localhost', name: 'Test User', password: 'password' };
  const roleName = `Role Name Only MySql Access`;
  const roleDescription = `Role Description Only MySql Access`;
  const roleNameCreate = `Role Name ${new Date().getTime()}`;
  const roleDescriptionCreate = `Role Description ${new Date().getTime()}`;
  let roles: ListRoles | undefined;

  test.beforeAll(async () => {
    roles = await api.pmm.managementV1.listRoles();
  });

  test.beforeEach(async ({ page }) => {
    await apiHelper.confirmTour(page);
    await page.goto('');
    await grafanaHelper.authorize(page, 'admin', 'admin');
  });

  test('PMM-T1573 Verify Access Roles tab on Configuration page @rbac @rbac-pre-upgrade', async ({ page }) => {
    test.skip(pmmVersion < 35, 'Test is for versions 2.35.0+');
    test.info().annotations.push({
      type: 'Also Covers',
      description: 'PMM-T1579 Verify docker variable to enable Access control (RBAC)',
    });
    const homeDashboard = new HomeDashboard(page);
    const rbacPage = new RbacPage(page);

    await test.step('1. Click on Configuration on the left menu and then select Access roles link', async () => {
      await homeDashboard.sideMenu.elements.configuration.hover();
      await expect(homeDashboard.sideMenu.configuration.buttons.rbac).toHaveText(
        homeDashboard.sideMenu.configuration.labels.rbac,
      );
      await homeDashboard.sideMenu.configuration.buttons.rbac.click();
    });

    await test.step('2. Click on Configuration on the left menu and then select Access roles link', async () => {
      await expect(rbacPage.rbacTable.elements.body).toContainText(rbacPage.rbacTable.labels.fullAccess);
    });

    await test.step('3. Verify there is "Create" button', async () => {
      await expect(rbacPage.buttons.create).toHaveText(rbacPage.labels.create);
      await expect(rbacPage.buttons.create).toHaveAttribute('href', rbacPage.links.createRole);
    });
  });

  test('PMM-T1580 Verify creating Access Role @rbac @rbac-pre-upgrade @rbac-post-upgrade', async ({ page }) => {
    test.skip(pmmVersion < 35, 'Test is for versions 2.35.0+');
    test.info().annotations.push({
      type: 'Also Covers',
      description: 'PMM-T1581 Verify assigning default role on Access roles page.',
    });

    // For updating from version without RBAC (<35)
    if (roles?.roles.length === 1) {
      const rbacPage = new RbacPage(page);
      const createRolePage = new CreateRolePage(page);

      await test.step('1. Navigate to the Access Role page, then click create button.', async () => {
        await page.goto(rbacPage.url);
        await rbacPage.buttons.create.click();
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
    }
  });

  test('PMM-T1584 Verify assigning Access role to user @rbac @rbac-pre-upgrade @rbac-post-upgrade', async ({ page }) => {
    test.skip(pmmVersion < 35, 'Test is for versions 2.35.0+');

    // For updating from version without RBAC (<35)
    if (roles?.roles.length === 1) {
      const rbacPage = new RbacPage(page);
      const createRolePage = new CreateRolePage(page);
      const newUserPage = new NewUserPage(page);
      const usersConfigurationPage = new UsersConfigurationPage(page);
      const mySqlDashboard = new MySqlDashboard(page);
      const nodesOverviewDashboard = new NodesOverviewDashboard(page);

      await test.step(
        '1. Navigate to the access role page then create role MySQL with label agent_type and value mysql_exporter',
        async () => {
          await page.goto(rbacPage.url);
          await rbacPage.buttons.create.click();
          await createRolePage.createNewRole({ roleName, roleDescription, label: 'agent_type', value: 'mysqld_exporter' });
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
        await mySqlDashboard.waitForPanelToHaveData('Top MySQL Used Connections', 444, Duration.TenMinutes);
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
    }
  });

  test('PMM-T1599 Verify assigned role after upgrade @rbac @rbac-post-upgrade', async ({ page }) => {
    test.skip(pmmVersion < 35, 'Test is for versions 2.35.0+');
    const usersConfigurationPage = new UsersConfigurationPage(page);
    const postgresqlInstancesOverviewDashboard = new PostgresqlInstancesOverviewDashboard(page);

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

  test('PMM-T1585 Verify deleting Access role @rbac @rbac-post-upgrade', async ({ page }) => {
    test.skip(pmmVersion < 35, 'Test is for versions 2.35.0+');
    test.info().annotations.push({
      type: 'Also Covers',
      description: 'PMM-T1578 Verify there is ability to enable Access control on Settings page.',
    });
    const rbacPage = new RbacPage(page);
    const usersConfigurationPage = new UsersConfigurationPage(page);

    await test.step('1. Navigate to Access Control page and try to delete role that is assigned to the user.', async () => {
      await page.goto(rbacPage.url);
      await rbacPage.rbacTable.elements.rowOptions(roleName).click();
      await rbacPage.rbacTable.elements.delete.click();
      await expect(rbacPage.rbacTable.elements.confirmDeleteRoleHeader).toContainText(
        rbacPage.rbacTable.messages.deleteRoleHeader(roleName),
      );
      await expect(rbacPage.rbacTable.elements.confirmDeleteRoleBody).toContainText(
        rbacPage.rbacTable.messages.userAssigned(roleName),
      );
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
      await rbacPage.toast.checkToastMessageContains(rbacPage.rbacTable.messages.roleDeleted(roleName), { variant: 'success' });
      await expect(rbacPage.rbacTable.elements.body).not.toContainText(roleName);
    });
  });

  test('PMM-T1652 Verify replacing the role while removing it @rbac @rbac-post-upgrade', async ({ page }) => {
    test.skip(pmmVersion < 35, 'Test is for versions 2.35.0+');
    const rbacPage = new RbacPage(page);
    const createRolePage = new CreateRolePage(page);
    const newUserPage = new NewUserPage(page);
    const usersConfigurationPage = new UsersConfigurationPage(page);

    const newRoleName = `Replace Role Test Role ${Date.now()}`;
    const newUserRoleDelete = { username: 'replaceRoleTestUser', email: 'replaceRoleTestUser@localhost', name: 'Replace Role Test User', password: 'password' };
    await test.step(
      '1. Navigate to the access role page delete old roles then create role MySQL with label agent_type and value mysql_exporter',
      async () => {
        await page.goto(rbacPage.url);
        await rbacPage.buttons.create.click();
        await createRolePage.createNewRole({ roleName: newRoleName, roleDescription, label: 'agent_type', value: 'mysqld_exporter' });
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
      await expect(rbacPage.rbacTable.elements.confirmDeleteRoleHeader).toContainText(
        rbacPage.rbacTable.messages.deleteRoleHeader(newRoleName),
      );
      await expect(rbacPage.rbacTable.elements.confirmDeleteRoleBody).toContainText(
        rbacPage.rbacTable.messages.userAssigned(newRoleName),
      );
      await expect(rbacPage.rbacTable.elements.roleAssignedDialogRoleSelect).toHaveText(rbacPage.rbacTable.labels.fullAccess);
      await rbacPage.rbacTable.buttons.confirmAndDeleteRole.click();
      await page.goto(usersConfigurationPage.url);
      await expect(usersConfigurationPage.usersTable.elements.rowByText(newUserRoleDelete.username)).toContainText(rbacPage.rbacTable.labels.fullAccess);
    });
  });

  test('PMM-T1668 Verify removing Access role for deleted user. @rbac @rbac-post-upgrade', async ({ page }) => {
    test.info().annotations.push({
      type: 'Also Covers',
      description: 'PMM-T1601 Verify Grafana Does not crash when filtering users from the admin page.',
    });
    test.skip(pmmVersion < 36, 'Test is for versions 2.36.0+');
    const rbacPage = new RbacPage(page);
    const createRolePage = new CreateRolePage(page);
    const newUserPage = new NewUserPage(page);
    const usersConfigurationPage = new UsersConfigurationPage(page);
    const deleteUser = {
      username: `userRBACDelete_${Date.now()}`, email: `userRBACDelete@localhost_${Date.now()}`, name: 'Delete User', password: 'password'
    };
    const deleteUserRole = `Delete Role PgSql Access - ${Date.now()
      } `;

    await test.step(
      '1. Navigate to the access role page then create role PgSql with label agent_type and value postgres_exporter',
      async () => {
        await page.goto(rbacPage.url);
        await rbacPage.buttons.create.click();
        await createRolePage.createNewRole({ roleName: deleteUserRole, roleDescription, label: 'agent_type', value: 'postgres_exporter' });
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
      await usersConfigurationPage.fields.searchUsers.type('NonExistingUser');
      await usersConfigurationPage.buttons.deleteUser(deleteUser.email).waitFor({ state: 'hidden' });
      await expect(usersConfigurationPage.elements.usersTable).toBeVisible();
      await usersConfigurationPage.fields.searchUsers.clear();
    });

    await test.step(`3. Delete user assigned to the role: ${deleteUserRole} `, async () => {
      await usersConfigurationPage.deleteUser(deleteUser.email);
      await usersConfigurationPage.verifyUserNotExists(deleteUser.email);
    });

    await test.step(`4. Delete user role: ${deleteUserRole}.`, async () => {
      await page.goto(rbacPage.url);
      await rbacPage.rbacTable.elements.rowOptions(deleteUserRole).click();
      await rbacPage.rbacTable.elements.delete.click();
      await expect(rbacPage.rbacTable.elements.confirmDeleteRoleHeader).toContainText(
        rbacPage.rbacTable.messages.deleteRoleHeader(deleteUserRole),
      );
      await expect(rbacPage.rbacTable.elements.confirmDeleteRoleBody).toContainText(
        rbacPage.rbacTable.messages.deleteRoleBody,
      );
      await rbacPage.rbacTable.buttons.confirmAndDeleteRole.click();
      await rbacPage.toast.checkToastMessageContains(rbacPage.rbacTable.messages.roleDeleted(deleteUserRole), { variant: 'success' });
    });
  })

  test('PMM-T1629 Verify re-enabling of the Access Control @rbac @rbac-post-upgrade', async ({ page }) => {
    test.skip(pmmVersion < 35, 'Test is for versions 2.35.0+');
    const advancedSettings = new AdvancedSettings(page);
    const homeDashboard = new HomeDashboard(page);
    const rbacPage = new RbacPage(page);

    await test.step('1.Navigate to the advanced settings and disable Access Control.', async () => {
      await page.goto(advancedSettings.url);
      await advancedSettings.fields.accessControl.click({ force: true });
      await expect(advancedSettings.fields.accessControl).not.toBeChecked();
      await advancedSettings.buttons.applyChanges.click();
    });

    await test.step('2. Verify Access Control is disabled.', async () => {
      await homeDashboard.sideMenu.elements.configuration.hover();
      await homeDashboard.sideMenu.configuration.buttons.rbac.waitFor({ state: 'detached' });
      await page.goto(rbacPage.url);
      await expect(rbacPage.elements.emptyBlock).toHaveText(rbacPage.messages.featureDisabled);
    });

    await test.step('3. Re-enable Access Control.', async () => {
      await page.goto(advancedSettings.url);
      await advancedSettings.fields.accessControl.check({ force: true });
      await expect(advancedSettings.fields.accessControl).toBeChecked();
      await advancedSettings.buttons.applyChanges.click();
    });

    await test.step('2. Verify Access Control is enabled.', async () => {
      await homeDashboard.sideMenu.elements.configuration.hover();
      await homeDashboard.sideMenu.configuration.buttons.rbac.waitFor({ state: 'visible' });
    });
  });
});
