const serviceName = 'pg-pagination-';

Feature('Pagination on Inventory Page');

BeforeSuite(async ({ addInstanceAPI, remoteInstancesHelper, credentials }) => {
  for (let i = 1; i <= 25; i++) {
    await addInstanceAPI.apiAddInstance(remoteInstancesHelper.instanceTypes.postgresql, `${serviceName}${i}`,
      { host: 'localhost', username: credentials.postgreSql.pmmServerUser, password: credentials.postgreSql.pmmServerUser });
  }
});

Before(async ({ I, pmmInventoryPage }) => {
  await I.Authorize();
  await pmmInventoryPage.open();
});

AfterSuite(async ({ inventoryAPI, remoteInstancesHelper }) => {
  for (let i = 1; i <= 25; i++) {
    await inventoryAPI.deleteNodeByName(`${serviceName}${i}`);
  }
});

Scenario(
  '@PMM-T1346 - Verify Inventory page has pagination on Services tab @inventory',
  async ({ I, pmmInventoryPage }) => {
    await pmmInventoryPage.pagination.verifyPaginationFunctionality();
  },
);

Scenario(
  '@PMM-T1346 - Verify Inventory page has pagination on Agents tab @inventory',
  async ({ I, pmmInventoryPage }) => {
    I.click(pmmInventoryPage.fields.agentsLink);
    await pmmInventoryPage.pagination.verifyPaginationFunctionality();
  },
);

Scenario(
  '@PMM-T1346 - Verify Inventory page has pagination on Nodes tab @inventory',
  async ({ I, pmmInventoryPage }) => {
    I.click(pmmInventoryPage.fields.nodesLink);
    await pmmInventoryPage.pagination.verifyPaginationFunctionality();
  },
);
