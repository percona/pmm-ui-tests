const { settingsAPI, iaCommon, alertsPage } = inject();

Feature('IA: Tabs and navigation');

Before(async ({ I, rulesAPI }) => {
  await I.Authorize();
  await rulesAPI.removeAllAlertRules();
});

Scenario(
  'PMM-T643 Verify message about disabled IA @ia @alerting-fb',
  async ({
    I, pmmSettingsPage, codeceptjsConfig
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

Scenario(
  'PMM-T481 Verify IA tab bar, ' +
  'PMM-T620 Verify after reloading the page user is on the same IA tab, ' +
  'PMM-T776 Verify that user is able to see valid HTML Title on alerts page @ia @alerting-fb',
  async ({
    I, alertRulesPage, ruleTemplatesPage, contactPointsPage, ncPage, silencesPage, alertGroupsPage, aiAdminPage
  }) => {
    await settingsAPI.apiEnableIA();
    const verifyNotificationChannelsPage = async () => {
      I.waitForVisible(ncPage.buttons.newPolicy, 30);
    };

    I.amOnPage(alertsPage.url);
    // PMM-T776
    const verifyTitle = (page) => {
      I.waitForDetached(locate('title').withText('Grafana'), 10);
      I.seeTitleEquals(`${page} - Alerting - Percona Monitoring and Management`);
    };

    verifyTitle('Fired alerts');
    iaCommon.openAndVerifyTab(iaCommon.tabNames.ruleTemplates, ruleTemplatesPage.buttons.openAddTemplateModal,
      ruleTemplatesPage.url);
    verifyTitle('Alert rule templates');
    iaCommon.openAndVerifyTab(iaCommon.tabNames.alertRules, alertRulesPage.buttons.openAddRuleModal, alertRulesPage.url);
    verifyTitle('Alert rules');
    iaCommon.openAndVerifyTab(iaCommon.tabNames.contactPoints, contactPointsPage.buttons.newContactPoint, contactPointsPage.url);
    verifyTitle('Contact points');
    iaCommon.openAndVerifyTab(iaCommon.tabNames.notificationPolicies, ncPage.buttons.newPolicy, ncPage.url);
    verifyTitle('Notification policies');

    // PMM-T620
    I.refreshPage();
    await verifyNotificationChannelsPage();

    iaCommon.openAndVerifyTab(iaCommon.tabNames.silences, silencesPage.buttons.newSilence, silencesPage.url);
    verifyTitle('Silences');
    iaCommon.openAndVerifyTab(iaCommon.tabNames.alertGroups, alertGroupsPage.elements.groupByContainer, alertGroupsPage.url);
    verifyTitle('Alert groups');
    iaCommon.openAndVerifyTab(iaCommon.tabNames.admin, aiAdminPage.elements.configTextarea, aiAdminPage.url);
    verifyTitle('Admin');
    iaCommon.openAndVerifyTab(iaCommon.tabNames.firedAlerts, alertsPage.elements.noAlerts, alertsPage.url);
  },
);
