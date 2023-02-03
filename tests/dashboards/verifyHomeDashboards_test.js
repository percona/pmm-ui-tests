const panels = new DataTable(['panelName', 'dashboardType', 'dashboardName', 'dashboard']);

Feature('Test Dashboards collection inside the Folders').retry(1);

panels.add(['Disk Space Total', 'singleNode', 'Disk Details', 'osDiskDetails']);
panels.add(['Disk Reads', 'singleNode', 'Disk Details', 'osDiskDetails']);
panels.add(['Disk Writes', 'singleNode', 'Disk Details', 'osDiskDetails']);
panels.add(['Total RAM', 'singleNode', 'Memory Details', 'osMemoryDetails']);
panels.add(['Virtual Memory Total', 'multipleNodes', 'Nodes Overview', 'osNodesOverview']);
panels.add(['Monitored Nodes', 'multipleNodes', 'Nodes Overview', 'osNodesOverview']);
panels.add(['Total Virtual CPUs', 'multipleNodes', 'Nodes Overview', 'osNodesOverview']);
Before(async ({ I, homePage }) => {
  await I.Authorize();
  await homePage.open();
});

Data(panels).Scenario(
  '@PMM-T1565 Verify ability to access OS dashboards with correct filter setup from Home Dashboard @nightly @dashboards',
  async ({
    I, current, dashboardPage, adminPage,
  }) => {
    const {
      panelName, dashboardType, dashboardName, dashboard,
    } = current;

    const expectedDashboard = dashboardPage[dashboard];

    I.click(dashboardPage.fields.openFiltersDropdownLocator('Node Name'));
    const nodeNames = await I.grabTextFromAll(dashboardPage.fields.allFilterDropdownOptions);

    I.click(dashboardPage.fields.filterDropdownOptionsLocator(nodeNames[0]));
    I.click(dashboardPage.fields.filterDropdownOptionsLocator(nodeNames[1]));
    I.click(dashboardPage.fields.refresh);
    dashboardPage.waitForDataLoaded();
    let expectedNodeName;

    if (dashboardType === 'singleNode') {
      // eslint-disable-next-line prefer-destructuring
      expectedNodeName = nodeNames.sort()[0];
    } else {
      expectedNodeName = await I.grabTextFrom(dashboardPage.fields.openFiltersDropdownLocator('Node Name'));
    }

    I.click(dashboardPage.fields.clickablePanel(panelName));
    I.switchToNextTab();
    I.waitForElement(`//span[text()="${dashboardName}"]`, 60);
    I.seeInCurrentUrl(expectedDashboard.clearUrl);
    await I.assertEqual(await I.grabTextFrom(dashboardPage.fields.openFiltersDropdownLocator('Node Name')), expectedNodeName);
    await dashboardPage.expandEachDashboardRow();

    dashboardPage.verifyMetricsExistence(expectedDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA(expectedDashboard.naElements);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(expectedDashboard.noDataElements);
  },
);
