const serviceNameForPagination = 'pg-pagination-';
const servicesNumber = 26;

Feature('Pagination on Inventory Page');

BeforeSuite(async ({
  addInstanceAPI, remoteInstancesHelper, credentials, inventoryAPI,
}) => {
  for (let i = 1; i <= servicesNumber; i++) {
    await addInstanceAPI.apiAddInstance(remoteInstancesHelper.instanceTypes.postgresql, `${serviceNameForPagination}${i}`,
      { host: 'localhost', username: credentials.postgreSql.pmmServerUser, password: credentials.postgreSql.pmmServerUser });
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

subPages.add(['services']);
subPages.add(['agents']);
subPages.add(['nodes']);

Data(subPages).Scenario(
  '@PMM-T1346 - Verify Inventory page has pagination on Services tab @inventory',
  async ({ I, pmmInventoryPage, current }) => {
    I.click(pmmInventoryPage.fields[`${current.name}Link`]);
    await pmmInventoryPage.pagination.verifyPaginationFunctionality();
  },
);

Data(subPages).Scenario(
  '@PMM-T1441 Check all checkboxes button should work fine for selected agents/nodes/services',
  async ({
    I, pmmInventoryPage, current,
  }) => {
    I.click(pmmInventoryPage.fields[`${current.name}Link`]);
    I.click(pmmInventoryPage.fields.selectAllCheckbox);
    let selectedCheckboxNumber = await I.grabNumberOfVisibleElements(pmmInventoryPage.fields.selectedCheckbox);

    I.click(pmmInventoryPage.pagination.elements.nextPageButton);
    I.click(pmmInventoryPage.fields.selectRowCheckbox);
    selectedCheckboxNumber += await I.grabNumberOfVisibleElements(pmmInventoryPage.fields.selectedCheckbox);

    I.click(pmmInventoryPage.fields.deleteButton);
    I.seeTextEquals(`Are you sure that you want to permanently delete ${selectedCheckboxNumber} ${current.name}?`, pmmInventoryPage.fields.removalDialogMessage);
  },
);

Data(subPages).Scenario(
  '@PMM-T1445 Verification of Select all Functiality for multiple page',
  async ({
    I, pmmInventoryPage, current,
  }) => {
    I.click(pmmInventoryPage.fields[`${current.name}Link`]);
    I.click(locate(pmmInventoryPage.fields.selectAllCheckbox));
    I.seeNumberOfElements(pmmInventoryPage.fields.selectedCheckbox, await pmmInventoryPage.pagination.getSelectedCountPerPage());
    I.click(pmmInventoryPage.pagination.elements.nextPageButton);
    I.seeNumberOfElements(pmmInventoryPage.fields.selectedCheckbox, 0);
  },
);
