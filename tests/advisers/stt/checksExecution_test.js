const assert = require('assert');

const {
  settingsAPI, perconaServerDB, securityChecksAPI, databaseChecksPage,
} = inject();
const connection = perconaServerDB.defaultConnection;
const emptyPasswordSummary = 'User(s) has/have no password defined';
const intervals = settingsAPI.defaultCheckIntervals;
const psServiceName = 'stt-mysql-5.7.30';
const failedCheckRowLocator = databaseChecksPage.elements
  .failedCheckRowByServiceName(psServiceName);
let nodeId;
let serviceId;

const intervalsTests = new DataTable(['interval', 'intervalValue']);

// TODO: unskip after https://jira.percona.com/browse/PMM-8051
// intervalsTests.add(['frequent_interval', 'FREQUENT']);
intervalsTests.add(['standard_interval', 'STANDARD']);
// intervalsTests.add(['rare_interval', 'RARE']);

const cleanup = async () => {
  await settingsAPI.apiEnableSTT();
  await settingsAPI.setCheckIntervals();
  await securityChecksAPI.restoreDefaultIntervals();
  await perconaServerDB.dropUser();
  await securityChecksAPI.enableCheck(securityChecksAPI.checkNames.mysqlVersion);
  await securityChecksAPI.enableCheck(securityChecksAPI.checkNames.mysqlEmptyPassword);
};

const prepareFailedCheck = async () => {
  await securityChecksAPI.startSecurityChecks();

  // Check that there is MySQL user empty password failed check
  await securityChecksAPI.waitForFailedCheckExistance(emptyPasswordSummary, psServiceName);
};

Feature('Security Checks: Checks Execution');

BeforeSuite(async ({ perconaServerDB, addInstanceAPI }) => {
  const mysqlComposeConnection = {
    host: '127.0.0.1',
    port: connection.port,
    username: connection.username,
    password: connection.password,
  };

  [nodeId, serviceId] = await addInstanceAPI.addInstanceForSTT(connection, psServiceName);

  perconaServerDB.connectToPS(mysqlComposeConnection);
});

AfterSuite(async ({ perconaServerDB, inventoryAPI }) => {
  await perconaServerDB.disconnectFromPS();
  if (nodeId) await inventoryAPI.deleteNode(nodeId, true);
});

Before(async ({
  I, perconaServerDB,
}) => {
  await I.Authorize();
  await cleanup();
  await perconaServerDB.createUser();
});

After(async () => {
  await cleanup();
});

Scenario(
  'PMM-T384 Verify that the user does not see an alert again if it has been fixed [critical] @stt @not-ovf',
  async ({
    securityChecksAPI, databaseChecksPage, perconaServerDB,
  }) => {
    await prepareFailedCheck();
    await perconaServerDB.setUserPassword();

    // Run DB Checks from UI
    await databaseChecksPage.runDBChecks();

    await securityChecksAPI.waitForFailedCheckNonExistance(emptyPasswordSummary, psServiceName);
    // Verify there is no MySQL user empty password failed check
    databaseChecksPage.verifyFailedCheckNotExists(emptyPasswordSummary);
  },
);

Scenario(
  'PMM-T594 Verify failed checks appear after STT is enabled in Settings @stt @not-ovf',
  async ({
    I, databaseChecksPage, homePage, settingsAPI,
  }) => {
    await settingsAPI.changeSettings({ stt: false });
    await settingsAPI.changeSettings({ stt: true });

    // Wait for MySQL user empty password failed check
    await securityChecksAPI.waitForFailedCheckExistance(emptyPasswordSummary, psServiceName);
    I.amOnPage(homePage.url);
    I.waitForVisible(homePage.fields.checksPanelSelector, 30);
    I.dontSeeElement(homePage.fields.noFailedChecksInPanel);
    I.seeElement(homePage.fields.sttFailedChecksPanelSelector);

    I.amOnPage(databaseChecksPage.url);
    I.waitForVisible(failedCheckRowLocator, 30);
  },
);

Scenario(
  'PMM-T617 Verify user is able to silence failed check @stt @not-ovf',
  async ({
    I, databaseChecksPage,
  }) => {
    const failedCheckRowLocator = databaseChecksPage.elements
      .failedCheckRowBySummary(emptyPasswordSummary);

    await prepareFailedCheck();
    databaseChecksPage.openFailedChecksListForService(serviceId);

    // Silence mysql Empty Password failed check and verify it's not displayed
    I.waitForVisible(failedCheckRowLocator, 30);

    const oldColor = await I.grabCssPropertyFrom(
      locate(databaseChecksPage.elements.failedCheckRowBySummary(emptyPasswordSummary))
        .find('td'), 'background-color',
    );

    I.click(failedCheckRowLocator.find('$silence-button'));
    const newColor = await I.grabCssPropertyFrom(
      locate(databaseChecksPage.elements.failedCheckRowBySummary(emptyPasswordSummary))
        .find('td'), 'background-color',
    );

    assert.ok(oldColor !== newColor);
  },
);

Data(intervalsTests).Scenario(
  'PMM-T706 PMM-709 PMM-T711 Verify checks are executed based on interval value, change interval, fix problem [critical] @stt @not-ovf',
  async ({
    securityChecksAPI, settingsAPI, perconaServerDB, databaseChecksPage, current,
  }) => {
    await prepareFailedCheck();
    await perconaServerDB.setUserPassword();

    // TODO: uncomment after https://jira.percona.com/browse/PMM-8051
    // await securityChecksAPI.changeCheckInterval(
    //   securityChecksAPI.checkNames.mysqlEmptyPassword,
    //   current.intervalValue,
    // );

    await settingsAPI.setCheckIntervals({ ...intervals, [current.interval]: '3s' });

    await securityChecksAPI.waitForFailedCheckNonExistance(emptyPasswordSummary, psServiceName);

    // Verify there is no MySQL user empty password failed check
    databaseChecksPage.verifyFailedCheckNotExists(emptyPasswordSummary);
  },
);

Scenario.skip(
  'PMM-T757 Verify disabled checks do not execute based on interval value [critical] @stt @not-ovf',
  async ({
    securityChecksAPI, settingsAPI, databaseChecksPage,
  }) => {
    await prepareFailedCheck();
    await securityChecksAPI.disableCheck(securityChecksAPI.checkNames.mysqlEmptyPassword);
    await settingsAPI.setCheckIntervals({ ...intervals, standard_interval: '3s' });

    await securityChecksAPI.waitForFailedCheckNonExistance(emptyPasswordSummary, psServiceName);

    // Verify there is no MySQL user empty password failed check
    databaseChecksPage.verifyFailedCheckNotExists(emptyPasswordSummary);
  },
);
