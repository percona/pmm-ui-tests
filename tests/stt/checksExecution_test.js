const { settingsAPI, perconaServerDB, securityChecksAPI } = inject();
const connection = perconaServerDB.defineConnection();
const emptyPasswordSummary = 'MySQL users have empty passwords';
const intervals = settingsAPI.defaultCheckIntervals;
let nodeID;

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

Feature('Security Checks: Checks Execution');

BeforeSuite(async ({ perconaServerDB, addInstanceAPI }) => {
  const mysqlComposeConnection = {
    host: '127.0.0.1',
    port: connection.port,
    username: connection.username,
    password: connection.password,
  };
  const instance = await addInstanceAPI.apiAddInstance(addInstanceAPI.instanceTypes.mysql, 'stt-mysql-5.7.30', connection);

  nodeID = instance.service.node_id;
  perconaServerDB.connectToPS(mysqlComposeConnection);
});

AfterSuite(async ({ perconaServerDB, inventoryAPI }) => {
  await perconaServerDB.disconnectFromPS();
  if (nodeID) await inventoryAPI.deleteNode(nodeID, true);
});

Before(async ({
  I, securityChecksAPI, perconaServerDB, databaseChecksPage,
}) => {
  await I.Authorize();
  await cleanup();
  await perconaServerDB.createUser();

  // Run DB Checks from UI
  databaseChecksPage.runDBChecks();

  // Check that there is MySQL user empty password failed check
  await securityChecksAPI.verifyFailedCheckExists(emptyPasswordSummary);
});

After(async () => {
  await cleanup();
});

Scenario(
  'PMM-T384 Verify that the user does not see an alert again if it has been fixed [critical] @stt',
  async ({
    securityChecksAPI, databaseChecksPage, perconaServerDB,
  }) => {
    await perconaServerDB.setUserPassword();

    // Run DB Checks from UI
    databaseChecksPage.runDBChecks();

    // Verify there is no MySQL user empty password failed check
    await securityChecksAPI.verifyFailedCheckNotExists(emptyPasswordSummary);
  },
);

Data(intervalsTests).Scenario(
  'PMM-T706 PMM-709 PMM-T711 Verify checks are executed based on interval value, change interval, fix problem [critical] @stt',
  async ({
    I, securityChecksAPI, settingsAPI, perconaServerDB, databaseChecksPage, current,
  }) => {
    await perconaServerDB.setUserPassword();

    // TODO: uncomment after https://jira.percona.com/browse/PMM-8051
    // await securityChecksAPI.changeCheckInterval(
    //   securityChecksAPI.checkNames.mysqlEmptyPassword,
    //   current.intervalValue,
    // );

    await settingsAPI.setCheckIntervals({ ...intervals, [current.interval]: '3s' });

    // Wait 30 seconds for Empty Password check execution
    I.wait(30);

    I.refreshPage();
    I.waitForVisible(databaseChecksPage.fields.dbCheckPanelSelector, 30);

    // Verify there is no MySQL user empty password failed check
    await securityChecksAPI.verifyFailedCheckNotExists(emptyPasswordSummary);
  },
);

Scenario(
  'PMM-T757 Verify disabled checks do not execute based on interval value [critical] @stt',
  async ({
    I, securityChecksAPI, settingsAPI, databaseChecksPage,
  }) => {
    await securityChecksAPI.disableCheck(securityChecksAPI.checkNames.mysqlEmptyPassword);
    await settingsAPI.setCheckIntervals({ ...intervals, standard_interval: '3s' });

    // Wait 20 seconds for Empty Password check execution
    I.wait(20);

    I.refreshPage();
    I.waitForVisible(databaseChecksPage.fields.dbCheckPanelSelector, 30);

    // Verify there is no MySQL user empty password failed check
    await securityChecksAPI.verifyFailedCheckNotExists(emptyPasswordSummary);
  },
);
