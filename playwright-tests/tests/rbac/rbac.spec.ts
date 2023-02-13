import { expect, test } from '@playwright/test';
import apiHelper from '@api/apiHelper';
import HomeDashboard from '@tests/pages/HomeDashboard.page';
import grafanaHelper from '@tests/helpers/GrafanaHelper';
import { RbacPage } from '@tests/pages/configuration/Rbac.page';
import { CreateRolePage } from '@tests/pages/configuration/CreateRole.page';

test.describe('Spec file for Access Control (RBAC)', async () => {
  test.beforeEach(async ({ page }) => {
    await apiHelper.confirmTour(page);
    await page.goto('');
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

    await grafanaHelper.authorize(page);
    await homeDashboard.sideMenu.elements.configuration.hover();
    await expect(homeDashboard.sideMenu.configuration.buttons.rbac).toHaveText(homeDashboard.sideMenu.configuration.labels.rbac);
    await homeDashboard.sideMenu.configuration.buttons.rbac.click();
    await expect(rbacPage.rbacTable.elements.body).toContainText(rbacPage.rbacTable.labels.fullAccess);
    await expect(rbacPage.buttons.create).toHaveText(rbacPage.labels.create);
    await expect(rbacPage.buttons.create).toHaveAttribute('href', rbacPage.links.createRole);
  });

  test('PMM-T1580 Verify creating Access Role @rbac', async ({ 
    page
  }) => {
    const rbacPage = new RbacPage(page);
    const createRolePage = new CreateRolePage(page);
    const roleName = `Role Name ${new Date().getTime()}`
    const roleDescription = `Role Description ${new Date().getTime()}`

    await grafanaHelper.authorize(page);
    await page.goto(rbacPage.url);
    await rbacPage.buttons.create.click();
    await createRolePage.fields.roleName.type(roleName);
    await createRolePage.fields.roleDescription.type(roleDescription);
    await createRolePage.fields.selectLabel.click();
    await createRolePage.elements.menuOption('agent_type').click();
    await createRolePage.fields.selectValue.click();
    await createRolePage.elements.menuOption('node_exporter').click();
    await createRolePage.buttons.submit.click();
    await createRolePage.toast.checkToastMessage(createRolePage.messages.roleCreatedHeader(roleName) + createRolePage.messages.roleCreatedDescription);
    await rbacPage.rbacTable.verifyRowData(roleName, roleDescription, 'agent_type', '=', 'node_exporter');
  });
});
