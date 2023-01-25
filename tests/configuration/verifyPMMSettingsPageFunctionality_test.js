const { pmmSettingsPage } = inject();
const communicationDefaults = new DataTable(['type', 'serverAddress', 'hello', 'from', 'authType', 'username', 'password', 'url', 'message']);
const assert = require('assert');

// pmmSettingsPage.communicationData.forEach(({
//   type, serverAddress, hello, from, authType, username, password, url,
// }) => {
//   // eslint-disable-next-line max-len
// eslint-disable-next-line max-len
//   communicationDefaults.add([type, serverAddress, hello, from, authType, username, password, url, pmmSettingsPage.messages.successPopUpMessage]);
// });

// communicationDefaults.add([
//   pmmSettingsPage.emailDefaults.type,
//   'test.com',
//   pmmSettingsPage.emailDefaults.hello,
//   pmmSettingsPage.emailDefaults.from,
//   pmmSettingsPage.emailDefaults.authType,
//   null,
//   null,
//   null,
//   'Invalid argument: invalid server address, expected format host:port']);
// communicationDefaults.add([
//   pmmSettingsPage.emailDefaults.type,
//   pmmSettingsPage.emailDefaults.serverAddress,
//   '%',
//   pmmSettingsPage.emailDefaults.from,
//   pmmSettingsPage.emailDefaults.authType,
//   null,
//   null,
//   null,
//   'Invalid argument: invalid hello field, expected valid host']);
// communicationDefaults.add([
//   'slack',
//   null,
//   null,
//   null,
//   null,
//   null,
//   null,
//   'invalid@url',
//   'Invalid argument: invalid url value']);

Feature('PMM Settings Functionality').retry(1);

Before(async ({ I, settingsAPI }) => {
  await I.Authorize();
  await settingsAPI.restoreSettingsDefaults();
});

Scenario('PMM-T93 - Open PMM Settings page and verify changing Metrics Resolution [critical] @settings @grafana-pr', async ({
  I,
  pmmSettingsPage,
}) => {
  const resolutionToApply = 'Rare';

  I.amOnPage(pmmSettingsPage.url);
  await pmmSettingsPage.waitForPmmSettingsPageLoaded();
  await pmmSettingsPage.selectMetricsResolution(resolutionToApply);
  I.verifyPopUpMessage(pmmSettingsPage.messages.successPopUpMessage);
  I.refreshPage();
  await pmmSettingsPage.waitForPmmSettingsPageLoaded();
  await pmmSettingsPage.verifySelectedResolution(resolutionToApply);
});

Scenario('PMM-T94 - Open PMM Settings page and verify changing Data Retention [critical] @settings', async ({
  I,
  pmmSettingsPage,
}) => {
  const dataRetentionValue = '1';
  const sectionNameToExpand = pmmSettingsPage.sectionTabsList.advanced;

  I.amOnPage(pmmSettingsPage.url);
  await pmmSettingsPage.waitForPmmSettingsPageLoaded();
  await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.advancedButton);
  await pmmSettingsPage.waitForPmmSettingsPageLoaded();
  pmmSettingsPage.changeDataRetentionValueTo(dataRetentionValue);
  I.verifyPopUpMessage(pmmSettingsPage.messages.successPopUpMessage);
  I.refreshPage();
  await pmmSettingsPage.waitForPmmSettingsPageLoaded();
  await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.advancedButton);
  await pmmSettingsPage.waitForPmmSettingsPageLoaded();
  I.waitForValue(pmmSettingsPage.fields.dataRetentionInput, dataRetentionValue, 30);
});

// TODO: check ovf failure
Scenario(
  'PMM-T108 - Open PMM Settings page and verify adding Alertmanager Rule [critical] PMM-T109 - Verify adding and clearing Alertmanager rules @not-ovf @settings',
  async ({ I, pmmSettingsPage }) => {
    const scheme = 'http://';
    const sectionNameToExpand = pmmSettingsPage.sectionTabsList.alertmanager;

    I.amOnPage(pmmSettingsPage.url);
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.alertmanagerButton);
    pmmSettingsPage.addAlertmanagerRule(
      scheme + pmmSettingsPage.alertManager.ip + pmmSettingsPage.alertManager.service,
      pmmSettingsPage.alertManager.editRule.replace('{{ sec }}', Math.floor(Math.random() * 10) + 1),
    );
    I.verifyPopUpMessage(pmmSettingsPage.messages.successPopUpMessage);
    pmmSettingsPage.openAlertsManagerUi();
    await pmmSettingsPage.verifyAlertmanagerRuleAdded(pmmSettingsPage.alertManager.editRuleName);
    // PMM-T109 starting here
    I.amOnPage(pmmSettingsPage.url);
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.alertmanagerButton);
    pmmSettingsPage.addAlertmanagerRule('', '');
    I.wait(5);
    pmmSettingsPage.openAlertsManagerUi();
    I.dontSeeElement(`//pre[contains(text(), '${pmmSettingsPage.alertManager.editRuleName}')]`);
  },
);

Scenario(
  'PMM-T253 Verify user can see correct tooltip for STT [trivial] @settings @stt @grafana-pr',
  async ({ I, pmmSettingsPage }) => {
    const sectionNameToExpand = pmmSettingsPage.sectionTabsList.advanced;

    I.amOnPage(pmmSettingsPage.url);
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.advancedButton);
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();

    await pmmSettingsPage.verifyTooltip(pmmSettingsPage.tooltips.advancedSettings.stt);
  },
);

Scenario(
  'PMM-T782 PMM-T783 Verify DBaaS is disabled by default, Verify DBaaS can be enabled in PMM Settings @settings @settings-fb',
  async ({ I, pmmSettingsPage, dbaasPage }) => {
    I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();

    // Verify tooltip for Enable/Disable DBaaS toggle
    await pmmSettingsPage.verifyTooltip(pmmSettingsPage.tooltips.advancedSettings.dbaas);

    let selector = await I.grabAttributeFrom(pmmSettingsPage.fields.dbaasSwitchSelector, 'checked');

    if (selector) {
      assert.ok(selector === false, 'Dbaas Should be disabled by Default, toggle should be disabled');
    }

    I.dontSeeElement(pmmSettingsPage.fields.dbaasMenuIconLocator);
    // FIXME: skip until https://jira.percona.com/browse/PMM-11221 is fixed
    // I.amOnPage(dbaasPage.url);
    // I.waitForElement(dbaasPage.disabledDbaaSMessage.settingsLinkLocator, 30);
    // const message = (await I.grabTextFrom(dbaasPage.disabledDbaaSMessage.emptyBlock)).replace(/\s+/g, ' ');

    // assert.ok(message === dbaasPage.disabledDbaaSMessage.textMessage,
    //   `Message Shown on ${message} should be equal to ${dbaasPage.disabledDbaaSMessage.textMessage}`);
    // const link = await I.grabAttributeFrom(dbaasPage.disabledDbaaSMessage.settingsLinkLocator, 'href');

    // assert.ok(link.includes('/graph/settings/advanced-settings'),
    //   `Advanced Setting Link displayed on DbaaS Page, when DbaaS is not enabled ${link}, please check the link`);
    // Enable DbaaS via Advanced Settings, Make sure Menu is visible.
    // await pmmSettingsPage.openAdvancedSettings();
    I.waitForVisible(pmmSettingsPage.tooltips.advancedSettings.dbaas.iconLocator, 30);
    I.click(pmmSettingsPage.fields.dbaasSwitchSelector);
    I.click(pmmSettingsPage.fields.applyButton);
    I.waitForElement(pmmSettingsPage.fields.dbaasMenuIconLocator, 30);
    I.seeElement(pmmSettingsPage.fields.dbaasMenuIconLocator);
    I.waitForElement(pmmSettingsPage.fields.dbaasSwitchSelector, 60);
    selector = await I.grabAttributeFrom(pmmSettingsPage.fields.dbaasSwitchSelectorInput, 'checked');
    assert.ok(selector === true, 'Dbaas Should be enabled, toggle should be checked now');
    I.amOnPage(dbaasPage.url);
    I.waitForElement(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButton, 50);
    I.seeElement(dbaasPage.tabs.kubernetesClusterTab.addKubernetesClusterButton);
  },
);

Scenario(
  'PMM-T254 PMM-T253 Verify disable telemetry while Advisers enabled @settings @stt @grafana-pr',
  async ({ I, pmmSettingsPage }) => {
    I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.telemetrySwitchSelectorInput, 'on');
    pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.sttSwitchSelectorInput, 'on');
    I.click(pmmSettingsPage.fields.telemetrySwitchSelector);
    pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.telemetrySwitchSelectorInput, 'off');
    I.click(pmmSettingsPage.fields.advancedButton);
    I.refreshPage();
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.sttSwitchSelectorInput, 'on');
    pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.telemetrySwitchSelectorInput, 'off');
  },
).retry(2);

Scenario('PMM-T520 - Verify that alert is in Firing State - internal alert manager @nightly @not-ovf', async ({
  I,
  pmmSettingsPage,
}) => {
  const scheme = 'http://127.0.0.1';
  const sectionNameToExpand = pmmSettingsPage.sectionTabsList.alertmanager;

  I.amOnPage(pmmSettingsPage.url);
  await pmmSettingsPage.waitForPmmSettingsPageLoaded();
  await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.alertmanagerButton);
  pmmSettingsPage.addAlertmanagerRule(
    scheme + pmmSettingsPage.alertManager.service,
    pmmSettingsPage.alertManager.rule2,
  );
  I.verifyPopUpMessage(pmmSettingsPage.messages.successPopUpMessage);
  pmmSettingsPage.openAlertsManagerUi();
  await pmmSettingsPage.verifyAlertmanagerRuleAdded(pmmSettingsPage.alertManager.ruleName2);
  I.amOnPage(pmmSettingsPage.stateOfAlertsUrl);
  await pmmSettingsPage.verifyAlertmanagerRuleAdded(pmmSettingsPage.alertManager.ruleName2, true);
});

Scenario('PMM-T520 - Verify that alert is being fired to external Alert Manager @nightly @not-ovf', async ({
  I,
  pmmSettingsPage,
}) => {
  const scheme = 'http://';
  const sectionNameToExpand = pmmSettingsPage.sectionTabsList.alertmanager;

  I.amOnPage(pmmSettingsPage.url);
  await pmmSettingsPage.waitForPmmSettingsPageLoaded();
  await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.alertmanagerButton);
  pmmSettingsPage.addAlertmanagerRule(
    scheme + pmmSettingsPage.alertManager.ip + pmmSettingsPage.alertManager.externalAlertManagerPort,
    pmmSettingsPage.alertManager.rule,
  );
  I.verifyPopUpMessage(pmmSettingsPage.messages.successPopUpMessage);
  pmmSettingsPage.openAlertsManagerUi();
  await pmmSettingsPage.verifyAlertmanagerRuleAdded(pmmSettingsPage.alertManager.ruleName);
  I.amOnPage(pmmSettingsPage.stateOfAlertsUrl);
  await pmmSettingsPage.verifyAlertmanagerRuleAdded(pmmSettingsPage.alertManager.ruleName, true);
  await pmmSettingsPage.verifyExternalAlertManager(pmmSettingsPage.alertManager.ruleName);
});

Scenario('PMM-T532 PMM-T533 PMM-T536 - Verify user can disable/enable IA in Settings @ia @settings',
  async ({
    I, pmmSettingsPage, settingsAPI, adminPage,
  }) => {
    await settingsAPI.apiEnableIA();
    I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
    I.waitForVisible(pmmSettingsPage.fields.perconaAlertingSwitch, 30);
    I.click(pmmSettingsPage.fields.perconaAlertingSwitch);
    I.dontSeeElement(pmmSettingsPage.communication.communicationSection);
    pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.perconaAlertingSwitchInput, 'off');
    I.click(pmmSettingsPage.fields.advancedButton);
    I.waitForVisible(pmmSettingsPage.fields.perconaAlertingSwitchInput, 30);
    pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.perconaAlertingSwitchInput, 'off');
    // I.moveCursorTo(adminPage.sideMenu.alertingBellIcon);
    // I.waitForVisible(adminPage.sideMenu.integratedAlertingManuItem, 20);
    // I.seeTextEquals('Integrated Alerting', adminPage.sideMenu.integratedAlerting);
    // I.seeTextEquals('Communication', pmmSettingsPage.communication.communicationSection);
    I.click(pmmSettingsPage.fields.perconaAlertingSwitch);
    pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.perconaAlertingSwitchInput, 'on');
    I.click(pmmSettingsPage.fields.advancedButton);
    I.waitForVisible(pmmSettingsPage.fields.perconaAlertingSwitch, 30);
    pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.perconaAlertingSwitchInput, 'on');
    I.dontSeeElementInDOM(adminPage.sideMenu.integratedAlerting);
    I.dontSeeElement(pmmSettingsPage.communication.communicationSection);
  }).retry(2);

Scenario('PMM-T785 - Verify DBaaS cannot be disabled with ENABLE_DBAAS or PERCONA_TEST_DBAAS @dbaas',
  async ({ I, pmmSettingsPage }) => {
    I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    I.waitForVisible(pmmSettingsPage.fields.dbaasSwitchSelector, 30);
    pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.dbaasSwitchSelectorInput, 'on');
    I.click(pmmSettingsPage.fields.dbaasSwitchSelector);
    pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.dbaasSwitchSelectorInput, 'off');
    I.click(pmmSettingsPage.fields.advancedButton);
    // skipped until PMM-9982 is fixed
    // pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.dbaasSwitchSelectorInput, 'on');
    I.verifyPopUpMessage(pmmSettingsPage.messages.invalidDBaaSDisableMessage);
  });

Data(communicationDefaults).Scenario('PMM-T534 PMM-T535 PMM-T1074 - Verify user is able to set up default Email/Slack communication settings / validation @ia @settings @grafana-pr',
  async ({
    I, pmmSettingsPage, settingsAPI, current,
  }) => {
    await settingsAPI.apiEnableIA();
    I.amOnPage(pmmSettingsPage.communicationSettingsUrl);
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    pmmSettingsPage.fillCommunicationFields(current);
    I.verifyPopUpMessage(current.message);
    if (current === pmmSettingsPage.messages.successPopUpMessage) {
      I.refreshPage();
      await pmmSettingsPage.waitForPmmSettingsPageLoaded();
      await pmmSettingsPage.verifyCommunicationFields(current);
    }
  });

Scenario(
  'PMM-T747 - Verify enabling Azure flag @instances',
  async ({
    I, pmmSettingsPage, remoteInstancesPage, settingsAPI,
  }) => {
    const sectionNameToExpand = pmmSettingsPage.sectionTabsList.advanced;

    I.amOnPage(pmmSettingsPage.url);
    await settingsAPI.disableAzure();
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.advancedButton);
    pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.microsoftAzureMonitoringSwitchInput, 'off');
    I.amOnPage(remoteInstancesPage.url);
    I.waitForInvisible(remoteInstancesPage.fields.addAzureMySQLPostgreSQL, 30);
    I.amOnPage(pmmSettingsPage.url);
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.advancedButton);
    pmmSettingsPage.switchAzure();
    I.amOnPage(remoteInstancesPage.url);
    I.waitForVisible(remoteInstancesPage.fields.addAzureMySQLPostgreSQL, 30);
    I.amOnPage(pmmSettingsPage.url);
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.advancedButton);
    pmmSettingsPage.switchAzure();
    I.amOnPage(remoteInstancesPage.url);
    I.waitForInvisible(remoteInstancesPage.fields.addAzureMySQLPostgreSQL, 30);
  },
);

Scenario(
  'PMM-T841 - Verify user is able to enable Backup Management @backup',
  async ({
    I, pmmSettingsPage, scheduledPage, settingsAPI, codeceptjsConfig,
  }) => {
    await settingsAPI.changeSettings({ backup: false });

    // Open advanced settings and verify backup management switch is off
    I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
    pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.backupManagementSwitchInput, 'off');

    // Open scheduled backups page and verify message about disabled backup management
    I.amOnPage(scheduledPage.url);
    I.waitForVisible('$empty-block', 20);

    const message = await I.grabTextFrom('$empty-block');

    assert.ok(
      message.replace(/\s+/g, ' ') === pmmSettingsPage.messages.disabledBackupManagement,
      `Message Shown on ${message} should be equal to ${pmmSettingsPage.messages.disabledBackupManagement}`,
    );
    I.seeAttributesOnElements('$settings-link', { href: `${codeceptjsConfig.config.helpers.Playwright.url}graph/settings/advanced-settings` });

    // Open advanced settings and enable backup management
    I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
    I.waitForVisible(pmmSettingsPage.fields.backupManagementSwitch, 30);
    I.click(pmmSettingsPage.fields.backupManagementSwitch);
    pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.backupManagementSwitchInput, 'on');
    I.click(pmmSettingsPage.fields.advancedButton);

    // Open scheduled backups page and verify backup management is enabled
    scheduledPage.openScheduledBackupsPage();
  },
);

Scenario(
  'PMM-T486 - Verify Public Address in PMM Settings @settings @nightly',
  async ({ I, pmmSettingsPage, settingsAPI }) => {
    await settingsAPI.changeSettings({ publicAddress: '' });
    await pmmSettingsPage.openAdvancedSettings();
    await pmmSettingsPage.verifyTooltip(pmmSettingsPage.tooltips.advancedSettings.publicAddress);

    await I.waitForVisible(pmmSettingsPage.fields.publicAddressInput, 30);
    I.seeElement(pmmSettingsPage.fields.publicAddressButton);
    I.click(pmmSettingsPage.fields.publicAddressButton);
    const publicAddressValue = await I.grabValueFrom(pmmSettingsPage.fields.publicAddressInput);

    I.assertTrue(publicAddressValue.length > 0, 'Expected the Public Address Input Field to be not empty!');
    pmmSettingsPage.applyChanges();
    I.refreshPage();
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    const publicAddressAfterRefresh = await I.grabValueFrom(pmmSettingsPage.fields.publicAddressInput);

    I.assertEqual(publicAddressAfterRefresh, publicAddressValue,
      `Expected the Public Address to be saved and Match ${publicAddressValue}`);
  },
);

Scenario(
  'PMM-T254 ensure Advisors are on by default @instances',
  async ({ settingsAPI }) => {
    const resp = await settingsAPI.getSettings('stt_enabled');

    assert.ok(resp, `Advisors should be turned on by default from 2.28.0 release but found ${resp}`);
  },
);

Scenario(
  '@PMM-T1227 - Verify tooltip "Read more" links on PMM Settings page redirect to working pages '
    + '@PMM-T1338 Verify that all the metrics from config are displayed on Telemetry tooltip in Settings > Advanced @settings',
  async ({ I, pmmSettingsPage, settingsAPI }) => {
    await settingsAPI.changeSettings({ alerting: true });
    const subPageTooltips = [
      {
        subPage: pmmSettingsPage.metricsResolutionUrl,
        tooltips: pmmSettingsPage.tooltips.metricsResolution,
      },
      {
        subPage: pmmSettingsPage.advancedSettingsUrl,
        tooltips: pmmSettingsPage.tooltips.advancedSettings,
      },
      {
        subPage: pmmSettingsPage.sshKeyUrl,
        tooltips: pmmSettingsPage.tooltips.ssh,
      },
      {
        subPage: pmmSettingsPage.alertManagerIntegrationUrl,
        tooltips: pmmSettingsPage.tooltips.alertManagerIntegration,
      },
      {
        subPage: pmmSettingsPage.perconaPlatformUrl,
        tooltips: pmmSettingsPage.tooltips.perconaPlatform,
      },
    ];

    for (const subPageTooltipObject of Object.values(subPageTooltips)) {
      I.amOnPage(subPageTooltipObject.subPage);

      for (const tooltipObject of Object.values(subPageTooltipObject.tooltips)) {
        if (tooltipObject.tabButton) {
          I.click(tooltipObject.tabButton);
        }

        await pmmSettingsPage.verifyTooltip(tooltipObject);
      }
    }
  },
);

Scenario('PMM-T1401 Verify Percona Alerting wording in Settings @max-length @settings', async ({
  I,
  pmmSettingsPage,
}) => {
  I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
  await pmmSettingsPage.waitForPmmSettingsPageLoaded();
  pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.perconaAlertingSwitch, 'on');
  await pmmSettingsPage.verifyTooltip(pmmSettingsPage.tooltips.advancedSettings.perconaAlerting);
});
