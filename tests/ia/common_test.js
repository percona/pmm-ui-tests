const { settingsAPI, iaCommon, alertsPage } = inject();

Feature('Alerting: Tabs and navigation');

Before(async ({ I, rulesAPI }) => {
  await I.Authorize();
  await rulesAPI.removeAllAlertRules();
});

Scenario.skip(
  'PMM-T643 Verify message about disabled IA @ia @alerting-fb',
  async ({
    I, pmmSettingsPage, codeceptjsConfig,
  }) => {
    await settingsAPI.apiDisableIA();
    I.amOnPage(alertsPage.url);
    I.waitForVisible(iaCommon.elements.disabledIa, 30);
    I.seeTextEquals(iaCommon.messages.disabledIa, iaCommon.elements.disabledIa);

    I.seeAttributesOnElements(iaCommon.elements.settingsLink, {
      href: `${codeceptjsConfig.config.helpers.Playwright.url}${pmmSettingsPage.advancedSettingsUrl}`,
    });
  },
);

Scenario.skip(
  'PMM-T481 Verify IA tab bar, '
  + 'PMM-T620 Verify after reloading the page user is on the same IA tab, '
  + 'PMM-T776 Verify that user is able to see valid HTML Title on alerts page @ia @alerting-fb',
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
    await iaCommon.openAndVerifyTab(
      iaCommon.tabNames.ruleTemplates,
      ruleTemplatesPage.buttons.openAddTemplateModal,
      ruleTemplatesPage.url,
    );
    verifyTitle('Alert rule templates');
    await iaCommon.openAndVerifyTab(iaCommon.tabNames.alertRules, alertRulesPage.buttons.newAlertRule, alertRulesPage.url);
    verifyTitle('Alert rules');
    await iaCommon
      .openAndVerifyTab(iaCommon.tabNames.contactPoints, contactPointsPage.buttons.newContactPoint, contactPointsPage.url);
    verifyTitle('Contact points');
    await iaCommon.openAndVerifyTab(iaCommon.tabNames.notificationPolicies, nPoliciesPage.buttons.newPolicy, nPoliciesPage.url);
    verifyTitle('Notification policies');

    // PMM-T620
    I.refreshPage();
    await verifyNotificationChannelsPage();

    await iaCommon.openAndVerifyTab(iaCommon.tabNames.silences, silencesPage.buttons.newSilence, silencesPage.url);
    verifyTitle('Silences');
    await iaCommon
      .openAndVerifyTab(iaCommon.tabNames.alertGroups, alertGroupsPage.elements.groupByContainer, alertGroupsPage.url);
    verifyTitle('Alert groups');
    await iaCommon.openAndVerifyTab(iaCommon.tabNames.admin, aiAdminPage.elements.configTextarea, aiAdminPage.url);
    verifyTitle('Admin');
    await iaCommon.openAndVerifyTab(iaCommon.tabNames.firedAlerts, alertsPage.elements.noAlerts, alertsPage.url);
  },
);
