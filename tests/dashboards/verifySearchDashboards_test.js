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
  'PMM-T1091 - Verify PMM Dashboards folders are correct @nightly @dashboards @post-upgrade',
  async ({ I, searchDashboardsModal, grafanaAPI }) => {
    const foldersNames = Object.values(searchDashboardsModal.folders).map((folder) => folder.name);

    foldersNames.unshift('Recent');
    const actualFolders = (await searchDashboardsModal.getFoldersList())
      // these folders verified in dedicated test.
      .filter((value) => value !== 'Starred' && value !== grafanaAPI.customFolderName);

    I.assertDeepMembers(actualFolders, foldersNames);
  },
);

Data(folders).Scenario(
  'PMM-T1086 - Verify PMM Dashboards collections are present in correct folders @nightly @dashboards @post-upgrade',
  async ({ searchDashboardsModal, current }) => {
    searchDashboardsModal.collapseFolder('Recent');
    searchDashboardsModal.expandFolder(current.name);
    searchDashboardsModal.verifyDashboardsInFolderCollection(current);
  },
);

Scenario(
  'PMM-T998 - Verify dashboard folders after upgrade @post-upgrade',
  async ({ I, searchDashboardsModal, grafanaAPI }) => {
    const actualFolders = (await searchDashboardsModal.getFoldersList());

    I.assertContain(actualFolders, 'Starred');
    I.assertContain(actualFolders, grafanaAPI.customFolderName);
    I.seeElement(searchDashboardsModal.fields.folderItemLocator(grafanaAPI.customDashboardName));
  },
);
