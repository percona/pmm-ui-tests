const assert = require('assert');

Feature('Security Checks: Checks Execution');

BeforeSuite(async ({ perconaServerDB }) => {
  perconaServerDB.connectToPS();
});

AfterSuite(async ({ perconaServerDB }) => {
  await perconaServerDB.disconnectFromPS();
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
    I, securityChecksAPI, databaseChecksPage, perconaServerDB, inventoryAPI,
  }) => {
    const detailsText = 'MySQL users have empty passwords';
    const users = await I.run('mysql', 'SELECT User from mysql.user');
    const services = await inventoryAPI.apiGetServices();

    // Run DB Checks from UI
    databaseChecksPage.runDBChecks();

    // Check that there is MySQL user empty password failed check
    const failedCheckExists = await securityChecksAPI.getFailedCheckBySummary(detailsText);

    assert.ok(failedCheckExists, `Expected to have "${detailsText}" failed check. Users are:
      ${JSON.stringify(users, null, 2)} 
      --- Services are: 
      ${JSON.stringify(services.data, null, 2)}
      --- Failed checks are:
      ${JSON.stringify(await securityChecksAPI.getSecurityChecksResults(), null, 2)}`);

    await perconaServerDB.setUserPassword();

    // Run DB Checks from UI
    databaseChecksPage.runDBChecks();

    // Verify there is no MySQL user empty password failed check
    const failedCheckDoesNotExist = await securityChecksAPI.getFailedCheckBySummary(detailsText);

    assert.ok(!failedCheckDoesNotExist, `Expected "${detailsText}" failed check to not be present`);
  },
);
