const assert = require('assert');
const { SERVICE_TYPE } = require('../helper/constants');

Feature('PMM upgrade tests for advisors and alerting');

const { psMySql } = inject();

const ruleName = 'Alert Rule for upgrade';
const psServiceName = 'upgrade-stt-ps-5.7.30';
const connection = psMySql.defaultConnection;
const failedCheckMessage = 'Newer version of Percona Server for MySQL is available';

Scenario.skip(
  'Verify user has failed checks before upgrade @pre-advisors-alerting-upgrade',
  async ({
    I,
    settingsAPI,
    databaseChecksPage,
    advisorsAPI,
    addInstanceAPI,
    inventoryAPI,
  }) => {
    const failedCheckRowLocator = databaseChecksPage.elements
      .failedCheckRowByServiceName(psServiceName);
    const runChecks = locate('button')
      .withText('Run DB checks');

    await psMySql.dropUser();
    await psMySql.createUser();
    await settingsAPI.changeSettings({ stt: true });
    await addInstanceAPI.addInstanceForSTT(connection, psServiceName);

    await advisorsAPI.startSecurityChecks();
    // Waiting to have results
    I.wait(60);
    // disable check, change interval for a check, change interval settings
    await advisorsAPI.disableCheck('mongodb_version');
    await advisorsAPI.changeCheckInterval('postgresql_version');
    await settingsAPI.setCheckIntervals({
      ...settingsAPI.defaultCheckIntervals,
      standard_interval: '3600s',
    });
    I.amOnPage(databaseChecksPage.url);

    // I.waitForVisible(runChecks, 30);
    // I.waitForVisible(failedCheckRowLocator, 60);

    // Check that there are failed checks
    // await advisorsAPI.verifyFailedCheckExists(emptyPasswordSummary);
    // await advisorsAPI.verifyFailedCheckExists(failedCheckMessage);

    // Silence mysql Empty Password failed check
    // I.waitForVisible(failedCheckRowLocator, 30);

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MYSQL, psServiceName);
    const { alert_id } = (await advisorsAPI.getFailedChecks(service_id))
      .find(({ summary }) => summary === failedCheckMessage);

    await advisorsAPI.toggleChecksAlert(alert_id);
  },
);

Scenario(
  'PMM-T577 Verify user is able to see IA alerts before upgrade @pre-advisors-alerting-upgrade',
  async ({
    settingsAPI, rulesAPI, alertsAPI,
  }) => {
    await settingsAPI.changeSettings({ alerting: true });
    await rulesAPI.removeAllAlertRules(true);
    await rulesAPI.createAlertRule({ ruleName });
    // Wait for alert to appear
    await alertsAPI.waitForAlerts(60, 1);
  },
);

Scenario(
  'Verify check intervals remain the same after upgrade @post-advisors-alerting-upgrade',
  async ({
    I,
    advisorsPage,
  }) => {
    const checkName = 'PostgreSQL Version';

    I.amOnPage(advisorsPage.url);
    I.waitForVisible(advisorsPage.buttons.disableEnableCheck(checkName));
    I.seeTextEquals('Frequent', advisorsPage.elements.intervalCellByName(checkName));
  },
);

Scenario(
  'Verify disabled checks remain disabled after upgrade @post-advisors-alerting-upgrade',
  async ({
    I,
    advisorsPage,
  }) => {
    const checkName = 'MongoDB Version';

    I.amOnPage(advisorsPage.url);
    I.waitForVisible(advisorsPage.buttons.disableEnableCheck(checkName));
    I.seeTextEquals('Enable', advisorsPage.buttons.disableEnableCheck(checkName));
    I.seeTextEquals('Disabled', advisorsPage.elements.statusCellByName(checkName));
  },
);

Scenario(
  'PMM-T577 Verify user is able to see IA alerts before upgrade @post-advisors-alerting-upgrade',
  async ({
    settingsAPI, rulesAPI, alertsAPI,
  }) => {
    await settingsAPI.changeSettings({ alerting: true });
    await rulesAPI.removeAllAlertRules(true);
    await rulesAPI.createAlertRule({ ruleName });
    // Wait for alert to appear
    await alertsAPI.waitForAlerts(60, 1);
  },
);

Scenario(
  'Verify settings for intervals remain the same after upgrade @post-advisors-alerting-upgrade',
  async ({
    I,
    pmmSettingsPage,
  }) => {
    I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
    I.waitForVisible(pmmSettingsPage.fields.rareIntervalInput, 30);

    I.seeInField(pmmSettingsPage.fields.rareIntervalInput, '78');
    I.seeInField(pmmSettingsPage.fields.standartIntervalInput, '1');
    I.seeInField(pmmSettingsPage.fields.frequentIntervalInput, '4');
  },
);

Scenario(
  'PMM-T577 Verify user can see IA alerts after upgrade @post-advisors-alerting-upgrade',
  async ({
    I, alertsPage, alertsAPI,
  }) => {
    const alertName = 'PostgreSQL too many connections (pmm-server-postgresql)';

    // Verify Alert is present
    await alertsAPI.waitForAlerts(60, 1);
    const alerts = await alertsAPI.getAlertsList();

    assert.ok(alerts[0].summary === alertName, `Didn't find alert with name ${alertName}`);

    I.amOnPage(alertsPage.url);
    I.waitForElement(alertsPage.elements.alertRow(alertName), 30);
  },
);

Scenario(
  'PMM-T268 - Verify Failed check singlestats after upgrade from old versions @post-advisors-alerting-upgrade',
  async ({
    I, homePage,
  }) => {
    await homePage.open();
    I.dontSeeElement(homePage.fields.sttDisabledFailedChecksPanelSelector, 15);
    I.waitForVisible(homePage.fields.failedChecksPanelContent, 30);
  },
);

Scenario(
  'Verify silenced checks remain silenced after upgrade @post-advisors-alerting-upgrade',
  async ({
    I,
    databaseChecksPage, inventoryAPI, advisorsAPI,
  }) => {
    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MYSQL, psServiceName);

    await advisorsAPI.waitForFailedCheckExistance(failedCheckMessage, psServiceName);
    databaseChecksPage.openFailedChecksListForService(service_id);

    I.waitForVisible(databaseChecksPage.elements.failedCheckRowBySummary(failedCheckMessage), 30);
    I.seeAttributesOnElements(databaseChecksPage.buttons.toggleFailedCheckBySummary(failedCheckMessage), { title: 'Activate' });
  },
);

Scenario.skip(
  'Verify user has failed checks after upgrade / STT on @post-advisors-alerting-upgrade',
  async ({
    I,
    pmmSettingsPage,
    advisorsAPI,
    advisorsPage,
  }) => {
    // Wait for 45 seconds to have latest check results
    I.wait(45);
    // Verify STT is enabled
    I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
    I.waitForVisible(pmmSettingsPage.fields.sttSwitchSelector, 30);
    pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.sttSwitchSelectorInput, 'on');

    I.amOnPage(advisorsPage.url);
    I.waitForVisible(advisorsPage.buttons.startDBChecks, 30);
    // Verify there is failed check
    await advisorsAPI.verifyFailedCheckExists(failedCheckMessage);
  },
);
