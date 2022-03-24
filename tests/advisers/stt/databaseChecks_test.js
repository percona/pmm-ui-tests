const assert = require('assert');

const {
  allChecksPage, databaseChecksPage, codeceptjsConfig, perconaServerDB,
} = inject();
const config = codeceptjsConfig.config.helpers.Playwright;
const connection = perconaServerDB.defaultConnection;
let nodeID;

const urls = new DataTable(['url']);

urls.add([databaseChecksPage.url]);
urls.add([allChecksPage.url]);

const psServiceName = 'databaseChecks-ps-5.7.30';
const detailsText = process.env.OVF_TEST === 'yes'
  ? 'Newer version of MySQL is available'
  : 'Newer version of Percona Server for MySQL is available';

Feature('Database Failed Checks');

BeforeSuite(async ({ addInstanceAPI }) => {
  nodeID = await addInstanceAPI.addInstanceForSTT(connection, psServiceName);
});

AfterSuite(async ({ inventoryAPI }) => {
  if (nodeID) await inventoryAPI.deleteNode(nodeID, true);
});

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T294 Verify user is able to see message about Disabled STT in Checks panel at Home Page [critical] @stt',
  async ({
    I, homePage, databaseChecksPage, settingsAPI,
  }) => {
    await settingsAPI.apiDisableSTT();
    I.amOnPage(homePage.url);
    I.waitForVisible(homePage.fields.sttDisabledFailedChecksPanelSelector, 30);
    I.see(
      databaseChecksPage.messages.homePagePanelMessage,
      homePage.fields.sttDisabledFailedChecksPanelSelector,
    );
  },
);

Data(urls).Scenario(
  'PMM-T295 PMM-T276 PMM-T470 Verify user is able to see message about Disabled STT at Database Checks page [critical] @stt',
  async ({
    I, databaseChecksPage, pmmSettingsPage, settingsAPI, current,
  }) => {
    await settingsAPI.apiDisableSTT();
    I.amOnPage(current.url);
    I.waitForVisible(databaseChecksPage.fields.dbCheckPanelSelector, 30);
    I.waitForVisible(databaseChecksPage.fields.disabledSTTMessageSelector, 30);
    I.see(
      databaseChecksPage.messages.disabledSTTMessage,
      locate('div').withChild(databaseChecksPage.fields.disabledSTTMessageSelector),
    );
    I.seeElement(databaseChecksPage.fields.disabledSTTMessageLinkSelector);
    I.seeAttributesOnElements(databaseChecksPage.fields.disabledSTTMessageLinkSelector, {
      href: `${config.url}${pmmSettingsPage.url}/advanced-settings`,
    });
  },
);

// TODO: need to add functions to access pages via left side menu
xScenario(
  'PMM-T233 PMM-T234 Verify user is able to access PMM Database Checks through UI and with URL [critical] @stt',
  async ({
    I, adminPage, databaseChecksPage, pmmSettingsPage, settingsAPI, securityChecksAPI,
  }) => {
    await settingsAPI.apiEnableSTT();
    await securityChecksAPI.waitForFailedCheckExistance(detailsText, psServiceName);
    I.amOnPage(pmmSettingsPage.url);
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await adminPage.selectItemFromPMMDropdown('PMM Database Checks');
    I.waitForVisible(databaseChecksPage.fields.dbCheckPanelSelector, 30);
    I.amOnPage(databaseChecksPage.url);
    I.waitForVisible(databaseChecksPage.fields.dbCheckPanelSelector, 30);
  },
);

Scenario(
  'PMM-T233 PMM-T354 PMM-T368 open PMM Database Checks page from home dashboard and verify number of failed checks [critical] @stt',
  async ({
    I, homePage, databaseChecksPage, settingsAPI, securityChecksAPI,
  }) => {
    await settingsAPI.apiEnableSTT();
    await securityChecksAPI.startSecurityChecks(['mysql_version']);
    await securityChecksAPI.waitForFailedCheckExistance(detailsText, psServiceName);
    I.wait(30);
    I.amOnPage(homePage.url);
    I.waitForVisible(homePage.fields.checksPanelSelector, 30);
    I.waitForVisible(homePage.fields.sttFailedChecksPanelSelector, 30);
    const [critical, major, trivial] = (await I.grabTextFrom(homePage.fields.sttFailedChecksPanelSelector)).split(' / ').map(Number);

    // Verify failed checks pop up
    I.moveCursorTo(homePage.fields.sttFailedChecksPanelSelector);
    I.waitForVisible(homePage.fields.popUp, 5);
    assert.ok(
      (await I.grabTextFrom(homePage.fields.popUp)),
      `Failed checks: ${critical + major + trivial}Critical – ${critical}Major – ${major}Trivial – ${trivial}`,
    );

    // Verify info icon message for Failed check panel
    I.moveCursorTo(homePage.fields.failedChecksPanelInfo);
    I.waitForVisible(homePage.fields.popUp, 5);
    I.seeTextEquals(homePage.failedChecksSinglestatsInfoMessage, homePage.fields.popUp);

    I.doubleClick(homePage.fields.sttFailedChecksPanelSelector);
    await databaseChecksPage.verifyDatabaseChecksPageOpened();

    // Verify count of checks by Severity match number on the home page singlestat
    I.seeNumberOfElements(locate('td').withText('Critical'), critical);
    I.seeNumberOfElements(locate('td').withText('Major'), major);
    I.seeNumberOfElements(locate('td').withText('Trivial'), trivial);
  },
);

Scenario(
  'PMM-T236 Verify user is able to hover Failed Checks values and see tooltip [minor] @stt',
  async ({
    I, databaseChecksPage, settingsAPI, securityChecksAPI,
  }) => {
    const row = 1;

    await settingsAPI.apiEnableSTT();
    await securityChecksAPI.waitForFailedCheckExistance(detailsText, psServiceName);
    I.amOnPage(databaseChecksPage.url);
    await databaseChecksPage.verifyDatabaseChecksPageOpened();
    databaseChecksPage.mouseOverInfoIcon(row);
    await databaseChecksPage.compareTooltipValues(row);
  },
);

Scenario(
  'PMM-T241 Verify user can see correct service name for failed checks [critical] @stt',
  async ({ databaseChecksPage, settingsAPI, securityChecksAPI }) => {
    await settingsAPI.apiEnableSTT();
    await databaseChecksPage.runDBChecks();
    await securityChecksAPI.waitForFailedCheckExistance(detailsText, psServiceName);
    // Verify failed check on UI
    databaseChecksPage.verifyFailedCheckExists(detailsText);
    await databaseChecksPage.verifyServiceNamesExistence(psServiceName);
  },
);
