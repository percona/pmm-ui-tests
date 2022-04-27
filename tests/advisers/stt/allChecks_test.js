const assert = require('assert');

const { perconaServerDB } = inject();

const connection = perconaServerDB.defaultConnection;
const psServiceName = 'allChecks-ps-5.7.30';
let nodeId;
let serviceId;

Feature('Security Checks: All Checks');

BeforeSuite(async ({ addInstanceAPI }) => {
  [nodeId, serviceId] = await addInstanceAPI.addInstanceForSTT(connection, psServiceName);
});
AfterSuite(async ({ inventoryAPI }) => {
  if (nodeId) await inventoryAPI.deleteNode(nodeId, true);
});

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
    const checkNameCell = locate('td').at(1);

    I.amOnPage(allChecksPage.url);

    I.waitForVisible(allChecksPage.elements.tableBody, 30);

    const checkNames = await I.grabTextFromAll(checkNameCell);

    assert.ok(!checkNames.find((el) => el === ''), 'Expected to not have empty check names.');
    const checkDescriptions = await I.grabTextFromAll(locate('td').at(2));

    assert.ok(!checkDescriptions.find((el) => el === ''), 'Expected to not have empty check descriptions.');

    assert.ok(checkNames.length === [...new Set(checkNames)].length, 'Expected to not have duplicate checks in All Checks list.');
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
    const detailsText = process.env.OVF_TEST === 'yes'
      ? 'Newer version of MySQL is available'
      : 'Newer version of Percona Server for MySQL is available';
    const checkName = 'MySQL Version';

    I.amOnPage(allChecksPage.url);
    // Run DB Checks from UI
    await allChecksPage.runDBChecks();

    // Wait for MySQL version failed check
    await securityChecksAPI.waitForFailedCheckExistance(detailsText, psServiceName);

    // Verify failed check on UI
    databaseChecksPage.verifyFailedCheckExists(detailsText, serviceId);

    // Disable MySQL Version check
    I.waitForVisible(allChecksPage.buttons.disableEnableCheck(checkName));
    I.seeTextEquals('Disable', allChecksPage.buttons.disableEnableCheck(checkName));
    I.seeTextEquals('Enabled', allChecksPage.elements.statusCellByName(checkName));

    I.click(allChecksPage.buttons.disableEnableCheck(checkName));

    I.seeTextEquals('Enable', allChecksPage.buttons.disableEnableCheck(checkName));
    I.seeTextEquals('Disabled', allChecksPage.elements.statusCellByName(checkName));

    // Run DB Checks from UI
    await allChecksPage.runDBChecks();
    await securityChecksAPI.waitForFailedCheckNonExistance(detailsText, psServiceName);

    // Verify there is no MySQL Version failed check
    // databaseChecksPage.verifyFailedCheckNotExists(detailsText, serviceId);
  },
);

Scenario(
  'PMM-T723 Verify user can change check interval @stt',
  async ({
    I, allChecksPage, securityChecksAPI,
  }) => {
    const checkName = 'MySQL Version';
    const interval = 'Rare';

    await securityChecksAPI.restoreDefaultIntervals();
    I.amOnPage(allChecksPage.url);

    I.waitForVisible(allChecksPage.elements.tableBody, 30);
    I.seeInCurrentUrl(allChecksPage.url);

    I.click(allChecksPage.buttons.openChangeInterval(checkName));
    I.waitForVisible(allChecksPage.elements.modalContent, 10);
    I.seeTextEquals(
      allChecksPage.messages.changeIntervalText(checkName),
      locate(allChecksPage.elements.modalContent).find('h4'),
    );
    I.click(allChecksPage.buttons.intervalValue(interval));

    I.click(allChecksPage.buttons.applyIntervalChange);

    I.verifyPopUpMessage(allChecksPage.messages.successIntervalChange(checkName));
    I.seeTextEquals(interval, allChecksPage.elements.intervalCellByName(checkName));

    await securityChecksAPI.restoreDefaultIntervals();
  },
);
