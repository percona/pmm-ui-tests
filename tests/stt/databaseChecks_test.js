const {
  I, allChecksPage, databaseChecksPage, codeceptjsConfig, perconaServerDB,
} = inject();
const config = codeceptjsConfig.config.helpers.Playwright;
const connection = perconaServerDB.defaultConnection;
let nodeID;

const urls = new DataTable(['url']);

urls.add([databaseChecksPage.url]);
urls.add([allChecksPage.url]);

Feature('Database Failed Checks').retry(2);

BeforeSuite(async ({ addInstanceAPI }) => {
  const instance = await addInstanceAPI.apiAddInstance(addInstanceAPI.instanceTypes.mysql, 'stt-failed-checks-mysql-5.7.30', connection);

  nodeID = instance.service.node_id;
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
    await securityChecksAPI.waitForSecurityChecksResults(20);
    I.amOnPage(pmmSettingsPage.url);
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await adminPage.selectItemFromPMMDropdown('PMM Database Checks');
    I.waitForVisible(databaseChecksPage.fields.dbCheckPanelSelector, 30);
    I.amOnPage(databaseChecksPage.url);
    I.waitForVisible(databaseChecksPage.fields.dbCheckPanelSelector, 30);
  },
);

Scenario(
  'PMM-T233 Verify user can see Number of failed checks at Home Page and open PMM Database Checks page from it [critical] @stt',
  async ({
    I, homePage, databaseChecksPage, settingsAPI, securityChecksAPI,
  }) => {
    await settingsAPI.apiEnableSTT();
    await securityChecksAPI.waitForSecurityChecksResults(20);
    I.amOnPage(homePage.url);
    I.waitForVisible(homePage.fields.checksPanelSelector, 30);
    I.waitForVisible(homePage.fields.sttFailedChecksPanelSelector, 30);
    I.doubleClick(homePage.fields.sttFailedChecksPanelSelector);
    await databaseChecksPage.verifyDatabaseChecksPageOpened();
  },
);

Scenario(
  'PMM-T236 Verify user is able to hover Failed Checks values and see tooltip [minor] @stt',
  async ({
    I, databaseChecksPage, settingsAPI, securityChecksAPI,
  }) => {
    const row = 1;

    await settingsAPI.apiEnableSTT();
    await securityChecksAPI.waitForSecurityChecksResults(20);
    I.amOnPage(databaseChecksPage.url);
    await databaseChecksPage.verifyDatabaseChecksPageOpened();
    databaseChecksPage.mouseOverInfoIcon(row);
    await databaseChecksPage.compareTooltipValues(row);
  },
);

Scenario(
  'PMM-T241 Verify user can see correct service name for failed checks [critical] @stt',
  async ({ databaseChecksPage, settingsAPI }) => {
    await settingsAPI.apiEnableSTT();
    await databaseChecksPage.runDBChecks();
    await databaseChecksPage.verifyServiceNamesExistence();
  },
);
