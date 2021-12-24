const {
  pmmSettingsPage, pmmInventoryPage, dashboardPage, remoteInstancesPage,
} = inject();

Feature('PMM Permission restrictions').retry(2);

let viewer; let admin; let
  editor;

const users = {
  viewer: {
    username: 'test_viewer',
    password: 'password',
  },
  admin: {
    username: 'test_admin',
    password: 'password',
  },
  editor: {
    username: 'test_editor',
    password: 'password',
  },
};

const viewerRole = new DataTable(['username', 'password', 'dashboard']);

viewerRole.add([users.viewer.username, users.viewer.password, remoteInstancesPage.url]);
viewerRole.add([users.viewer.username, users.viewer.password, pmmSettingsPage.url]);
viewerRole.add([users.viewer.username, users.viewer.password, 'graph/inventory/nodes?orgId=1']);
viewerRole.add([users.viewer.username, users.viewer.password, 'graph/inventory/agents?orgId=1']);
viewerRole.add([users.viewer.username, users.viewer.password, 'graph/inventory/services?orgId=1']);

const editorRole = new DataTable(['username', 'password', 'dashboard']);

editorRole.add([users.editor.username, users.editor.password, remoteInstancesPage.url]);
editorRole.add([users.editor.username, users.editor.password, pmmSettingsPage.url]);
editorRole.add([users.editor.username, users.editor.password, 'graph/inventory/nodes?orgId=1']);
editorRole.add([users.editor.username, users.editor.password, 'graph/inventory/agents?orgId=1']);
editorRole.add([users.editor.username, users.editor.password, 'graph/inventory/services?orgId=1']);

const ptSummaryRoleCheck = new DataTable(['username', 'password', 'dashboard']);

ptSummaryRoleCheck.add([users.editor.username, users.editor.password, dashboardPage.nodeSummaryDashboard.url]);
ptSummaryRoleCheck.add([users.viewer.username, users.viewer.password, dashboardPage.nodeSummaryDashboard.url]);

BeforeSuite(async ({ I }) => {
  I.say('Creating users for the permissions test suite');
  const viewerId = await I.createUser(users.viewer.username, users.viewer.password);
  const adminId = await I.createUser(users.admin.username, users.admin.password);
  const editorId = await I.createUser(users.editor.username, users.editor.password);

  await I.setRole(viewerId);
  await I.setRole(adminId, 'Admin');
  await I.setRole(editorId, 'Editor');
  viewer = viewerId;
  admin = adminId;
  editor = editorId;
});

AfterSuite(async ({ I }) => {
  I.say('Removing users');
  await I.deleteUser(viewer);
  await I.deleteUser(admin);
  await I.deleteUser(editor);
});

Scenario(
  'PMM-T358 Verify Failed checks panel at Home page for the viewer role (STT is enabled) @stt @grafana-pr',
  async ({ I, homePage, settingsAPI }) => {
    await settingsAPI.apiEnableSTT();
    await I.Authorize(users.viewer.username, users.viewer.password);
    I.amOnPage(homePage.url);
    I.waitForVisible(homePage.fields.checksPanelSelector, 30);
    I.waitForVisible(homePage.fields.noAccessRightsSelector, 30);
    I.see('Insufficient access permissions.', homePage.fields.noAccessRightsSelector);
  },
);

Scenario(
  'PMM-T360 Verify Failed checks panel at Home page for the admin role (STT is enabled) @stt @grafana-pr',
  async ({ I, homePage, settingsAPI }) => {
    await settingsAPI.apiEnableSTT();
    await I.Authorize(users.admin.username, users.admin.password);
    I.amOnPage(homePage.url);
    I.waitForVisible(homePage.fields.checksPanelSelector, 30);
    I.dontSeeElement(homePage.fields.noAccessRightsSelector);
  },
);

Scenario(
  'PMM-T358 Verify Database Failed checks page for the viewer role (STT is enabled) [critical] @stt @grafana-pr',
  async ({ I, databaseChecksPage, settingsAPI }) => {
    await settingsAPI.apiEnableSTT();
    await I.Authorize(users.viewer.username, users.viewer.password);
    I.amOnPage(databaseChecksPage.url);
    I.waitForVisible(databaseChecksPage.fields.dbCheckPanelSelector, 30);
    I.waitForVisible(databaseChecksPage.fields.noAccessRightsSelector, 30);
    I.see('Insufficient access permissions.', databaseChecksPage.fields.noAccessRightsSelector);
  },
);

Scenario(
  'PMM-T360 Verify Database Failed checks page for the admin role (STT is enabled) [critical] @stt @grafana-pr',
  async ({ I, databaseChecksPage, settingsAPI }) => {
    await settingsAPI.apiEnableSTT();
    await I.Authorize(users.admin.username, users.admin.password);
    I.amOnPage(databaseChecksPage.url);
    I.waitForVisible(databaseChecksPage.fields.dbCheckPanelSelector, 30);
    I.dontSeeElement(databaseChecksPage.fields.noAccessRightsSelector);
  },
);

Scenario(
  'PMM-T358 Verify Failed checks panel at Home page for the viewer role (STT is disabled) @stt @grafana-pr',
  async ({ I, homePage, settingsAPI }) => {
    await settingsAPI.apiDisableSTT();
    await I.Authorize(users.viewer.username, users.viewer.password);
    I.amOnPage(homePage.url);
    I.waitForVisible(homePage.fields.checksPanelSelector, 30);
    I.waitForVisible(homePage.fields.noAccessRightsSelector, 30);
    I.see('Insufficient access permissions.', homePage.fields.noAccessRightsSelector);
  },
);

Scenario(
  'PMM-T360 Verify Failed checks panel at Home page for the admin role (STT is disabled) @stt @grafana-pr',
  async ({ I, homePage, settingsAPI }) => {
    await settingsAPI.apiDisableSTT();
    await I.Authorize(users.admin.username, users.admin.password);
    I.amOnPage(homePage.url);
    I.waitForVisible(homePage.fields.checksPanelSelector, 30);
    I.dontSeeElement(homePage.fields.noAccessRightsSelector);
  },
);

Scenario(
  'PMM-T358 Verify Database Failed checks page for the viewer role (STT is disabled) [critical] @stt @grafana-pr',
  async ({ I, databaseChecksPage, settingsAPI }) => {
    await settingsAPI.apiDisableSTT();
    await I.Authorize(users.viewer.username, users.viewer.password);
    I.amOnPage(databaseChecksPage.url);
    I.waitForVisible(databaseChecksPage.fields.dbCheckPanelSelector, 30);
    I.waitForVisible(databaseChecksPage.fields.noAccessRightsSelector, 30);
    I.see('Insufficient access permissions.', databaseChecksPage.fields.noAccessRightsSelector);
  },
);

Scenario(
  'PMM-T360 Verify Database Failed checks page for the admin role (STT is disabled) [critical] @stt @grafana-pr',
  async ({ I, databaseChecksPage, settingsAPI }) => {
    await settingsAPI.apiDisableSTT();
    await I.Authorize(users.admin.username, users.admin.password);
    I.amOnPage(databaseChecksPage.url);
    I.waitForVisible(databaseChecksPage.fields.dbCheckPanelSelector, 30);
    I.dontSeeElement(databaseChecksPage.fields.noAccessRightsSelector);
  },
);

Scenario(
  'PMM-T682 Verify backup locations access for user with viewer role [critical] @backup @grafana-pr',
  async ({
    I, databaseChecksPage, settingsAPI, locationsPage,
  }) => {
    await settingsAPI.changeSettings({ backup: true });
    await I.Authorize(users.viewer.username, users.viewer.password);

    I.amOnPage(locationsPage.url);
    I.waitForVisible(databaseChecksPage.fields.noAccessRightsSelector, 30);
    I.see('Insufficient access permissions.', databaseChecksPage.fields.noAccessRightsSelector);
  },
);

Data(viewerRole).Scenario(
  'PMM-T824 - Verify viewer users do not see Inventory, Settings, Remote Instances Page @nightly @grafana-pr',
  async ({
    I, current, homePage, databaseChecksPage,
  }) => {
    const { username, password, dashboard } = current;

    await I.Authorize(username, password);
    I.amOnPage(dashboard);
    I.waitForVisible(databaseChecksPage.fields.noAccessRightsSelector, 30);
    I.see('Insufficient access permissions.', databaseChecksPage.fields.noAccessRightsSelector);
  },
);

Data(editorRole).Scenario(
  'PMM-T824 - Verify editor users do not see Inventory, Settings, Remote Instances Page @nightly @grafana-pr',
  async ({
    I, current, homePage, databaseChecksPage,
  }) => {
    const { username, password, dashboard } = current;

    await I.Authorize(username, password);
    I.amOnPage(dashboard);
    I.waitForVisible(databaseChecksPage.fields.noAccessRightsSelector, 30);
    I.see('Insufficient access permissions.', databaseChecksPage.fields.noAccessRightsSelector);
  },
);

Data(ptSummaryRoleCheck).Scenario(
  'PMM-T420 Verify the pt-summary with different user roles @nightly @grafana-pr',
  async ({
    I, databaseChecksPage, settingsAPI, locationsPage, current, adminPage,
  }) => {
    const { username, password, dashboard } = current;

    await I.Authorize(username, password);
    I.amOnPage(dashboard);
    dashboardPage.waitForDashboardOpened();
    I.click(adminPage.fields.metricTitle);
    await dashboardPage.expandEachDashboardRow();
    adminPage.performPageUp(5);
    I.waitForElement(dashboardPage.nodeSummaryDashboard.ptSummaryDetail.reportContainer, 60);
    I.seeElement(dashboardPage.nodeSummaryDashboard.ptSummaryDetail.reportContainer);
  },
);
