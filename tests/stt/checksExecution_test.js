const assert = require('assert');

Feature('Security Checks: Checks Execution').retry(2);

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
    I, securityChecksAPI, databaseChecksPage, perconaServerDB,
  }) => {
    const detailsText = 'MySQL users have empty passwords';

    await securityChecksAPI.startSecurityChecks();
    await securityChecksAPI.waitForSecurityChecksResults(30);

    // Check that there is MySQL user empty password failed check
    const failedCheckExists = await securityChecksAPI.getFailedCheckBySummary(detailsText);

    assert.ok(failedCheckExists, `Expected to have "${detailsText}" failed check`);

    await perconaServerDB.setUserPassword();

    // Run DB Checks from UI
    databaseChecksPage.runDBChecks();

    // Verify there is no MySQL user empty password failed check
    const failedCheckDoesNotExist = await securityChecksAPI.getFailedCheckBySummary(detailsText);

    assert.ok(!failedCheckDoesNotExist, `Expected "${detailsText}" failed check to not be present`);
  },
);
