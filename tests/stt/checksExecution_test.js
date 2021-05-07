const { settingsAPI, perconaServerDB } = inject();
const connection = perconaServerDB.defaultConnection;
const emptyPasswordSummary = 'MySQL users have empty passwords';
const intervals = settingsAPI.defaultCheckIntervals;
let nodeID;

const intervalsTests = new DataTable(['interval', 'intervalValue']);

// TODO: unskip after https://jira.percona.com/browse/PMM-8051
// intervalsTests.add(['frequent_interval', 'FREQUENT']);
// intervalsTests.add(['standard_interval', 'STANDARD']);
// intervalsTests.add(['rare_interval', 'RARE']);

Feature('Security Checks: Checks Execution');

BeforeSuite(async ({ perconaServerDB, addInstanceAPI }) => {
  const instance = await addInstanceAPI.apiAddInstance(addInstanceAPI.instanceTypes.mysql, 'stt-mysql-5.7.30', connection);

  nodeID = instance.service.node_id;
  perconaServerDB.connectToPS();
});

AfterSuite(async ({ perconaServerDB, inventoryAPI }) => {
  await perconaServerDB.disconnectFromPS();
  if (nodeID) await inventoryAPI.deleteNode(nodeID, true);
});

Before(async ({
  I, settingsAPI, securityChecksAPI, perconaServerDB, databaseChecksPage,
}) => {
  await I.Authorize();
  await settingsAPI.apiEnableSTT();
  await settingsAPI.setCheckIntervals();
  await securityChecksAPI.restoreDefaultIntervals();
  await perconaServerDB.dropUser();
  await perconaServerDB.createUser();
  await securityChecksAPI.enableCheck(securityChecksAPI.checkNames.mysqlVersion);

  // Run DB Checks from UI
  databaseChecksPage.runDBChecks();

  // Check that there is MySQL user empty password failed check
  await securityChecksAPI.verifyFailedCheckExists(emptyPasswordSummary);
});

After(async ({ settingsAPI, securityChecksAPI, perconaServerDB }) => {
  await settingsAPI.apiEnableSTT();
  await settingsAPI.setCheckIntervals();
  await securityChecksAPI.restoreDefaultIntervals();
  await perconaServerDB.dropUser();
  await securityChecksAPI.enableCheck(securityChecksAPI.checkNames.mysqlVersion);
  await securityChecksAPI.enableCheck(securityChecksAPI.checkNames.mysqlEmptyPassword);
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
  'PMM-T706 Verify checks are executed based on interval value [critical] @stt',
  async ({
    I, securityChecksAPI, settingsAPI, perconaServerDB, current,
  }) => {
    await perconaServerDB.setUserPassword();

    await securityChecksAPI.changeCheckInterval(
      securityChecksAPI.checkNames.mysqlEmptyPassword,
      current.intervalValue,
    );
    await settingsAPI.setCheckIntervals({ ...intervals, [current.interval]: '5s' });

    // Wait 10 seconds for Empty Password check execution
    I.wait(10);

    I.refreshPage();

    // Verify there is no MySQL user empty password failed check
    await securityChecksAPI.verifyFailedCheckNotExists(emptyPasswordSummary);
  },
);

Scenario(
  'PMM-T757 Verify disabled checks do not execute based on interval value [critical] @stt',
  async ({
    I, securityChecksAPI, settingsAPI, perconaServerDB,
  }) => {
    await perconaServerDB.setUserPassword();

    await securityChecksAPI.disableCheck(securityChecksAPI.checkNames.mysqlEmptyPassword);

    await settingsAPI.setCheckIntervals({ ...intervals, standard_interval: '5s' });

    // Wait 10 seconds for Empty Password check execution
    I.wait(10);

    I.refreshPage();

    // Verify there is no MySQL user empty password failed check
    await securityChecksAPI.verifyFailedCheckNotExists(emptyPasswordSummary);
  },
);
