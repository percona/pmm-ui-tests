const serviceNameForPagination = 'pg-pagination-';
const servicesNumber = 26;

Feature('Pagination on Inventory Page');

BeforeSuite(async ({
  addInstanceAPI, remoteInstancesHelper, credentials, inventoryAPI,
}) => {
  for (let i = 1; i <= servicesNumber; i++) {
    await addInstanceAPI.apiAddInstance(
      remoteInstancesHelper.instanceTypes.postgresql,
      `${serviceNameForPagination}${i}`,
      { host: 'localhost', username: credentials.postgreSql.pmmServerUser, password: credentials.postgreSql.pmmServerUser },
    );
  }
});

Before(async ({ I, pmmInventoryPage }) => {
  await I.Authorize();
  await pmmInventoryPage.open();
});

AfterSuite(async ({ inventoryAPI }) => {
  for (let i = 1; i <= servicesNumber; i++) {
    await inventoryAPI.deleteNodeByName(`${serviceNameForPagination}${i}`);
  }
});

const subPages = new DataTable(['name']);

//Todo Fix/Adjust Agent tests
subPages.add(['services']);
subPages.add(['nodes']);

Data(subPages).Scenario(
  '@PMM-T1346 - Verify Inventory page has pagination on Services tab @inventory',
  async ({ I, pmmInventoryPage, current }) => {
    const subPageLocator = pmmInventoryPage.fields[`${current.name}Link`];

    I.waitForClickable(subPageLocator, 30);
    I.click(subPageLocator);
    await pmmInventoryPage.pagination.verifyPaginationFunctionality();
  },
);

Data(subPages).Scenario(
  '@PMM-T1441 Check all checkboxes button should work fine for selected agents/nodes/services @inventory',
  async ({
    I, pmmInventoryPage, current,
  }) => {
    const subPageLocator = pmmInventoryPage.fields[`${current.name}Link`];

    I.waitForClickable(subPageLocator, 60);
    I.click(subPageLocator);
    I.waitForClickable(pmmInventoryPage.fields.selectAllCheckbox,30);
    I.click(pmmInventoryPage.fields.selectAllCheckbox);
    I.waitForVisible(pmmInventoryPage.fields.selectedCheckbox,30);
    let selectedCheckboxNumber = await I.grabNumberOfVisibleElements(pmmInventoryPage.fields.selectedCheckbox);

    I.waitForClickable(pmmInventoryPage.pagination.elements.nextPageButton, 30);
    I.click(pmmInventoryPage.pagination.elements.nextPageButton);
    I.waitForClickable(pmmInventoryPage.fields.selectRowCheckbox, 30);
    I.click(pmmInventoryPage.fields.selectRowCheckbox);
    I.waitForVisible(pmmInventoryPage.fields.selectedCheckbox, 30);
    selectedCheckboxNumber += await I.grabNumberOfVisibleElements(pmmInventoryPage.fields.selectedCheckbox);

    I.waitForClickable(pmmInventoryPage.fields.deleteButton);
    I.click(pmmInventoryPage.fields.deleteButton);
    if (`${current.name}` === "services"){
       I.waitForElement(pmmInventoryPage.fields.removalServiceDialogMessage, 30);
       I.seeTextEquals(`Are you sure that you want to permanently delete ${selectedCheckboxNumber} ${current.name}`, pmmInventoryPage.fields.removalServiceDialogMessage);
    }else{
       I.waitForElement(pmmInventoryPage.fields.removalDialogMessage, 30);
       I.seeTextEquals(`Are you sure that you want to permanently delete ${selectedCheckboxNumber} ${current.name}`, pmmInventoryPage.fields.removalDialogMessage);
   }
  }
);

Data(subPages).Scenario(
  '@PMM-T1445 Verification of Select all Functiality for multiple page @inventory',
  async ({
    I, pmmInventoryPage, current,
  }) => {
    const subPageLocator = pmmInventoryPage.fields[`${current.name}Link`];

    I.waitForClickable(subPageLocator, 60);
    I.click(subPageLocator);
    I.waitForClickable(pmmInventoryPage.fields.selectAllCheckbox,30);
    I.click(pmmInventoryPage.fields.selectAllCheckbox);
    I.waitForElement(pmmInventoryPage.fields.selectAllCheckbox,30);
    I.waitNumberOfVisibleElements(
      pmmInventoryPage.fields.selectedCheckbox,
      await pmmInventoryPage.pagination.getSelectedCountPerPage(),
    );
    I.waitForClickable(pmmInventoryPage.pagination.elements.nextPageButton);
    I.click(pmmInventoryPage.pagination.elements.nextPageButton);
    I.waitNumberOfVisibleElements(pmmInventoryPage.fields.selectedCheckbox, 0);
  },
);
