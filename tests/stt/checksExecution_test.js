const assert = require('assert');

const { codeceptjsConfig } = inject();
const url = new URL(codeceptjsConfig.config.helpers.Playwright.url);
const connection = {
  host: url.host,
  port: 43306,
  username: 'root',
  password: 'ps',
};
let nodeID;

Feature('Security Checks: Checks Execution').retry(2);

BeforeSuite(async ({ perconaServerDB, addInstanceAPI }) => {
  const instance = await addInstanceAPI.apiAddInstance(addInstanceAPI.instanceTypes.mysql, 'stt-mysql-5.7.30', connection);

  nodeID = instance.service.node_id;
  perconaServerDB.connectToPS(connection);
});

AfterSuite(async ({ perconaServerDB, inventoryAPI }) => {
  await perconaServerDB.disconnectFromPS();
  await inventoryAPI.deleteNode(nodeID, true);
});

Before(async ({
  I, settingsAPI, securityChecksAPI, perconaServerDB,
}) => {
  await I.Authorize();
  await settingsAPI.apiEnableSTT();
  await perconaServerDB.dropUser();
  await perconaServerDB.createUser();
  await securityChecksAPI.enableMySQLVersionCheck();
});

After(async ({ settingsAPI, securityChecksAPI, perconaServerDB }) => {
  await settingsAPI.apiEnableSTT();
  await perconaServerDB.dropUser();
  await securityChecksAPI.enableMySQLVersionCheck();
});

Scenario(
  'PMM-T384 Verify that the user does not see an alert again if it has been fixed [critical] @stt @not-pr-pipeline',
  async ({
    securityChecksAPI, databaseChecksPage, perconaServerDB,
  }) => {
    const detailsText = 'MySQL users have empty passwords';

    // Run DB Checks from UI
    databaseChecksPage.runDBChecks();

    // Check that there is MySQL user empty password failed check
    const failedCheckExists = await securityChecksAPI.getFailedCheckBySummary(detailsText);

    assert.ok(failedCheckExists, `Expected to have "${detailsText}" failed check.`);

    await perconaServerDB.setUserPassword();

    // Run DB Checks from UI
    databaseChecksPage.runDBChecks();

    // Verify there is no MySQL user empty password failed check
    const failedCheckDoesNotExist = await securityChecksAPI.getFailedCheckBySummary(detailsText);

    assert.ok(!failedCheckDoesNotExist, `Expected "${detailsText}" failed check to not be present`);
  },
);
