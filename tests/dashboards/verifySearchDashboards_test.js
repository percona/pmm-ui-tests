const { searchDashboardsModal } = inject();

const folders = new DataTable(['folderObject']);

Object.values(searchDashboardsModal.folders).forEach((folder) => { folders.add([folder]); });

Feature('Test Dashboards collection inside the Folders');

Before(async ({ I }) => {
  await I.Authorize();
});

Data(folders).Scenario(
  'PMM-T1086 - Verify PMM Dashboards collections are present in correct folders @nightly @dashboards @imp',
  async ({
    I, homePage, dashboardPage, searchDashboardsModal, current,
  }) => {
    // await homePage.open();
    I.amOnPage(homePage.url);
    dashboardPage.waitForDashboardOpened();
    I.click(dashboardPage.fields.breadcrumbs.dashboardName);
    searchDashboardsModal.waitForOpened();
    searchDashboardsModal.collapseFolder('Recent');
    searchDashboardsModal.expandFolder(current.name);
    searchDashboardsModal.verifyDashboardsInFolderCollection(current);
  },
);
