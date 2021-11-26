const assert = require('assert');

const { searchDashboardsModal } = inject();

const folders = new DataTable(['folderObject']);

Object.values(searchDashboardsModal.folders).forEach((folder) => { folders.add([folder]); });

Feature('Test Dashboards collection inside the Folders');

Before(async ({
  I, homePage, dashboardPage, searchDashboardsModal,
}) => {
  await I.Authorize();
  await homePage.open();
  I.click(dashboardPage.fields.breadcrumbs.dashboardName);
  searchDashboardsModal.waitForOpened();
});

Scenario(
  'PMM-T1091 - Verify PMM Dashboards folders are correct @nightly @dashboards',
  async ({ searchDashboardsModal }) => {
    const foldersNames = Object.values(searchDashboardsModal.folders).map((folder) => folder.name);

    foldersNames.unshift('Recent');
    assert.strictEqual(await searchDashboardsModal.countFolders(), foldersNames.length,
      'Folders amount does not match expected!');
    assert.deepStrictEqual(await searchDashboardsModal.getFoldersList(), foldersNames,
      'Folders collection does not match expected!');
  },
);

Data(folders).Scenario(
  'PMM-T1086 - Verify PMM Dashboards collections are present in correct folders @nightly @dashboards',
  async ({ searchDashboardsModal, current }) => {
    searchDashboardsModal.collapseFolder('Recent');
    searchDashboardsModal.expandFolder(current.name);
    searchDashboardsModal.verifyDashboardsInFolderCollection(current);
  },
);
