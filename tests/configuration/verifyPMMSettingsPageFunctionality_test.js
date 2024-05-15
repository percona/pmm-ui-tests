const assert = require('assert');

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

Scenario.skip(
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

Scenario.skip(
  'PMM-T254 PMM-T253 Verify disable telemetry while Advisors enabled @settings @stt @grafana-pr',
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

Scenario(
  'PMM-T532 PMM-T533 PMM-T536 - Verify user can disable/enable IA in Settings @ia @settings',
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
  },
).retry(2);

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
    I.waitForVisible(pmmSettingsPage.fields.backupManagementSwitchInput, 20);
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
  '@PMM-T1658 Verify that backup management is enabled by default @backup @bm-fb',
  async ({
    I, pmmSettingsPage, settingsAPI, homePage, leftNavMenu,
  }) => {
    const pmmVersion = await homePage.getVersions().versionMinor;

    const settingEndpointResponse = await settingsAPI.getSettings('backup_management_enabled');

    if (pmmVersion >= 36 || pmmVersion === undefined) {
      I.amOnPage(homePage.url);
      I.waitForVisible(leftNavMenu.backups.locator, 30);
      I.assertEqual(settingEndpointResponse, true);
      I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
      I.waitForVisible(pmmSettingsPage.fields.backupManagementSwitch, 30);
      await pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.backupManagementSwitchInput, 'on');
      assert.ok(settingEndpointResponse, `Backup managment should be turned on by default from 2.36.0 release but found ${settingEndpointResponse}`);
    } else {
      I.say('Skipping this test PMM-T1658, because PMM Server version is lower then Feature fix version');
    }
  },
).retry(2);

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

    I.assertEqual(
      publicAddressAfterRefresh,
      publicAddressValue,
      `Expected the Public Address to be saved and Match ${publicAddressValue}`,
    );
  },
).retry(1);

Scenario(
  'PMM-T254 ensure Advisors are on by default @instances',
  async ({ settingsAPI }) => {
    const resp = await settingsAPI.getSettings('stt_enabled');

    assert.ok(resp, `Advisors should be turned on by default from 2.28.0 release but found ${resp}`);
  },
);

Scenario(
  '@PMM-T1227 @PMM-T1338 - Verify tooltip "Read more" links on PMM Settings page redirect to working pages '
  + 'Verify that all the metrics from config are displayed on Telemetry tooltip in Settings > Advanced @settings',
  async ({ I, pmmSettingsPage, settingsAPI }) => {
    await settingsAPI.changeSettings({ alerting: true });

    const subPageTooltips = await pmmSettingsPage.getSubpageTooltips();

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
  pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.perconaAlertingSwitchInput, 'on');
  await pmmSettingsPage.verifyTooltip(pmmSettingsPage.tooltips.advancedSettings.perconaAlerting);
});

// unskip after SAAS-1437 is done and 500 error is fixed
Scenario.skip(
  'PMM-T1328 Verify public address is set automatically on Percona Platform page once connected to Portal @nightly',
  async ({
    I, pmmSettingsPage, portalAPI, perconaPlatformPage, settingsAPI,
  }) => {
    await settingsAPI.changeSettings({ publicAddress: '' });

    const serverAddressIP = process.env.VM_IP;
    const newAdminUser = await portalAPI.getUser();

    await portalAPI.oktaCreateUser(newAdminUser);
    const platformToken = await portalAPI.getUserAccessToken(newAdminUser.email, newAdminUser.password);

    await portalAPI.apiCreateOrg(platformToken);
    await perconaPlatformPage.openPerconaPlatform();
    await perconaPlatformPage.connectToPortal(platformToken, `Test Server ${Date.now()}`, true);
    await pmmSettingsPage.openAdvancedSettings();

    await pmmSettingsPage.verifyTooltip(pmmSettingsPage.tooltips.advancedSettings.publicAddress);

    await I.waitForVisible(pmmSettingsPage.fields.publicAddressInput, 30);
    I.seeElement(pmmSettingsPage.fields.publicAddressButton);
    const publicAddressValue = await I.grabValueFrom(pmmSettingsPage.fields.publicAddressInput);

    I.assertTrue(publicAddressValue.length > 0, 'Expected the Public Address Input Field to be not empty!');
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();

    await I.assertEqual(
      serverAddressIP,
      publicAddressValue,
      `Expected the Public Address to be saved and Match ${publicAddressValue}`,
    );
  },
).retry(1);
