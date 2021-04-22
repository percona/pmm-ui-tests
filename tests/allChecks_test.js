const assert = require('assert');

Feature('Security Checks: All Checks').retry(2);

Before(async ({ I, settingsAPI, securityChecksAPI }) => {
  await I.Authorize();
  await settingsAPI.apiEnableSTT();
  await securityChecksAPI.enableMySQLVersionCheck();
});

After(async ({ settingsAPI, securityChecksAPI }) => {
  await settingsAPI.apiEnableSTT();
  await securityChecksAPI.enableMySQLVersionCheck();
});

Scenario(
  'PMM-T469 PMM-T472 PMM-T654 Verify list of all checks [critical] @not-pr-pipeline',
  async ({
    I, allChecksPage,
  }) => {
    I.amOnPage(allChecksPage.url);

    I.waitForVisible(allChecksPage.elements.tableBody, 30);

    for (const {
      name, description, status, interval,
    } of allChecksPage.checks) {
      I.seeTextEquals(name, allChecksPage.elements.checkNameCell(name));
      I.seeTextEquals(description, allChecksPage.elements.descriptionCellByName(name));
      I.seeTextEquals(status, allChecksPage.elements.statusCellByName(name));
      I.seeTextEquals(interval, allChecksPage.elements.intervalCellByName(name));
    }
  },
);
Scenario(
  'PMM-T471 Verify reloading page on All Checks tab [minor] @not-pr-pipeline',
  async ({
    I, allChecksPage,
  }) => {
    I.amOnPage(allChecksPage.url);

    I.waitForVisible(allChecksPage.elements.tableBody, 30);
    I.seeInCurrentUrl(allChecksPage.url);

    I.refreshPage();

    I.waitForVisible(allChecksPage.elements.tableBody, 30);
    I.seeInCurrentUrl(allChecksPage.url);
    I.seeElement(allChecksPage.elements.checkNameCell(allChecksPage.checks[0].name));
  },
);

Scenario(
  'PMM-T585 Verify user is able enable/disable checks [critical] @not-pr-pipeline',
  async ({
    I, allChecksPage, securityChecksAPI, databaseChecksPage,
  }) => {
    const detailsText = 'Newer version of Percona Server for MySQL is available';
    const checkName = 'MySQL Version';

    await securityChecksAPI.startSecurityChecks();
    await securityChecksAPI.waitForSecurityChecksResults(30);

    // Check that there is failed MySQL Version check
    const failedCheckExists = await securityChecksAPI.getFailedCheckBySummary(detailsText);

    assert.ok(failedCheckExists, `Expected to have "${detailsText}" failed check`);

    // Disable MySQL Version check
    I.amOnPage(allChecksPage.url);
    I.waitForVisible(allChecksPage.buttons.disableEnableCheck(checkName));
    I.seeTextEquals('Disable', allChecksPage.buttons.disableEnableCheck(checkName));
    I.seeTextEquals('Enabled', allChecksPage.elements.statusCellByName(checkName));

    I.click(allChecksPage.buttons.disableEnableCheck(checkName));

    I.seeTextEquals('Enable', allChecksPage.buttons.disableEnableCheck(checkName));
    I.seeTextEquals('Disabled', allChecksPage.elements.statusCellByName(checkName));

    // Run DB Checks from UI
    I.amOnPage(databaseChecksPage.url);
    I.waitForVisible(databaseChecksPage.buttons.startDBChecks, 30);
    I.click(databaseChecksPage.buttons.startDBChecks);
    I.verifyPopUpMessage(databaseChecksPage.messages.securityChecksDone);

    // Verify there is no MySQL Version failed check
    const failedCheckDoesNotExist = await securityChecksAPI.getFailedCheckBySummary(detailsText);

    assert.ok(!failedCheckDoesNotExist, `Expected "${detailsText}" failed check to not be present`);
  },
);
