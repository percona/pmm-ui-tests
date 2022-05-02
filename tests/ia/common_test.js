Feature('IA: Navigation, breadcrumb').retry(1);

Before(async ({
  I, channelsAPI, settingsAPI, rulesAPI, templatesAPI,
}) => {
  await I.Authorize();
  await settingsAPI.apiEnableIA();
  await rulesAPI.clearAllRules(true);
  await templatesAPI.clearAllTemplates();
  await channelsAPI.clearAllNotificationChannels();
});

Scenario(
  'PMM-T481 PMM-T619 PMM-T620 PMM-T776 Verify user is able to use tab bar, breadcrumb @ia @grafana-pr',
  async ({
    I, alertRulesPage, ruleTemplatesPage, iaCommon, ncPage,
  }) => {
    const verifyNotificationChannelsPage = async () => {
      I.seeInCurrentUrl(`${iaCommon.url}/notification-channels`);
      I.seeElement(ncPage.buttons.openAddChannelModal);
      await iaCommon.verifyTabIsActive(iaCommon.tabNames.notificationChannels);
      iaCommon.checkBreadcrumbText(iaCommon.tabNames.notificationChannels, iaCommon.elements.breadcrumbActive);
    };

    const verifyTitle = (page) => {
      I.seeTitleEquals(`Integrated Alerting: ${page} - Percona Monitoring and Management`);
    };

    I.amOnPage(iaCommon.url);

    I.waitForVisible(iaCommon.elements.tab(iaCommon.tabNames.alerts));
    I.seeInCurrentUrl(`${iaCommon.url}/alerts`);
    await iaCommon.verifyTabIsActive(iaCommon.tabNames.alerts);
    verifyTitle('Alerts');
    iaCommon.checkBreadcrumbText(iaCommon.tabNames.alerts, iaCommon.elements.breadcrumbActive);

    iaCommon.openTab(iaCommon.tabNames.alertRules);
    I.seeInCurrentUrl(`${iaCommon.url}/alert-rules`);
    I.seeElement(alertRulesPage.buttons.openAddRuleModal);
    await iaCommon.verifyTabIsActive(iaCommon.tabNames.alertRules);
    verifyTitle('Alert Rules');
    iaCommon.checkBreadcrumbText(iaCommon.tabNames.alertRules, iaCommon.elements.breadcrumbActive);

    iaCommon.openTab(iaCommon.tabNames.ruleTemplates);
    I.seeInCurrentUrl(`${iaCommon.url}/alert-rule-templates`);
    I.seeElement(ruleTemplatesPage.buttons.openAddTemplateModal);
    await iaCommon.verifyTabIsActive(iaCommon.tabNames.ruleTemplates);
    verifyTitle('Alert Rule Templates');
    iaCommon.checkBreadcrumbText(iaCommon.tabNames.ruleTemplates, iaCommon.elements.breadcrumbActive);

    iaCommon.openTab(iaCommon.tabNames.notificationChannels);
    await verifyNotificationChannelsPage();
    verifyTitle('Notification Channels');
    I.refreshPage();
    I.waitForVisible(ncPage.buttons.openAddChannelModal, 30);
    await verifyNotificationChannelsPage();

    iaCommon.openTab(iaCommon.tabNames.alerts);
    I.seeInCurrentUrl(`${iaCommon.url}/alerts`);
    await iaCommon.verifyTabIsActive(iaCommon.tabNames.alerts);
    iaCommon.checkBreadcrumbText(iaCommon.tabNames.alerts, iaCommon.elements.breadcrumbActive);
  },
);
