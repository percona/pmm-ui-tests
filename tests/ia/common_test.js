Feature('IA: Navigation, breadcrumb').retry(1);

Before(async ({
  I, channelsAPI, settingsAPI, rulesAPI, templatesAPI,
}) => {
  await I.Authorize();
//   await settingsAPI.apiEnableIA();
//   await rulesAPI.clearAllRules(true);
//   await templatesAPI.clearAllTemplates();
//   await channelsAPI.clearAllNotificationChannels();
});

Scenario(
  'PMM-T643 Verify message about disabled IA @ia @grafana-pr',
  async ({
    I, settingsAPI, iaCommon, pmmSettingsPage, codeceptjsConfig,
  }) => {
    await settingsAPI.apiDisableIA();
    I.amOnPage(iaCommon.tabNames.ruleTemplates);
    I.waitForVisible(iaCommon.elements.disabledIa, 30);
    I.seeTextEquals(iaCommon.messages.disabledIa, iaCommon.elements.disabledIa);

    I.seeAttributesOnElements(iaCommon.elements.settingsLink, {
      href: `${codeceptjsConfig.config.helpers.Playwright.url}${pmmSettingsPage.advancedSettingsUrl}`,
    });
  },
);

Scenario(
  'PMM-T481 PMM-T620 PMM-T776 Verify user is able to use tab bar, breadcrumb @ia @grafana-pr',
  async ({
    I, alertRulesPage, ruleTemplatesPage, iaCommon, ncPage,
  }) => {
    const verifyNotificationChannelsPage = async () => {
      I.seeInCurrentUrl(`/graph/alerting/routes`);
      I.seeElement(ncPage.buttons.newPolicy);
      await iaCommon.verifyTabIsActive(iaCommon.tabNames.notificationPolicies);
    };

    I.amOnPage(iaCommon.url.firedAlerts);
    I.waitForVisible(iaCommon.elements.tab(iaCommon.tabNames.firedAlerts));
    I.seeInCurrentUrl(iaCommon.url.firedAlerts);
    await iaCommon.verifyTabIsActive(iaCommon.tabNames.firedAlerts);

    iaCommon.openTab(iaCommon.tabNames.ruleTemplates);
    I.seeInCurrentUrl(iaCommon.url.ruleTemplates);
    I.seeElement(ruleTemplatesPage.buttons.openAddTemplateModal);
    await iaCommon.verifyTabIsActive(iaCommon.tabNames.ruleTemplates);

    iaCommon.openTab(iaCommon.tabNames.alertRules);
    I.seeInCurrentUrl(iaCommon.url.alertRules);
    I.seeElement(alertRulesPage.buttons.openAddRuleModal);
    await iaCommon.verifyTabIsActive(iaCommon.tabNames.alertRules);

    iaCommon.openTab(iaCommon.tabNames.contactPoints);
    I.seeInCurrentUrl(iaCommon.url.contactPoints);
    // I.seeElement(alertRulesPage.buttons.openAddRuleModal);
    await iaCommon.verifyTabIsActive(iaCommon.tabNames.contactPoints);

    iaCommon.openTab(iaCommon.tabNames.notificationPolicies);
    await verifyNotificationChannelsPage();
    I.refreshPage();
    I.waitForVisible(ncPage.buttons.newPolicy, 30);
    await verifyNotificationChannelsPage();

    iaCommon.openTab(iaCommon.tabNames.silences);
    I.seeInCurrentUrl(iaCommon.url.silences);
    // I.seeElement(alertRulesPage.buttons.openAddRuleModal);
    await iaCommon.verifyTabIsActive(iaCommon.tabNames.silences);

    iaCommon.openTab(iaCommon.tabNames.alertGroups);
    I.seeInCurrentUrl(iaCommon.url.alertGroups);
    // I.seeElement(alertRulesPage.buttons.openAddRuleModal);
    await iaCommon.verifyTabIsActive(iaCommon.tabNames.alertGroups);

    iaCommon.openTab(iaCommon.tabNames.admin);
    I.seeInCurrentUrl(iaCommon.url.admin);
    // I.seeElement(alertRulesPage.buttons.openAddRuleModal);
    await iaCommon.verifyTabIsActive(iaCommon.tabNames.admin);

    iaCommon.openTab(iaCommon.tabNames.firedAlerts);
    I.seeInCurrentUrl(iaCommon.url.firedAlerts);
    await iaCommon.verifyTabIsActive(iaCommon.tabNames.firedAlerts);
  },
);
