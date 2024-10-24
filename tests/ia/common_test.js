const { settingsAPI, iaCommon, alertsPage } = inject();

Feature('Alerting: Tabs and navigation');

Before(async ({ I, rulesAPI }) => {
  await I.Authorize();
  await rulesAPI.removeAllAlertRules();
});

Scenario(
  'PMM-T643 Verify message about disabled IA @alerting-fb',
  async ({
    I, pmmSettingsPage, codeceptjsConfig,
  }) => {
    await settingsAPI.apiDisableIA();
    I.amOnPage(alertsPage.url);
    I.waitForVisible(iaCommon.elements.disabledIa, 30);
    I.seeTextEquals(iaCommon.messages.disabledIa, iaCommon.elements.disabledIa);

    const link = await I.grabAttributeFrom(iaCommon.elements.settingsLink, 'href');

    I.assertContain(link, pmmSettingsPage.advancedSettingsUrl, 'Settings link does not contain expected link.');
  },
);

Scenario(
  'PMM-T481 Verify IA tab bar, '
  + 'PMM-T620 Verify after reloading the page user is on the same IA tab, '
  + 'PMM-T776 Verify that user is able to see valid HTML Title on alerts page @alerting-fb',
  async ({
    I, alertRulesPage, ruleTemplatesPage, contactPointsPage, nPoliciesPage, silencesPage, alertGroupsPage, aiAdminPage,
  }) => {
    await settingsAPI.apiEnableIA();
    const verifyNotificationChannelsPage = async () => {
      I.waitForVisible(nPoliciesPage.buttons.newPolicy, 30);
    };

    I.amOnPage(alertsPage.url);
    // give title time to change from 'Grafana'
    I.wait(10);
    // PMM-T776
    const verifyTitle = (page) => {
      I.seeTitleEquals(`${page} - Alerting - Percona Monitoring and Management`);
    };

    verifyTitle('Fired alerts');
    iaCommon.openAndVerifyTab(
      iaCommon.tabNames.ruleTemplates,
      ruleTemplatesPage.buttons.openAddTemplateModal,
      ruleTemplatesPage.url,
    );
    verifyTitle('Alert rule templates');
    iaCommon.openAndVerifyTab(iaCommon.tabNames.alertRules, alertRulesPage.buttons.newAlertRule, alertRulesPage.url);
    verifyTitle('Alert rules');
    iaCommon.openAndVerifyTab(iaCommon.tabNames.contactPoints, contactPointsPage.buttons.newContactPoint, contactPointsPage.url);
    verifyTitle('Contact points');
    iaCommon.openAndVerifyTab(iaCommon.tabNames.notificationPolicies, nPoliciesPage.buttons.newPolicy, nPoliciesPage.url);
    verifyTitle('Notification policies');

    // PMM-T620
    I.refreshPage();
    await verifyNotificationChannelsPage();

    await iaCommon.openAndVerifyTab(iaCommon.tabNames.silences, silencesPage.buttons.newSilence, silencesPage.url);
    verifyTitle('Silences');
    await iaCommon.openAndVerifyTab(iaCommon.tabNames.alertGroups, alertGroupsPage.elements.groupByContainer, alertGroupsPage.url);
    verifyTitle('Alert groups');
    await iaCommon.openAndVerifyTab(iaCommon.tabNames.admin, aiAdminPage.elements.configTextarea, aiAdminPage.url);
    verifyTitle('Admin');
    await iaCommon.openAndVerifyTab(iaCommon.tabNames.firedAlerts, alertsPage.elements.noAlerts, alertsPage.url);
  },
);
