const {
  settingsAPI, allChecksPage,
} = inject();

const changeIntervalTests = new DataTable(['checkName', 'interval']);

Object.values(allChecksPage.checks).forEach(({ name }) => {
  changeIntervalTests.add([name, 'Rare']);
});

Feature('Security Checks: All Checks').retry(2);

Before(async ({ I, settingsAPI, securityChecksAPI }) => {
  await I.Authorize();
  await settingsAPI.apiEnableSTT();
  await securityChecksAPI.enableCheck(securityChecksAPI.checkNames.mysqlVersion);
});

After(async ({ settingsAPI, securityChecksAPI }) => {
  await settingsAPI.apiEnableSTT();
  await securityChecksAPI.enableCheck(securityChecksAPI.checkNames.mysqlVersion);
});

Scenario(
  'PMM-T469 PMM-T472 PMM-T654 Verify list of all checks [critical] @stt',
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

      // Verify there are no duplicates
      I.seeNumberOfVisibleElements(allChecksPage.elements.checkNameCell(name), 1);
    }
  },
);

Scenario(
  'PMM-T471 Verify reloading page on All Checks tab [minor] @stt',
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
  'PMM-T585 Verify user is able enable/disable checks [critical] @stt',
  async ({
    I, allChecksPage, securityChecksAPI, databaseChecksPage,
  }) => {
    const detailsText = 'Newer version of Percona Server for MySQL is available';
    const checkName = 'MySQL Version';

    // Run DB Checks from UI
    databaseChecksPage.runDBChecks();

    // Check that there is MySQL version failed check
    await securityChecksAPI.verifyFailedCheckExists(detailsText);

    // Disable MySQL Version check
    I.amOnPage(allChecksPage.url);
    I.waitForVisible(allChecksPage.buttons.disableEnableCheck(checkName));
    I.seeTextEquals('Disable', allChecksPage.buttons.disableEnableCheck(checkName));
    I.seeTextEquals('Enabled', allChecksPage.elements.statusCellByName(checkName));

    I.click(allChecksPage.buttons.disableEnableCheck(checkName));

    I.seeTextEquals('Enable', allChecksPage.buttons.disableEnableCheck(checkName));
    I.seeTextEquals('Disabled', allChecksPage.elements.statusCellByName(checkName));

    // Run DB Checks from UI
    databaseChecksPage.runDBChecks();

    // Verify there is no MySQL Version failed check
    await securityChecksAPI.verifyFailedCheckNotExists(detailsText);
  },
);

Data(changeIntervalTests).Scenario(
  'PMM-T723 Verify user can change check intervals for every check @stt',
  async ({
    I, allChecksPage, securityChecksAPI, current,
  }) => {
    await securityChecksAPI.restoreDefaultIntervals();
    I.amOnPage(allChecksPage.url);

    I.waitForVisible(allChecksPage.elements.tableBody, 30);
    I.seeInCurrentUrl(allChecksPage.url);

    I.click(allChecksPage.buttons.openChangeInterval(current.checkName));
    I.waitForVisible(allChecksPage.elements.modalContent, 10);
    I.seeTextEquals(
      allChecksPage.messages.changeIntervalText(current.checkName),
      locate(allChecksPage.elements.modalContent).find('h4'),
    );
    I.click(allChecksPage.buttons.intervalValue(current.interval));

    I.click(allChecksPage.buttons.applyIntervalChange);

    I.verifyPopUpMessage(allChecksPage.messages.successIntervalChange(current.checkName));
    I.seeTextEquals(current.interval, allChecksPage.elements.intervalCellByName(current.checkName));

    await securityChecksAPI.restoreDefaultIntervals();
  },
);
