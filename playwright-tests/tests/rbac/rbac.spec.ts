import { expect, test } from '@playwright/test';
import apiHelper from '@api/apiHelper';
import HomeDashboard from '@tests/pages/HomeDashboard.page';
import grafanaHelper from '@tests/helpers/GrafanaHelper';
import { RbacPage } from '@tests/pages/configuration/Rbac.page';
import { CreateRolePage } from '@tests/pages/configuration/CreateRole.page';
import { NewUserPage } from '@tests/pages/serverAdmin/NewUser.page';
import { UsersConfigurationPage } from '@tests/pages/configuration/UsersConfiguration.page';
import { MySqlDashboard } from '@tests/pages/dashboards/mysql/MySqlDashboard.page';

test.describe('Spec file for Access Control (RBAC)', async () => {
  test.beforeEach(async ({ page }) => {
    await apiHelper.confirmTour(page);
    await page.goto('');
    await grafanaHelper.authorize(page);
  });

  test('PMM-T1573 Verify Access Roles tab on Configuration page @rbac', async ({
    page,
  }) => {
    test.info().annotations.push({
      type: 'Also Covers',
      description:
        'PMM-T1579 Verify docker variable to enable Access control (RBAC)',
    });
    const homeDashboard = new HomeDashboard(page);
    const rbacPage = new RbacPage(page);

    await test.step('1. Click on Configuration on the left menu and then select Access roles link', async () => {
      await homeDashboard.sideMenu.elements.configuration.hover();
      await expect(homeDashboard.sideMenu.configuration.buttons.rbac).toHaveText(homeDashboard.sideMenu.configuration.labels.rbac);  
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

  test('PMM-T1580 Verify creating Access Role @rbac', async ({ 
    page
  }) => {
    const rbacPage = new RbacPage(page);
    const createRolePage = new CreateRolePage(page);

    const roleName = `Role Name ${new Date().getTime()}`
    const roleDescription = `Role Description ${new Date().getTime()}`
    await test.step('1. Navigate to the Access Role page, then click create button.', async () => {
      await page.goto(rbacPage.url);
      await rbacPage.buttons.create.click();
    });
    
    await test.step('2. Create new role agent_type=mysqld_exporter.', async () => {
      await createRolePage.createNewRole({roleName, roleDescription, label: 'agent_type', value: 'mysqld_exporter'});
      await rbacPage.rbacTable.verifyRowData(roleName, roleDescription, 'agent_type', '=', 'mysqld_exporter');
    });
    
    await test.step('3. Assign new role as a default one.', async () => {
      await rbacPage.rbacTable.elements.rowOptions(roleName).click();
      await rbacPage.rbacTable.elements.setDefault.click();
      await expect(rbacPage.rbacTable.elements.defaultRow).toContainText(roleName);
      await expect(rbacPage.rbacTable.elements.rowByText(rbacPage.rbacTable.labels.fullAccess)).not.toContainText('Default');
    });
    
  });

  test('PMM-T1584 Verify assigning Access role to user @rbac', async ({ 
    page
  }) => {
    const rbacPage = new RbacPage(page);
    const createRolePage = new CreateRolePage(page);
    const newUserPage = new NewUserPage(page);
    const usersConfigurationPage = new UsersConfigurationPage(page);
    const mySqlDashboard = new MySqlDashboard(page);
    const homeDashboard = new HomeDashboard(page);

    const roleName = `Role Name ${new Date().getTime()}`
    const roleDescription = `Role Description ${new Date().getTime()}`
    const newUser = { username: 'testUserRBAC', email: 'testUserRBAC@localhost', name: 'Test User', password: 'password' };

    await test.step('1. Navigate to the access role page then create role MySQL with label agent_type and value mysql_exporter', async () => {
      await page.goto(rbacPage.url);
      await rbacPage.buttons.create.click();
      await createRolePage.createNewRole({roleName, roleDescription, label: 'agent_type', value: 'mysqld_exporter'});
      await rbacPage.rbacTable.verifyRowData(roleName, roleDescription, 'agent_type', '=', 'mysqld_exporter'); 
    });

    await test.step('2. Create new user and assign new role to the user.', async () => {
      await page.goto(newUserPage.url);
      await newUserPage.createUser(newUser.name, newUser.email, newUser.username, newUser.password);
  
      await page.goto(usersConfigurationPage.url);
      await usersConfigurationPage.usersTable.fields.accessRole('testUserRBAC@localhost').click();
      await usersConfigurationPage.optionMenu.selectOption(roleName);
    });

    await test.step('3. Login as new user and verify that Node Dashboard does NOT show data.', async () => {
      await grafanaHelper.unAuthorize(page);
      await grafanaHelper.authorize(page, newUser.username, newUser.password);
      await homeDashboard.verifyAllPanelsDoesNotHaveData();
    });

    await test.step('4. Login as new user and verify that Node MySql Dashboard shows data.', async () => {
      await page.goto(mySqlDashboard.url)
      await mySqlDashboard.verifyAllPanelsHaveData();
    });
  });
});
