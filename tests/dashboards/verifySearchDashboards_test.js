const assert = require('assert');

const { searchDashboardsModal } = inject();

const folders = new DataTable(['folderObject']);

Object.values(searchDashboardsModal.folders).forEach((folder) => { folders.add([folder]); });

Feature('Test Dashboards collection inside the Folders');

Before(async ({ I, homePage }) => {
  await I.Authorize();
  await homePage.open();
});

Scenario(
  'PMM-T1091 - Verify PMM Dashboards folders are correct @nightly @dashboards',
  async ({ I, searchDashboardsModal, dashboardPage }) => {
    I.click(dashboardPage.fields.breadcrumbs.dashboardName);
    searchDashboardsModal.waitForOpened();
    const foldersNames = Object.values(searchDashboardsModal.folders).map((folder) => folder.name);
    const actualFolders = (await searchDashboardsModal.getFoldersList());

    foldersNames.unshift('Recent');
    I.assertDeepMembers(actualFolders, foldersNames);
  },
);

Data(folders).Scenario(
  'PMM-T1086 - Verify PMM Dashboards collections are present in correct folders @nightly @dashboards @post-upgrade',
  async ({
    I, current, searchDashboardsModal, dashboardPage,
  }) => {
    I.click(dashboardPage.fields.breadcrumbs.dashboardName);
    searchDashboardsModal.waitForOpened();
    searchDashboardsModal.collapseFolder('Recent');
    searchDashboardsModal.expandFolder(current.name);
    searchDashboardsModal.verifyDashboardsInFolderCollection(current);
  },
);
