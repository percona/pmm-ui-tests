const assert = require('assert');

const { psMySql } = inject();

const connection = psMySql.defaultConnection;
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

Scenario.skip(
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

Scenario.skip(
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

Scenario.skip(
  'PMM-T585 Verify user is able enable/disable checks [critical] @stt @advisors-fb',
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
    I.amOnPage(allChecksPage.url);
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

Scenario.skip(
  'PMM-T723 Verify user can change check interval @stt @advisors-fb',
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

Scenario.skip(
  '@PMM-T1269 Verify ability to filter Advisor checks list @stt',
  async ({
    I, allChecksPage, securityChecksAPI,
  }) => {
    const searchKey = 'CVE fixes';
    const ruleName = 'MongoDB CVE Version';
    const interval = 'Rare';
    const tableRowLocator = '//tr[td]';

    await allChecksPage.open();

    await I.say('Click on magnifying glass icon then select search by Description field', 'pink');
    I.click(allChecksPage.filter.searchButton);
    I.waitForVisible(allChecksPage.filter.searchFieldDropdown, 5);
    I.click(allChecksPage.filter.searchFieldDropdown);
    I.waitForVisible(allChecksPage.filter.searchFieldDescription);
    I.click(allChecksPage.filter.searchFieldDescription);

    await I.say(`Search for ${searchKey} and assert single check found`, 'pink');
    I.fillField(allChecksPage.filter.searchInput, searchKey);
    I.waitForVisible(allChecksPage.elements.tableBody, 5);
    I.seeNumberOfElements(tableRowLocator, 1);

    await I.say(`Edit result: set "${interval}" and filter "Standard" then assert no checks found`, 'pink');
    I.click(allChecksPage.buttons.openChangeInterval(ruleName));
    I.waitForVisible(allChecksPage.elements.modalContent, 5);
    I.click(allChecksPage.buttons.intervalValue(interval));
    I.click(allChecksPage.buttons.applyIntervalChange);
    I.click(allChecksPage.filter.filterButton);
    I.waitForVisible(allChecksPage.filter.intervalDropdown, 5);
    I.click(allChecksPage.filter.intervalDropdown);
    I.waitForVisible(allChecksPage.filter.intervalStandard);
    I.click(allChecksPage.filter.intervalStandard);
    I.waitForVisible(allChecksPage.elements.noChecksFound, 5);

    await I.say(`Filter "${interval}" checks and assert single check found`, 'pink');
    I.click(allChecksPage.filter.intervalDropdown);
    I.waitForVisible(allChecksPage.filter.intervalRare);
    I.click(allChecksPage.filter.intervalRare);
    I.waitForVisible(allChecksPage.elements.tableBody, 5);
    I.seeNumberOfElements(tableRowLocator, 1);

    await I.say('Edit result: disable then assert no checks found', 'pink');
    I.click(allChecksPage.buttons.disableEnableCheck(ruleName));
    I.click(allChecksPage.filter.statusEnabledRadio);
    I.waitForVisible(allChecksPage.elements.noChecksFound, 5);

    await I.say('Filter "Disabled" checks and assert single check found', 'pink');
    I.click(allChecksPage.filter.statusDisabledRadio);
    I.waitForVisible(allChecksPage.elements.tableBody, 5);
    I.seeNumberOfElements(tableRowLocator, 1);

    await I.say('Click "clear all" button then search and filter elements are not displayed', 'pink');
    I.click(allChecksPage.filter.clearAllButton);
    I.waitForInvisible(allChecksPage.filter.searchFieldDropdown, 5);
    I.waitForInvisible(allChecksPage.filter.searchInput);
    I.waitForInvisible(allChecksPage.filter.statusAllRadio);
    I.waitForInvisible(allChecksPage.filter.intervalDropdown);

    await securityChecksAPI.restoreDefaultIntervals();
    await securityChecksAPI.enableCheck(ruleName);
  },
);
